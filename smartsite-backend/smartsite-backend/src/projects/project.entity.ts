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
import { Company } from '../companies/company.entity';

export enum ProjectStatus {
  DRAFT = 'DRAFT',
  SUBMITTED_FOR_VALIDATION = 'SUBMITTED_FOR_VALIDATION',
  REJECTED = 'REJECTED',
  APPROVED = 'APPROVED',
  ACTIVE = 'ACTIVE',
}

@Entity('projects')
@Index(['companyId'])
@Index(['projectManagerId'])
@Index(['qhseManagerId'])
@Index(['status'])
@Index(['companyId', 'code'], { unique: true })
export class Project {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  companyId: string;

  @ManyToOne(() => Company, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'companyId' })
  company: Company;

  @Column({ type: 'varchar', length: 150 })
  name: string;

  @Column({ type: 'varchar', length: 40 })
  code: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 255 })
  projectManagerId: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  directorId: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  clientUserId: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  qhseManagerId: string;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  budgetPlanned: number;

  @Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
  budgetConsumed: number;

  @Column({ type: 'varchar', length: 10, default: 'USD' })
  currency: string;

  @Column({ type: 'date' })
  startDate: Date;

  @Column({ type: 'date' })
  endDate: Date;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  latitude: number;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  longitude: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  siteAddress: string;

  @Column({ type: 'text', nullable: true })
  latestValidationComment: string;

  @Column({ type: 'timestamp', nullable: true })
  submittedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  validatedAt: Date;

  @Column({
    type: 'enum',
    enum: ProjectStatus,
    default: ProjectStatus.DRAFT,
  })
  status: ProjectStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
