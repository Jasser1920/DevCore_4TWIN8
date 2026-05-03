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

export enum StrategicVisionStatus {
  DRAFT = 'DRAFT',
  PENDING_VALIDATION = 'PENDING_VALIDATION',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export interface KPI {
  name: string;
  target: number;
  unit: string;
  description?: string;
}

@Entity('strategic_visions')
@Index(['companyId'])
@Index(['status'])
export class StrategicVision {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  companyId: string;

  @ManyToOne(() => Company, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'companyId' })
  company: Company;

  @Column({ type: 'decimal', precision: 15, scale: 2 })
  projectBudget: number; // Budget in dollars

  @Column({ type: 'varchar', length: 10, default: 'USD' })
  currency: string;

  @Column({ type: 'date' })
  startDate: Date;

  @Column({ type: 'date' })
  endDate: Date;

  @Column({ type: 'simple-json' })
  globalKPIs: KPI[]; // Array of KPIs

  @Column({
    type: 'enum',
    enum: StrategicVisionStatus,
    default: StrategicVisionStatus.DRAFT,
  })
  status: StrategicVisionStatus;

  @Column({ type: 'varchar', length: 255, nullable: true })
  directorUserId: string; // Keycloak ID of director who created this

  @Column({ type: 'varchar', length: 255, nullable: true })
  validatedByUserId: string; // Keycloak ID of director who validated/approved

  @Column({ type: 'text', nullable: true, default: '' })
  validationNotes: string;

  @Column({ type: 'decimal', precision: 15, scale: 2, nullable: true })
  budgetCeiling: number; // Max allowed budget for this company

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  validatedAt: Date;
}
