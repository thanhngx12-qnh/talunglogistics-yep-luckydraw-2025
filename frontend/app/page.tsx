// File: frontend/app/page.tsx
"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Trophy, Settings, Volume2, MonitorPlay, ChevronRight, Truck } from "lucide-react";

export default function Home() {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.2 }
    }
  };

  const item = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 }
  };

  return (
    <main className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden bg-truck-pattern bg-fixed bg-cover">
      {/* Overlay Gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#003366] via-[#001F3F] to-black opacity-95"></div>

      {/* Decorative Light Spots */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#FF0000]/10 rounded-full blur-[150px] -z-10"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#0052A4]/20 rounded-full blur-[150px] -z-10"></div>

      <motion.div 
        variants={container}
        initial="hidden"
        animate="show"
        className="z-10 w-full max-w-5xl px-6 flex flex-col items-center text-center"
      >
        {/* Logo/Icon Area */}
        <motion.div variants={item} className="mb-8 relative">
          <div className="w-24 h-24 bg-gradient-to-tr from-[#FF0000] to-[#FFD700] rounded-3xl flex items-center justify-center shadow-2xl rotate-12 border border-white/20">
            <Truck className="text-white w-12 h-12 -scale-x-100" />
          </div>
          <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg -rotate-12 border border-blue-900">
            <Trophy className="text-[#003366] w-6 h-6" />
          </div>
        </motion.div>

        {/* Title Section */}
        <motion.div variants={item} className="mb-16">
          <h1 className="text-5xl md:text-8xl font-black italic tracking-tighter leading-none uppercase mb-4">
            <span className="text-white">YEAR END</span>{" "}
            <span className="bg-gradient-to-r from-[#FFD700] via-white to-[#FFD700] bg-clip-text text-transparent">PARTY</span>
          </h1>
          <div className="flex items-center justify-center gap-4">
            <div className="h-[2px] w-12 bg-gradient-to-r from-transparent to-[#FF0000]"></div>
            <p className="text-[#FFD700] font-bold tracking-[0.4em] uppercase text-sm md:text-base">
              Lucky Draw System 2025
            </p>
            <div className="h-[2px] w-12 bg-gradient-to-l from-transparent to-[#FF0000]"></div>
          </div>
        </motion.div>

        {/* Action Cards */}
        <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
          
          {/* Main Display Card */}
          <Link href="/display" className="group">
            <div className="h-full p-8 bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2rem] hover:bg-[#FF0000]/10 hover:border-[#FF0000]/50 transition-all duration-500 shadow-2xl relative overflow-hidden flex flex-col items-center">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-20 transition-opacity">
                <MonitorPlay size={120} />
              </div>
              <div className="w-16 h-16 bg-gradient-to-br from-[#003366] to-[#001F3F] rounded-2xl flex items-center justify-center mb-6 shadow-lg border border-white/10 group-hover:scale-110 transition-transform">
                <MonitorPlay className="text-[#FFD700]" />
              </div>
              <h3 className="text-xl font-black uppercase italic mb-2 tracking-tight">Màn hình chính</h3>
              <p className="text-white/50 text-sm mb-6 leading-relaxed">Giao diện quay thưởng trực tiếp cho sân khấu và khán giả.</p>
              <div className="mt-auto flex items-center text-[#FFD700] font-bold text-xs uppercase tracking-widest group-hover:gap-3 transition-all">
                Truy cập ngay <ChevronRight size={14} />
              </div>
            </div>
          </Link>

          {/* Admin Panel Card */}
          <Link href="/admin" className="group">
            <div className="h-full p-8 bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2rem] hover:bg-[#003366]/40 hover:border-[#0052A4]/50 transition-all duration-500 shadow-2xl relative overflow-hidden flex flex-col items-center">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-20 transition-opacity">
                <Settings size={120} />
              </div>
              <div className="w-16 h-16 bg-gradient-to-br from-[#003366] to-[#001F3F] rounded-2xl flex items-center justify-center mb-6 shadow-lg border border-white/10 group-hover:scale-110 transition-transform">
                <Settings className="text-white" />
              </div>
              <h3 className="text-xl font-black uppercase italic mb-2 tracking-tight">Quản trị viên</h3>
              <p className="text-white/50 text-sm mb-6 leading-relaxed">Thiết lập giải thưởng, nạp danh sách và quản lý kết quả.</p>
              <div className="mt-auto flex items-center text-white/40 font-bold text-xs uppercase tracking-widest group-hover:text-white transition-all">
                Vào hệ thống <ChevronRight size={14} />
              </div>
            </div>
          </Link>

          {/* Sound Test Card */}
          <Link href="/sound-test" className="group">
            <div className="h-full p-8 bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2rem] hover:bg-white/10 hover:border-white/30 transition-all duration-500 shadow-2xl relative overflow-hidden flex flex-col items-center">
              <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-20 transition-opacity">
                <Volume2 size={120} />
              </div>
              <div className="w-16 h-16 bg-gradient-to-br from-[#003366] to-[#001F3F] rounded-2xl flex items-center justify-center mb-6 shadow-lg border border-white/10 group-hover:scale-110 transition-transform">
                <Volume2 className="text-white/60" />
              </div>
              <h3 className="text-xl font-black uppercase italic mb-2 tracking-tight">Kiểm tra âm thanh</h3>
              <p className="text-white/50 text-sm mb-6 leading-relaxed">Đảm bảo nhạc nền quay số và âm thanh chiến thắng sẵn sàng.</p>
              <div className="mt-auto flex items-center text-white/40 font-bold text-xs uppercase tracking-widest group-hover:text-white transition-all">
                Bắt đầu test <ChevronRight size={14} />
              </div>
            </div>
          </Link>

        </motion.div>

        {/* Footer info */}
        <motion.div variants={item} className="mt-20">
          <p className="text-white/10 text-[10px] font-black uppercase tracking-[1.5em] ml-[1.5em]">
            Logistics Excellence • Tà Lùng Border • 2025
          </p>
        </motion.div>
      </motion.div>
    </main>
  );
}
