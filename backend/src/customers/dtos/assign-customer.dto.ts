import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class AssignCustomerDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  userId!: string;
}
