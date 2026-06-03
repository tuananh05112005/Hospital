import React, { useState, useEffect, useContext, useRef } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { Activity, Clock, ShieldAlert, CheckCircle, ArrowRight, Stethoscope, TestTube, Search, Pill, X, XCircle } from 'lucide-react';
import api from '../api/axios';

const Queue = () => {
  const { user } = useContext(AuthContext);
  const socket = useSocket();
  const [queue, setQueue] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Modal Khám Bệnh & Kê Đơn (Dành cho Bác sĩ)
  const [isPrescribeOpen, setIsPrescribeOpen] = useState(false);
  const [activeVisit, setActiveVisit] = useState(null);
  const [prescribeNotes, setPrescribeNotes] = useState('');
  
  // Modal Chỉ định Xét Nghiệm
  const [isLabModalOpen, setIsLabModalOpen] = useState(false);
  const [labFormData, setLabFormData] = useState({ visit_id: '', patient_id: '', test_type: 'Xét nghiệm Máu Toàn Phần' });
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedMeds, setSelectedMeds] = useState([]);
  const [isAILoading, setIsAILoading] = useState(false);
  const searchTimeoutRef = useRef(null);
  const [filterMode, setFilterMode] = useState('mine'); // 'mine' or 'all'

  const fetchQueue = async () => {
    try {
      // Fetch all waiting visits
      const response = await api.get('/visits/queue?status=waiting');
      setQueue(response.data);
    } catch (e) {
      setError('Lỗi khi tải hàng đợi');
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const filteredQueue = queue.filter(visit => {
    if (user?.role === 'doctor' && filterMode === 'mine') {
      return String(visit.doctor_id) === String(user?.id) || visit.doctor_id === null;
    }
    return true;
  });

  useEffect(() => {
    fetchQueue();
    
    if (socket) {
      socket.on('queue_updated', () => {
        fetchQueue();
      });
    }

    return () => {
      if (socket) {
        socket.off('queue_updated');
      }
    };
  }, [user, socket]);

  const handleUpdateStatus = async (id, status) => {
    try {
      await api.put(`/visits/${id}/status`, { status });
      fetchQueue();
    } catch (e) {
      alert('Lỗi cập nhật trạng thái');
    }
  };

  const handleTransferSurgery = async (visit) => {
    if (window.confirm('Cảnh báo: Bệnh nhân sẽ được chuyển thẳng vào Phòng Phẫu Thuật. Bạn có chắc chắn?')) {
        try {
            await api.post('/rooms/transfer-surgery', { visit_id: visit.id, patient_id: visit.patient_id });
            alert('Đã gán giường Phòng Phẫu Thuật thành công!');
            fetchQueue();
        } catch (e) {
            alert('Lỗi: ' + (e.response?.data?.message || e.message));
        }
    }
  };

  const handleAiSuggest = async () => {
    if (!prescribeNotes.trim()) {
       alert('Vui lòng nhập Chẩn đoán lâm sàng (triệu chứng) để AI có thể đọc bệnh án!');
       return;
    }
    setIsAILoading(true);
    try {
        const res = await api.post('/clinical/ai-suggest', { symptoms: prescribeNotes });
        const suggestions = res.data.result;
        const newMeds = [...selectedMeds];
        suggestions.forEach(med => {
            if (!newMeds.find(m => m.name.toLowerCase() === med.name.toLowerCase())) {
                newMeds.push(med);
            }
        });
        setSelectedMeds(newMeds);
    } catch (e) {
        alert('Không thể kết nối Máy chủ AI.');
    } finally {
        setIsAILoading(false);
    }
  };

  const handleFdaSearch = (e) => {
    const val = e.target.value;
    setSearchQuery(val);

    if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

    if (val.trim().length < 3) {
      setSearchResults([]);
      return;
    }

    searchTimeoutRef.current = setTimeout(async () => {
       setIsSearching(true);
       try {
         const res = await fetch(`https://api.fda.gov/drug/ndc.json?search=generic_name:*${val}*+brand_name:*${val}*&limit=5`);
         if (!res.ok) throw new Error('Not found');
         const data = await res.json();
         const uniqueNames = [...new Set(data.results.map(r => r.generic_name || r.brand_name))];
         setSearchResults(uniqueNames);
       } catch (err) {
         setSearchResults([]);
       } finally {
         setIsSearching(false);
       }
    }, 600);
  };

  const selectMed = (name) => {
    if (!selectedMeds.find(m => m.name === name)) {
       setSelectedMeds([...selectedMeds, { name, quantity: 1, price: 50000 }]);
    }
    setSearchQuery('');
    setSearchResults([]);
  };

  const updateMedQty = (index, qty) => {
    const updated = [...selectedMeds];
    updated[index].quantity = qty;
    setSelectedMeds(updated);
  };

  const removeMed = (index) => {
    setSelectedMeds(selectedMeds.filter((_, i) => i !== index));
  };

  const handlePrescribeSubmit = async (e) => {
    e.preventDefault();
    try {
       await api.post('/clinical/prescribe', {
          visit_id: activeVisit.id,
          patient_id: activeVisit.patient_id,
          notes: prescribeNotes,
          medications: selectedMeds
       });
       alert('Lưu đơn thuốc và hoàn tất lượt khám!');
       setIsPrescribeOpen(false);
       fetchQueue();
    } catch (error) {
       alert('Lỗi: ' + (error.response?.data?.message || 'Không thể lưu đơn thuốc'));
    }
  };

  const handleOrderLabSubmit = async (e) => {
    e.preventDefault();
    try {
        await api.post('/labs/request', labFormData);
        alert('Đã gửi phiếu Chỉ định Cận lâm sàng thành công!');
        setIsLabModalOpen(false);
        fetchQueue();
    } catch (e) {
        alert('Lỗi: ' + e.message);
    }
  };

  const callToExamine = async (visit) => {
    await handleUpdateStatus(visit.id, 'examining');
    setActiveVisit(visit);
    setPrescribeNotes(visit.notes || '');
    setSelectedMeds([]);
    setSearchQuery('');
    setSearchResults([]);
    setIsPrescribeOpen(true);
  };

  if (loading) return <div className="p-8 text-slate-500 font-medium flex items-center gap-2"><Clock className="animate-spin" /> Đang tải hàng đợi...</div>;

  return (
    <div className="p-8 bg-slate-50 min-h-full">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-lg text-primary">
              <Activity size={28} />
            </div>
            Hàng Đợi Khám Bệnh (Queue)
          </h1>
          <p className="text-slate-500 mt-2 font-medium">Quản lý bệnh nhân đang chờ khám trong ngày.</p>
        </div>
        <button onClick={fetchQueue} className="bg-white border border-slate-200 text-slate-700 px-4 py-2 rounded-lg font-bold shadow-sm hover:bg-slate-50 transition-all flex items-center gap-2">
          <Clock size={16} /> Làm mới
        </button>
      </div>

      {error && <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-lg border border-red-200">{error}</div>}

      {user?.role === 'doctor' && (
        <div className="flex gap-2 mb-6 bg-slate-200/50 p-1.5 rounded-xl border border-slate-200 w-fit">
          <button 
            onClick={() => setFilterMode('mine')} 
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              filterMode === 'mine' ? 'bg-primary text-white shadow-sm' : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            Bệnh nhân của tôi ({queue.filter(v => String(v.doctor_id) === String(user?.id) || v.doctor_id === null).length})
          </button>
          <button 
            onClick={() => setFilterMode('all')} 
            className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${
              filterMode === 'all' ? 'bg-primary text-white shadow-sm' : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            Tất cả bệnh nhân ({queue.length})
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredQueue.length === 0 ? (
          <div className="col-span-full text-center py-12 text-slate-400 bg-white rounded-xl border border-slate-200 border-dashed">
            <CheckCircle size={48} className="mx-auto mb-4 text-green-400 opacity-50" />
            <p className="text-lg font-bold text-slate-500">Hàng đợi đang trống</p>
            <p className="text-sm">Không có bệnh nhân nào đang chờ khám.</p>
          </div>
        ) : (
          filteredQueue.map((visit) => (
            <div key={visit.id} className={`bg-white rounded-xl shadow-sm border-l-4 p-6 transition-all hover:shadow-md ${
              visit.priority === 'emergency' ? 'border-red-500' :
              visit.priority === 'urgent' ? 'border-orange-500' : 'border-blue-500'
            }`}>
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-xl font-bold text-slate-700">
                  {visit.queue_number}
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                  visit.priority === 'emergency' ? 'bg-red-100 text-red-700' :
                  visit.priority === 'urgent' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
                }`}>
                  {visit.priority === 'emergency' ? 'Cấp cứu' : visit.priority === 'urgent' ? 'Ưu tiên' : 'Thường'}
                </div>
              </div>
              
              <h3 className="text-xl font-bold text-slate-900 mb-1">{visit.patient_name}</h3>
              <p className="text-sm text-slate-500 font-medium">MRN: {visit.mrn || 'N/A'}</p>
              
              <div className="mt-2 mb-4 p-2 bg-slate-50 rounded-lg border border-slate-100 text-xs">
                <span className="text-slate-500 font-medium">Bác sĩ phụ trách: </span>
                <span className={`font-bold ${visit.doctor_name ? 'text-primary' : 'text-amber-600'}`}>
                  {visit.doctor_name ? `BS. ${visit.doctor_name}` : 'Khám tự do (Chưa chỉ định)'}
                </span>
              </div>

              {user.role === 'doctor' && (String(visit.doctor_id) === String(user.id) || visit.doctor_id === null) && (
                <div className="pt-4 border-t border-slate-100 flex gap-2 flex-wrap">
                  {visit.priority === 'emergency' && (
                      <button 
                        onClick={() => handleTransferSurgery(visit)}
                        className="w-full bg-red-600 text-white py-2 mb-2 rounded-lg font-bold hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                      >
                        🚨 Chuyển thẳng Phẫu Thuật
                      </button>
                  )}
                  <button 
                    onClick={() => callToExamine(visit)}
                    className="flex-1 bg-primary text-white py-2 rounded-lg font-bold hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                  >
                    Gọi vào khám <Stethoscope size={16} />
                  </button>
                  <button 
                    onClick={() => {
                        setLabFormData({ visit_id: visit.id, patient_id: visit.patient_id, test_type: 'Xét nghiệm Máu Toàn Phần' });
                        setIsLabModalOpen(true);
                    }}
                    className="bg-amber-500 text-white px-3 py-2 rounded-lg font-bold hover:bg-amber-600 transition-colors flex items-center justify-center"
                    title="Chỉ định Lab"
                  >
                    <TestTube size={18} />
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Modal Khám Bệnh & API Kê Đơn */}
      {isPrescribeOpen && activeVisit && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4 animation-fade-in">
           <div className="bg-white rounded-md shadow-sm w-full max-w-2xl flex flex-col max-h-[90vh]">
              <div className="px-6 py-5 border-b border-slate-200 bg-gradient-to-r from-indigo-50 to-white flex justify-between items-center rounded-t-2xl">
                <div>
                  <h3 className="text-xl font-bold text-indigo-900 flex items-center gap-2"><Stethoscope size={24} /> Bệnh Án & Kê Đơn</h3>
                  <p className="text-indigo-600 text-sm font-medium mt-1">Bệnh nhân: {activeVisit.patient_name}</p>
                </div>
                <button onClick={() => setIsPrescribeOpen(false)} className="text-slate-400 hover:text-slate-700 p-2 rounded-full hover:bg-slate-100 transition-colors"><X size={24} /></button>
              </div>

              <div className="p-6 overflow-y-auto flex-1 space-y-6">
                 <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Chẩn đoán Lâm Sàng</label>
                    <textarea 
                      rows="3" 
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none bg-slate-50 transition-colors"
                      placeholder="Ghi nhận triệu chứng, chẩn đoán bệnh..."
                      value={prescribeNotes}
                      onChange={(e) => setPrescribeNotes(e.target.value)}
                    ></textarea>
                 </div>

                 <div className="border-t border-slate-200 pt-6">
                    <div className="flex justify-between items-center mb-2">
                       <label className="block text-sm font-bold text-slate-700">Kê Đơn Thuốc (Hỗ trợ bởi AI & Kho Dữ liệu FDA)</label>
                       <button 
                         type="button" 
                         onClick={handleAiSuggest} 
                         disabled={isAILoading} 
                         className="text-sm bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-bold py-1.5 px-3 rounded-lg shadow-sm shadow-purple-500/30 transition-all flex items-center gap-1"
                       >
                         {isAILoading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : '✨ AI Kê Đơn Viện Sĩ'}
                       </button>
                    </div>
                    <div className="relative">
                       <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                         <Search size={18} className="text-slate-400" />
                       </div>
                       <input 
                         type="text" 
                         value={searchQuery}
                         onChange={handleFdaSearch}
                         className="w-full pl-10 pr-4 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none shadow-sm"
                         placeholder="Gõ tên Tên thuốc chuẩn Quốc tế (Vd: Ibuprofen, Amoxicillin)..."
                       />
                       {isSearching && <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>}
                       
                       {searchResults.length > 0 && (
                         <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-sm max-h-48 overflow-y-auto">
                           {searchResults.map((med, idx) => (
                             <div 
                               key={idx} 
                               onClick={() => selectMed(med)}
                               className="px-4 py-3 hover:bg-indigo-50 cursor-pointer flex items-center gap-2 border-b border-slate-50 last:border-0"
                             >
                               <Pill size={16} className="text-indigo-400" />
                               <span className="font-semibold text-slate-700 capitalize">{med.toLowerCase()}</span>
                             </div>
                           ))}
                         </div>
                       )}
                    </div>

                    {selectedMeds.length > 0 && (
                      <div className="mt-4 bg-slate-50 rounded-xl border border-slate-200 p-4">
                        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Danh sách xuất thuốc</h4>
                        <div className="space-y-3">
                          {selectedMeds.map((m, idx) => (
                             <div key={idx} className="flex items-center justify-between bg-white p-3 rounded-lg border border-slate-100 shadow-sm">
                               <div className="font-semibold text-slate-800 capitalize flex items-center gap-2">
                                 <Pill size={16} className="text-indigo-400" />
                                 {m.name.toLowerCase()}
                               </div>
                               <div className="flex items-center gap-3">
                                 <div className="flex items-center gap-2">
                                   <span className="text-xs text-slate-500 font-medium">SL:</span>
                                   <input type="number" min="1" value={m.quantity} onChange={(e) => updateMedQty(idx, parseInt(e.target.value))} className="w-16 px-2 py-1 border border-slate-200 rounded-md text-center outline-none focus:border-indigo-500" />
                                 </div>
                                 <button onClick={() => removeMed(idx)} className="text-red-400 hover:text-red-600 p-1"><XCircle size={20} /></button>
                               </div>
                             </div>
                          ))}
                        </div>
                      </div>
                    )}
                 </div>
              </div>

              <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 rounded-b-2xl flex justify-end gap-3">
                 <button onClick={() => setIsPrescribeOpen(false)} className="px-5 py-2.5 bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-xl font-bold transition-colors">
                   Tạm đóng
                 </button>
                 <button onClick={handlePrescribeSubmit} className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-sm shadow-indigo-600/30 transition-all flex items-center gap-2">
                   <CheckCircle size={20} /> Hoàn Tất Chẩn Đoán
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* Modal Chỉ Định Y Lệnh (Lab) */}
      {isLabModalOpen && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-white rounded-md shadow-sm w-full max-w-sm overflow-hidden">
                  <div className="px-6 py-4 border-b border-amber-200 bg-amber-50">
                      <h3 className="text-lg font-bold text-amber-900 flex items-center gap-2"><TestTube size={20}/> Y Lệnh Cận Lâm Sàng</h3>
                  </div>
                  <form onSubmit={handleOrderLabSubmit} className="p-6">
                      <label className="block text-sm font-semibold text-slate-700 mb-2">Chọn Loại Chỉ Định <span className="text-red-500">*</span></label>
                      <select required value={labFormData.test_type} onChange={e => setLabFormData({...labFormData, test_type: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none mb-6 font-medium">
                          <option value="Xét nghiệm Máu Toàn Phần">Xét nghiệm Máu Toàn Phần</option>
                          <option value="Xét nghiệm Sinh hóa Máy">Xét nghiệm Sinh hóa Máy</option>
                          <option value="Chẩn đoán X-Quang Phổi">Chẩn đoán X-Quang Phổi</option>
                          <option value="Siêu âm Ổ bụng tổng quát">Siêu âm Ổ bụng tổng quát</option>
                          <option value="Chụp Cắt lớp MRI">Chụp Cắt lớp MRI</option>
                      </select>
                      <div className="flex justify-end gap-3">
                          <button type="button" onClick={() => setIsLabModalOpen(false)} className="px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl font-medium transition-colors">Hủy</button>
                          <button type="submit" className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-bold shadow-sm shadow-amber-500/30 transition-colors">Yêu cầu Kỹ Thuật Viên</button>
                      </div>
                  </form>
              </div>
          </div>
      )}
    </div>
  );
};

export default Queue;
