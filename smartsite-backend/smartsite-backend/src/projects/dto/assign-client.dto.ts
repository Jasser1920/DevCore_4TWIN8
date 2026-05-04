import { IsNotEmpty, IsString } from 'class-validator';

export class AssignClientDto {
  @IsString()
  @IsNotEmpty()
  clientUserId: string;
}
