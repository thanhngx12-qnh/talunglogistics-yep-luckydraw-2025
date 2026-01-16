// File: backend/src/game/game.gateway.ts
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { GameService } from './game.service';

@WebSocketGateway({
  cors: { origin: '*' },
})
export class GameGateway {
  @WebSocketServer()
  server: Server;

  constructor(private readonly gameService: GameService) {}

  @SubscribeMessage('admin_select_prize')
  handleSelectPrize(@MessageBody() data: { prizeId: string; imageUrl: string }) {
    this.server.emit('sync_prize_image', data);
  }

  // SỬA ĐỔI QUAN TRỌNG TẠI ĐÂY
  @SubscribeMessage('admin_start_spin')
  async handleStartSpin(@MessageBody() data: { prizeId: string }) {
    try {
      // 1. Kiểm tra điều kiện trước
      await this.gameService.validateSpin(data.prizeId);
      
      // 2. Nếu OK thì mới báo cho mọi người quay
      this.server.emit('spin_started');
    } catch (error) {
      // 3. Nếu lỗi thì báo lỗi ngay, KHÔNG QUAY
      const errorMessage = error.response?.message || error.message || 'Lỗi không xác định';
      console.error('START SPIN ERROR:', errorMessage);
      this.server.emit('spin_error', { message: errorMessage });
    }
  }

  @SubscribeMessage('admin_stop_spin')
  async handleStopSpin(@MessageBody() data: { prizeId: string }) {
    try {
      const winners = await this.gameService.spin(data.prizeId);
      this.server.emit('spin_completed', winners);
    } catch (error) {
      const errorMessage = error.response?.message || error.message;
      this.server.emit('spin_error', { message: errorMessage });
    }
  }

  @SubscribeMessage('admin_cancel_result')
  async handleCancelResult(@MessageBody() data: { employeeId: string }) {
     await this.gameService.cancelResult(data.employeeId);
     this.server.emit('data_refresh_required'); 
  }
}
