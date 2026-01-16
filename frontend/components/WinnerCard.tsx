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
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(employee.name)}&background=001F3F&color=FFD700&size=400&font-size=0.35&bold=true`;

  return (
    <motion.div
      initial={{ scale: 0, rotateY: -90, opacity: 0 }}
      animate={{ scale: 1, rotateY: 0, opacity: 1 }}
      transition={{ type: "spring", stiffness: 120, damping: 15 }}
      className="relative group w-60 h-[380px] flex-shrink-0" // Kích thước cố định để dàn hàng ngang
    >
      {/* Hào quang đỏ gold */}
      <div className="absolute -inset-1.5 bg-gradient-to-b from-[#FFD700] via-[#FF0000] to-[#FFD700] rounded-[2.5rem] blur-md opacity-20 transition duration-1000 group-hover:opacity-40"></div>
      
      {/* Thân Card */}
      <div className="relative h-full w-full bg-gradient-to-b from-[#003366]/90 to-[#001F3F] backdrop-blur-3xl rounded-[2.5rem] flex flex-col items-center border border-white/10 shadow-2xl overflow-hidden p-6">
        
        {/* Nhãn Winner */}
        <div className="z-10 mb-6">
            <div className="bg-[#FF0000] px-4 py-1 rounded-full border border-[#FFD700]/40 shadow-lg">
                <span className="text-[9px] font-black text-white uppercase tracking-[0.3em]">Winner 2025</span>
            </div>
        </div>

        {/* AVATAR CHUẨN KÍCH THƯỚC: Ép cứng w-36 h-36 */}
        <div className="relative z-10">
            <div className="w-36 h-36 rounded-full border-[5px] border-[#FFD700] p-1 shadow-[0_0_30px_rgba(255,215,0,0.3)] bg-[#001F3F] overflow-hidden">
                <img
                    src={avatarSrc}
                    alt={employee.name}
                    className="w-full h-full rounded-full object-cover" // object-cover đảm bảo ảnh luôn lấp đầy và không bị méo
                    onError={() => setImageError(true)}
                />
            </div>
        </div>

        {/* THÔNG TIN */}
        <div className="mt-6 text-center w-full z-10 flex-1 flex flex-col justify-center">
            <h3 className="text-2xl font-black text-[#FFD700] uppercase tracking-tighter leading-tight mb-3 drop-shadow-xl truncate w-full px-2">
                {employee.name}
            </h3>
            
            <div className="flex items-center justify-center gap-2">
                <div className="h-[1px] w-6 bg-white/20"></div>
                <p className="text-white text-xs font-bold uppercase tracking-[0.15em] opacity-80 italic">
                    {employee.department}
                </p>
                <div className="h-[1px] w-6 bg-white/20"></div>
            </div>
        </div>

        <div className="mt-4 w-10 h-1 bg-[#FFD700]/20 rounded-full"></div>
      </div>
    </motion.div>
  );
};
