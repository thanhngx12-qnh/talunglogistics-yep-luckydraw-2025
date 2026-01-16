// File: frontend/app/display/page.tsx
"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { socket } from "@/lib/socket";
import confetti from "canvas-confetti";
import { motion, AnimatePresence } from "framer-motion";
import { WinnerCard } from "@/components/WinnerCard";
import { Play, Square, Trophy, AlertTriangle, RefreshCw, List, MonitorPlay, Volume2, VolumeX, Settings } from "lucide-react";
import { useGameAudio } from "@/hooks/useGameAudio";
import Link from "next/link";

interface Winner { id: string; name: string; department: string; code: string; avatarUrl?: string; }
interface Prize { id: string; name: string; imageUrl: string; quantity: number; remaining?: number; employees: Winner[]; }

const DUMMY_NAMES = [
  "Nguyễn Văn A", "Trần Thị B", "Lê Văn C", "Phạm Thị D", 
  "Hoàng Văn E", "Vũ Thị F", "Đặng Văn G", "Bùi Thị H",
  "Đang quay...", "Hồi hộp quá...", "Ai đây???"
];

export default function DisplayPage() {
  const [viewMode, setViewMode] = useState<"SPIN" | "SUMMARY">("SPIN");
  const [status, setStatus] = useState<"IDLE" | "SPINNING" | "COMPLETED">("IDLE");
  const [prizeImage, setPrizeImage] = useState<string | null>(null);
  const [winners, setWinners] = useState<Winner[]>([]);
  const [runningName, setRunningName] = useState("SẴN DÀNG");
  
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [selectedPrizeId, setSelectedPrizeId] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const spinInterval = useRef<NodeJS.Timeout | null>(null);
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3003";

  // --- TÍCH HỢP AUDIO MỚI ---
  const { toggleMute, isMuted, playSpin, stopSpin, playWin } = useGameAudio();


  const loadPrizes = useCallback(() => {
    fetch(`${API_URL}/prizes`)
      .then((res) => res.json())
      .then((data) => {
        setPrizes(data);
        if (!selectedPrizeId && data.length > 0) {
           const available = data.find((p: any) => p.remaining > 0) || data[0];
           setSelectedPrizeId(available.id);
           setPrizeImage(available.imageUrl);
        }
      })
      .catch(err => console.error(err));
  }, [API_URL, selectedPrizeId]);

  useEffect(() => {
    loadPrizes();
    if (!socket.connected) socket.connect();

    socket.on("sync_prize_image", (data) => {
      setPrizeImage(data.imageUrl);
      setStatus("IDLE");
      setWinners([]);
      setRunningName("SẴN DÀNG");
      setErrorMsg(null);
      setViewMode("SPIN");
    });

    socket.on("spin_started", () => {
      setStatus("SPINNING");
      setWinners([]);
      setErrorMsg(null);
      setViewMode("SPIN");
      
      playSpin(); // BẮT ĐẦU PHÁT NHẠC SPIN
      
      if (spinInterval.current) clearInterval(spinInterval.current);
      spinInterval.current = setInterval(() => {
        setRunningName(DUMMY_NAMES[Math.floor(Math.random() * DUMMY_NAMES.length)]);
      }, 50);
    });

    socket.on("spin_completed", (data) => {
      if (spinInterval.current) clearInterval(spinInterval.current);
      
      stopSpin(); // DỪNG NHẠC SPIN
      setStatus("COMPLETED"); 
      setWinners(data);
      playWin(); // PHÁT NHẠC WIN
      fireConfetti();
      loadPrizes(); 
    });

    socket.on("spin_error", (data: { message: string }) => {
      if (spinInterval.current) clearInterval(spinInterval.current);
      
      stopSpin(); // DỪNG NHẠC SPIN KHI CÓ LỖI
      setStatus("IDLE");
      setRunningName("CHỜ BAN TỔ CHỨC...");
      const msg = Array.isArray(data.message) ? data.message.join(", ") : data.message;
      setErrorMsg(msg);
      setTimeout(() => setErrorMsg(null), 5000);
    });

    return () => {
      socket.off("sync_prize_image");
      socket.off("spin_started");
      socket.off("spin_completed");
      socket.off("spin_error");
      if (spinInterval.current) clearInterval(spinInterval.current);
    };
  }, [loadPrizes, playSpin, stopSpin, playWin]); // Thêm dependencies

  const handleSelectPrize = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const prizeId = e.target.value;
    setSelectedPrizeId(prizeId);
    const prize = prizes.find(p => p.id === prizeId);
    if (prize) {
      socket.emit("admin_select_prize", { prizeId: prize.id, imageUrl: prize.imageUrl });
    }
  };

  const handleStart = () => {
    if (!selectedPrizeId) return alert("Chưa chọn giải thưởng!");
    // Lệnh socket emit được gọi trực tiếp từ user interaction
    socket.emit("admin_start_spin", { prizeId: selectedPrizeId });
  };

  const handleStop = () => {
    // Lệnh socket emit được gọi trực tiếp từ user interaction
    socket.emit("admin_stop_spin", { prizeId: selectedPrizeId });
  };

  const fireConfetti = () => {
    const duration = 3000;
    const end = Date.now() + duration;
    const frame = () => {
      confetti({ particleCount: 5, angle: 60, spread: 55, origin: { x: 0 }, colors: ['#FFD700', '#FFA500', '#FFFFFF'] });
      confetti({ particleCount: 5, angle: 120, spread: 55, origin: { x: 1 }, colors: ['#FFD700', '#FFA500', '#FFFFFF'] });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();
  };

  const getDisplayQuantity = (p: Prize) => {
    if (p.remaining !== undefined) return p.remaining;
    return p.quantity;
  };

  return (
    <main className="min-h-screen bg-slate-950 flex flex-col overflow-hidden relative font-sans">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-900 via-slate-950 to-black opacity-80 z-0"></div>

      <div className="z-10 flex-1 flex flex-col items-center p-4 pb-32 w-full max-w-7xl mx-auto">
        
        <motion.div initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-center mb-6 mt-4">
          <h1 className="text-4xl md:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-yellow-600 drop-shadow-lg tracking-wider">
            {viewMode === 'SUMMARY' ? 'BẢNG VINH DANH' : 'YEAR END PARTY'}
          </h1>
          <p className="text-blue-300 text-lg md:text-xl mt-2 tracking-widest uppercase">Lucky Draw 2024</p>
        </motion.div>

        <AnimatePresence>
          {errorMsg && (
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute top-24 bg-red-600/90 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-2 z-50 backdrop-blur-sm">
              <AlertTriangle className="animate-pulse" />
              <span className="font-bold uppercase tracking-wide">{errorMsg}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* --- VIEW 1: SPIN MODE (QUAY SỐ) --- */}
        {viewMode === "SPIN" && (
          <div className="relative w-full flex flex-col items-center justify-center flex-1">
            <AnimatePresence mode="wait">
              {status !== "COMPLETED" && (
                <motion.div key="spinning-area" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 1.5, filter: "blur(10px)" }} className="flex flex-col items-center">
                  <div className="w-64 h-64 md:w-80 md:h-80 bg-white/5 rounded-full flex items-center justify-center border-4 border-yellow-500/50 shadow-[0_0_50px_rgba(234,179,8,0.3)] mb-8 overflow-hidden backdrop-blur-sm">
                    {prizeImage ? <img src={prizeImage} alt="Prize" className="w-full h-full object-contain p-6 hover:scale-110 transition-transform duration-500" /> : <div className="text-6xl animate-bounce">🎁</div>}
                  </div>
                  {status === "SPINNING" && (
                    <div className="bg-black/60 backdrop-blur-md px-16 py-8 rounded-3xl border border-yellow-500/50 shadow-2xl">
                      <h2 className="text-5xl md:text-6xl font-mono text-yellow-400 font-bold animate-pulse tracking-wider">{runningName}</h2>
                    </div>
                  )}
                </motion.div>
              )}

              {status === "COMPLETED" && (
                <motion.div key="winners-area" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} className="w-full flex flex-col items-center">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 justify-items-center mb-8">
                    {winners.map((employee) => <WinnerCard key={employee.id} employee={employee} apiBaseUrl={API_URL} />)}
                  </div>
                  <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.5 } }} className="text-center">
                    <h2 className="text-5xl text-white font-bold mb-2 drop-shadow-md">XIN CHÚC MỪNG!</h2>
                    <p className="text-yellow-400 text-2xl font-light">Đã trở thành chủ nhân giải thưởng</p>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* --- VIEW 2: SUMMARY MODE (TỔNG KẾT) --- */}
        {viewMode === "SUMMARY" && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} 
            className="w-full h-full overflow-y-auto pr-2 pb-20 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {prizes.map((prize) => (
              prize.employees.length > 0 && (
                <div key={prize.id} className="bg-gray-900/60 border border-yellow-500/30 rounded-xl overflow-hidden backdrop-blur-sm">
                  <div className="bg-yellow-900/40 p-3 border-b border-yellow-500/30 flex items-center justify-between">
                    <h3 className="text-yellow-400 font-bold uppercase truncate flex-1">{prize.name}</h3>
                    <span className="text-xs bg-yellow-500 text-black px-2 py-0.5 rounded-full font-bold">{prize.employees.length}</span>
                  </div>
                  <div className="p-3 max-h-60 overflow-y-auto space-y-2 custom-scrollbar">
                    {prize.employees.map((emp) => (
                      <div key={emp.id} className="flex items-center gap-3 bg-black/40 p-2 rounded-lg">
                         <div className="w-8 h-8 rounded-full bg-gray-700 overflow-hidden shrink-0">
                           <img src={emp.avatarUrl ? (emp.avatarUrl.startsWith('http') ? emp.avatarUrl : `${API_URL}/public/${emp.avatarUrl}`) : `https://ui-avatars.com/api/?name=${encodeURIComponent(emp.name)}&background=random`} className="w-full h-full object-cover" />
                         </div>
                         <div className="min-w-0">
                           <p className="text-white text-sm font-semibold truncate">{emp.name}</p>
                           <p className="text-gray-400 text-xs truncate">{emp.department}</p>
                         </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            ))}
          </motion.div>
        )}

      </div>

      {/* --- CONTROL BAR --- */}
      <div className="z-50 fixed bottom-0 left-0 right-0 h-24 bg-gray-900/90 backdrop-blur-xl border-t border-gray-700 flex items-center justify-between px-8 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
        
        {/* Left: Prize Selector / Audio Mute / Admin Button */}
        <div className="flex items-center gap-4">
           {viewMode === "SPIN" && (
             <>
                <div className="flex items-center gap-2 text-yellow-500 font-bold uppercase tracking-wider hidden md:flex">
                  <Trophy className="w-6 h-6" />
                  <span>Giải:</span>
                </div>
                <select 
                  className="bg-gray-800 text-white border border-gray-600 rounded-lg px-4 py-3 text-lg focus:ring-2 focus:ring-yellow-500 outline-none w-48 md:w-auto"
                  value={selectedPrizeId}
                  onChange={handleSelectPrize}
                  disabled={status === "SPINNING"}
                >
                  {prizes.map((p) => (
                    <option key={p.id} value={p.id} className={getDisplayQuantity(p) === 0 ? "text-gray-500 bg-gray-900" : ""}>
                      {p.name} (Còn: {getDisplayQuantity(p)})
                    </option>
                  ))}
                </select>
             </>
           )}
           
           {/* Nút Mute / Unmute */}
           <button 
             onClick={toggleMute} 
             className="p-3 rounded-full bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors ml-4"
             title={isMuted ? "Bật âm thanh" : "Tắt âm thanh"}
           >
             {isMuted ? <VolumeX className="w-5 h-5 text-red-400" /> : <Volume2 className="w-5 h-5" />}
           </button>
           
           {/* Nút Mở Admin Page */}
           <Link
             href="/admin"
             className="p-3 rounded-full bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors flex items-center justify-center"
             title="Mở Trang Quản Trị"
           >
             <Settings className="w-5 h-5" />
           </Link>
        </div>

        {/* Center: Main Action Button */}
        <div className="absolute left-1/2 -translate-x-1/2 -top-10">
          {viewMode === "SPIN" ? (
             status !== "SPINNING" ? (
              <button onClick={handleStart} className="w-24 h-24 bg-gradient-to-br from-green-500 to-green-700 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(34,197,94,0.6)] hover:scale-105 active:scale-95 transition-all border-4 border-gray-900 group">
                <Play className="w-10 h-10 text-white ml-1 group-hover:animate-pulse" fill="white" />
              </button>
            ) : (
              <button onClick={handleStop} className="w-24 h-24 bg-gradient-to-br from-red-500 to-red-700 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(239,68,68,0.6)] hover:scale-105 active:scale-95 transition-all border-4 border-gray-900 animate-pulse">
                <Square className="w-10 h-10 text-white" fill="white" />
              </button>
            )
          ) : (
            // Nút quay về khi đang ở chế độ Tổng kết
            <button onClick={() => setViewMode("SPIN")} className="w-24 h-24 bg-gray-700 rounded-full flex items-center justify-center border-4 border-gray-900 hover:bg-gray-600 transition-all shadow-lg">
               <MonitorPlay className="w-10 h-10 text-white" />
            </button>
          )}
        </div>

        {/* Right: Toggle Mode & Refresh */}
        <div className="flex items-center gap-3">
          <button 
             onClick={() => {
                loadPrizes(); 
                setViewMode(prev => prev === "SPIN" ? "SUMMARY" : "SPIN");
             }}
             className={`px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-all ${viewMode === "SUMMARY" ? "bg-yellow-500 text-black" : "bg-gray-800 text-gray-300 hover:bg-gray-700"}`}
          >
            <List className="w-5 h-5" />
            <span className="hidden md:inline">{viewMode === "SPIN" ? "Tổng Kết" : "Quay Số"}</span>
          </button>

          <button onClick={() => window.location.reload()} className="p-3 rounded-full bg-gray-800 hover:bg-gray-700 text-gray-400 hover:text-white transition-colors">
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>
    </main>
  );
}
