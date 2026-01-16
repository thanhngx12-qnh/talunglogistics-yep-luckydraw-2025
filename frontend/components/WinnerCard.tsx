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

  // Fallback avatar: Nền Navy, chữ Vàng Gold
  const avatarSrc = !imageError && employee.avatarUrl
    ? (employee.avatarUrl.startsWith('http') ? employee.avatarUrl : `${apiBaseUrl}/public/${employee.avatarUrl}`)
    : `https://ui-avatars.com/api/?name=${encodeURIComponent(employee.name)}&background=001F3F&color=FFD700&size=400&font-size=0.35&bold=true`;

  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 150, damping: 15 }}
      className="relative group w-72 h-[420px] flex-shrink-0" // KÍCH THƯỚC CỐ ĐỊNH CHO MỌI THẺ
    >
      {/* Hào quang đỏ rực phía sau */}
      <div className="absolute -inset-1 bg-[#FF0000] rounded-[2.5rem] blur-md opacity-20 group-hover:opacity-40 transition duration-1000"></div>
      
      {/* Thân Card: Kính mờ xanh Navy */}
      <div className="relative h-full w-full bg-gradient-to-b from-[#003366] to-[#001F3F] backdrop-blur-3xl rounded-[2.5rem] flex flex-col items-center border border-white/20 shadow-[0_25px_50px_rgba(0,0,0,0.8)] overflow-hidden p-8">
        
        {/* Nhãn Winner phía trên */}
        <div className="z-10 mb-8">
            <div className="bg-[#FF0000] px-6 py-1.5 rounded-full border border-[#FFD700]/50 shadow-lg">
                <span className="text-xs font-black text-white uppercase tracking-[0.3em]">WINNER 2025</span>
            </div>
        </div>

        {/* Avatar: Hình tròn lớn viền Vàng Gold (Đã bỏ ngôi sao) */}
        <div className="relative z-10">
            <div className="w-40 h-40 rounded-full border-[6px] border-[#FFD700] p-1 shadow-[0_0_40px_rgba(255,215,0,0.4)] bg-[#001F3F]">
                <img
                    src={avatarSrc}
                    alt={employee.name}
                    className="w-full h-full rounded-full object-cover"
                    onError={() => setImageError(true)}
                />
            </div>
        </div>

        {/* Thông tin nhân viên: HIỂN THỊ RÕ TÊN NHÂN VIÊN */}
        <div className="mt-8 text-center w-full z-10 flex-1 flex flex-col justify-center">
            {/* TÊN: Dùng màu Vàng Gold đặc để đảm bảo luôn hiển thị rõ */}
            <h3 className="text-3xl md:text-4xl font-black text-[#FFD700] uppercase tracking-tighter leading-tight mb-3 drop-shadow-[0_2px_10px_rgba(0,0,0,0.5)] truncate w-full px-2">
                {employee.name}
            </h3>
            
            {/* Divider */}
            <div className="flex items-center justify-center gap-4 my-2">
                <div className="h-[1px] w-10 bg-white/20"></div>
                <div className="w-2 h-2 bg-[#FF0000] rotate-45"></div>
                <div className="h-[1px] w-10 bg-white/20"></div>
            </div>

            {/* PHÒNG BAN */}
            <p className="text-white text-base font-bold uppercase tracking-[0.1em] opacity-90 italic">
                {employee.department}
            </p>
        </div>

        {/* Footer Card */}
        <div className="mt-4 w-12 h-1 bg-[#FFD700]/30 rounded-full"></div>

      </div>
    </motion.div>
  );
};
