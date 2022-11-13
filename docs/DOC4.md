## 기타

### I. 로그 남기기

#### 1. 단순한 로그 남기기

`main.ts`

```ts
import { Logger } from '@nestjs/common';

...

async function bootstrap() {
  const PORT = 3000;
  const app = await NestFactory.create(AppModule);
  await app.listen(PORT);
  Logger.log(`Application running on port ${PORT}`);
}
```

#### 2. verbose 남기기

`board.service.ts`

```ts
private logger = new Logger('BoardService');
constructor(private prisma: PrismaService) {}

...

async deleteBoard(id: number, user: User): Promise<void> {
  const res = await this.prisma.board.deleteMany({
    where: { id, author: user },
  });

  if (res.count === 0) {
    throw new NotFoundException(`There is no your board with id ${id}`);
  }

  this.logger.verbose(`User ${user.username} deleted a post`);
}
```

### II. 환경변수 설정

여러 방법이 있다. 꼭 하나의 방법만 사용할 필요 없고 여러 방법을 섞어서 써도 된다.

1. OS 환경변수 사용

- 배포 서버에서 DB 관련 정보를 저장해두기도 한다.

2. `dotenv` 사용

3. `config` 사용

- windows의 경우 `win-node-env`를 같이 사용해야 한다.
