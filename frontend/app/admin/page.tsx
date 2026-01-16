// File: frontend/app/admin/page.tsx
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { Upload, Trash2, List, Settings, RefreshCw, AlertTriangle, Home, Trophy, PlusCircle, PenTool, X, User } from 'lucide-react';
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
interface WinnerData extends EmployeeData {} // Winner là subtype của Employee

type AdminTabs = 'upload' | 'winners' | 'prizes' | 'employees';

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<AdminTabs>('employees'); // Mặc định mở tab quản lý nhân viên
  const [file, setFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [winnersList, setWinnersList] = useState<WinnerData[]>([]);
  const [prizesList, setPrizesList] = useState<PrizeData[]>([]);
  const [employeesList, setEmployeesList] = useState<EmployeeData[]>([]); // Danh sách nhân viên GỐC
  
  const [isPrizeModalOpen, setIsPrizeModalOpen] = useState(false);
  const [editingPrize, setEditingPrize] = useState<PrizeData | null>(null);
  
  const [isEmployeeModalOpen, setIsEmployeeModalOpen] = useState(false); // Modal Sửa Nhân viên
  const [editingEmployee, setEditingEmployee] = useState<EmployeeData | null>(null);

  // --- LOGIC 1: FETCH DATA ---
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
      setPrizesList(response.data.map((p: any) => ({
        id: p.id, name: p.name, quantity: p.quantity, batchSize: p.batchSize, imageUrl: p.imageUrl, sortOrder: p.sortOrder,
      } as PrizeData)));
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

    return () => {
        socket.off('data_refresh_required');
    }
  }, [fetchEmployees, fetchPrizes]);


  // --- LOGIC 2: UPLOAD (Giữ nguyên) ---
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0]);
      setUploadStatus('idle');
    }
  };

  const handleImport = async () => {
    if (!file) return;
    setUploadStatus('loading');
    const formData = new FormData();
    formData.append('file', file);
    try {
      await axios.post(`${API_URL}/employees/import`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      setUploadStatus('success');
      alert(`Thành công! Đã nạp dữ liệu.`);
      setActiveTab('employees');
      fetchEmployees();
    } catch (error) {
      setUploadStatus('error');
      alert('Lỗi nạp dữ liệu! Vui lòng kiểm tra định dạng file (CSV: code,name,department).');
      console.error(error);
    }
  };


  // --- LOGIC 3: HUỶ KẾT QUẢ ---
  const handleCancelResult = (employeeId: string, employeeName: string) => {
    if (!confirm(`Bạn có chắc muốn HỦY kết quả trúng giải của nhân viên ${employeeName}?`)) return;
    socket.emit('admin_cancel_result', { employeeId });
    fetchEmployees(); // Cập nhật lại
  };
  
  
  // --- SUB-COMPONENTS ---
  
  // 3.1 EMPLOYEE FORM MODAL
  const EmployeeFormModal: React.FC<{ employee: EmployeeData | null, onClose: () => void }> = ({ employee, onClose }) => {
    const isEditing = !!employee;
    const [formData, setFormData] = useState({
        name: employee?.name || '',
        code: employee?.code || '',
        department: employee?.department || '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };
    
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            // Logic Sửa nhân viên (CẦN TẠO API PUT/POST CHO EMPLOYEE)
            // Hiện tại ta chỉ có API GET/POST/DELETE (reset), nên ta sẽ tạm dùng alert
            alert("Tính năng Sửa/Tạo nhân viên cá nhân (API PUT) đang được triển khai. Vui lòng sửa trực tiếp trong CSV và nạp lại.");
            onClose();
            // TODO: Tạo API PUT /employees/:id
        } catch (error) {
            alert('Lỗi khi lưu nhân viên.');
        }
    }
    
    const handleDelete = async () => {
        if(!isEditing || !confirm(`Xác nhận XÓA nhân viên ${employee!.name} khỏi hệ thống?`)) return;
        try {
            // Hiện tại chỉ có API Reset all. Nếu muốn xóa từng người, cần thêm API DELETE /employees/:id
            alert("Tính năng Xóa từng nhân viên (API DELETE) đang được triển khai. Vui lòng dùng tính năng Hủy giải hoặc Reset All.");
            onClose();
            // TODO: Tạo API DELETE /employees/:id
        } catch(error) {
            alert('Lỗi khi xóa nhân viên.');
        }
    }

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/70 z-[10000] flex items-center justify-center backdrop-blur-sm" onClick={onClose}>
            <motion.form initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }} className="bg-gray-800 p-6 rounded-xl w-full max-w-md shadow-2xl border border-gray-700 space-y-4" onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit}>
                <div className="flex justify-between items-center border-b border-gray-700 pb-3">
                    <h3 className="text-xl font-bold text-yellow-400">{isEditing ? `Sửa NV: ${employee!.name}` : 'Thêm Nhân Viên Mới'}</h3>
                    <button type="button" onClick={onClose} className="text-gray-400 hover:text-white"><X /></button>
                </div>
                
                {['name', 'code', 'department'].map(key => (
                    <div key={key}>
                        <label className="block text-sm font-medium text-gray-300 capitalize">{key.replace(/([A-Z])/g, ' $1')}</label>
                        <input name={key} value={formData[key as keyof typeof formData]} onChange={handleChange} required className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2.5 text-white mt-1" />
                    </div>
                ))}
                
                <div className="flex justify-between pt-2">
                    {isEditing && (
                        <button type="button" onClick={handleDelete} className="text-red-400 hover:text-red-300 transition-colors flex items-center gap-1">
                            <Trash2 className="w-4 h-4" /> Xóa NV
                        </button>
                    )}
                    <button type="submit" className="bg-yellow-600 text-black font-bold py-2 px-4 rounded-lg hover:bg-yellow-500 transition-colors ml-auto">LƯU THAY ĐỔI (Tạm thời là Alert)</button>
                </div>
            </motion.form>
        </motion.div>
    );
  };

  // 3.2 PRIZE FORM MODAL (Giữ nguyên)
  const PrizeFormModal: React.FC<{ prize: PrizeData | null, onClose: () => void }> = ({ prize, onClose }) => {
    // ... (Giữ nguyên code PrizeFormModal)
    const [formData, setFormData] = useState<Omit<PrizeData, 'id'>>({
        name: prize?.name || '',
        quantity: prize?.quantity || 1,
        batchSize: prize?.batchSize || 1,
        imageUrl: prize?.imageUrl || '',
        sortOrder: prize?.sortOrder || 0,
    });
    
    const isEditing = !!prize;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ 
            ...prev, 
            [name]: (name === 'quantity' || name === 'batchSize' || name === 'sortOrder') ? parseInt(value) || 0 : value 
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (isEditing) {
                await axios.put(`${API_URL}/prizes/${prize!.id}`, formData);
            } else {
                await axios.post(`${API_URL}/prizes`, formData);
            }
            alert(`Lưu giải thưởng "${formData.name}" thành công!`);
            fetchPrizes();
            onClose();
            socket.emit('data_refresh_required');
        } catch (error) {
            alert('Lỗi khi lưu giải thưởng. Vui lòng kiểm tra các trường dữ liệu.');
            console.error(error);
        }
    };
    
    const handleDelete = async () => {
        if(!isEditing || !confirm(`Xác nhận XÓA giải "${prize!.name}"?`)) return;
        try {
            await axios.delete(`${API_URL}/prizes/${prize!.id}`);
            alert('Đã xóa giải thưởng!');
            fetchPrizes();
            onClose();
        } catch(error) {
            alert('Lỗi khi xóa giải thưởng.');
            console.error(error);
        }
    }


    return (
        <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/70 z-[10000] flex items-center justify-center backdrop-blur-sm" onClick={onClose}
        >
            <motion.form 
                initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
                className="bg-gray-800 p-6 rounded-xl w-full max-w-lg shadow-2xl border border-gray-700 space-y-4" onClick={(e) => e.stopPropagation()}
                onSubmit={handleSubmit}
            >
                <div className="flex justify-between items-center border-b border-gray-700 pb-3">
                    <h3 className="text-xl font-bold text-yellow-400">{isEditing ? `Sửa Giải: ${prize!.name}` : 'Thêm Giải Thưởng Mới'}</h3>
                    <button type="button" onClick={onClose} className="text-gray-400 hover:text-white"><X /></button>
                </div>
                
                {Object.keys(formData).map(key => (
                    <div key={key}>
                        <label className="block text-sm font-medium text-gray-300 capitalize">{key.replace(/([A-Z])/g, ' $1')}</label>
                        <input 
                            type={key === 'quantity' || key === 'batchSize' || key === 'sortOrder' ? 'number' : 'text'}
                            name={key}
                            value={formData[key as keyof typeof formData] as string | number}
                            onChange={handleChange}
                            required
                            className="w-full bg-gray-900 border border-gray-700 rounded-lg p-2.5 text-white mt-1"
                        />
                         {key === 'imageUrl' && <p className="text-xs text-gray-500 mt-1">Gợi ý: Dùng link ảnh trực tiếp (https://...) hoặc tên file (ví dụ: <code className='text-gray-400'>iphone.png</code>) nếu đã chép vào thư mục <code className='text-gray-400'>public</code>.</p>}
                    </div>
                ))}
                
                <div className="flex justify-between pt-2">
                    {isEditing && (
                        <button type="button" onClick={handleDelete} className="text-red-400 hover:text-red-300 transition-colors flex items-center gap-1">
                            <Trash2 className="w-4 h-4" /> Xóa Giải
                        </button>
                    )}
                    <button 
                        type="submit" 
                        className="bg-yellow-600 text-black font-bold py-2 px-4 rounded-lg hover:bg-yellow-500 transition-colors ml-auto"
                    >
                        {isEditing ? 'LƯU THAY ĐỔI' : 'TẠO MỚI GIẢI THƯỞNG'}
                    </button>
                </div>
            </motion.form>
        </motion.div>
    );
  };


  // --- TAB CONTENTS ---
  const UploadTab = (
    <div className="space-y-6">
      <div className="border-2 border-dashed border-gray-600 rounded-xl p-8 text-center hover:bg-gray-700/50 transition-colors">
        <input type="file" onChange={handleFileUpload} accept=".csv,.xlsx" className="hidden" id="file-upload" />
        <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
          <Upload className="w-12 h-12 text-yellow-400 mb-3" />
          <p className="text-gray-200 text-lg font-medium">Kéo thả hoặc nhấn để chọn file CSV/XLSX</p>
          {file && <p className="text-green-400 mt-2 text-sm">{file.name} - ({Math.round(file.size / 1024)} KB)</p>}
        </label>
      </div>
      <button 
        onClick={handleImport}
        disabled={!file || uploadStatus === 'loading'}
        className={`w-full py-3 rounded-xl font-bold text-lg transition-all flex items-center justify-center gap-2 ${
          !file || uploadStatus === 'loading'
            ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
            : 'bg-yellow-600 text-black hover:bg-yellow-500 shadow-lg shadow-yellow-500/30'
        }`}
      >
        {uploadStatus === 'loading' ? (
          <>
            <RefreshCw className="w-5 h-5 animate-spin" /> Đang nạp dữ liệu...
          </>
        ) : (
          'BƯỚC 1: NẠP DANH SÁCH NHÂN VIÊN'
        )}
      </button>
      <p className="text-sm text-gray-400 mt-4 p-3 bg-gray-700/50 rounded-lg">
        LƯU Ý QUAN TRỌNG: File CSV phải có định dạng: <code className='text-yellow-300'>Mã NV, Tên, Phòng ban</code>.
      </p>
    </div>
  );

  const WinnersTab = (
    <div className="space-y-6">
        <div className="flex justify-between items-center bg-gray-700/50 p-3 rounded-xl border border-gray-600">
            <p className="text-base text-gray-300">Tổng cộng: <span className="text-yellow-400 font-bold">{winnersList.length}</span> người đã trúng giải</p>
            <button onClick={fetchEmployees} className="text-green-400 hover:text-green-300 transition-colors flex items-center gap-1 text-sm font-semibold">
                <RefreshCw className="w-4 h-4" /> Tải lại
            </button>
        </div>
        <div className="max-h-[60vh] overflow-y-auto custom-scrollbar rounded-xl border border-gray-700">
            <table className="w-full text-left text-sm text-gray-300">
                <thead className="text-xs text-gray-400 uppercase bg-gray-700/80 sticky top-0 backdrop-blur-sm">
                    <tr>
                        <th scope="col" className="px-4 py-3">Tên / Mã NV</th>
                        <th scope="col" className="px-4 py-3">Giải thưởng</th>
                        <th scope="col" className="px-4 py-3">Phòng ban</th>
                        <th scope="col" className="px-4 py-3 text-right">Hành động</th>
                    </tr>
                </thead>
                <tbody>
                    {winnersList.map((w) => (
                        <motion.tr 
                            key={w.id} 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.2 }}
                            className="bg-gray-800 border-b border-gray-700 hover:bg-gray-700/50"
                        >
                            <th scope="row" className="px-4 py-3 font-medium text-white flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-gray-700 overflow-hidden shrink-0">
                                   <img src={w.avatarUrl ? `${API_URL}/public/${w.avatarUrl}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(w.name)}&background=random`} alt={w.name} className="w-full h-full object-cover" />
                                </div>
                                <div>
                                    {w.name}
                                    <p className="text-xs text-gray-400 mt-0.5">{w.code}</p>
                                </div>
                            </th>
                            <td className="px-4 py-3 text-yellow-400 font-semibold">
                                {w.prize?.name || 'Đã hủy giải'}
                            </td>
                            <td className="px-4 py-3">{w.department}</td>
                            <td className="px-4 py-3 text-right">
                                <button 
                                    onClick={() => handleCancelResult(w.id, w.name)}
                                    className="text-red-400 hover:text-red-300 transition-colors flex items-center justify-end text-sm font-bold gap-1"
                                >
                                    <Trash2 className="w-4 h-4" /> Hủy Giải
                                </button>
                            </td>
                        </motion.tr>
                    ))}
                </tbody>
            </table>
        </div>
        {winnersList.length === 0 && <p className="text-center text-gray-500 py-10">Chưa có ai trúng giải!</p>}
    </div>
  );
  
  const PrizesTab = (
      <div className='space-y-6'>
          <div className='flex justify-between items-center'>
              <p className="text-base text-gray-300">Tổng cộng: <span className="text-yellow-400 font-bold">{prizesList.length}</span> loại giải thưởng</p>
              <button 
                onClick={() => { setEditingPrize(null); setIsPrizeModalOpen(true); }}
                className='bg-green-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-500 transition-colors flex items-center gap-2'
              >
                  <PlusCircle className='w-5 h-5' /> Thêm Giải Thưởng
              </button>
          </div>
          
          <div className="max-h-[60vh] overflow-y-auto custom-scrollbar rounded-xl border border-gray-700">
            <table className="w-full text-left text-sm text-gray-300">
                <thead className="text-xs text-gray-400 uppercase bg-gray-700/80 sticky top-0 backdrop-blur-sm">
                    <tr>
                        <th scope="col" className="px-4 py-3">Tên Giải</th>
                        <th scope="col" className="px-4 py-3">SL Tổng/Lượt</th>
                        <th scope="col" className="px-4 py-3">Ảnh</th>
                        <th scope="col" className="px-4 py-3">Thứ tự</th>
                        <th scope="col" className="px-4 py-3 text-right">Hành động</th>
                    </tr>
                </thead>
                <tbody>
                    {prizesList.sort((a,b) => a.sortOrder - b.sortOrder).map((p) => (
                        <tr 
                            key={p.id} 
                            className="bg-gray-800 border-b border-gray-700 hover:bg-gray-700/50 cursor-pointer"
                        >
                            <th scope="row" className="px-4 py-3 font-medium text-white">
                                {p.name}
                            </th>
                            <td className="px-4 py-3">
                                <span className="text-yellow-400 font-bold">{p.quantity}</span> / {p.batchSize}
                            </td>
                            <td className="px-4 py-3">
                                {p.imageUrl ? <img src={p.imageUrl.startsWith('http') ? p.imageUrl : `${API_URL}/public/${p.imageUrl}`} alt="Prize" className="w-10 h-10 object-contain" /> : 'Không có ảnh'}
                            </td>
                            <td className="px-4 py-3">{p.sortOrder}</td>
                            <td className="px-4 py-3 text-right">
                                <button 
                                    onClick={() => { setEditingPrize(p); setIsPrizeModalOpen(true); }}
                                    className="text-blue-400 hover:text-blue-300 transition-colors flex items-center justify-end text-sm font-bold gap-1"
                                >
                                    <PenTool className="w-4 h-4" /> Sửa
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
          </div>
          
          {prizesList.length === 0 && <p className="text-center text-gray-500 py-10">Chưa có giải thưởng nào!</p>}

      </div>
  );
  
  const EmployeesTab = (
      <div className='space-y-6'>
          <div className='flex justify-between items-center'>
              <p className="text-base text-gray-300">Tổng cộng: <span className="text-yellow-400 font-bold">{employeesList.length}</span> nhân viên</p>
              <div className='flex gap-3'>
                  {/* <button 
                      onClick={() => setActiveTab('upload')}
                      className='bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-500 transition-colors flex items-center gap-2'
                  >
                      <Upload className='w-5 h-5' /> Nạp Lại Hàng Loạt
                  </button> */}
                  <button 
                      onClick={() => setActiveTab('upload')}
                      className='bg-blue-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-500 transition-colors flex items-center gap-2'
                  >
                      <Upload className='w-5 h-5' /> Nạp Lại Hàng Loạt
                  </button>
              </div>
          </div>
          
          <div className="max-h-[60vh] overflow-y-auto custom-scrollbar rounded-xl border border-gray-700">
            <table className="w-full text-left text-sm text-gray-300">
                <thead className="text-xs text-gray-400 uppercase bg-gray-700/80 sticky top-0 backdrop-blur-sm">
                    <tr>
                        <th scope="col" className="px-4 py-3">Tên / Mã NV</th>
                        <th scope="col" className="px-4 py-3">Phòng ban</th>
                        <th scope="col" className="px-4 py-3">Trạng thái</th>
                        <th scope="col" className="px-4 py-3 text-right">Hành động</th>
                    </tr>
                </thead>
                <tbody>
                    {employeesList.map((e) => (
                        <tr 
                            key={e.id} 
                            className="bg-gray-800 border-b border-gray-700 hover:bg-gray-700/50 cursor-pointer"
                        >
                            <th scope="row" className="px-4 py-3 font-medium text-white flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-gray-700 overflow-hidden shrink-0">
                                   <img src={e.avatarUrl ? `${API_URL}/public/${e.avatarUrl}` : `https://ui-avatars.com/api/?name=${encodeURIComponent(e.name)}&background=random`} alt={e.name} className="w-full h-full object-cover" />
                                </div>
                                <div>
                                    {e.name}
                                    <p className="text-xs text-gray-400 mt-0.5">{e.code}</p>
                                </div>
                            </th>
                            <td className="px-4 py-3">{e.department}</td>
                            <td className="px-4 py-3">
                                {e.isWinner ? <span className="text-red-400 font-bold">ĐÃ TRÚNG: {e.prize?.name || '...'}</span> : <span className="text-green-400">Khả dụng</span>}
                            </td>
                            <td className="px-4 py-3 text-right">
                                <button 
                                    onClick={() => { setEditingEmployee(e); setIsEmployeeModalOpen(true); }}
                                    className="text-blue-400 hover:text-blue-300 transition-colors flex items-center justify-end text-sm font-bold gap-1"
                                >
                                    <PenTool className="w-4 h-4" /> Sửa
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
          </div>
          
          {employeesList.length === 0 && <p className="text-center text-gray-500 py-10">Chưa có nhân viên nào trong hệ thống!</p>}
          
          <button 
              onClick={async () => {
                 if(confirm('CẢNH BÁO: Thao tác này sẽ XÓA SẠCH toàn bộ dữ liệu nhân viên và trạng thái trúng giải. Bạn có chắc chắn?')) {
                    await axios.delete(`${API_URL}/employees/reset`);
                    alert('Đã xóa sạch dữ liệu nhân viên. Vui lòng nạp lại danh sách mới!');
                    fetchEmployees();
                    setActiveTab('upload');
                 }
              }}
              className="w-full py-3 mt-4 text-red-400 bg-red-900/50 rounded-xl hover:bg-red-900/80 transition-colors text-base font-semibold border border-red-800"
            >
                <AlertTriangle className="w-5 h-5 inline-block mr-2" /> XÓA SẠCH VÀ RESET TOÀN BỘ NHÂN VIÊN
            </button>
      </div>
  );


  // --- GIAO DIỆN CHÍNH ---
  return (
    <div className="min-h-screen bg-gray-950 p-6 md:p-10 font-sans">
      <div className="w-full max-w-5xl mx-auto">
        
        <div className="flex justify-between items-center border-b border-gray-700 pb-4 mb-8">
            <h1 className="text-3xl md:text-4xl font-extrabold text-yellow-400 flex items-center gap-3">
                <Settings className="w-8 h-8" /> BẢNG QUẢN TRỊ HỆ THỐNG
            </h1>
            <Link href="/display" className="flex items-center gap-2 text-white bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded-lg font-semibold transition-colors">
                <Home className="w-5 h-5" /> Về Màn Hình Chính
            </Link>
        </div>

        <div className="flex border-b border-gray-700 mb-8">
          <button onClick={() => setActiveTab('employees')} className={`px-6 py-3 font-bold text-lg transition-colors ${activeTab === 'employees' ? 'text-yellow-400 border-b-2 border-yellow-500' : 'text-gray-400 hover:text-white'}`}><User className='w-5 h-5 mr-2' /> Quản Lý Nhân Viên Gốc</button>
          <button onClick={() => setActiveTab('winners')} className={`px-6 py-3 font-bold text-lg transition-colors ${activeTab === 'winners' ? 'text-yellow-400 border-b-2 border-yellow-500' : 'text-gray-400 hover:text-white'}`}><List className='w-5 h-5 mr-2' /> Quản Lý Kết Quả</button>
          <button onClick={() => setActiveTab('prizes')} className={`px-6 py-3 font-bold text-lg transition-colors ${activeTab === 'prizes' ? 'text-yellow-400 border-b-2 border-yellow-500' : 'text-gray-400 hover:text-white'}`}><Trophy className='w-5 h-5 mr-2' /> Quản Lý Giải Thưởng</button>
        </div>

        <div className="bg-gray-900 p-6 rounded-xl shadow-2xl border border-gray-800">
          {activeTab === 'upload' && UploadTab}
          {activeTab === 'winners' && WinnersTab}
          {activeTab === 'prizes' && PrizesTab}
          {activeTab === 'employees' && EmployeesTab}
        </div>

      </div>
      
      {/* Prize Form Modal */}
      <AnimatePresence>
        {isPrizeModalOpen && <PrizeFormModal prize={editingPrize} onClose={() => { setIsPrizeModalOpen(false); setEditingPrize(null); }} />}
      </AnimatePresence>
      
      {/* Employee Form Modal */}
      <AnimatePresence>
        {isEmployeeModalOpen && <EmployeeFormModal employee={editingEmployee} onClose={() => { setIsEmployeeModalOpen(false); setEditingEmployee(null); }} />}
      </AnimatePresence>
    </div>
  );
};
