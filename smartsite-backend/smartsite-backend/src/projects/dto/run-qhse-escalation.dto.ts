import { IsOptional, IsString } from 'class-validator';

export class RunQhseEscalationDto {
  @IsString()
  @IsOptional()
  reportId?: string;
}
