import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Project } from './project.entity';

export enum ProjectValidationAction {
  SUBMIT = 'SUBMIT',
  APPROVE = 'APPROVE',
  REJECT = 'REJECT',
  RESUBMIT = 'RESUBMIT',
}

@Entity('project_validation_history')
@Index(['projectId'])
@Index(['action'])
@Index(['createdAt'])
export class ProjectValidationHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  projectId: string;

  @ManyToOne(() => Project, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'projectId' })
  project: Project;

  @Column({
    type: 'enum',
    enum: ProjectValidationAction,
  })
  action: ProjectValidationAction;

  @Column({ type: 'varchar', length: 255 })
  actorUserId: string;

  @Column({ type: 'varchar', length: 60 })
  actorRole: string;

  @Column({ type: 'text', nullable: true })
  comment: string;

  @CreateDateColumn()
  createdAt: Date;
}
