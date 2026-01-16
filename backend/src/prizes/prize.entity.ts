// File: backend/src/prizes/prize.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { Employee } from '../employees/employee.entity';

@Entity('prizes')
export class Prize {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column('int')
  quantity: number;

  @Column('int', { default: 1 })
  batchSize: number;

  @Column({ nullable: true })
  imageUrl: string;

  @Column('int', { default: 0 })
  sortOrder: number;

  // Quan hệ 1-N: Một giải thưởng có thể trao cho nhiều nhân viên
  @OneToMany(() => Employee, (employee) => employee.prize)
  employees: Employee[];
}
