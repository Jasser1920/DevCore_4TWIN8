import { IsIn, IsOptional, IsString, MaxLength } from 'class-validator';

export class ReviewQhseReportDto {
  @IsString()
  @IsIn(['ACCEPT', 'REQUEST_CORRECTION'])
  decision: 'ACCEPT' | 'REQUEST_CORRECTION';

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  comment?: string;
}
