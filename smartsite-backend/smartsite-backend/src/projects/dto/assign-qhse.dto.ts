import { IsString, IsMongoId } from 'class-validator';

export class AssignQhseDto {
  @IsMongoId()
  @IsString()
  qhseManagerId: string;
}
