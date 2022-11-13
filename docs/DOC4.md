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
