import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum CompanyStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
}

@Entity('companies')
@Index(['ownerUserId'])
@Index(['status'])
export class Company {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({
    type: 'enum',
    enum: CompanyStatus,
    default: CompanyStatus.ACTIVE,
  })
  status: CompanyStatus;

  @Column({ type: 'varchar', length: 255 })
  ownerUserId: string; // Super Admin who created this company (Keycloak ID)

  @Column({ type: 'varchar', length: 255, nullable: true })
  managerUserId: string; // Director assigned as company manager (MongoDB ID)

  @Column({ type: 'varchar', length: 255, nullable: true })
  projectManagerId: string; // Project Manager assigned by Director (MongoDB ID)

  @Column({ type: 'bigint', default: 10737418240 }) // 10 GB in bytes
  storageQuota: number;

  @Column({ type: 'bigint', default: 0 })
  usedStorage: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  contactEmail: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  contactName: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
