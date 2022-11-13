## Nest.js에 MySQl + prisma 사용하기

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

```ts
...
model Board {
  id    Int     @default(autoincrement()) @id
  title String
  description  String @db.Text
  status String
}
```

<a href="https://www.prisma.io/docs/concepts/database-connectors/mysql">참고로 `String`의 default는 `VARCHAR(191)` 이다.</a>

#### 4. Migration

`shell`

```bash
npx prisma migrate dev
```

- `dev`: 개발 환경에서만 사용. 배포 환경에서는 절대 사용하면 안된다.

#### Reference

- <a href="https://www.prisma.io/docs/getting-started/setup-prisma/start-from-scratch/relational-databases-typescript-mysql">prisma 공식문서</a>

### II. Nest.js에 Prisma Client 연동하기

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
