// File: frontend/components/WinnerCard.tsx
import React, { useState } from 'react';
import { motion } from 'framer-motion';

interface Employee {
  id: string;
  code: string;
  name: string;
  department: string;
  avatarUrl?: string;
}

interface WinnerCardProps {
  employee: Employee;
  apiBaseUrl: string;
}

export const WinnerCard: React.FC<WinnerCardProps> = ({ employee, apiBaseUrl }) => {
  const [imageError, setImageError] = useState(false);

  // Fallback ảnh nếu không có avatar
  const avatarSrc = !imageError && employee.avatarUrl
    ? (employee.avatarUrl.startsWith('http') ? employee.avatarUrl : `${apiBaseUrl}/public/${employee.avatarUrl}`)
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(employee.name)}&background=random&size=200`;

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 200, damping: 15 }}
      className="relative group"
    >
      <div className="absolute -inset-1 bg-yellow-500 rounded-2xl blur opacity-40 group-hover:opacity-100 transition duration-500"></div>
      
      <div className="relative px-6 py-6 bg-gray-900 rounded-2xl flex flex-col items-center border border-yellow-500/50 shadow-xl w-64">
        
        {/* Avatar */}
        <div className="w-24 h-24 mb-3 rounded-full border-2 border-yellow-400 p-1 shadow-lg bg-black">
          <img
            src={avatarSrc}
            alt={employee.name}
            className="w-full h-full rounded-full object-cover"
            onError={() => setImageError(true)}
          />
        </div>

        {/* Thông tin Text - SỬA LẠI CHO DỄ NHÌN */}
        <div className="text-center w-full">
          <h3 className="text-xl font-bold text-yellow-400 mb-1 truncate px-2 uppercase">
            {employee.name}
          </h3>
          <p className="text-blue-300 text-sm font-medium mb-2 truncate px-2">{employee.department}</p>
          <div className="inline-block px-3 py-0.5 bg-gray-800 text-gray-400 text-xs rounded-full border border-gray-700">
            {employee.code}
          </div>
        </div>
      </div>
    </motion.div>
  );
};
