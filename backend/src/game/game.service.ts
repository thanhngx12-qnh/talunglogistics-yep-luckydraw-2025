// File: backend/src/game/game.service.ts
import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Employee } from '../employees/employee.entity';
import { Prize } from '../prizes/prize.entity';

@Injectable()
export class GameService {
  constructor(
    @InjectRepository(Employee)
    private employeeRepo: Repository<Employee>,
    @InjectRepository(Prize)
    private prizeRepo: Repository<Prize>,
    private dataSource: DataSource,
  ) {}

  async getAvailablePrizes() {
    return this.prizeRepo
      .createQueryBuilder('prize')
      .where('prize.quantity > (SELECT COUNT(*) FROM employees WHERE "prizeId" = prize.id)')
      .orderBy('prize.sortOrder', 'ASC')
      .getMany();
  }

  // HÀM MỚI: Chỉ kiểm tra điều kiện, không update dữ liệu
  async validateSpin(prizeId: string) {
    // 1. Kiểm tra giải thưởng
    const prize = await this.prizeRepo.findOne({ where: { id: prizeId } });
    if (!prize) throw new BadRequestException('Giải thưởng không tồn tại!');

    // 2. Kiểm tra số lượng
    const winnersCount = await this.employeeRepo.count({ where: { prize: { id: prizeId } } });
    if (winnersCount >= prize.quantity) {
      throw new BadRequestException(`Giải "${prize.name}" đã hết (Đã trao ${winnersCount}/${prize.quantity})!`);
    }

    // 3. Kiểm tra nhân viên khả dụng
    const eligibleCount = await this.employeeRepo.count({ where: { isWinner: false } });
    if (eligibleCount === 0) {
      throw new BadRequestException('Không còn nhân viên nào để quay!');
    }

    return true; // Đủ điều kiện
  }

  async spin(prizeId: string) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Logic quay số (giữ nguyên như cũ)
      const prize = await queryRunner.manager.findOne(Prize, { where: { id: prizeId } });
      if (!prize) throw new BadRequestException('Giải thưởng không tồn tại!');

      const winnersCount = await queryRunner.manager.count(Employee, { where: { prize: { id: prizeId } } });
      if (winnersCount >= prize.quantity) {
         throw new BadRequestException(`Giải thưởng đã hết!`);
      }

      const remaining = prize.quantity - winnersCount;
      const limit = Math.min(prize.batchSize, remaining);

      const winners = await queryRunner.manager
        .createQueryBuilder(Employee, 'employee')
        .setLock('pessimistic_write')
        .where('employee.isWinner = :status', { status: false })
        .orderBy('RANDOM()')
        .limit(limit)
        .getMany();

      if (winners.length === 0) throw new BadRequestException('Hết nhân viên!');

      for (const winner of winners) {
        winner.isWinner = true;
        winner.prize = prize;
        winner.wonAt = new Date();
        await queryRunner.manager.save(winner);
      }

      await queryRunner.commitTransaction();
      return winners;

    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }

  async cancelResult(employeeId: string) {
    const employee = await this.employeeRepo.findOne({ where: { id: employeeId } });
    if (!employee) throw new BadRequestException('Nhân viên không tồn tại');
    employee.isWinner = false;
    employee.prize = null;
    employee.wonAt = null;
    return this.employeeRepo.save(employee);
  }
}
