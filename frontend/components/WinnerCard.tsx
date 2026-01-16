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

  const avatarSrc = !imageError && employee.avatarUrl
    ? (employee.avatarUrl.startsWith('http') ? employee.avatarUrl : `${apiBaseUrl}/public/${employee.avatarUrl}`)
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(employee.name)}&background=003366&color=fff&size=400`;

  return (
    <motion.div
      initial={{ scale: 0.7, opacity: 0, rotateY: 90 }}
      animate={{ scale: 1, opacity: 1, rotateY: 0 }}
      transition={{ type: "spring", stiffness: 120, damping: 12 }}
      className="relative group w-64 md:w-72" // Thu nhỏ chiều rộng card một chút
    >
      {/* Hiệu ứng viền phát sáng */}
      <div className="absolute -inset-1.5 bg-gradient-to-r from-[#FF0000] via-[#FFD700] to-[#FF0000] rounded-[2rem] blur-lg opacity-40 group-hover:opacity-100 transition duration-1000 animate-pulse"></div>
      
      {/* Card chính: Glassmorphism */}
      <div className="relative px-6 py-10 bg-white/10 backdrop-blur-3xl rounded-[2rem] flex flex-col items-center border border-white/20 shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden">
        
        {/* Trang trí background card */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-[#FF0000]/10 rounded-full blur-2xl -mr-12 -mt-12"></div>

        {/* Avatar: Tỷ lệ w-40 h-40 (Cân đối cho 5 người) */}
        <div className="relative w-40 h-40 mb-6 rounded-full border-4 border-[#FFD700] p-1 shadow-[0_0_30px_rgba(255,215,0,0.4)] bg-gradient-to-br from-[#003366] to-[#001F3F] z-10">
          <img
            src={avatarSrc}
            alt={employee.name}
            className="w-full h-full rounded-full object-cover ring-2 ring-white/10"
            onError={() => setImageError(true)}
          />
          {/* Badge nhỏ xinh */}
          <div className="absolute -bottom-1 -right-1 bg-[#FFD700] p-2 rounded-full shadow-lg border-2 border-[#001F3F]">
             <svg className="w-4 h-4 text-[#001F3F]" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
          </div>
        </div>

        {/* Thông tin Text */}
        <div className="text-center w-full z-10">
          <h3 className="text-3xl font-black bg-gradient-to-r from-[#FFD700] via-white to-[#FFD700] bg-clip-text text-transparent mb-3 uppercase tracking-tight leading-tight">
            {employee.name}
          </h3>
          
          <div className="flex items-center justify-center gap-2">
              <div className="h-[1px] w-4 bg-[#FF0000]"></div>
              <p className="text-[#E0E0E0] text-sm md:text-base font-bold tracking-[0.1em] uppercase italic opacity-90">
                {employee.department}
              </p>
              <div className="h-[1px] w-4 bg-[#FF0000]"></div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
