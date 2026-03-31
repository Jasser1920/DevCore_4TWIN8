import { IsOptional, IsString } from 'class-validator';

export class SubmitMilestoneDto {
  @IsString()
  @IsOptional()
  evidenceSummary?: string;
}
