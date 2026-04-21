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
import { QhseSiteReport } from './qhse-site-report.entity';

export enum QhseCorrectiveActionPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
}

export enum QhseCorrectiveActionStatus {
  OPEN = 'OPEN',
  IN_PROGRESS = 'IN_PROGRESS',
  BLOCKED = 'BLOCKED',
  DONE = 'DONE',
}

export enum QhseFindingSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
}

@Entity('qhse_corrective_actions')
@Index(['reportId'])
@Index(['projectId'])
@Index(['assignedQhseManagerId'])
@Index(['status'])
@Index(['escalated'])
@Index(['reportId', 'findingId'], { unique: true })
export class QhseCorrectiveAction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  reportId: string;

  @ManyToOne(() => QhseSiteReport, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'reportId' })
  report: QhseSiteReport;

  @Column({ type: 'uuid' })
  projectId: string;

  @Column({ type: 'uuid' })
  companyId: string;

  @Column({ type: 'varchar', length: 255 })
  assignedQhseManagerId: string;

  @Column({ type: 'varchar', length: 255 })
  findingId: string;

  @Column({ type: 'varchar', length: 500 })
  title: string;

  @Column({ type: 'varchar', length: 255, default: 'Project Manager' })
  owner: string;

  @Column({ type: 'date' })
  dueDate: Date;

  @Column({
    type: 'enum',
    enum: QhseCorrectiveActionPriority,
    default: QhseCorrectiveActionPriority.MEDIUM,
  })
  priority: QhseCorrectiveActionPriority;

  @Column({
    type: 'enum',
    enum: QhseCorrectiveActionStatus,
    default: QhseCorrectiveActionStatus.OPEN,
  })
  status: QhseCorrectiveActionStatus;

  @Column({
    type: 'enum',
    enum: QhseFindingSeverity,
    default: QhseFindingSeverity.MEDIUM,
  })
  sourceSeverity: QhseFindingSeverity;

  @Column({ type: 'boolean', default: false })
  escalated: boolean;

  @Column({ type: 'text', nullable: true })
  escalationReason: string;

  @Column({ type: 'timestamp', nullable: true })
  escalatedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
