import { Module } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { BoardController } from './board.controller';
import { BoardService } from './board.service';

@Module({
  controllers: [BoardController],
  providers: [BoardService, PrismaService],
})
export class BoardModule {}
