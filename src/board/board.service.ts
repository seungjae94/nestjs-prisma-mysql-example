import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Board, BoardStatus } from '@prisma/client';
import { CreateBoardDto } from './dto/create-board.dto';

@Injectable()
export class BoardService {
  constructor(private prisma: PrismaService) {}

  async getBoard(id: number): Promise<Board> {
    const board = await this.prisma.board.findUnique({
      where: { id },
    });
    if (!board) throw new NotFoundException(`There is no board with id ${id}`);
    return board;
  }

  async getBoards(): Promise<Board[]> {
    return this.prisma.board.findMany();
  }

  async createBoard(createBoardDto: CreateBoardDto): Promise<Board> {
    return this.prisma.board.create({
      data: createBoardDto,
    });
  }

  async deleteBoard(id: number): Promise<void> {
    try {
      await this.prisma.board.delete({
        where: { id },
      });
    } catch (e) {
      throw new NotFoundException(`There is no board with id ${id}`);
    }
  }

  async updateBoardStatus(id: number, status: BoardStatus): Promise<Board> {
    try {
      const board = await this.prisma.board.update({
        where: { id },
        data: { status },
      });
      return board;
    } catch (e) {
      throw new NotFoundException(`There is no board with id ${id}`);
    }
  }
}
