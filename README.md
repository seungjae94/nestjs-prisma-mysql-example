## 프로젝트 설명

<a href="https://youtube.com/playlist?list=PL9a7QRYt5fqnCYYs9YfcBXcWuDnAnQ5sI">John Ahn님의 Nest.js 강의</a>를 들으면서 따라 만들어 본 Nest.js 프로젝트

### 강의와 다르게 진행한 부분

1. 그룹 프로젝트에서 DB로 `MySQL`을 사용하기로 결정했기 때문에 `PostgreSQL`이 아닌 `MySQL` 을 사용했다.

2. 그룹 프로젝트에서 ORM으로 `prisma`를 사용하기로 결정했기 때문에 `typeorm`이 아닌 `prisma`를 사용했다.

## Nest.js에 MySQL + prisma 사용하기

### I. MySQL + prisma 셋업

#### 1. prisma 셋업

`shell`

```bash
npm i prisma
npx prisma init
```

#### 2. MySQL 연동

`schema.prisma`

```plain
...
datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}
```

`.env`

```plain
DATABASE_URL="mysql://아이디:비밀번호@호스트:포트/스키마_이름"
```

#### 3. 실험용 model 생성

`schema.prisma`

```plain
...
model Board {
  id    Int     @default(autoincrement()) @id
  title String
  description  String
  status String
}
```

#### 4. Migration

`shell`

```bash
npx prisma migrate dev
```

- `dev`: 개발 환경에서만 사용. 배포 환경에서는 절대 사용하면 안된다.

#### Reference

- <a href="https://www.prisma.io/docs/getting-started/setup-prisma/start-from-scratch/relational-databases-typescript-mysql">prisma 공식문서</a>

### Nest.js에 Prisma Client 연동하기

#### 1. Prisma Client 설치

`shell`

```bash
npm i @prisma/client
```

#### 2. `PrismaService` 구현

`shell`

```bash
nest g service prisma --no-spec
```

`prisma.service.ts`

```ts
import { INestApplication, Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
  }

  async enableShutdownHooks(app: INestApplication) {
    this.$on('beforeExit', async () => {
      await app.close();
    });
  }
}
```

prisma에서는 굳이 repository pattern을 따를 필요 없이 `PrismaService`만 구현해도 될 것 같다.

#### 3. 다른 서비스에서 PrismaService 사용하기

`board.module.ts`

```ts
import { Module } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { BoardController } from './board.controller';
import { BoardService } from './board.service';

@Module({
  controllers: [BoardController],
  providers: [BoardService, PrismaService],
})
export class BoardModule {}
```

`board.service.ts`

```ts
import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { Board, Prisma } from '@prisma/client';

@Injectable()
export class BoardService {
  constructor(private prisma: PrismaService) {}

  async getBoard(id: string): Promise<Board> {
    const found = await this.prisma.board.findUnique({
      where: {id},
    });
    if (!found) throw new NotFoundException(`There is no board with id ${id}`);
    return found;
  }
  ...
}
```

#### Reference

- <a href="https://docs.nestjs.com/recipes/prisma">prisma 공식 문서</a>

## Trouble shooting

#### 1. service layer의 async method에서 발생시킨 error가 서버 응답에 반영되지 않고 콘솔에 출력되는 문제

<b>문제 상황</b>

![image](https://user-images.githubusercontent.com/102232291/201486333-3c53772d-a839-428a-955c-d01159bcb7f0.png)

<b>원인</b>

<a href="https://github.com/nestjs/nest/issues/3484">"Nest doesn't catch on error thrown asynchronously."</a>

![image](https://user-images.githubusercontent.com/102232291/201486163-6e8bf2ff-16d8-4663-9006-31130c0e7a08.png)

controller layer의 `deleteBoard` 함수를 async 함수로 만들지 않으면 controller layer가 종료되고 서버 응답까지 마치고 난 뒤에야 error가 발생하기 때문에 exception filter에서 error handling을 할 수 없게 된다.

<b>(권장) 해결책 1</b>

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

<br /><br /><br /><br /><br /><br /><br /><br /><br /><br /><br />

# 참고

<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="200" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://coveralls.io/github/nestjs/nest?branch=master" target="_blank"><img src="https://coveralls.io/repos/github/nestjs/nest/badge.svg?branch=master#9" alt="Coverage" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Installation

```bash
$ npm install
```

## Running the app

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Test

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://kamilmysliwiec.com)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](LICENSE).
