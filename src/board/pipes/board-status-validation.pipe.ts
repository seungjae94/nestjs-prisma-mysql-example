import { BadRequestException, PipeTransform } from '@nestjs/common';

export class BoardStatusValidationPipe implements PipeTransform {
  transform(value: string) {
    if (typeof value !== 'string')
      throw new BadRequestException('Board status should be a string');
    value = value.toUpperCase();
    if (value !== 'PRIVATE' && value !== 'PUBLIC')
      throw new BadRequestException(
        `Board status should be either 'PRIVATE' or 'PUBLIC'`,
      );
    return value;
  }
}
