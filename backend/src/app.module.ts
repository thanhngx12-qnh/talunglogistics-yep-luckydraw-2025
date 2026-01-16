// File: backend/src/app.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Employee } from './employees/employee.entity';
import { Prize } from './prizes/prize.entity';
import { PrizesController } from './prizes/prizes.controller';
import { EmployeesController } from './employees/employees.controller';
import { GameService } from './game/game.service';
import { GameGateway } from './game/game.gateway';

@Module({
  imports: [
    // Kết nối Database
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST || 'postgres',
      port: parseInt(process.env.DB_PORT) || 5432,
      username: process.env.DB_USERNAME || 'admin',
      password: process.env.DB_PASSWORD || 'admin',
      database: process.env.DB_DATABASE || 'yep_luckydraw',
      entities: [Employee, Prize],
      synchronize: true, // Tự động tạo bảng
    }),
    // Đăng ký Entity để dùng Repository
    TypeOrmModule.forFeature([Employee, Prize]),
  ],
  controllers: [
    PrizesController,
    EmployeesController
  ],
  providers: [
    GameService,
    GameGateway // Kích hoạt Socket Realtime
  ],
})
export class AppModule {}
