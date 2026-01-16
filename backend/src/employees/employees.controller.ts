// File: backend/src/employees/employees.controller.ts
import { Controller, Get, Post, Body, UseInterceptors, UploadedFile, Delete, Param } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Employee } from './employee.entity';

@Controller('employees')
export class EmployeesController {
  constructor(
    @InjectRepository(Employee)
    private employeeRepo: Repository<Employee>,
  ) {}

  @Get()
  findAll() {
    return this.employeeRepo.find({ 
      order: { name: 'ASC' },
      relations: ['prize']
    });
  }

  @Post('import')
  @UseInterceptors(FileInterceptor('file'))
  async import(@UploadedFile() file: Express.Multer.File) {
    if (!file) return { message: 'File not found' };

    const csvContent = file.buffer.toString('utf8');
    const lines = csvContent.split('\n').filter(line => line.trim() !== '');
    const employees: Employee[] = [];

    for (const line of lines) {
      const parts = line.split(',').map(p => p.trim());
      const [code, name, department] = parts.slice(0, 3);
      
      if (code && name) {
        const trimmedCode = code.toUpperCase();
        const exists = await this.employeeRepo.findOne({ where: { code: trimmedCode } });
        
        if (!exists) {
          const emp = new Employee();
          emp.code = trimmedCode;
          emp.name = name;
          emp.department = department ? department : 'Unknown';
          // ĐỊNH DẠNG CHUẨN: Dùng .jpg (Bạn cần chép ảnh .jpg)
          emp.avatarUrl = 'avatars/' + emp.code.toLowerCase() + '.jpg'; 
          employees.push(emp);
        }
      }
    }

    if (employees.length > 0) {
      await this.employeeRepo.save(employees);
    }

    return { message: 'Imported successfully', count: employees.length };
  }

  @Delete('reset')
  async resetData() {
    await this.employeeRepo.clear();
    return { message: 'All employees deleted' };
  }
}
