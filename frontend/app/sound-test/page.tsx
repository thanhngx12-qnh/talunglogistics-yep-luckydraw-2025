// File: frontend/app/sound-test/page.tsx
"use client";

// FIX: Thêm Trophy vào danh sách import
import { Play, Square, Volume2, VolumeX, RefreshCw, Trophy } from "lucide-react"; 
import { useGameAudio } from "@/hooks/useGameAudio";
import Link from "next/link";
import { useState } from "react";

export default function SoundTestPage() {
    // Tự quản lý trạng thái Spinning và Winner giả lập
    const [isTestSpinning, setIsTestSpinning] = useState(false);
    const [isTestWinner, setIsTestWinner] = useState(false);
    
    // Hook âm thanh (không truyền state, sẽ dùng hàm play/stop trực tiếp)
    const { toggleMute, isMuted, playSpin, stopSpin, playWin } = useGameAudio();

    // 1. Hàm khởi tạo Audio (Để cấp quyền Autoplay)
    const handleInitialize = () => {
        // Tương tác đầu tiên của người dùng để trình duyệt cấp quyền
        playSpin(); // Thử bật
        stopSpin(); // Tắt ngay
        alert("Khởi tạo thành công! Bây giờ bạn có thể thử các nút Play.");
    }
    
    // 2. Hàm Test Play Spin
    const handlePlaySpin = () => {
        setIsTestWinner(false);
        setIsTestSpinning(true);
        playSpin();
    }
    
    // 3. Hàm Test Stop Spin
    const handleStopSpin = () => {
        setIsTestSpinning(false);
        stopSpin();
    }
    
    // 4. Hàm Test Play Win
    const handlePlayWin = () => {
        setIsTestSpinning(false);
        setIsTestWinner(true);
        stopSpin(); // Đảm bảo nhạc Spin dừng
        playWin();
    }
    

    return (
        <main className="min-h-screen bg-gray-900 text-white p-10 font-sans">
            <Link href="/display" className="flex items-center gap-2 text-blue-400 hover:text-blue-300 transition-colors mb-6">
                &larr; Về Màn Hình Chính
            </Link>
            
            <h1 className="text-3xl font-bold text-yellow-400 mb-6">Trang Test Âm Thanh (Debug Autoplay)</h1>

            <div className="bg-gray-800 p-6 rounded-xl space-y-6">
                
                {/* TRẠNG THÁI & KHỞI TẠO */}
                <div className="flex items-center gap-4 border-b border-gray-700 pb-4">
                    <button 
                        onClick={handleInitialize}
                        className="bg-blue-600 hover:bg-blue-500 py-2 px-4 rounded-lg font-bold text-lg flex items-center gap-2"
                    >
                        <Volume2 className="w-5 h-5" /> Bước 1: CẤP QUYỀN VÀ KHỞI TẠO AUDIO
                    </button>
                    <p className="text-sm text-gray-400"> (Bắt buộc phải click 1 lần để trình duyệt cho phép phát)</p>
                </div>
                
                {/* NÚT TEST SPIN */}
                <div className="flex items-center gap-4">
                    <button 
                        onClick={handlePlaySpin}
                        disabled={isTestSpinning}
                        className="bg-green-600 hover:bg-green-500 py-3 px-6 rounded-xl font-bold text-xl flex items-center gap-2 disabled:bg-gray-600"
                    >
                        <Play className="w-6 h-6" /> TEST: Play Spin Loop
                    </button>
                    <button 
                        onClick={handleStopSpin}
                        disabled={!isTestSpinning}
                        className="bg-red-600 hover:bg-red-500 py-3 px-6 rounded-xl font-bold text-xl flex items-center gap-2 disabled:bg-gray-600"
                    >
                        <Square className="w-6 h-6" /> TEST: Stop Spin
                    </button>
                    <span className={`text-lg font-semibold ${isTestSpinning ? 'text-green-400' : 'text-gray-400'}`}>{isTestSpinning ? 'ĐANG PHÁT' : 'ĐÃ DỪNG'}</span>
                </div>

                {/* NÚT TEST WIN */}
                <div className="pt-4 border-t border-gray-700">
                    <button 
                        onClick={handlePlayWin}
                        className="bg-yellow-600 hover:bg-yellow-500 py-3 px-6 rounded-xl font-bold text-xl flex items-center gap-2"
                    >
                        <Trophy className="w-6 h-6" /> TEST: Play Win Sound
                    </button>
                    <span className={`text-lg font-semibold ml-4 ${isTestWinner ? 'text-yellow-400' : 'text-gray-400'}`}> (Phát 1 lần)</span>
                </div>
                
                {/* NÚT MUTE */}
                <div className="pt-4 border-t border-gray-700">
                    <button 
                        onClick={toggleMute}
                        className="bg-gray-600 hover:bg-gray-500 py-3 px-6 rounded-xl font-bold text-xl flex items-center gap-2"
                    >
                         {isMuted ? <VolumeX className="w-6 h-6 text-red-400" /> : <Volume2 className="w-6 h-6" />}
                         {isMuted ? 'UNMUTE' : 'MUTE'}
                    </button>
                </div>
                
                {/* HƯỚNG DẪN */}
                <div className='pt-6 border-t border-gray-700 space-y-2 text-sm text-gray-400'>
                    <p>Nếu không có tiếng sau khi Click Khởi tạo, vui lòng kiểm tra:</p>
                    <ul className='list-disc list-inside ml-4'>
                        <li>Bạn đã chép file <code className='text-white'>spin.mp3</code> và <code className='text-white'>win.mp3</code> (chữ thường) vào thư mục <code className='text-white'>yep-luckydraw/public/sounds</code> chưa?</li>
                        <li>Đảm bảo âm lượng máy tính đang mở.</li>
                    </ul>
                </div>

            </div>
        </main>
    );
}
