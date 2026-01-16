// File: backend/src/employees/employee.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Prize } from '../prizes/prize.entity';

@Entity('employees')
export class Employee {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  code: string; // Mã nhân viên (duy nhất)

  @Column()
  name: string;

  @Column()
  department: string;

  @Column({ nullable: true })
  avatarUrl: string;

  @Column({ default: false })
  isWinner: boolean;

  @Column({ type: 'timestamp', nullable: true })
  wonAt: Date;

  // Quan hệ N-1: Nhiều nhân viên có thể trúng cùng 1 loại giải (nhưng mỗi người chỉ nhận 1 giải tại 1 thời điểm)
  @ManyToOne(() => Prize, (prize) => prize.employees, { nullable: true })
  @JoinColumn({ name: 'prizeId' })
  prize: Prize;
}
