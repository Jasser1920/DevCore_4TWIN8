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

export enum MilestoneStatus {
  PLANNED = 'PLANNED',
  SUBMITTED_FOR_CLIENT_VALIDATION = 'SUBMITTED_FOR_CLIENT_VALIDATION',
  APPROVED_BY_CLIENT = 'APPROVED_BY_CLIENT',
  REJECTED_BY_CLIENT = 'REJECTED_BY_CLIENT',
  RESUBMITTED_FOR_CLIENT_VALIDATION = 'RESUBMITTED_FOR_CLIENT_VALIDATION',
}

@Entity('milestones')
@Index(['projectId'])
@Index(['companyId'])
@Index(['status'])
export class Milestone {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  projectId: string;

  @ManyToOne(() => Project, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'projectId' })
  project: Project;

  @Column({ type: 'uuid' })
  companyId: string;

  @Column({ type: 'varchar', length: 150 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'date' })
  plannedDate: Date;

  @Column({ type: 'text', nullable: true })
  evidenceSummary: string;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  evidenceAttachments: string[];

  @Column({ type: 'timestamp', nullable: true })
  submittedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  validatedAt: Date;

  @Column({ type: 'text', nullable: true })
  clientValidationComment: string;

  @Column({ type: 'varchar', length: 255 })
  createdByPmId: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  validatedByClientId: string;

  @Column({
    type: 'enum',
    enum: MilestoneStatus,
    default: MilestoneStatus.PLANNED,
  })
  status: MilestoneStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
