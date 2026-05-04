import { IsNumber, IsArray, IsDate, IsNotEmpty, Min, ValidateNested, IsString, IsOptional, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';

export class KPIDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsNumber()
  @Min(0)
  target: number;

  @IsString()
  @IsNotEmpty()
  unit: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class CreateStrategicVisionDto {
  @IsNumber()
  @Min(0)
  projectBudget: number;

  @IsOptional()
  @IsString()
  currency: string = 'USD';

  @IsDate()
  @Type(() => Date)
  @IsNotEmpty()
  startDate: Date;

  @IsDate()
  @Type(() => Date)
  @IsNotEmpty()
  endDate: Date;

  @IsArray()
  @ArrayMinSize(1, { message: 'At least one KPI is required' })
  @ValidateNested({ each: true })
  @Type(() => KPIDto)
  globalKPIs: KPIDto[];
}

export class UpdateStrategicVisionDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  projectBudget?: number;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  startDate?: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  endDate?: Date;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => KPIDto)
  globalKPIs?: KPIDto[];
}

export class ValidateStrategicVisionDto {
  @IsString()
  @IsNotEmpty()
  status: 'APPROVED' | 'REJECTED';

  @IsOptional()
  @IsString()
  validationNotes?: string;
}
