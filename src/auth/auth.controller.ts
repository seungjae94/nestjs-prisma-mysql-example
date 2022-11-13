import {
  Body,
  Controller,
  Post,
  Req,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { User } from '@prisma/client';
import { AuthService } from './auth.service';
import { AuthCredentialsDto } from './dto/auth-credentials.dto';
import { GetUser } from './get-user.decorator';
import { SigninResponse } from './type/response';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('/signup')
  signup(
    @Body(ValidationPipe) authCrendentialsDto: AuthCredentialsDto,
  ): Promise<void> {
    return this.authService.signup(authCrendentialsDto);
  }

  @Post('/signin')
  @UsePipes(ValidationPipe)
  signin(
    @Body(ValidationPipe) authCrendentialsDto: AuthCredentialsDto,
  ): Promise<SigninResponse> {
    return this.authService.signin(authCrendentialsDto);
  }

  @Post('/test')
  @UseGuards(AuthGuard('jwt'))
  test(@GetUser() user: User) {
    console.log('user', user);
  }
}
