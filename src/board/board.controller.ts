import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Patch,
  UsePipes,
  ValidationPipe,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Board, BoardStatus, User } from '@prisma/client';
import { GetUser } from 'src/auth/get-user.decorator';
import { BoardService } from './board.service';
import { CreateBoardDto } from './dto/create-board.dto';
import { BoardStatusValidationPipe } from './pipes/board-status-validation.pipe';

@Controller('board')
@UseGuards(AuthGuard('jwt'))
export class BoardController {
  constructor(private boardService: BoardService) {}

  @Get('/:id')
  getBoard(@Param('id', ParseIntPipe) id: number): Promise<Board> {
    return this.boardService.getBoard(id);
  }

  @Get()
  getBoards(): Promise<Board[]> {
    return this.boardService.getBoards();
  }

  @Post()
  @UsePipes(ValidationPipe)
  createBoard(
    @Body() createBoardDto: CreateBoardDto,
    @GetUser() user: User,
  ): Promise<Board> {
    return this.boardService.createBoard(createBoardDto, user);
  }

  // Trouble shooting #1 참조
  @Delete('/:id')
  deleteBoard(
    @Param('id', ParseIntPipe) id: number,
    @GetUser() user: User,
  ): Promise<void> {
    return this.boardService.deleteBoard(id, user);
  }

  @Patch('/:id/status')
  updateBoardStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('status', BoardStatusValidationPipe) status: BoardStatus,
  ): Promise<Board> {
    return this.boardService.updateBoardStatus(id, status);
  }
}
