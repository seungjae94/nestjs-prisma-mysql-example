## 인가 기능 구현

#### 1. 유저-보드 관계 생성

`schema.prisma`

```ts
model Board {
  id    Int     @default(autoincrement()) @id
  title String
  description  String @db.Text
  status BoardStatus @default(PUBLIC)
  author User @relation(fields: [authorName], references: [username])
  authorName String
}

model User {
  id Int @default(autoincrement()) @id
  username String @unique
  password String
  boards Board[]
}
```

#### 2. 게시물 생성할 때 유저 정보도 포함시키기

`board.controller.ts`

```ts
@Post()
@UsePipes(ValidationPipe)
createBoard(
  @Body() createBoardDto: CreateBoardDto,
  @GetUser() user: User,
): Promise<Board> {
  return this.boardService.createBoard(createBoardDto, user);
}
```

`board.service.ts`

```ts
async createBoard(
  createBoardDto: CreateBoardDto,
  user: User,
): Promise<Board> {
  return this.prisma.board.create({
    data: { ...createBoardDto, authorId: user.id },
    include: { author: true },
  });
}
```

`BoardService`에서 `createBoard`를 할 때 connect를 사용해 `author`를 지정해줄 수도 있지만 `authorId`를 명시하는 것이 훨씬 간단하다.

외부로 노출된 model에 relation은 포함되지 않는다. relation을 포함한 model을 얻고 싶을 경우 `include` 옵션을 이용해 원하는 relation을 직접 지정해줘야 한다.

#### 3. 자신이 생성한 게시물만 삭제할 수 있도록 하기

`board.controller.ts`

```ts
@Delete('/:id')
deleteBoard(
  @Param('id', ParseIntPipe) id: number,
  @GetUser() user: User,
): Promise<void> {
  return this.boardService.deleteBoard(id, user);
}
```

`board.service.ts`

```ts
async deleteBoard(id: number, user: User): Promise<void> {
  const res = await this.prisma.board.deleteMany({
    where: { id, author: user },
  });

  if (res.count === 0) {
    throw new NotFoundException(`There is no your board with id ${id}`);
  }
}
```

예외 처리를 하는 것보다 `deleteMany`를 사용하는 것이 훨씬 편하다.

또, `deleteMany`는 `where` 옵션에 uniqueness를 요구하지 않으므로 `author` 역시 검색 조건으로 사용할 수 있다.
