# File: backend/Dockerfile

# Sử dụng Node 18 Alpine cho nhẹ và ổn định
FROM node:18-alpine

# Thiết lập thư mục làm việc
WORKDIR /app

# Copy file định nghĩa dependencies trước (để tận dụng Docker cache)
COPY package*.json ./

# Cài đặt dependencies
# Dùng --legacy-peer-deps để tránh lỗi version nếu có conflict
RUN npm install --legacy-peer-deps

# Copy toàn bộ source code vào
COPY . .

# Build code (NestJS build ra thư mục dist)
RUN npm run build

# Expose port 3001
EXPOSE 3001

# Lệnh chạy khi container khởi động
CMD ["npm", "run", "start:prod"]
