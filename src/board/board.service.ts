import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Board, BoardStatus, User } from '@prisma/client';
import { CreateBoardDto } from './dto/create-board.dto';

@Injectable()
export class BoardService {
  private logger = new Logger('BoardService');
  constructor(private prisma: PrismaService) {}

  async getBoard(id: number): Promise<Board> {
    const board = await this.prisma.board.findUnique({
      where: { id },
      include: { author: true },
    });
    if (!board) throw new NotFoundException(`There is no board with id ${id}`);
    return board;
  }

  async getBoards(): Promise<Board[]> {
    return this.prisma.board.findMany({
      include: { author: true },
    });
  }

  async createBoard(
    createBoardDto: CreateBoardDto,
    user: User,
  ): Promise<Board> {
    return this.prisma.board.create({
      data: {
        ...createBoardDto,
        authorId: user.id,
      },
      include: { author: true },
    });
  }

  async deleteBoard(id: number, user: User): Promise<void> {
    const res = await this.prisma.board.deleteMany({
      where: { id, author: user },
    });

    if (res.count === 0) {
      throw new NotFoundException(`There is no your board with id ${id}`);
    }

    this.logger.verbose(`User ${user.username} deleted a post`);
  }

  async updateBoardStatus(id: number, status: BoardStatus): Promise<Board> {
    try {
      const board = await this.prisma.board.update({
        where: { id },
        data: { status },
        include: { author: true },
      });
      return board;
    } catch (e) {
      throw new NotFoundException(`There is no board with id ${id}`);
    }
  }
}
