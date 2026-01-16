// File: frontend/app/admin/page.tsx
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Upload, Trash2, List, Settings, RefreshCw, 
  AlertTriangle, Home, Trophy, PlusCircle, 
  PenTool, X, User, ChevronRight, FileText 
} from 'lucide-react';
import axios from 'axios';
import { socket } from '@/lib/socket';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3003';

// --- INTERFACES ---
interface PrizeData { id: string; name: string; quantity: number; batchSize: number; imageUrl: string; sortOrder: number; }
interface EmployeeData {
  id: string;
  name: string;
  code: string;
  department: string;
  avatarUrl?: string;
  isWinner: boolean;
  prize?: PrizeData;
}
interface WinnerData extends EmployeeData {}

type AdminTabs = 'employees' | 'winners' | 'prizes' | 'upload';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<AdminTabs>('employees');
  const [file, setFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [winnersList, setWinnersList] = useState<WinnerData[]>([]);
  const [prizesList, setPrizesList] = useState<PrizeData[]>([]);
  const [employeesList, setEmployeesList] = useState<EmployeeData[]>([]);
  
  const [isPrizeModalOpen, setIsPrizeModalOpen] = useState(false);
  const [editingPrize, setEditingPrize] = useState<PrizeData | null>(null);
  
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<EmployeeData | null>(null);

  // --- LOGIC FETCH DATA ---
  const fetchEmployees = useCallback(async () => {
      try {
        const response = await axios.get(`${API_URL}/employees`);
        const allEmployees = response.data as EmployeeData[];
        setEmployeesList(allEmployees);
        setWinnersList(allEmployees.filter(e => e.prize && e.prize.id) as WinnerData[]);
      } catch (error) {
        console.error('Error fetching employees:', error);
      }
  }, [API_URL]);
  
  const fetchPrizes = useCallback(async () => {
    try {
      const response = await axios.get(`${API_URL}/prizes`);
      setPrizesList(response.data);
    } catch (error) {
        console.error('Error fetching prizes:', error);
    }
  }, [API_URL]);

  useEffect(() => {
    fetchEmployees();
    fetchPrizes();
    socket.on('data_refresh_required', () => {
        fetchEmployees();
        fetchPrizes();
    });
    return () => { socket.off('data_refresh_required'); }
  }, [fetchEmployees, fetchPrizes]);

  const handleImport = async () => {
    if (!file) return;
    setUploadStatus('loading');
    const formData = new FormData();
    formData.append('file', file);
    try {
      await axios.post(`${API_URL}/employees/import`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setUploadStatus('success');
      alert(`Thành công! Dữ liệu đã được cập nhật.`);
      setActiveTab('employees');
      fetchEmployees();
    } catch (error) {
      setUploadStatus('error');
      alert('Lỗi định dạng file!');
    } finally { setUploadStatus('idle'); }
  };

  const handleCancelResult = (employeeId: string, employeeName: string) => {
    if (!confirm(`Hủy giải thưởng của ${employeeName}?`)) return;
    socket.emit('admin_cancel_result', { employeeId });
    setTimeout(fetchEmployees, 500); // Đợi DB cập nhật rồi fetch lại
  };

  // --- UI COMPONENTS: MODALS ---

  // 1. Modal sửa Nhân Viên (MỚI BỔ SUNG)
  const EmployeeFormModal = ({ employee, onClose }: { employee: EmployeeData | null, onClose: () => void }) => {
    return (
      <div className="fixed inset-0 bg-[#001F3F]/90 backdrop-blur-md z-[100] flex items-center justify-center p-4">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-[#003366] border border-white/20 rounded-3xl p-8 w-full max-w-md shadow-2xl">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-black text-[#FFD700] italic">CHI TIẾT NHÂN SỰ</h3>
            <button onClick={onClose} className="text-white/50 hover:text-white"><X /></button>
          </div>
          <div className="space-y-6">
            <div className="flex flex-col items-center mb-4">
              <div className="w-24 h-24 rounded-2xl border-2 border-[#FFD700] overflow-hidden mb-4 shadow-xl">
                <img src={employee?.avatarUrl ? `${API_URL}/public/${employee.avatarUrl}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(employee?.name || '')}&background=003366&color=fff`} className="w-full h-full object-cover" />
              </div>
              <p className="text-white font-black text-xl">{employee?.name}</p>
              <p className="text-[#FFD700] font-bold text-sm tracking-widest">{employee?.code}</p>
            </div>
            <div className="bg-white/5 p-4 rounded-2xl space-y-2">
               <p className="text-xs text-white/40 uppercase font-bold tracking-widest">Phòng ban</p>
               <p className="text-white font-medium">{employee?.department}</p>
            </div>
            <div className="bg-white/5 p-4 rounded-2xl space-y-2">
               <p className="text-xs text-white/40 uppercase font-bold tracking-widest">Trạng thái giải thưởng</p>
               <p className={employee?.isWinner ? "text-[#FF0000] font-black" : "text-green-400 font-bold"}>
                 {employee?.isWinner ? `ĐÃ TRÚNG: ${employee.prize?.name}` : "CHƯA TRÚNG GIẢI"}
               </p>
            </div>
            <button onClick={onClose} className="w-full py-4 bg-white/10 text-white font-black rounded-xl hover:bg-white/20 transition-all uppercase tracking-tighter">Đóng cửa sổ</button>
          </div>
        </motion.div>
      </div>
    );
  };

  // 2. Modal sửa Giải Thưởng
  const PrizeFormModal = ({ prize, onClose }: { prize: PrizeData | null, onClose: () => void }) => {
    const isEditing = !!prize;
    const [formData, setFormData] = useState({
      name: prize?.name || '',
      quantity: prize?.quantity || 1,
      batchSize: prize?.batchSize || 1,
      imageUrl: prize?.imageUrl || '',
      sortOrder: prize?.sortOrder || 0,
    });

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      try {
        if (isEditing) await axios.put(`${API_URL}/prizes/${prize!.id}`, formData);
        else await axios.post(`${API_URL}/prizes`, formData);
        fetchPrizes();
        onClose();
        socket.emit('data_refresh_required');
      } catch (error) { alert('Lỗi lưu dữ liệu'); }
    };

    return (
      <div className="fixed inset-0 bg-[#001F3F]/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-[#003366] border border-white/20 rounded-3xl p-8 w-full max-w-lg shadow-2xl">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-bold text-[#FFD700] italic">
              {isEditing ? 'HIỆU CHỈNH GIẢI THƯỞNG' : 'THÊM GIẢI THƯỞNG MỚI'}
            </h3>
            <button onClick={onClose} className="text-white/50 hover:text-white"><X /></button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-[10px] font-black text-[#FFD700] uppercase tracking-widest">Tên giải thưởng</label>
              <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 mt-1 text-white focus:border-[#FF0000] outline-none transition-all" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black text-[#FFD700] uppercase tracking-widest">Số lượng tổng</label>
                <input type="number" value={formData.quantity} onChange={e => setFormData({...formData, quantity: parseInt(e.target.value)})} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 mt-1 text-white focus:border-[#FF0000] outline-none" />
              </div>
              <div>
                <label className="text-[10px] font-black text-[#FFD700] uppercase tracking-widest">SL mỗi lượt quay</label>
                <input type="number" value={formData.batchSize} onChange={e => setFormData({...formData, batchSize: parseInt(e.target.value)})} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 mt-1 text-white focus:border-[#FF0000] outline-none" />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-black text-[#FFD700] uppercase tracking-widest">Tên file ảnh</label>
              <input type="text" value={formData.imageUrl} onChange={e => setFormData({...formData, imageUrl: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl p-3 mt-1 text-white focus:border-[#FF0000] outline-none" placeholder="iphone.png" />
            </div>
            <div className="pt-4 flex gap-3">
              <button type="submit" className="flex-1 py-4 bg-gradient-to-r from-[#DC2626] to-[#FF0000] text-white font-black rounded-xl hover:brightness-125 transition-all uppercase tracking-tighter shadow-lg shadow-red-600/20">Xác nhận lưu</button>
              <button type="button" onClick={onClose} className="px-6 py-4 bg-white/10 text-white font-bold rounded-xl hover:bg-white/20 transition-all uppercase text-sm">Hủy</button>
            </div>
          </form>
        </motion.div>
      </div>
    );
  };

  // --- MAIN RENDER ---
  return (
    <div className="min-h-screen bg-truck-pattern bg-fixed bg-cover flex flex-col font-sans select-none">
      <div className="fixed inset-0 bg-gradient-to-br from-[#003366] via-[#001F3F] to-black opacity-95 -z-10"></div>

      <div className="w-full max-w-7xl mx-auto p-4 md:p-8 flex-1">
        
        {/* Header Section */}
        <header className="flex flex-col md:flex-row justify-between items-center mb-10 gap-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-[#FF0000] to-[#003366] rounded-2xl flex items-center justify-center shadow-2xl rotate-3 border border-white/20">
              <Settings className="text-white w-8 h-8 animate-[spin_10s_linear_infinite]" />
            </div>
            <div>
              <h1 className="text-4xl font-black italic tracking-tighter text-white uppercase">
                ADMIN <span className="bg-gradient-to-r from-[#FFD700] via-[#FFFFFF] to-[#FFD700] bg-clip-text text-transparent">DASHBOARD</span>
              </h1>
              <p className="text-[#FFD700] font-bold text-[10px] tracking-[0.4em] uppercase opacity-80">Logistics Excellence 2025</p>
            </div>
          </div>
          <Link href="/display" className="group flex items-center gap-3 bg-white/5 backdrop-blur-xl border border-white/10 px-6 py-3 rounded-2xl font-bold hover:bg-[#FF0000] transition-all duration-500 shadow-xl">
            <Home className="w-5 h-5 text-[#FFD700] group-hover:text-white" />
            <span className="text-white uppercase text-xs tracking-widest">Màn hình chính</span>
          </Link>
        </header>

        {/* Navigation Tabs */}
        <nav className="flex flex-wrap gap-2 mb-8 bg-black/20 p-2 rounded-3xl border border-white/5 backdrop-blur-md">
          {[
            { id: 'employees', icon: User, label: 'Nhân viên' },
            { id: 'winners', icon: Trophy, label: 'Kết quả' },
            { id: 'prizes', icon: List, label: 'Giải thưởng' },
            { id: 'upload', icon: Upload, label: 'Nạp dữ liệu' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as AdminTabs)}
              className={`flex-1 flex items-center justify-center gap-3 px-6 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all duration-300 ${
                activeTab === tab.id 
                ? 'bg-gradient-to-r from-[#DC2626] to-[#FF0000] text-white shadow-lg shadow-red-600/40 scale-105' 
                : 'text-white/50 hover:text-white hover:bg-white/5'
              }`}
            >
              <tab.icon className="w-4 h-4" /> {tab.label}
            </button>
          ))}
        </nav>

        {/* Main Content Area */}
        <main className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-6 md:p-10 shadow-[0_30px_100px_rgba(0,0,0,0.4)] min-h-[600px]">
          
          <AnimatePresence mode="wait">
            {activeTab === 'employees' && (
              <motion.div key="emp" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-xl font-black text-white uppercase italic tracking-tighter flex items-center gap-3">
                    <User className="text-[#FF0000]" /> Danh sách nhân sự
                    <span className="text-[10px] bg-[#FFD700] text-[#003366] px-3 py-1 rounded-full font-black ml-2">{employeesList.length}</span>
                  </h2>
                  <button 
                    onClick={async () => {
                      if(confirm('CẢNH BÁO: Xóa sạch toàn bộ nhân viên khỏi hệ thống?')) { 
                        await axios.delete(`${API_URL}/employees/reset`); 
                        fetchEmployees(); 
                      }
                    }} 
                    className="text-[10px] font-black text-red-500 hover:text-red-400 uppercase tracking-widest flex items-center gap-2 border border-red-500/20 px-4 py-2 rounded-xl transition-all"
                  >
                    <Trash2 size={12} /> Reset hệ thống
                  </button>
                </div>
                
                <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full text-left">
                    <thead className="border-b border-white/10 text-[#FFD700] text-[9px] uppercase tracking-[0.3em] font-black">
                      <tr>
                        <th className="pb-4 px-4">Nhân sự</th>
                        <th className="pb-4 px-4">Bộ phận</th>
                        <th className="pb-4 px-4 text-center">Trạng thái</th>
                        <th className="pb-4 px-4 text-right">Chi tiết</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-sm">
                      {employeesList.map(e => (
                        <tr key={e.id} className="group hover:bg-white/[0.02] transition-colors">
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-xl bg-[#003366] border border-white/10 overflow-hidden group-hover:border-[#FFD700]/50 transition-all shadow-lg">
                                <img src={e.avatarUrl ? `${API_URL}/public/${e.avatarUrl}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(e.name)}&background=003366&color=fff`} className="w-full h-full object-cover" />
                              </div>
                              <div>
                                <p className="font-bold text-white uppercase group-hover:text-[#FFD700] transition-colors">{e.name}</p>
                                <p className="text-[10px] text-white/30 font-mono tracking-tighter">{e.code}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4 text-white/60 font-medium text-xs uppercase">{e.department}</td>
                          <td className="py-4 px-4 text-center">
                            {e.isWinner ? 
                              <span className="bg-red-500/10 text-[#FF0000] border border-red-500/20 px-3 py-1 rounded-lg text-[9px] font-black uppercase">Đã trúng: {e.prize?.name}</span> : 
                              <span className="text-green-500/40 text-[9px] font-bold uppercase tracking-widest">Khả dụng</span>
                            }
                          </td>
                          <td className="py-4 px-4 text-right">
                            {/* FIX: GẮN SỰ KIỆN CLICK VÀO NÚT PEN TOOL */}
                            <button 
                              onClick={() => { setEditingEmployee(e); setIsEmployeeModalOpen(true); }}
                              className="p-3 bg-white/5 rounded-xl text-white/30 hover:text-[#FFD700] hover:bg-white/10 transition-all"
                            >
                              <PenTool size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </motion.div>
            )}

            {activeTab === 'winners' && (
              <motion.div key="win" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }}>
                <div className="flex justify-between items-center mb-8 border-b border-white/10 pb-6">
                  <h2 className="text-2xl font-black text-white italic tracking-tighter uppercase">DANH SÁCH <span className="text-[#FFD700]">TRÚNG GIẢI</span></h2>
                  <button onClick={fetchEmployees} className="bg-white/5 p-3 rounded-xl hover:bg-white/10 transition-all shadow-lg"><RefreshCw className="text-[#FFD700]" size={20} /></button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {winnersList.map(w => (
                    <div key={w.id} className="bg-white/5 border border-white/10 rounded-[1.5rem] p-6 flex items-center gap-4 hover:border-[#FF0000]/50 transition-all relative overflow-hidden group">
                      <div className="absolute top-0 right-0 bg-[#FF0000] text-white text-[9px] font-black px-4 py-1.5 rounded-bl-2xl uppercase tracking-tighter shadow-lg">{w.prize?.name}</div>
                      <div className="w-16 h-16 rounded-full border-2 border-[#FFD700] p-0.5 shrink-0 shadow-xl">
                        <img src={w.avatarUrl ? `${API_URL}/public/${w.avatarUrl}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(w.name)}&background=003366&color=fff`} className="w-full h-full rounded-full object-cover" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-black text-white uppercase truncate text-base tracking-tight">{w.name}</p>
                        <p className="text-[10px] text-white/40 uppercase font-bold tracking-widest mb-2">{w.department}</p>
                        <button onClick={() => handleCancelResult(w.id, w.name)} className="text-[9px] font-black text-[#FF0000] uppercase tracking-widest flex items-center gap-1 hover:brightness-150 transition-all border border-red-500/20 px-2 py-1 rounded-lg bg-red-500/5">
                          <Trash2 size={10} /> Hủy kết quả
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'prizes' && (
              <motion.div key="prz" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
                <div className="flex justify-between items-center mb-8">
                  <h2 className="text-xl font-black text-white uppercase italic tracking-tighter flex items-center gap-3"><Trophy className="text-[#FFD700]" /> Cơ cấu giải thưởng</h2>
                  <button onClick={() => { setEditingPrize(null); setIsPrizeModalOpen(true); }} className="bg-gradient-to-r from-[#DC2626] to-[#FF0000] text-white font-black px-6 py-3 rounded-xl flex items-center gap-2 text-[10px] tracking-[0.2em] uppercase shadow-lg shadow-red-600/30">
                    <PlusCircle size={14} /> Thêm giải mới
                  </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {prizesList.sort((a,b) => a.sortOrder - b.sortOrder).map(p => (
                    <div key={p.id} onClick={() => { setEditingPrize(p); setIsPrizeModalOpen(true); }} className="bg-white/5 border border-white/10 rounded-[2rem] p-6 flex items-center gap-6 hover:bg-white/[0.08] transition-all cursor-pointer group shadow-xl">
                      <div className="w-20 h-20 bg-[#001F3F] rounded-2xl flex items-center justify-center p-3 border border-white/10 group-hover:border-[#FFD700]/50 transition-all">
                        {p.imageUrl ? <img src={p.imageUrl.startsWith('http') ? p.imageUrl : `${API_URL}/public/${p.imageUrl}`} className="w-full h-full object-contain" /> : <Trophy className="text-white/10" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-black text-[#FFD700] uppercase tracking-[0.3em] mb-1">Cấp độ: {p.sortOrder}</p>
                        <h3 className="text-xl font-black text-white uppercase italic truncate leading-none mb-3">{p.name}</h3>
                        <div className="flex gap-4">
                          <div className="text-[10px] text-white/40 font-black uppercase">Tổng số: <span className="text-white">{p.quantity}</span></div>
                          <div className="text-[10px] text-white/40 font-black uppercase">Mỗi lượt: <span className="text-white">{p.batchSize}</span></div>
                        </div>
                      </div>
                      <ChevronRight className="text-white/10 group-hover:text-white transition-all" />
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'upload' && (
              <motion.div key="upl" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="max-w-2xl mx-auto py-10">
                <div className="text-center mb-10">
                  <div className="w-20 h-20 bg-red-600/10 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-red-500/20">
                    <FileText className="text-[#FF0000] w-10 h-10" />
                  </div>
                  <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter">Nạp nhân sự hàng loạt</h2>
                  <p className="text-white/40 text-xs mt-3 uppercase tracking-widest font-bold">Yêu cầu file CSV: Mã NV, Tên, Phòng ban</p>
                </div>

                <div className="bg-black/40 border-2 border-dashed border-white/10 rounded-[2.5rem] p-16 text-center hover:border-[#FF0000]/50 transition-all group shadow-2xl relative overflow-hidden">
                  <input type="file" onChange={e => setFile(e.target.files?.[0] || null)} className="hidden" id="admin-file-upload" accept=".csv" />
                  <label htmlFor="admin-file-upload" className="cursor-pointer flex flex-col items-center relative z-10">
                    <Upload className="w-16 h-16 text-white/10 group-hover:text-[#FFD700] transition-all mb-6" />
                    <p className="text-white font-black text-xl uppercase tracking-tight">{file ? file.name : "CHỌN TẬP TIN DANH SÁCH"}</p>
                    <p className="text-white/20 text-[10px] mt-3 font-mono">{file ? `${Math.round(file.size/1024)} KB` : "Click hoặc kéo thả file .csv vào đây"}</p>
                  </label>
                </div>

                <button 
                  onClick={handleImport}
                  disabled={!file || uploadStatus === 'loading'}
                  className="w-full mt-10 py-6 bg-gradient-to-r from-[#DC2626] to-[#FF0000] text-white font-black rounded-2xl shadow-2xl shadow-red-600/40 hover:scale-[1.02] active:scale-95 disabled:opacity-30 disabled:grayscale transition-all uppercase tracking-[0.2em] italic"
                >
                  {uploadStatus === 'loading' ? 'Đang xử lý dữ liệu...' : 'Tiến hành nạp ngay'}
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* Prize Modal */}
      <AnimatePresence>
        {isPrizeModalOpen && <PrizeFormModal prize={editingPrize} onClose={() => setIsPrizeModalOpen(false)} />}
      </AnimatePresence>
      
      {/* Employee Modal */}
      <AnimatePresence>
        {isEmployeeModalOpen && <EmployeeFormModal employee={editingEmployee} onClose={() => setIsEmployeeModalOpen(false)} />}
      </AnimatePresence>
      
      <footer className="w-full p-10 text-center">
        <p className="text-white/10 text-[9px] font-black uppercase tracking-[1.2em]">Logistics Excellence • 2025</p>
      </footer>
    </div>
  );
}
