# File: frontend/Dockerfile

# Sử dụng Node 18 Alpine
FROM node:18-alpine

# Thiết lập thư mục làm việc
WORKDIR /app

# Copy file package để cài thư viện trước
COPY package*.json ./

# Cài đặt dependencies
RUN npm install

# Copy toàn bộ source code
COPY . .

# Build Next.js
RUN npm run build

# Expose port 3000
EXPOSE 3000

# Chạy ứng dụng
CMD ["npm", "start"]
