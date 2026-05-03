import { IsArray, IsOptional, IsString, MaxLength } from 'class-validator';

export class SubmitMilestoneDto {
  @IsString()
  @IsOptional()
  evidenceSummary?: string;

  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  @MaxLength(500, { each: true })
  evidenceAttachments?: string[];
}
