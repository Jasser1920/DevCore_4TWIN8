import { IsIn, IsOptional, IsString } from 'class-validator';

export class ValidateProjectDto {
  @IsIn(['APPROVE', 'REJECT'])
  decision: 'APPROVE' | 'REJECT';

  @IsString()
  @IsOptional()
  comment?: string;
}
