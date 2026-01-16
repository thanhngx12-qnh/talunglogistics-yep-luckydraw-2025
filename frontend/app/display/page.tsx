// File: frontend/app/display/page.tsx
"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { socket } from "@/lib/socket";
import confetti from "canvas-confetti";
import { motion, AnimatePresence } from "framer-motion";
import { WinnerCard } from "@/components/WinnerCard";
import { 
  Play, Square, Trophy, AlertTriangle, RefreshCw, 
  List, MonitorPlay, Volume2, VolumeX, Settings, Truck, ChevronRight 
} from "lucide-react";
import { useGameAudio } from "@/hooks/useGameAudio";
import Link from "next/link";

interface Winner { id: string; name: string; department: string; code: string; avatarUrl?: string; }
interface Prize { id: string; name: string; imageUrl: string; quantity: number; remaining?: number; employees: Winner[]; }

const DUMMY_NAMES = [
  "BÙI MINH QUANG", "TRẦN VĂN THÀNH", "LÊ THỊ MAI", "NGUYỄN ANH TUẤN", 
  "VẬN TẢI XUYÊN BIÊN", "LOGISTICS 2025", "HÀNH TRÌNH VƯƠN XA", "TÀ LÙNG BORDER",
  "ĐANG TÌM CHỦ NHÂN...", "HỒI HỘP QUÁ...", "AI SẼ MAY MẮN???"
];

export default function DisplayPage() {
  const [viewMode, setViewMode] = useState<"SPIN" | "SUMMARY">("SPIN");
  const [status, setStatus] = useState<"IDLE" | "SPINNING" | "COMPLETED">("IDLE");
  const [prizeImage, setPrizeImage] = useState<string | null>(null);
  const [winners, setWinners] = useState<Winner[]>([]);
  const [runningName, setRunningName] = useState("SẴN SÀNG");
  
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [selectedPrizeId, setSelectedPrizeId] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const spinInterval = useRef<NodeJS.Timeout | null>(null);
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3003";

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
      setRunningName("SẴN SÀNG");
      setErrorMsg(null);
      setViewMode("SPIN");
    });

    socket.on("spin_started", () => {
      setStatus("SPINNING");
      setWinners([]);
      setErrorMsg(null);
      setViewMode("SPIN");
      playSpin();
      
      if (spinInterval.current) clearInterval(spinInterval.current);
      spinInterval.current = setInterval(() => {
        setRunningName(DUMMY_NAMES[Math.floor(Math.random() * DUMMY_NAMES.length)]);
      }, 50);
    });

    socket.on("spin_completed", (data) => {
      if (spinInterval.current) clearInterval(spinInterval.current);
      stopSpin();
      setStatus("COMPLETED"); 
      setWinners(data);
      playWin();
      fireConfetti();
      loadPrizes(); 
    });

    socket.on("spin_error", (data: { message: string }) => {
      if (spinInterval.current) clearInterval(spinInterval.current);
      stopSpin();
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
  }, [loadPrizes, playSpin, stopSpin, playWin]);

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
    socket.emit("admin_start_spin", { prizeId: selectedPrizeId });
  };

  const handleStop = () => {
    socket.emit("admin_stop_spin", { prizeId: selectedPrizeId });
  };

  const fireConfetti = () => {
    const duration = 5000;
    const end = Date.now() + duration;
    const frame = () => {
      confetti({ particleCount: 7, angle: 60, spread: 60, origin: { x: 0 }, colors: ['#FF0000', '#FFD700', '#FFFFFF'] });
      confetti({ particleCount: 7, angle: 120, spread: 60, origin: { x: 1 }, colors: ['#FF0000', '#FFD700', '#FFFFFF'] });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();
  };

  const getDisplayQuantity = (p: Prize) => {
    if (p.remaining !== undefined) return p.remaining;
    return p.quantity;
  };

  return (
    <main className="min-h-screen bg-truck-pattern bg-fixed bg-cover flex flex-col overflow-hidden relative font-sans">
      <div className="absolute inset-0 bg-gradient-to-br from-[#003366] via-[#001F3F] to-black opacity-95 z-0"></div>

      {/* --- MAIN DISPLAY AREA --- */}
      <div className="z-10 flex-1 flex flex-col items-center justify-center p-4 pb-32">
        
        {/* HEADER */}
        <motion.div 
            animate={status === "COMPLETED" ? { scale: 0.8, y: -20 } : { scale: 1, y: 0 }}
            className="text-center mb-8 relative transition-all duration-700"
        >
          <h1 className="text-5xl md:text-8xl font-black italic tracking-tighter uppercase leading-none mb-2">
            <span className="text-white">YEAR END</span>{" "}
            <span className="bg-gradient-to-r from-[#FFD700] via-white to-[#FFD700] bg-clip-text text-transparent drop-shadow-[0_0_30px_rgba(255,215,0,0.5)]">PARTY</span>
          </h1>
          <div className="flex items-center justify-center gap-4 text-[#FFD700]">
            <p className="text-lg md:text-2xl font-bold tracking-[0.5em] uppercase opacity-90">Lucky Draw 2025</p>
          </div>
        </motion.div>

        {/* ERROR POPUP */}
        <AnimatePresence>
          {errorMsg && (
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute top-32 bg-[#FF0000] text-white px-8 py-4 rounded-2xl shadow-2xl z-50 backdrop-blur-md border border-white/20">
              <span className="font-black uppercase tracking-widest text-sm">{errorMsg}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* VIEW: SPIN MODE */}
        {viewMode === "SPIN" && (
          <div className="relative w-full flex flex-col items-center justify-center flex-1">
            <AnimatePresence mode="wait">
              {status !== "COMPLETED" && (
                <motion.div key="spinning-area" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0, scale: 0.5 }} className="flex flex-col items-center">
                  <div className="w-64 h-64 md:w-80 md:h-80 bg-white/5 rounded-full flex items-center justify-center border-4 border-[#FF0000] shadow-[0_0_60px_rgba(255,0,0,0.3)] mb-12 relative overflow-hidden backdrop-blur-sm">
                    {prizeImage ? <img src={prizeImage} alt="Prize" className="w-full h-full object-contain p-10 drop-shadow-2xl" /> : <Trophy size={100} className="text-white/10" />}
                  </div>
                  {status === "SPINNING" && (
                    <div className="bg-white/5 backdrop-blur-2xl px-16 py-8 rounded-[2.5rem] border border-white/10 shadow-2xl">
                      <h2 className="text-5xl md:text-6xl font-black bg-gradient-to-r from-[#FFFFFF] via-[#FF0000] to-[#FFD700] bg-clip-text text-transparent italic animate-pulse tracking-tighter">
                        {runningName}
                      </h2>
                    </div>
                  )}
                </motion.div>
              )}

              {/* VIEW: WINNER REVEAL - CĂN GIỮA VÀ LÀM LỚN */}
              {status === "COMPLETED" && (
                <motion.div 
                    key="winners-area" 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    className="w-full flex flex-col items-center justify-center"
                >
                  <div className={`flex flex-wrap justify-center items-center gap-12 w-full max-w-7xl px-4`}>
                    {winners.map((employee) => (
                      <WinnerCard key={employee.id} employee={employee} apiBaseUrl={API_URL} />
                    ))}
                  </div>
                  
                  <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0, transition: { delay: 0.8 } }} className="text-center mt-12">
                    <h2 className="text-5xl md:text-7xl font-black text-white italic tracking-tighter drop-shadow-2xl uppercase">
                      XIN CHÚC <span className="text-[#FFD700]">MỪNG!</span>
                    </h2>
                    <p className="text-[#E0E0E0] text-xl md:text-2xl font-bold tracking-[0.3em] uppercase opacity-70 mt-4 underline decoration-[#FF0000] underline-offset-8">
                      CHỦ NHÂN GIẢI THƯỞNG
                    </p>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* VIEW: SUMMARY MODE */}
        {viewMode === "SUMMARY" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full h-full overflow-y-auto pr-4 pb-20 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 custom-scrollbar">
            {prizes.map((prize) => (
              prize.employees.length > 0 && (
                <div key={prize.id} className="bg-white/5 border border-white/10 rounded-[2rem] overflow-hidden backdrop-blur-xl shadow-2xl">
                  <div className="bg-gradient-to-r from-[#003366] to-[#001F3F] p-5 border-b border-[#FF0000]/30 flex items-center justify-between">
                    <h3 className="text-[#FFD700] font-black uppercase italic truncate flex-1 tracking-tight">{prize.name}</h3>
                    <span className="text-sm bg-[#FF0000] text-white px-3 py-1 rounded-full font-black shadow-lg">{prize.employees.length}</span>
                  </div>
                  <div className="p-5 max-h-80 overflow-y-auto space-y-3 custom-scrollbar">
                    {prize.employees.map((emp) => (
                      <div key={emp.id} className="flex items-center gap-4 bg-white/5 p-3 rounded-2xl border border-white/5 hover:border-[#FFD700]/30 transition-colors">
                         <div className="w-12 h-12 rounded-full border-2 border-[#FFD700] overflow-hidden shrink-0">
                           <img src={emp.avatarUrl ? (emp.avatarUrl.startsWith('http') ? emp.avatarUrl : `${API_URL}/public/${emp.avatarUrl}`) : `https://ui-avatars.com/api/?name=${encodeURIComponent(emp.name)}&background=003366&color=fff`} className="w-full h-full object-cover" />
                         </div>
                         <div className="min-w-0">
                           <p className="text-white font-bold uppercase truncate tracking-tighter">{emp.name}</p>
                           <p className="text-white/40 text-[10px] uppercase font-black">{emp.department}</p>
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

      {/* --- BRANDED CONTROL BAR --- */}
      <div className="z-50 fixed bottom-0 left-0 right-0 h-24 bg-[#001F3F]/80 backdrop-blur-3xl border-t border-white/10 flex items-center justify-between px-8 shadow-[0_-20px_50px_rgba(0,0,0,0.5)]">
        <div className="flex items-center gap-4">
           {viewMode === "SPIN" && (
             <div className="flex items-center gap-3 bg-white/5 p-1 rounded-2xl border border-white/10">
                <div className="bg-[#FF0000] p-3 rounded-xl shadow-lg">
                  <Trophy className="w-5 h-5 text-white" />
                </div>
                <select className="bg-transparent text-white font-black uppercase text-sm focus:ring-0 outline-none pr-8 cursor-pointer min-w-[180px]" value={selectedPrizeId} onChange={handleSelectPrize} disabled={status === "SPINNING"}>
                  {prizes.map((p) => ( <option key={p.id} value={p.id} className="bg-[#001F3F] text-white"> {p.name} ({getDisplayQuantity(p)}) </option> ))}
                </select>
             </div>
           )}
           <button onClick={toggleMute} className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 text-white transition-all"> {isMuted ? <VolumeX size={20} className="text-[#FF0000]" /> : <Volume2 size={20} />} </button>
           <Link href="/admin" className="p-4 rounded-2xl bg-white/5 hover:bg-[#FF0000] text-white transition-all group"> <Settings size={20} className="group-hover:rotate-90 transition-transform" /> </Link>
        </div>

        <div className="absolute left-1/2 -translate-x-1/2 -top-12">
          {viewMode === "SPIN" ? (
             status !== "SPINNING" ? (
              <button onClick={handleStart} className="w-28 h-28 bg-gradient-to-br from-[#0052A4] to-[#003366] rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(0,82,164,0.6)] hover:scale-110 active:scale-95 transition-all border-8 border-[#001F3F] group overflow-hidden">
                <Play className="w-12 h-12 text-white ml-2" fill="white" />
              </button>
            ) : (
              <button onClick={handleStop} className="w-28 h-28 bg-gradient-to-br from-[#DC2626] to-[#FF0000] rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(255,0,0,0.6)] hover:scale-110 active:scale-95 transition-all border-8 border-[#001F3F] animate-pulse">
                <Square className="w-12 h-12 text-white" fill="white" />
              </button>
            )
          ) : (
            <button onClick={() => setViewMode("SPIN")} className="w-24 h-24 bg-white/10 backdrop-blur-xl rounded-full flex items-center justify-center border-4 border-white/20 hover:bg-[#FF0000] transition-all"> <MonitorPlay className="w-10 h-10 text-white" /> </button>
          )}
        </div>

        <div className="flex items-center gap-4">
          <button onClick={() => { loadPrizes(); setViewMode(prev => prev === "SPIN" ? "SUMMARY" : "SPIN"); }} className={`px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-[0.2em] flex items-center gap-3 transition-all border ${ viewMode === "SUMMARY" ? "bg-[#FF0000] text-white border-transparent shadow-[0_0_20px_rgba(255,0,0,0.4)]" : "bg-white/5 text-white/50 border-white/10 hover:border-[#FFD700]" }`}> <List size={16} /> {viewMode === "SPIN" ? "Bảng Vinh Danh" : "Về Quay Số"} </button>
          <button onClick={() => window.location.reload()} className="p-4 rounded-2xl bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-all"> <RefreshCw size={20} /> </button>
        </div>
      </div>
    </main>
  );
}
