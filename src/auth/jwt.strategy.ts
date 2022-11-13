import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { User } from '@prisma/client';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from 'src/prisma/prisma.service';

interface JwtPayload {
  username: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    super({
      // 서버에서 토큰을 검증할 때 사용
      secretOrKey: process.env.JWT_SECRET,
      // request에서 토큰을 추출할 수 있는 방법을 명시
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    });
  }

  async validate(payload: JwtPayload): Promise<User> {
    const { username } = payload;
    const user = await this.prisma.user.findUnique({
      where: { username },
    });

    if (!user) throw new UnauthorizedException();

    return user;
  }
}
