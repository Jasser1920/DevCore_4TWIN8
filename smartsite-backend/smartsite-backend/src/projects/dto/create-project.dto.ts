import { IsDateString, IsNotEmpty, IsNumber, IsOptional, IsString, MaxLength, Min } from 'class-validator';

export class CreateProjectDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name: string;

  @IsString()
  @IsOptional()
  @MaxLength(40)
  code?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @Min(0)
  budgetPlanned: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  budgetConsumed?: number;

  @IsString()
  @IsOptional()
  @MaxLength(10)
  currency?: string;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;
}
