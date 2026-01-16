// File: frontend/lib/socket.ts
import { io } from "socket.io-client";

// Lấy URL từ biến môi trường
const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3003";

// Khởi tạo kết nối
export const socket = io(SOCKET_URL, {
  transports: ["websocket"], // Bắt buộc dùng WebSocket để tối ưu tốc độ
  autoConnect: true,         // Tự động kết nối khi vào web
  reconnection: true,        // Tự động kết nối lại nếu mạng chập chờn
  reconnectionAttempts: 5,   // Thử lại 5 lần nếu mất kết nối
});
