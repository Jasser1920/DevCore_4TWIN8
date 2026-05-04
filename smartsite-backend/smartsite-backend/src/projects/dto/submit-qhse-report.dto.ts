import { IsArray, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class SubmitQhseReportDto {
  @IsString()
  @MinLength(5)
  @MaxLength(3000)
  summary: string;

  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  attachments?: string[];
}
