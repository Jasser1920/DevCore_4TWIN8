import { IsDateString, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateQhseCorrectiveActionDto {
  @IsString()
  @IsOptional()
  @MaxLength(500)
  title?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  owner?: string;

  @IsDateString()
  @IsOptional()
  dueDate?: string;

  @IsString()
  @IsOptional()
  @IsIn(['LOW', 'MEDIUM', 'HIGH'])
  priority?: 'LOW' | 'MEDIUM' | 'HIGH';

  @IsString()
  @IsOptional()
  @IsIn(['OPEN', 'IN_PROGRESS', 'BLOCKED', 'DONE'])
  status?: 'OPEN' | 'IN_PROGRESS' | 'BLOCKED' | 'DONE';
}
