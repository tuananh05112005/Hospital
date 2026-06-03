import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { CalendarCheck, ShieldAlert, User, Clock, AlertCircle, ChevronLeft, ChevronRight, Search, Check, X } from 'lucide-react';
import api from '../api/axios';

const Schedules = () => {
  const { user } = useContext(AuthContext);
  const [originalShifts, setOriginalShifts] = useState([]);
  const [localShifts, setLocalShifts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDirty, setIsDirty] = useState(false);
  
  // Admin assignment state
  const [doctors, setDoctors] = useState([]);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [activeCell, setActiveCell] = useState(null); // { day, type }
  const [modalSelectedDoctorIds, setModalSelectedDoctorIds] = useState([]);
  const [doctorSearchQuery, setDoctorSearchQuery] = useState('');

  // Initialize to the start of the current week (Monday)
  const getStartOfWeek = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    d.setHours(0, 0, 0, 0);
    return d;
  };

  const [currentWeekStart, setCurrentWeekStart] = useState(getStartOfWeek(new Date()));

  const shiftTypes = [
    { id: 'morning', name: 'Ca Sáng (06:00 - 14:00)' },
    { id: 'afternoon', name: 'Ca Chiều (14:00 - 22:00)' },
    { id: 'night', name: 'Ca Đêm (22:00 - 06:00)' }
  ];

  // Generate 7 days for the currently selected week
  const days = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(currentWeekStart);
    d.setDate(d.getDate() + i);
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().split('T')[0];
  });

  // Get today's date in YYYY-MM-DD local time for disabling past days
  const getTodayStr = () => {
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    return d.toISOString().split('T')[0];
  };
  const todayStr = getTodayStr();

  const checkIsDirty = (local, original) => {
    if (local.length !== original.length) return true;
    for (let l of local) {
      const found = original.some(
        o => String(o.doctor_id) === String(l.doctor_id) &&
             o.shift_date.substring(0, 10) === l.shift_date.substring(0, 10) &&
             o.shift_type === l.shift_type
      );
      if (!found) return true;
    }
    return false;
  };

  const fetchShifts = async () => {
    try {
      setLoading(true);
      const response = await api.get('/shifts');
      setOriginalShifts(response.data);
      setLocalShifts(response.data);
      setIsDirty(false);
    } catch (e) {
      console.error('Lỗi tải danh sách ca trực:', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchDoctors = async () => {
    try {
      const response = await api.get('/doctors');
      setDoctors(response.data);
    } catch (e) {
      console.error('Lỗi tải danh sách bác sĩ:', e);
    }
  };

  useEffect(() => {
    fetchShifts();
    if (user?.role === 'admin') {
      fetchDoctors();
    }
  }, [user]);

  const handleToggleShift = (date, type) => {
    if (user?.role !== 'doctor') return;
    if (date < todayStr) return; // Cannot register for past days

    const alreadyExists = localShifts.some(
      s => String(s.doctor_id) === String(user.id) && s.shift_date.substring(0, 10) === date && s.shift_type === type
    );

    let updated;
    if (alreadyExists) {
      // Remove
      updated = localShifts.filter(
        s => !(String(s.doctor_id) === String(user.id) && s.shift_date.substring(0, 10) === date && s.shift_type === type)
      );
    } else {
      // Add
      updated = [
        ...localShifts,
        {
          doctor_id: Number(user.id),
          doctor_name: user.name,
          specialization: user.specialization || '',
          shift_date: date,
          shift_type: type
        }
      ];
    }
    setLocalShifts(updated);
    setIsDirty(checkIsDirty(updated, originalShifts));
  };

  const handleOpenAdminModal = (day, type) => {
    setActiveCell({ day, type });
    // Find all doctors currently assigned to this cell in localShifts
    const assigned = localShifts
      .filter(s => s.shift_date.substring(0, 10) === day && s.shift_type === type)
      .map(s => String(s.doctor_id));
    setModalSelectedDoctorIds(assigned);
    setDoctorSearchQuery('');
    setIsAdminModalOpen(true);
  };

  const handleToggleDoctorInModal = (docUserId) => {
    const docUserIdStr = String(docUserId);
    if (modalSelectedDoctorIds.includes(docUserIdStr)) {
      setModalSelectedDoctorIds(modalSelectedDoctorIds.filter(id => id !== docUserIdStr));
    } else {
      setModalSelectedDoctorIds([...modalSelectedDoctorIds, docUserIdStr]);
    }
  };

  const handleConfirmAdminModal = () => {
    const { day, type } = activeCell;
    
    // Remove all existing assignments for this day & type
    const baseShifts = localShifts.filter(
      s => !(s.shift_date.substring(0, 10) === day && s.shift_type === type)
    );
    
    // Create new assignments from selected doctor user IDs
    const newShifts = modalSelectedDoctorIds.map(docUserId => {
      const doc = doctors.find(d => String(d.user_id) === String(docUserId));
      return {
        doctor_id: Number(docUserId),
        doctor_name: doc ? doc.name : 'Bác sĩ',
        specialization: doc ? doc.specialization : '',
        shift_date: day,
        shift_type: type
      };
    });
    
    const updated = [...baseShifts, ...newShifts];
    setLocalShifts(updated);
    setIsDirty(checkIsDirty(updated, originalShifts));
    setIsAdminModalOpen(false);
    setActiveCell(null);
  };

  const handleSaveBulk = async () => {
    try {
      setLoading(true);
      let payload = {};
      
      if (user.role === 'admin') {
        const startOfWeek = days[0];
        const endOfWeekObj = new Date(currentWeekStart);
        endOfWeekObj.setDate(endOfWeekObj.getDate() + 7);
        endOfWeekObj.setMinutes(endOfWeekObj.getMinutes() - endOfWeekObj.getTimezoneOffset());
        const endOfWeek = endOfWeekObj.toISOString().split('T')[0];
        
        const shiftsInWeek = localShifts.filter(s => {
          const d = s.shift_date.substring(0, 10);
          return d >= startOfWeek && d < endOfWeek;
        });
        
        payload = {
          currentWeekStart: currentWeekStart.toISOString(),
          shifts: shiftsInWeek.map(s => ({
            doctor_id: s.doctor_id,
            shift_date: s.shift_date.substring(0, 10),
            shift_type: s.shift_type
          }))
        };
      } else if (user.role === 'doctor') {
        const myFutureShifts = localShifts.filter(
          s => String(s.doctor_id) === String(user.id) && s.shift_date.substring(0, 10) >= todayStr
        );
        payload = {
          shifts: myFutureShifts.map(s => ({
            shift_date: s.shift_date.substring(0, 10),
            shift_type: s.shift_type
          }))
        };
      }
      
      const response = await api.post('/shifts/bulk', payload);
      alert(response.data.message || 'Lưu lịch trực thành công!');
      await fetchShifts();
    } catch (e) {
      console.error(e);
      alert('Lỗi lưu lịch trực: ' + (e.response?.data?.message || e.message));
    } finally {
      setLoading(false);
    }
  };

  const handleCancelChanges = () => {
    setLocalShifts(originalShifts);
    setIsDirty(false);
  };

  const handleWeekChange = (direction) => {
    if (isDirty) {
      const confirmLeave = window.confirm('Bạn có thay đổi chưa lưu. Chuyển tuần sẽ làm mất các thay đổi này. Bạn có muốn tiếp tục?');
      if (!confirmLeave) return;
      handleCancelChanges();
    }
    
    const next = new Date(currentWeekStart);
    if (direction === 'next') {
      next.setDate(next.getDate() + 7);
    } else {
      next.setDate(next.getDate() - 7);
    }
    setCurrentWeekStart(next);
  };

  const getShiftDoctors = (date, type) => {
    return localShifts.filter(s => s.shift_date.substring(0, 10) === date && s.shift_type === type);
  };

  const isMyShift = (date, type) => {
    return getShiftDoctors(date, type).some(s => String(s.doctor_id) === String(user?.id));
  };

  if (loading && originalShifts.length === 0) return <div className="p-8 text-slate-500 font-medium flex items-center gap-2"><Clock className="animate-spin" /> Đang tải lịch trực...</div>;

  return (
    <div className="p-8 bg-slate-50 min-h-full">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-lg text-primary">
              <CalendarCheck size={28} />
            </div>
            Quản Lý Lịch Trực (Roster)
          </h1>
          <p className="text-slate-500 mt-2 font-medium">Lên lịch và theo dõi ca trực của Y Bác sĩ trong bệnh viện.</p>
        </div>
        
        <div className="flex items-center gap-4 bg-white px-4 py-2 rounded-lg border border-slate-200 shadow-sm">
          <button onClick={() => handleWeekChange('prev')} className="p-2 hover:bg-slate-100 rounded-md text-slate-600 transition-colors" title="Tuần trước">
            <ChevronLeft size={20} />
          </button>
          <div className="font-bold text-slate-800 w-48 text-center">
            {new Date(days[0]).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })} - {new Date(days[6]).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
          </div>
          <button onClick={() => handleWeekChange('next')} className="p-2 hover:bg-slate-100 rounded-md text-slate-600 transition-colors" title="Tuần sau">
            <ChevronRight size={20} />
          </button>
        </div>
      </div>

      {isDirty && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between shadow-sm animate-fade-in">
          <div className="flex items-center gap-3">
            <div className="bg-amber-100 p-2 rounded-lg text-amber-700">
              <AlertCircle size={20} />
            </div>
            <div>
              <h4 className="text-amber-900 font-bold">Bạn có thay đổi chưa lưu!</h4>
              <p className="text-amber-700 text-sm mt-0.5">Nhấp vào "Lưu lịch trực" để cập nhật thay đổi vào hệ thống.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={handleCancelChanges} 
              className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold shadow-sm hover:bg-slate-50 transition-colors"
            >
              Hủy thay đổi
            </button>
            <button 
              onClick={handleSaveBulk} 
              className="px-5 py-2 bg-primary text-white rounded-xl font-bold shadow-md shadow-primary/25 hover:bg-primary/95 transition-all"
            >
              Lưu lịch trực
            </button>
          </div>
        </div>
      )}

      {user?.role === 'doctor' && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-xl flex items-start gap-3">
          <AlertCircle className="text-blue-600 mt-0.5" size={20} />
          <div>
            <h4 className="text-blue-900 font-bold">Hướng dẫn Đăng ký Ca</h4>
            <p className="text-blue-700 text-sm mt-1">Nhấp vào các ô trong bảng để chọn/hủy ca trực. Các ca bạn chọn sẽ hiển thị màu xanh dương. Sau khi chọn xong, nhấp vào nút <strong>"Lưu lịch trực"</strong> ở phía trên để lưu thay đổi.</p>
          </div>
        </div>
      )}

      {user?.role === 'admin' && (
        <div className="mb-6 p-4 bg-indigo-50 border border-indigo-200 rounded-xl flex items-start gap-3">
          <AlertCircle className="text-indigo-600 mt-0.5" size={20} />
          <div>
            <h4 className="text-indigo-900 font-bold">Quyền quản trị viên: Phân công lịch trực</h4>
            <p className="text-indigo-700 text-sm mt-1">Nhấp vào bất kỳ ô ca trực nào để mở danh sách bác sĩ và phân công/gỡ bỏ trực. Sau khi hoàn tất phân công cho các ngày trong tuần này, nhấp vào <strong>"Lưu lịch trực"</strong> để ghi nhận.</p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white">
                <th className="p-4 font-bold border-b border-slate-700">Ngày</th>
                {shiftTypes.map(type => (
                  <th key={type.id} className="p-4 font-bold border-b border-slate-700 border-l border-slate-700">{type.name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {days.map((day, idx) => (
                <tr key={day} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/50'}>
                  <td className="p-4 font-bold text-slate-700 border-b border-slate-100 whitespace-nowrap">
                    {new Date(day).toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit' })}
                  </td>
                  {shiftTypes.map(type => {
                    const doctorsInShift = getShiftDoctors(day, type.id);
                    const isMine = isMyShift(day, type.id);
                    const isPast = day < todayStr;
                    const canEdit = (user?.role === 'admin') || (user?.role === 'doctor' && !isPast);
                    
                    return (
                      <td key={type.id} className={`p-2 border-b border-l border-slate-100 align-top min-w-[250px] ${isPast && user?.role !== 'admin' ? 'bg-slate-50' : ''}`}>
                        <div 
                          onClick={() => {
                            if (canEdit) {
                              if (user.role === 'admin') {
                                handleOpenAdminModal(day, type.id);
                              } else {
                                handleToggleShift(day, type.id);
                              }
                            }
                          }}
                          className={`h-full min-h-[100px] p-3 rounded-lg border-2 transition-all ${
                            canEdit ? 'cursor-pointer hover:shadow-md' : 'cursor-default'
                          } ${
                            isMine 
                              ? (isPast ? 'bg-blue-50/50 border-blue-300' : 'bg-blue-50 border-blue-400')
                              : (isPast ? 'bg-transparent border-transparent' : 'bg-white border-dashed border-slate-200 hover:border-slate-300')
                          } ${isPast && user?.role !== 'admin' ? 'opacity-60' : ''}`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-slate-400 uppercase">
                              {doctorsInShift.length} Bác sĩ
                            </span>
                            {isMine && <span className="bg-blue-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">Ca của bạn</span>}
                          </div>
                          
                          <div className="space-y-1.5 mt-2">
                            {doctorsInShift.map(doc => (
                              <div key={`${doc.doctor_id}-${doc.id || doc.shift_date}`} className="flex items-center gap-2 bg-white/60 p-1.5 rounded border border-slate-100">
                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white ${String(doc.doctor_id) === String(user?.id) ? 'bg-blue-600' : 'bg-slate-700'}`}>
                                  {doc.doctor_name ? doc.doctor_name.charAt(0) : 'U'}
                                </div>
                                <div className="flex flex-col">
                                  <span className={`text-sm font-bold ${String(doc.doctor_id) === String(user?.id) ? 'text-blue-900' : 'text-slate-700'}`}>BS. {doc.doctor_name}</span>
                                  <span className="text-[10px] font-semibold text-slate-500 truncate">{doc.specialization}</span>
                                </div>
                              </div>
                            ))}
                            {doctorsInShift.length === 0 && (
                              <div className="text-center text-slate-400 text-sm py-4 italic">
                                Trống
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Admin Phân Công Ca Trực */}
      {isAdminModalOpen && activeCell && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg flex flex-col max-h-[85vh] border border-slate-100 overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-200 bg-gradient-to-r from-primary/5 to-white flex justify-between items-center">
              <div>
                <h3 className="text-xl font-bold text-slate-950 flex items-center gap-2">
                  <User size={24} className="text-primary" /> Phân Công Ca Trực
                </h3>
                <p className="text-slate-500 text-xs font-semibold mt-1 uppercase tracking-wider">
                  {activeCell.type === 'morning' ? 'Ca Sáng (06:00 - 14:00)' :
                   activeCell.type === 'afternoon' ? 'Ca Chiều (14:00 - 22:00)' : 'Ca Đêm (22:00 - 06:00)'} 
                  {' - '} 
                  {new Date(activeCell.day).toLocaleDateString('vi-VN', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' })}
                </p>
              </div>
              <button 
                onClick={() => setIsAdminModalOpen(false)} 
                className="text-slate-400 hover:text-slate-700 p-2 rounded-full hover:bg-slate-100 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            {/* Search Doctor */}
            <div className="p-4 border-b border-slate-100 bg-slate-50/50">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input 
                  type="text"
                  placeholder="Tìm kiếm bác sĩ theo tên hoặc khoa..."
                  value={doctorSearchQuery}
                  onChange={(e) => setDoctorSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all text-sm font-semibold"
                />
              </div>
            </div>

            {/* Doctor list */}
            <div className="p-6 overflow-y-auto flex-1 space-y-3">
              {doctors
                .filter(doc => 
                  doc.name.toLowerCase().includes(doctorSearchQuery.toLowerCase()) ||
                  (doc.specialization && doc.specialization.toLowerCase().includes(doctorSearchQuery.toLowerCase()))
                )
                .map(doc => {
                  const isChecked = modalSelectedDoctorIds.includes(String(doc.user_id));
                  return (
                    <label 
                      key={doc.id} 
                      className={`flex items-center justify-between p-3.5 rounded-xl border-2 cursor-pointer transition-all hover:bg-slate-50 ${
                        isChecked ? 'border-primary bg-primary/5 hover:bg-primary/5' : 'border-slate-100 bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-white ${isChecked ? 'bg-primary' : 'bg-slate-400'}`}>
                          {doc.name.charAt(0)}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-bold text-slate-800 text-sm">BS. {doc.name}</span>
                          <span className="text-xs text-slate-500 font-semibold">{doc.specialization} - {doc.department}</span>
                        </div>
                      </div>
                      <input 
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleDoctorInModal(doc.user_id)}
                        className="w-5 h-5 text-primary border-slate-300 rounded focus:ring-primary focus:ring-2 transition-all cursor-pointer accent-primary"
                      />
                    </label>
                  );
                })}
              {doctors.filter(doc => 
                  doc.name.toLowerCase().includes(doctorSearchQuery.toLowerCase()) ||
                  (doc.specialization && doc.specialization.toLowerCase().includes(doctorSearchQuery.toLowerCase()))
                ).length === 0 && (
                <div className="text-center text-slate-400 py-8 italic text-sm">Không tìm thấy bác sĩ nào.</div>
              )}
            </div>

            <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3">
              <button 
                onClick={() => setIsAdminModalOpen(false)} 
                className="px-4 py-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-100 rounded-xl font-bold transition-colors"
              >
                Hủy
              </button>
              <button 
                onClick={handleConfirmAdminModal} 
                className="px-5 py-2 bg-primary text-white rounded-xl font-bold shadow-sm hover:bg-primary/95 transition-all flex items-center gap-1.5"
              >
                <Check size={18} /> Xác nhận
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Schedules;
