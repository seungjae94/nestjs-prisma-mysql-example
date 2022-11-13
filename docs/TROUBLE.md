## Trouble shooting

#### 1. service layer의 async method에서 발생시킨 error가 서버 응답에 반영되지 않고 콘솔에 출력되는 문제

<b>문제 상황</b>

![image](https://user-images.githubusercontent.com/102232291/201486333-3c53772d-a839-428a-955c-d01159bcb7f0.png)

<b>원인</b>

<a href="https://github.com/nestjs/nest/issues/3484">"Nest doesn't catch on error thrown asynchronously."</a>

![image](https://user-images.githubusercontent.com/102232291/201486163-6e8bf2ff-16d8-4663-9006-31130c0e7a08.png)

controller layer의 `deleteBoard` 함수를 async 함수로 만들지 않으면 controller layer가 종료되고 서버 응답까지 마치고 난 뒤에야 error가 발생하기 때문에 exception filter에서 error handling을 할 수 없게 된다.

<b>해결책</b>

controller layer의 `deleteBoard` 함수에서 `Promise`를 반환한다.

```ts
@Delete('/:id')
deleteBoard(@Param('id', ParseIntPipe) id: number): Promise<void> {
  return this.boardService.deleteBoard(id);
}
```

controller layer에서 promise를 반환하는 경우 promise가 resolve/reject 된 뒤 lifecycle이 진행된다.

즉, promise 내에서 에러가 발생하는 시점은 lifecycle이 진행되기 이전이다.

따라서 에러는 exception filter에서 잘 처리된다.

참고로 custom exception filter를 따로 구현하지 않으면 `HttpException`만 자동으로 처리된다.

#### 2. signup 함수의 실행 결과가 DB에 반영되지 않는 문제

<b>문제 상황</b>

`auth.service.ts`

```ts
@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

  async signup(authCredentialsDto: AuthCredentialsDto): Promise<void> {
    const { username } = authCredentialsDto;
    const user = await this.prisma.user.findFirst({
      where: { username },
    });

    if (user) {
      throw new BadRequestException(
        `The user with username ${username} already exists`,
      );
    }

    this.prisma.user.create({ data: authCredentialsDto });
  }
}
```

`AuthService`의 `signup` 함수는 정상적으로 실행되지만 DB에 새로운 유저 레코드가 생성되지 않는 문제가 발생했다.

따로 에러가 발생하지도 않았고 JS 비동기 처리와 관련된 문제도 아닌 것 같다.

(참고) `signup` 함수의 구조가 변경되어 이 문제는 더이상 고려할 필요가 없다.

<b>원인</b>

<a href="https://stackoverflow.com/questions/69452367/prisma-create-update-without-await">"This happens because Prisma queries are then-ables, meaning they only execute when you call `await` or `.then()` or `.catch()`. This is called lazy evaluation. This is different than a regular promise which starts executing immediately."</a>

prisma가 lazy evalution을 하기 때문에 발생한 문제였다.

<b>해결책</b>

`auth.service.ts`

```ts
@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

  async signup(authCredentialsDto: AuthCredentialsDto): Promise<void> {
    const { username } = authCredentialsDto;
    const user = await this.prisma.user.findFirst({
      where: { username },
    });

    if (user) {
      throw new BadRequestException(
        `The user with username ${username} already exists`,
      );
    }

    await this.prisma.user.create({ data: authCredentialsDto });
    // this.prisma.user.create({ data: authCredentialsDto }).then(() => {})
  }
}
```

`await` 또는 `.then()`을 명시한다.
