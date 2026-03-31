import { IsIn, IsOptional, IsString } from 'class-validator';

export class ClientValidateMilestoneDto {
  @IsIn(['APPROVE', 'REJECT'])
  decision: 'APPROVE' | 'REJECT';

  @IsString()
  @IsOptional()
  comment?: string;
}
