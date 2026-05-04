import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Project } from './project.entity';

export enum QhseSiteReportStatus {
  SUBMITTED = 'SUBMITTED',
  UNDER_REVIEW = 'UNDER_REVIEW',
  ACTION_REQUIRED = 'ACTION_REQUIRED',
  ACCEPTED = 'ACCEPTED',
}

@Entity('qhse_site_reports')
@Index(['projectId'])
@Index(['assignedQhseManagerId'])
@Index(['status'])
export class QhseSiteReport {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  projectId: string;

  @ManyToOne(() => Project, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'projectId' })
  project: Project;

  @Column({ type: 'uuid' })
  companyId: string;

  @Column({ type: 'varchar', length: 255 })
  submittedByPmId: string;

  @Column({ type: 'varchar', length: 255 })
  assignedQhseManagerId: string;

  @Column({ type: 'text' })
  summary: string;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  attachments: string[];

  @Column({
    type: 'enum',
    enum: QhseSiteReportStatus,
    default: QhseSiteReportStatus.SUBMITTED,
  })
  status: QhseSiteReportStatus;

  @Column({ type: 'text', nullable: true })
  qhseComment: string;

  @Column({ type: 'timestamp', nullable: true })
  submittedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  reviewedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
