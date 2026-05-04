import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsIn,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

class CorrectiveActionInputDto {
  @IsString()
  @MaxLength(255)
  findingId: string;

  @IsString()
  @MaxLength(500)
  title: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  owner?: string;

  @IsDateString()
  dueDate: string;

  @IsString()
  @IsIn(['LOW', 'MEDIUM', 'HIGH'])
  priority: 'LOW' | 'MEDIUM' | 'HIGH';

  @IsString()
  @IsIn(['LOW', 'MEDIUM', 'HIGH'])
  sourceSeverity: 'LOW' | 'MEDIUM' | 'HIGH';
}

export class CreateQhseCorrectiveActionsDto {
  @IsArray()
  @ArrayMinSize(1)
  actions: CorrectiveActionInputDto[];
}
