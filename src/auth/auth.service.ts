import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime';
import { PrismaService } from 'src/prisma/prisma.service';
import { AuthCredentialsDto } from './dto/auth-credentials.dto';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { SigninResponse } from './type/response';

enum PrismaErrorCode {
  UNIQUE_CONSTRAINT_ERROR = 'P2002',
}

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService, private jwtService: JwtService) {}

  async signup(authCredentialsDto: AuthCredentialsDto): Promise<void> {
    try {
      const { username, password } = authCredentialsDto;

      const salt = await bcrypt.genSalt(); // salt = [알고리즘][Cost factor][Salt]
      const hash = await bcrypt.hash(password, salt); // hash = [알고리즘][Cost factor][Salt].[Hash]

      await this.prisma.user.create({
        data: {
          username,
          password: hash,
        },
      });
    } catch (e) {
      // 차후 Exception Filter로 넘기는게 나을 수도...
      if (e instanceof PrismaClientKnownRequestError) {
        switch (e.code) {
          case PrismaErrorCode.UNIQUE_CONSTRAINT_ERROR:
            throw new BadRequestException(
              `The user with username ${authCredentialsDto.username} already exists`,
            );
        }
      }

      throw e;
    }
  }

  async signin(
    authCredentialsDto: AuthCredentialsDto,
  ): Promise<SigninResponse> {
    const { username, password } = authCredentialsDto;
    const user = await this.prisma.user.findUnique({
      where: { username },
    });

    if (user && (await bcrypt.compare(password, user.password))) {
      // JWT 토큰 생성
      const payload = { username };
      const accessToken = await this.jwtService.sign(payload);

      return { accessToken };
    }

    throw new UnauthorizedException('로그인 실패');
  }
}
