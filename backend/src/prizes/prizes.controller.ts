import { Controller, Get, Post, Body, Put, Param, Delete } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Prize } from './prize.entity';
import { Employee } from '../employees/employee.entity';

@Controller('prizes')
export class PrizesController {
  constructor(
    @InjectRepository(Prize)
    private prizeRepo: Repository<Prize>,
    @InjectRepository(Employee)
    private employeeRepo: Repository<Employee>,
  ) {}

  @Get()
  async findAll() {
    const prizes = await this.prizeRepo.find({
      order: { sortOrder: 'ASC' },
      relations: ['employees'] // Load danh sách người trúng
    });

    return prizes.map(prize => {
      const used = prize.employees ? prize.employees.length : 0;
      return {
        ...prize,
        remaining: Math.max(0, prize.quantity - used),
        // QUAN TRỌNG: Trả về danh sách nhân viên trúng giải này để làm trang Tổng kết
        employees: prize.employees || [] 
      };
    });
  }

  @Post()
  create(@Body() data: Partial<Prize>) {
    return this.prizeRepo.save(data);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() data: Partial<Prize>) {
    await this.prizeRepo.update(id, data);
    return this.prizeRepo.findOne({ where: { id } });
  }

  @Delete(':id')
  delete(@Param('id') id: string) {
    return this.prizeRepo.delete(id);
  }
}
