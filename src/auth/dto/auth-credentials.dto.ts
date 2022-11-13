import { IsString, Matches, MaxLength, MinLength } from 'class-validator';

const PASSWORD_PATTERN = /^[a-zA-Z0-9]+$/;

export class AuthCredentialsDto {
  @IsString()
  @MinLength(4)
  @MaxLength(20)
  username: string;

  @IsString()
  @MinLength(4)
  @MaxLength(20)
  @Matches(PASSWORD_PATTERN, {
    message: '비밀번호는 영어와 숫자로만 구성해야 합니다',
  })
  password: string;
}
