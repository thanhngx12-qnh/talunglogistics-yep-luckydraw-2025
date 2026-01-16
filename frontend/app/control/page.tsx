"use client";

import { useEffect, useState } from "react";
import { socket } from "@/lib/socket";
import { Play, Square, Trophy, Users, RefreshCw, AlertTriangle } from "lucide-react";

interface Prize {
  id: string;
  name: string;
  imageUrl: string;
  quantity: number;
}

interface Winner {
  id: string;
  name: string;
  department: string;
}

export default function ControlPage() {
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [selectedPrizeId, setSelectedPrizeId] = useState<string>("");
  const [isSpinning, setIsSpinning] = useState(false);
  const [lastWinners, setLastWinners] = useState<Winner[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3003";

  useEffect(() => {
    fetch(`${API_URL}/prizes`)
      .then((res) => res.json())
      .then((data) => {
        setPrizes(data);
        if (data.length > 0) {
          setSelectedPrizeId(data[0].id);
          socket.emit("admin_select_prize", { prizeId: data[0].id, imageUrl: data[0].imageUrl });
        }
      });

    if (!socket.connected) socket.connect();

    // 1. Chỉ khi Server bảo "OK Quay đi" thì mới đổi giao diện sang Dừng
    socket.on("spin_started", () => {
      setIsSpinning(true);
      setLastWinners([]);
      setErrorMsg(null);
    });

    socket.on("spin_completed", (winners: Winner[]) => {
      setIsSpinning(false);
      setLastWinners(winners);
      setErrorMsg(null);
    });

    socket.on("spin_error", (data: { message: string | string[] }) => {
      setIsSpinning(false);
      const msg = Array.isArray(data.message) ? data.message.join(", ") : data.message;
      setErrorMsg(msg);
      // alert("❌ " + msg); // Có thể bỏ alert nếu thấy phiền, vì đã có thông báo đỏ trên màn hình
    });

    return () => {
      socket.off("spin_started");
      socket.off("spin_completed");
      socket.off("spin_error");
    };
  }, []);

  const handleSelectPrize = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const prizeId = e.target.value;
    setSelectedPrizeId(prizeId);
    setErrorMsg(null);
    const prize = prizes.find(p => p.id === prizeId);
    if (prize) {
      socket.emit("admin_select_prize", { prizeId: prize.id, imageUrl: prize.imageUrl });
    }
  };

  const handleStart = () => {
    if (!selectedPrizeId) return alert("Chưa chọn giải!");
    
    // Gửi lệnh Start kèm ID giải thưởng để check
    // KHÔNG set isSpinning(true) ở đây nữa! Chờ server.
    socket.emit("admin_start_spin", { prizeId: selectedPrizeId });
  };

  const handleStop = () => {
    socket.emit("admin_stop_spin", { prizeId: selectedPrizeId });
  };

  const handleCancel = (winnerId: string) => {
    if(!confirm("Hủy kết quả này?")) return;
    socket.emit("admin_cancel_result", { employeeId: winnerId });
    setLastWinners(prev => prev.filter(w => w.id !== winnerId));
  };

  return (
    <main className="min-h-screen bg-gray-900 text-white p-4 md:p-8 flex flex-col items-center">
      <div className="w-full max-w-lg space-y-6">
        <h1 className="text-3xl font-bold text-center text-yellow-500 uppercase">Bảng Điều Khiển</h1>

        {errorMsg && (
          <div className="bg-red-900/80 border border-red-500 p-4 rounded-xl flex items-center gap-3 animate-pulse">
            <AlertTriangle className="text-red-400" />
            <span className="font-bold text-red-100">{errorMsg}</span>
          </div>
        )}

        <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700">
          <label className="flex items-center gap-2 text-yellow-400 font-semibold mb-2">
            <Trophy size={20} /> Chọn Giải Thưởng:
          </label>
          <select 
            className="w-full bg-gray-900 border border-gray-600 rounded-xl p-4 text-xl outline-none"
            value={selectedPrizeId}
            onChange={handleSelectPrize}
            disabled={isSpinning}
          >
            {prizes.map((p) => (
              <option key={p.id} value={p.id}>{p.name} (SL: {p.quantity})</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {!isSpinning ? (
            <button onClick={handleStart} className="w-full h-32 bg-green-600 hover:bg-green-500 active:scale-95 transition-all rounded-3xl flex flex-col items-center justify-center gap-2 shadow-lg">
              <Play size={48} fill="white" />
              <span className="text-3xl font-black uppercase">BẮT ĐẦU</span>
            </button>
          ) : (
            <button onClick={handleStop} className="w-full h-32 bg-red-600 hover:bg-red-500 active:scale-95 transition-all rounded-3xl flex flex-col items-center justify-center gap-2 shadow-lg animate-pulse">
              <Square size={48} fill="white" />
              <span className="text-3xl font-black uppercase">DỪNG LẠI</span>
            </button>
          )}
        </div>

        {lastWinners.length > 0 && (
          <div className="bg-gray-800 p-6 rounded-2xl border border-gray-700">
            <h3 className="text-lg font-semibold text-gray-300 mb-4 flex items-center gap-2"><Users size={20} /> Kết quả:</h3>
            <ul className="space-y-3">
              {lastWinners.map((w) => (
                <li key={w.id} className="bg-gray-900 p-4 rounded-xl flex justify-between items-center border border-gray-700">
                  <div>
                    <p className="text-xl font-bold text-yellow-400">{w.name}</p>
                    <p className="text-sm text-gray-400">{w.department}</p>
                  </div>
                  <button onClick={() => handleCancel(w.id)} className="text-red-400 hover:text-red-300"><RefreshCw size={20} /></button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </main>
  );
}
