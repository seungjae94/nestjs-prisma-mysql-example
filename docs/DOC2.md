## 인증 기능 추가하기

### I. auth 도메인 구현

#### 1. module, controller, service 생성

```bash
nest g module auth
nest g controller auth --no-spec
nest g service auth --no-spec
```

#### 2. `User` model 생성

`schema.prisma`

```ts
...
model User {
  id Int @default(autoincrement()) @id
  username String
  password String
}
```

#### 3. `AuthService`에 `PrismaService` 주입

`auth.module.ts`

```ts
import { Module } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

@Module({
  controllers: [AuthController],
  providers: [AuthService, PrismaService],
})
export class AuthModule {}
```

``

`auth.service.ts`

```ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}
}
```

### II. 회원가입/로그인 기능 구현 (로그인 상태 유지 X)

#### 1. `AuthCredentialsDto` 생성

`auth-credentials.dto.ts`

```ts
import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

const PASSWORD_PATTERN = /^[a-zA-Z0-9]+$/;

export class AuthCredentialsDto {
  @IsString()
  @MinLength(4)
  @MaxLength(20)
  username: string;

  @IsString()
  @MinLength(4)
  @MaxLength(20)
  @Matches(PASSWORD_PATTERN, {
    message: '비밀번호는 영어와 숫자로만 구성해야 합니다',
  })
  password: string;
}
```

#### 2. `AuthService` 구현

#### 3. `AuthController` 구현

#### 4. 회원 가입 기능 구현

#### 5. 유저 데이터 유효성 체크

#### 6. 비밀번호 암호화

비밀번호를 저장하는 방법에 대해 생각해보자.

<b>평문</b>

- 최악의 방법

<b>양방향 암호화</b>

- <b>대칭키 (암호화 키 = 복호화 키)</b> 또는 <b>비대칭키 (암호화 키 ≠ 복호화 키)</b>를 사용해 암호화/복호화
- 복호화 키가 노출될 경우 위험

<b>단방향 암호화</b>

- SHA256 등의 hash function 사용
  - <a href="https://emn178.github.io/online-tools/sha256.html">다양한 hash function을 실험할 수 있는 사이트</a>

하지만, 단방향 암호화를 사용한다고 해서 비밀번호가 완전히 보호되는 것은 아니다.

예를 들어 A 유저가 `1234`를 비밀번호로 사용하고 있다고 해보자.

A 유저의 digest는 `03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4`가 될 것이다.

이 때, 해커가 A 유저의 digest를 탈취한 뒤 <a href="https://crackstation.net/">rainbow table</a>에 대입하면 A 유저의 비밀번호 `1234`를 얻게 된다.

<b>salt</b>

- salt: 각 사용자에 대응하는 임의의 문자열
- 비밀번호를 해싱하는 대신 `salt + 비밀번호`를 해싱한다.

`salt + 비밀번호`가 rainbow table에 존재할 확률은 0에 가깝기 때문에 rainbow table이 거의 확실하게 무력화된다.

심지어 해커가 salt를 탈취한다고 해도 해당 salt에 대한 rainbow table을 갖고 있지 않기 때문에 brute force 외에는 비밀번호를 얻을 방법이 없다.

<b>bcrypt</b>

`bcrypt` 라이브러리를 사용해 salt와 hash를 쉽게 처리할 수 있다.

먼저 `bcrypt`는 salt + key streching (hash 반복) 기능을 제공한다.

![image](https://user-images.githubusercontent.com/102232291/201511898-3736d97b-25b6-4892-b60a-dbe5bdff663c.png)

또 compare 기능도 제공한다.

![image](https://user-images.githubusercontent.com/102232291/201511862-3495f1f2-5d14-4ed1-8ac0-d67a2c4edfdc.png)

`shell`

```bash
npm i bcrypt
npm i -D @types/bcrypt
```

`auth.service.ts`

```ts
...
async signup(authCredentialsDto: AuthCredentialsDto): Promise<void> {
    try {
      const { username, password } = authCredentialsDto;

      const salt = await bcrypt.genSalt(); // salt = [알고리즘][Cost factor][Salt]
      const hash = await bcrypt.hash(password, salt); // hash = [알고리즘][Cost factor][Salt].[Hash]

      await this.prisma.user.create({
        data: {
          username,
          password: hash,
        },
      });
    } catch (e) {
      if (e instanceof PrismaClientKnownRequestError) {
        switch (e.code) {
          case PrismaErrorCode.UNIQUE_CONSTRAINT_ERROR:
            throw new BadRequestException(
              `The user with username ${authCredentialsDto.username} already exists`,
            );
        }
      }

      throw e;
    }
  }
```

#### 7. 로그인 기능 구현

#### Reference

- <a href="https://javaplant.tistory.com/26">단방향/양방향 암호화</a>
- <a href="https://st-lab.tistory.com/100">hash와 salt</a>
- <a href="https://velog.io/@sangmin7648/Bcrypt%EB%9E%80">bcrypt 기능 설명</a>

### III. 로그인 상태 유지 (JWT)

#### 전체 프로세스

로그인 할 때 JWT 토큰 발행
→ 클라이언트가 인가가 필요한 데이터를 요청
→ 서버에서 request header에 포함된 토큰을 꺼내 검증
→ 검증 성공시 요청한 데이터를 응답

#### 1. 모듈 설치

`shell`

```bash
npm i @nestjs/jwt @nestjs/passport passport passport-jwt
npm i -D @types/passport-jwt
```

#### 2. Passport 모듈, JWT 모듈 등록

먼저 JWT secret key를 환경변수로 등록해야 한다.

`.env` 파일에 `JWT_SECRET_KEY`를 등록한다.

`Nest.js`에서 환경변수를 사용하기 위해 `dotenv`를 설치한다.

`shell`

```bash
npm i dotenv
npmp i -D @types/dotenv
```

다음으로 `main.ts`에서 `boostrap()`을 실행하기 전에 `dotenv.config()`를 먼저 실행하도록 한다.

`main.ts`

```ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({
  path: path.resolve('.env'),
});

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  await app.listen(3000);
}
bootstrap();
```

다음으로 `AuthModule`에 `PassportModule`과 `JwtModule`을 등록한다.

`auth.module.ts`

```ts
...
@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: 3600 },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, PrismaService],
})
export class AuthModule {}
```

#### 3. `AuthService`에 `JwtService` 주입

`auth.service.ts`

```ts
...
@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService, private jwtService: JwtService) {}
  ...
}
```

#### 4. access token 생성

`auth.service.ts`

```ts
...
async signin(
  authCredentialsDto: AuthCredentialsDto,
): Promise<SigninResponse> {
  const { username, password } = authCredentialsDto;
  const user = await this.prisma.user.findUnique({
    where: { username },
  });

  if (user && (await bcrypt.compare(password, user.password))) {
    // JWT 토큰 생성
    const payload = { username };
    const accessToken = await this.jwtService.sign(payload);

    return { accessToken };
  }

  throw new UnauthorizedException('로그인 실패');
}
```

`auth.controller.ts`

```ts
...
@Post('/signin')
@UsePipes(ValidationPipe)
signin(
  @Body(ValidationPipe) authCrendentialsDto: AuthCredentialsDto,
): Promise<SigninResponse> {
  return this.authService.signin(authCrendentialsDto);
}
```

`type/response.d.ts`

```ts
export declare type SigninResponse = { accessToken: string };
```

#### 5. access token 토큰 검증 및 `req` 객체에 유저 정보 추가

먼저 `JwtStrategy`를 구현한다.

`jwt.strategy.ts`

```ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { User } from '@prisma/client';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from 'src/prisma/prisma.service';

interface JwtPayload {
  username: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    super({
      // 서버에서 토큰을 검증할 때 사용
      secretOrKey: process.env.JWT_SECRET,
      // request에서 토큰을 추출할 수 있는 방법을 명시
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    });
  }

  async validate(payload: JwtPayload): Promise<User> {
    const { username } = payload;
    const user = await this.prisma.user.findUnique({
      where: { username },
    });

    if (!user) throw new UnauthorizedException();

    return user;
  }
}
```

<b>Guard</b>

- 인가 관련 미들웨어
- 해당 경로로 진입할 수 있는 사람과 그렇지 않은 사람을 구분해준다

`AuthGuard`는 다음과 같은 일을 대신 해준다.

> request에서 토큰을 꺼내 검증한다
> 토큰이 유효할 경우 `JwtStrategy`의 `validate` 함수를 실행한 결과를 request에 추가해준다

<a href="https://jay-ji.tistory.com/94">`AuthGuard`가 어떻게 `JwtStrategy`의 `validate` 함수를 실행하는지</a>에 대해서는 일단 깊게 고민하지 말고 넘어가도록 하자.

`AuthModule`에서 `AuthGuard`를 사용하기 위해서는 `PassportModule`을 import하고 `JwtStrategy`를 Provider로 등록해야 한다.

`app.module.ts`

```ts
...
@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: 3600 },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, PrismaService, JwtStrategy],
  // AuthModule을 import 하는 다른 모듈에서 JwtStrategy, PassportModule를 사용할 수 있게 해준다.
  exports: [JwtStrategy, PassportModule],
})
export class AuthModule {}
```

`auth.controller.ts`

```ts
...
@Post('/test')
@UseGuards(AuthGuard())
test(@Req() req) {
  console.log('user', req.user);
}
```

#### 6. 커스텀 데코레이터를 적용해 `req.user` 대신 `user` 사용

`get-user.decorator.ts`

```ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User } from '@prisma/client';

export const GetUser = createParamDecorator(
  (data, ctx: ExecutionContext): User => {
    const req = ctx.switchToHttp().getRequest();
    return req.user;
  },
);
```

`auth.controller.ts`

```ts
...
@Post('/test')
@UseGuards(AuthGuard())
test(@GetUser() user: User) {
  console.log('user', user);
}
```

#### 7. 다른 모듈에서 `AuthGuard` 사용하기

마찬가지로, `BoardModule`에서 `AuthGuard`를 사용하기 위해서는 `PassportModule`을 import하고 `JwtStrategy`를 Provider로 등록해야 한다.

`PassportModule`과 `JwtStrategy`를 직접 가져올 수도 있지만, 앞서 `AuthModule`에서 `PassportModule`, `JwtStrategy` 인스턴스를 재사용하기 위해 export 해두었으므로 `AuthModule`만 import 하는 편이 더 좋다.

`board.module.ts`

```ts
...
@Module({
  imports: [AuthModule],
  controllers: [BoardController],
  providers: [BoardService, PrismaService],
})
export class BoardModule {}
```

`board.controller.ts`

```ts
...
@Controller('board')
@UseGuards(AuthGuard())
export class BoardController {
  ...
}
```
