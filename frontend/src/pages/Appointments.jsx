import React, { useState, useEffect, useContext, useRef } from 'react';
import api from '../api/axios';
import { Plus, X, Edit2, Trash2, CheckCircle, XCircle, Stethoscope, Search, Pill } from 'lucide-react';
import { AuthContext } from '../context/AuthContext';
import { TestTube, Activity } from 'lucide-react';

const Appointments = () => {
  const { user } = useContext(AuthContext);
  const [appointments, setAppointments] = useState([]);
  const [patients, setPatients] = useState([]);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal Đăng ký Lịch
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    patient_id: '', doctor_id: '', appointment_date: '', time: '', notes: '', status: 'scheduled'
  });

  const [isNewPatient, setIsNewPatient] = useState(false);
  const [newPatientData, setNewPatientData] = useState({
    name: '', phone: '', dob: '', gender: 'Male', address: ''
  });

  const handleNewPatientChange = (e) => {
    const { name, value } = e.target;
    setNewPatientData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Modal Khám Bệnh & Kê Đơn (Dành cho Bác sĩ)
  const [isPrescribeOpen, setIsPrescribeOpen] = useState(false);
  const [activeApt, setActiveApt] = useState(null);
  const [prescribeNotes, setPrescribeNotes] = useState('');
  
  // Modal Chỉ định Xét Nghiệm
  const [isLabModalOpen, setIsLabModalOpen] = useState(false);
  const [labFormData, setLabFormData] = useState({ appointment_id: '', patient_id: '', test_type: 'Xét nghiệm Máu Toàn Phần' });
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedMeds, setSelectedMeds] = useState([]);
  const [isAILoading, setIsAILoading] = useState(false);
  const searchTimeoutRef = useRef(null);

  // Modal Check-in (Dành cho Lễ tân)
  const [isCheckInOpen, setIsCheckInOpen] = useState(false);
  const [checkInData, setCheckInData] = useState({
    appointment_id: '',
    patient_id: '',
    patient_name: '',
    doctor_user_id: '',
    priority: 'normal',
    notes: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
  };

  useEffect(() => {
    fetchData();
  }, []);

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

  const fetchData = async () => {
    setLoading(true);
    try {
      const [appRes, patRes, docRes] = await Promise.all([
        api.get('/appointments'),
        api.get('/patients'),
        api.get('/doctors')
      ]);
      setAppointments(appRes.data);
      setPatients(patRes.data);
      setDoctors(docRes.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (apt = null) => {
    setIsNewPatient(false);
    setNewPatientData({ name: '', phone: '', dob: '', gender: 'Male', address: '' });
    if (apt) {
      setEditingId(apt.id);
      const dateObj = new Date(apt.appointment_date);
      const localDate = new Date(dateObj.getTime() - (dateObj.getTimezoneOffset() * 60000)).toISOString().split('T')[0];
      const localTime = dateObj.toTimeString().slice(0,5);

      setFormData({
        patient_id: apt.patient_id || '',
        doctor_id: apt.doctor_id || '',
        appointment_date: localDate,
        time: localTime,
        notes: apt.notes || '',
        status: apt.status || 'scheduled'
      });
    } else {
      setEditingId(null);
      setFormData({ 
        patient_id: patients[0]?.id || '', 
        doctor_id: doctors[0]?.id || '', 
        appointment_date: '', 
        time: '08:00', 
        notes: '',
        status: 'scheduled'
      });
    }
    setIsModalOpen(true);
  };

  // ----- FDA API Logic -----
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
         // Lọc trùng lặp tên thuốc
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
       setSelectedMeds([...selectedMeds, { name, quantity: 1, price: 50000 }]); // Giả lập đồng giá 50k
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
  // --------------------------

  const handlePrescribeSubmit = async (e) => {
    e.preventDefault();
    try {
       await api.post('/clinical/prescribe', {
          appointment_id: activeApt.id,
          patient_id: activeApt.patient_id,
          notes: prescribeNotes,
          medications: selectedMeds
       });
       alert('Lưu đơn thuốc và chuyển phiếu thu thành công!');
       setIsPrescribeOpen(false);
       fetchData();
    } catch (error) {
       alert('Lỗi: ' + (error.response?.data?.message || 'Không thể lưu đơn thuốc'));
    }
  };

  const openPrescribeModal = (apt) => {
    setActiveApt(apt);
    setPrescribeNotes(apt.notes || '');
    setSelectedMeds([]);
    setSearchQuery('');
    setSearchResults([]);
    setIsPrescribeOpen(true);
  };

  const handleOrderLabSubmit = async (e) => {
    e.preventDefault();
    try {
        await api.post('/labs/request', labFormData);
        alert('Đã gửi phiếu Chỉ định Cận lâm sàng thành công!');
        setIsLabModalOpen(false);
        fetchData();
    } catch (e) {
        alert('Lỗi: ' + e.message);
    }
  };

  const openLabModal = (apt) => {
      setLabFormData({ appointment_id: apt.id, patient_id: apt.patient_id, test_type: 'Xét nghiệm Máu Toàn Phần' });
      setIsLabModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
       let currentPatientId = formData.patient_id;
       
       if (!editingId && isNewPatient) {
         if (!newPatientData.name.trim()) {
           alert('Vui lòng nhập tên bệnh nhân mới!');
           return;
         }
         // Register patient first
         const patRes = await api.post('/patients', {
           name: newPatientData.name,
           email: newPatientData.email || null,
           phone: newPatientData.phone || null,
           dob: newPatientData.dob || null,
           gender: newPatientData.gender || null,
           address: newPatientData.address || null
         });
         currentPatientId = patRes.data.id;
       }

       if (!currentPatientId && !isNewPatient) {
         alert('Vui lòng chọn bệnh nhân!');
         return;
       }

       const dateTime = `${formData.appointment_date}T${formData.time}:00`;
       if (editingId) {
         await api.put(`/appointments/${editingId}/status`, {
           patient_id: currentPatientId,
           doctor_id: formData.doctor_id,
           appointment_date: dateTime,
           status: formData.status,
           notes: formData.notes
         });
       } else {
         await api.post('/appointments', {
           patient_id: currentPatientId, 
           doctor_id: formData.doctor_id, 
           appointment_date: dateTime, 
           notes: formData.notes
         });
       }
       setIsModalOpen(false);
       fetchData();
    } catch (error) {
       alert('Lỗi: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleCheckIn = (apt) => {
    // Tự động phân loại mức độ ưu tiên
    let priority = 'normal';
    
    // 1. Nhận diện Trẻ em (dưới 16 tuổi) hoặc Người cao tuổi (trên 65 tuổi)
    if (apt.patient_dob) {
      const birthYear = new Date(apt.patient_dob).getFullYear();
      const currentYear = new Date().getFullYear();
      const age = currentYear - birthYear;
      if (age < 16 || age >= 65) {
        priority = 'urgent';
      }
    }
    
    // Nếu khám chuyên khoa Nhi
    if (apt.doctor_specialization && apt.doctor_specialization.toLowerCase().includes('nhi')) {
      priority = 'urgent';
    }

    // 2. Nhận diện các triệu chứng khẩn cấp / cấp cứu
    const emergencyKeywords = ['cấp cứu', 'khẩn cấp', 'emergency', 'tai nạn', 'nguy kịch', 'đau thắt ngực', 'đau ngực', 'khó thở'];
    const notesLower = (apt.notes || '').toLowerCase();
    if (emergencyKeywords.some(keyword => notesLower.includes(keyword))) {
      priority = 'emergency';
    }

    setCheckInData({
      appointment_id: apt.id,
      patient_id: apt.patient_id,
      patient_name: apt.patient_name,
      doctor_user_id: apt.doctor_user_id || '',
      priority: priority,
      notes: apt.notes || ''
    });
    setIsCheckInOpen(true);
  };

  const handleCheckInSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/visits', {
        patient_id: checkInData.patient_id,
        doctor_id: checkInData.doctor_user_id || null,
        priority: checkInData.priority,
        notes: checkInData.notes
      });
      await api.put(`/appointments/${checkInData.appointment_id}/status`, { status: 'completed', notes: checkInData.notes });
      alert(`Đã đưa bệnh nhân vào Hàng đợi khám thành công!`);
      setIsCheckInOpen(false);
      fetchData();
    } catch (e) {
      alert('Lỗi check-in: ' + (e.response?.data?.message || e.message));
    }
  };

  const handleDelete = async (id) => {
     if(window.confirm('Bạn có chắc muốn hủy và xóa bỏ lịch khám này?')) {
        try {
           await api.delete(`/appointments/${id}`);
           fetchData();
        } catch (error) {}
     }
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'completed': return <span className="px-2.5 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold uppercase">Đã Khám</span>;
      case 'cancelled': return <span className="px-2.5 py-1 bg-red-100 text-red-700 rounded-full text-xs font-bold uppercase">Đã Hủy</span>;
      default: return <span className="px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold uppercase">Đã Đặt Lịch</span>;
    }
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Lịch Khám Bệnh</h1>
          <p className="text-slate-500 text-sm mt-1">Sắp xếp hẹn khám và chẩn đoán kê đơn lâm sàng</p>
        </div>
        {user?.role !== 'doctor' && (
          <button onClick={() => handleOpenModal()} className="bg-primary hover:bg-secondary text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm shadow-primary/30 flex items-center gap-2">
            <Plus size={18} /> Đặt Lịch Khám Mới
          </button>
        )}
      </div>

      <div className="bg-white rounded-md shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-sm">
                <th className="p-4 font-semibold">Thời gian</th>
                <th className="p-4 font-semibold">Bệnh nhân</th>
                <th className="p-4 font-semibold">Bác sĩ phụ trách</th>
                <th className="p-4 font-semibold">Trạng thái</th>
                <th className="p-4 font-semibold text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="5" className="p-8 text-center text-slate-500 font-medium">Đang tải lịch khám...</td></tr>
              ) : appointments.length === 0 ? (
                <tr><td colSpan="5" className="p-8 text-center text-slate-500 font-medium">Hiện không có lịch khám nào.</td></tr>
              ) : (
                appointments.map(apt => (
                  <tr key={apt.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="p-4 font-medium text-slate-800">
                      {new Date(apt.appointment_date).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                    <td className="p-4 text-slate-700 font-medium">{apt.patient_name || 'N/A'}</td>
                    <td className="p-4 text-slate-600 text-sm">{apt.doctor_name || 'N/A'}</td>
                    <td className="p-4">{getStatusBadge(apt.status)}</td>
                    <td className="p-4 text-right">
                       
                       {/* Nút Khám Bệnh dành cho Bác sĩ */}
                       {user?.role === 'doctor' && apt.status === 'scheduled' && (
                          <div className="flex gap-2 justify-end">
                              <button onClick={() => openPrescribeModal(apt)} className="text-white bg-indigo-500 hover:bg-indigo-600 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors inline-flex items-center gap-1 shadow-sm">
                                <Stethoscope size={16} /> Khám
                              </button>
                              <button onClick={() => openLabModal(apt)} className="text-white bg-amber-500 hover:bg-amber-600 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors inline-flex items-center gap-1 shadow-sm" title="Chỉ định Xét nghiệm Lab">
                                <Activity size={16} /> Lab
                              </button>
                          </div>
                       )}

                       {/* Nút Edit/Delete cho Admin/Receptionist */}
                       {user?.role !== 'doctor' && (
                          <>
                           {apt.status === 'scheduled' && (
                              <>
                                <button onClick={() => handleCheckIn(apt)} className="text-white bg-emerald-600 hover:bg-emerald-700 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all inline-flex items-center gap-1 shadow-sm mr-2" title="Đưa vào hàng đợi khám">
                                  Check-in
                                </button>
                                <button onClick={() => api.put(`/appointments/${apt.id}/status`, { status: 'cancelled' }).then(fetchData)} className="text-orange-500 hover:bg-orange-50 p-1.5 rounded-md inline-flex mr-2" title="Xóa bỏ / Hủy">
                                  <XCircle size={18} />
                                </button>
                              </>
                           )}
                           <button onClick={() => handleOpenModal(apt)} className="text-blue-600 hover:bg-blue-50 p-1.5 rounded-md transition-colors mr-1 inline-flex" title="Cập nhật">
                             <Edit2 size={18} />
                           </button>
                           <button onClick={() => handleDelete(apt.id)} className="text-red-500 hover:bg-red-50 p-1.5 rounded-md transition-colors inline-flex" title="Xóa cứng">
                             <Trash2 size={18} />
                           </button>
                          </>
                       )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

       {/* Modal Đặt lịch hẹn */}
      {isModalOpen && user?.role !== 'doctor' && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animation-fade-in">
          <div className="bg-white rounded-md shadow-sm w-full max-w-lg overflow-hidden">
             <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
               <h3 className="text-lg font-bold text-slate-800">{editingId ? 'Cập nhật Lịch khám' : 'Đặt lịch khám mới'}</h3>
               <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600 p-1 rounded-md transition-colors"><X size={20} /></button>
             </div>
             
             <form onSubmit={handleSubmit} className="p-6 space-y-4">
                {!editingId && (
                  <div className="flex items-center mb-2 mt-1">
                    <input 
                      type="checkbox" 
                      id="isNewPatient" 
                      checked={isNewPatient} 
                      onChange={(e) => setIsNewPatient(e.target.checked)} 
                      className="w-4 h-4 text-primary focus:ring-primary border-slate-300 rounded mr-2 cursor-pointer"
                    />
                    <label htmlFor="isNewPatient" className="text-sm font-bold text-indigo-600 cursor-pointer select-none">
                      Đăng ký nhanh bệnh nhân mới (Chưa có hồ sơ)
                    </label>
                  </div>
                )}

                {isNewPatient && !editingId ? (
                  <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100 space-y-3">
                    <p className="text-xs font-bold text-indigo-700 uppercase tracking-wider mb-1">Hồ Sơ Bệnh Nhân Mới</p>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-1">Họ và Tên <span className="text-red-500">*</span></label>
                      <input required={isNewPatient} type="text" name="name" value={newPatientData.name} onChange={handleNewPatientChange} className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary outline-none" placeholder="Ví dụ: Nguyễn Văn A" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Số điện thoại</label>
                        <input type="text" name="phone" value={newPatientData.phone} onChange={handleNewPatientChange} className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary outline-none" placeholder="0901234567" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Giới tính</label>
                        <select name="gender" value={newPatientData.gender} onChange={handleNewPatientChange} className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary outline-none">
                          <option value="Male">Nam</option>
                          <option value="Female">Nữ</option>
                          <option value="Other">Khác</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Ngày sinh</label>
                        <input type="date" name="dob" value={newPatientData.dob} onChange={handleNewPatientChange} className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary outline-none" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-600 mb-1">Địa chỉ</label>
                        <input type="text" name="address" value={newPatientData.address} onChange={handleNewPatientChange} className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary outline-none" placeholder="Địa chỉ thường trú..." />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Chọn Bệnh nhân <span className="text-red-500">*</span></label>
                    <select required name="patient_id" value={formData.patient_id} onChange={handleChange} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary outline-none">
                       {patients.map(p => <option key={p.id} value={p.id}>{p.name} {p.phone ? `(${p.phone})` : ''}</option>)}
                    </select>
                  </div>
                )}
               <div>
                 <label className="block text-sm font-semibold text-slate-700 mb-1">Chọn Bác sĩ <span className="text-red-500">*</span></label>
                 <select required name="doctor_id" value={formData.doctor_id} onChange={handleChange} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary outline-none">
                    {doctors.map(d => <option key={d.id} value={d.id}>Bs. {d.name} ({d.specialization})</option>)}
                 </select>
               </div>
               <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className="block text-sm font-semibold text-slate-700 mb-1">Ngày diễn ra <span className="text-red-500">*</span></label>
                   <input required type="date" name="appointment_date" value={formData.appointment_date} onChange={handleChange} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary outline-none" />
                 </div>
                 <div>
                   <label className="block text-sm font-semibold text-slate-700 mb-1">Giờ khám <span className="text-red-500">*</span></label>
                   <input required type="time" name="time" value={formData.time} onChange={handleChange} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary outline-none" />
                 </div>
               </div>
               {editingId && (
                 <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Trạng thái</label>
                  <select name="status" value={formData.status} onChange={handleChange} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary outline-none">
                     <option value="scheduled">Đã Đặt Lịch (Scheduled)</option>
                     <option value="completed">Đã Khám (Completed)</option>
                     <option value="cancelled">Đã Hủy (Cancelled)</option>
                  </select>
                </div>
               )}
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Ghi chú lâm sàng / Tình trạng</label>
                <textarea name="notes" rows="2" value={formData.notes || ''} onChange={handleChange} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary outline-none"></textarea>
              </div>
              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                <button type="button" onClick={handleCloseModal} className="px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl font-medium transition-colors">Đóng</button>
                <button type="submit" className="px-4 py-2 bg-primary hover:bg-secondary text-white rounded-xl font-medium shadow-sm shadow-primary/30 transition-colors">Lưu trữ</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Khám Bệnh & API Kê Đơn */}
      {isPrescribeOpen && activeApt && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4 animation-fade-in">
           <div className="bg-white rounded-md shadow-sm w-full max-w-2xl flex flex-col max-h-[90vh]">
              <div className="px-6 py-5 border-b border-slate-200 bg-gradient-to-r from-indigo-50 to-white flex justify-between items-center rounded-t-2xl">
                <div>
                  <h3 className="text-xl font-bold text-indigo-900 flex items-center gap-2"><Stethoscope size={24} /> Bệnh Án & Kê Đơn</h3>
                  <p className="text-indigo-600 text-sm font-medium mt-1">Bệnh nhân: {activeApt.patient_name}</p>
                </div>
                <button onClick={() => setIsPrescribeOpen(false)} className="text-slate-400 hover:text-slate-700 p-2 rounded-full hover:bg-slate-100 transition-colors"><X size={24} /></button>
              </div>

              <div className="p-6 overflow-y-auto flex-1 space-y-6">
                 {/* Bệnh Án */}
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

                 {/* Kê Đơn Thuốc API FDA */}
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
                       
                       {/* Dropdown Gợi ý FDA */}
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

                    {/* Danh sách Thuốc Đã Kê */}
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
                   Bỏ qua
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

      {/* Modal Check-in chủ động */}
      {isCheckInOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animation-fade-in">
          <div className="bg-white rounded-md shadow-sm w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-emerald-50">
              <h3 className="text-lg font-bold text-emerald-800 flex items-center gap-2">
                <CheckCircle size={20} /> Xác nhận Check-in lượt khám
              </h3>
              <button onClick={() => setIsCheckInOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-md transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleCheckInSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-500 mb-0.5">Bệnh nhân</label>
                <div className="text-base font-bold text-slate-800 bg-slate-50 px-3 py-2.5 rounded-lg border border-slate-100">
                  {checkInData.patient_name}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Bác sĩ khám</label>
                <select 
                  value={checkInData.doctor_user_id} 
                  onChange={(e) => setCheckInData({ ...checkInData, doctor_user_id: e.target.value })}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none font-medium"
                >
                  <option value="">-- Khám bất kỳ bác sĩ nào --</option>
                  {doctors.map(doc => (
                    <option key={doc.id} value={doc.user_id}>
                      BS. {doc.doctor_name || doc.name} - {doc.specialization}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Mức độ ưu tiên</label>
                <select 
                  value={checkInData.priority} 
                  onChange={(e) => setCheckInData({ ...checkInData, priority: e.target.value })}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none font-semibold"
                >
                  <option value="normal">Khám Thường</option>
                  <option value="urgent">Ưu Tiên (Trẻ em, người cao tuổi)</option>
                  <option value="emergency">Cấp Cứu (Xử lý ngay)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Ghi chú triệu chứng / Lý do khám</label>
                <textarea 
                  rows="3" 
                  value={checkInData.notes} 
                  onChange={(e) => setCheckInData({ ...checkInData, notes: e.target.value })}
                  className="w-full px-3 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none text-sm"
                  placeholder="Nhập ghi chú triệu chứng..."
                ></textarea>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                <button type="button" onClick={() => setIsCheckInOpen(false)} className="px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl font-semibold transition-colors">
                  Hủy
                </button>
                <button type="submit" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-sm shadow-emerald-600/30 transition-colors">
                  Xác nhận đưa vào Hàng đợi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Appointments;
