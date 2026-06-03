import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../api/axios';
import { Search, Plus, X, Edit2, Trash2, ChevronLeft, ChevronRight, Activity, CalendarPlus } from 'lucide-react';
import { usePatients } from '../hooks/usePatients';

const Patients = () => {
  const { user } = useContext(AuthContext);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  
  const { patients, loading, refetch } = usePatients(page, 10, search);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isVisitModalOpen, setIsVisitModalOpen] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState(null);
  const [visitData, setVisitData] = useState({ priority: 'normal', notes: '', doctor_id: '' });
  const [isAptModalOpen, setIsAptModalOpen] = useState(false);
  const [aptData, setAptData] = useState({ doctor_id: '', appointment_date: '', reason: '' });
  const [doctors, setDoctors] = useState([]);
  
  React.useEffect(() => {
    api.get('/doctors').then(res => setDoctors(res.data)).catch(e => console.error(e));
  }, []);

  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', dob: '', gender: 'Male', address: ''
  });
  const handleOpenModal = (patient = null) => {
    if (patient) {
      setEditingId(patient.id);
      setFormData({
        name: patient.name,
        email: patient.email || '',
        phone: patient.phone || '',
        dob: patient.dob ? patient.dob.split('T')[0] : '',
        gender: patient.gender || 'Male',
        address: patient.address || ''
      });
    } else {
      setEditingId(null);
      setFormData({ name: '', email: '', phone: '', dob: '', gender: 'Male', address: '' });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleVisitChange = (e) => {
    setVisitData({ ...visitData, [e.target.name]: e.target.value });
  };

  const handleCreateVisit = async (e) => {
    e.preventDefault();
    try {
        await api.post('/visits', {
            patient_id: selectedPatientId,
            doctor_id: visitData.doctor_id || null,
            priority: visitData.priority,
            notes: visitData.notes
        });
        setIsVisitModalOpen(false);
        alert('Đã đưa bệnh nhân vào Hàng đợi thành công!');
    } catch (e) {
        alert('Lỗi tạo lượt khám: ' + (e.response?.data?.message || e.message));
    }
  };

  const handleCreateApt = async (e) => {
    e.preventDefault();
    try {
        await api.post('/appointments', {
            patient_id: selectedPatientId,
            doctor_id: aptData.doctor_id,
            appointment_date: aptData.appointment_date,
            reason: aptData.reason
        });
        setIsAptModalOpen(false);
        alert('Đã đặt hẹn lịch khám thành công!');
    } catch (e) {
        alert('Lỗi đặt lịch hẹn: ' + (e.response?.data?.message || e.message));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/patients/${editingId}`, formData);
      } else {
        await api.post('/patients', formData);
      }
      handleCloseModal();
      refetch();
    } catch (error) {
      alert('Có lỗi xảy ra: ' + (error.response?.data?.message || error.message));
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa bệnh nhân này không?')) {
      try {
        await api.delete(`/patients/${id}`);
        refetch();
      } catch (error) {
         if(error.response?.status === 403) {
             alert('Chỉ Admin mới có quyền xóa bệnh nhân!');
         } else {
             alert('Lỗi xóa bệnh nhân');
         }
      }
    }
  };

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Quản lý Bệnh nhân</h1>
          <p className="text-slate-500 text-sm mt-1">Hồ sơ khám chữa bệnh của bệnh nhân</p>
        </div>
        {user?.role !== 'doctor' && (
          <button 
            onClick={() => handleOpenModal()} 
            className="bg-primary hover:bg-secondary text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm shadow-primary/30 flex items-center gap-2"
          >
            <Plus size={18} />
            Đăng ký Bệnh nhân
          </button>
        )}
      </div>

      <div className="bg-white rounded-md shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
          <div className="relative w-64 md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
            <input 
              type="text" 
              placeholder="Tìm kiếm bệnh nhân..." 
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white shadow-inner"
            />
          </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white border-b border-slate-200 text-slate-500 text-sm">
                <th className="p-4 font-semibold">Họ và Tên</th>
                <th className="p-4 font-semibold">Điện thoại</th>
                <th className="p-4 font-semibold">Giới tính</th>
                <th className="p-4 font-semibold">Ngày sinh</th>
                {user?.role !== 'doctor' && <th className="p-4 font-semibold text-right">Thao tác</th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={user?.role === 'doctor' ? 4 : 5} className="p-8 text-center text-slate-500 font-medium">Đang tải dữ liệu...</td></tr>
              ) : patients.length === 0 ? (
                <tr><td colSpan={user?.role === 'doctor' ? 4 : 5} className="p-8 text-center text-slate-500 font-medium">Chưa có dữ liệu bệnh nhân nào.</td></tr>
              ) : (
                patients.map(patient => (
                  <tr key={patient.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                    <td className="p-4 font-semibold text-slate-800">{patient.name}</td>
                    <td className="p-4 text-slate-600 text-sm">{patient.phone || '-'}</td>
                    <td className="p-4 text-slate-600 text-sm">
                      {patient.gender === 'Male' ? 'Nam' : patient.gender === 'Female' ? 'Nữ' : 'Khác'}
                    </td>
                    <td className="p-4 text-slate-600 text-sm">
                      {patient.dob ? new Date(patient.dob).toLocaleDateString('vi-VN') : '-'}
                    </td>
                    {user?.role !== 'doctor' && (
                      <td className="p-4 text-right">
                        <button 
                          onClick={() => {
                             setSelectedPatientId(patient.id);
                             setVisitData({ priority: 'normal', notes: '', doctor_id: '' });
                             setIsVisitModalOpen(true);
                          }}
                          className="text-green-600 hover:text-green-800 hover:bg-green-50 p-2 rounded-lg transition-colors mr-1 inline-flex"
                          title="Đăng ký khám (Vào Hàng đợi)"
                        >
                          <Activity size={16} />
                        </button>
                        <button 
                          onClick={() => {
                             setSelectedPatientId(patient.id);
                             setAptData({ doctor_id: '', appointment_date: '', reason: '' });
                             setIsAptModalOpen(true);
                          }}
                          className="text-purple-600 hover:text-purple-800 hover:bg-purple-50 p-2 rounded-lg transition-colors mr-1 inline-flex"
                          title="Đặt Hẹn Khám (Tương lai)"
                        >
                          <CalendarPlus size={16} />
                        </button>
                        {user?.role !== 'doctor' && (
                          <>
                            <button 
                              onClick={() => handleOpenModal(patient)}
                              className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 p-2 rounded-lg transition-colors mr-1 inline-flex"
                              title="Sửa"
                            >
                              <Edit2 size={16} />
                            </button>
                            {user?.role === 'admin' && (
                              <button 
                                onClick={() => handleDelete(patient.id)}
                                className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-colors inline-flex"
                                title="Xóa"
                              >
                                <Trash2 size={16} />
                              </button>
                            )}
                          </>
                        )}
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="p-4 border-t border-slate-200 flex justify-between items-center bg-slate-50">
            <span className="text-sm text-slate-500">Trang {page}</span>
            <div className="flex gap-2">
                <button 
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="p-1 rounded bg-white border border-slate-200 hover:bg-slate-100 disabled:opacity-50"
                >
                    <ChevronLeft size={18} />
                </button>
                <button 
                    onClick={() => setPage(p => p + 1)}
                    disabled={patients.length < 10}
                    className="p-1 rounded bg-white border border-slate-200 hover:bg-slate-100 disabled:opacity-50"
                >
                    <ChevronRight size={18} />
                </button>
            </div>
        </div>
      </div>

      {/* Modal Overlay */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animation-fade-in">
          <div className="bg-white rounded-md shadow-sm w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h3 className="text-lg font-bold text-slate-800">
                {editingId ? 'Cập nhật tài khoản Bệnh nhân' : 'Đăng ký Bệnh nhân mới'}
              </h3>
              <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600 p-1 rounded-md transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Họ và Tên <span className="text-red-500">*</span></label>
                <input required type="text" name="name" value={formData.name} onChange={handleChange} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Số điện thoại</label>
                  <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Email</label>
                  <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Ngày sinh</label>
                  <input type="date" name="dob" value={formData.dob} onChange={handleChange} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Giới tính</label>
                  <select name="gender" value={formData.gender} onChange={handleChange} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none">
                    <option value="Male">Nam</option>
                    <option value="Female">Nữ</option>
                    <option value="Other">Khác</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Địa chỉ</label>
                <textarea name="address" rows="2" value={formData.address} onChange={handleChange} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none"></textarea>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                <button type="button" onClick={handleCloseModal} className="px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl font-medium transition-colors">
                  Hủy bỏ
                </button>
                <button type="submit" className="px-4 py-2 bg-primary hover:bg-secondary text-white rounded-xl font-medium shadow-sm shadow-primary/30 transition-colors">
                  {editingId ? 'Lưu thay đổi' : 'Đăng ký ngay'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Visit Modal */}
      {isVisitModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animation-fade-in">
          <div className="bg-white rounded-md shadow-sm w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-green-50">
              <h3 className="text-lg font-bold text-green-800 flex items-center gap-2">
                <Activity size={20} /> Đưa vào Hàng Đợi Khám
              </h3>
              <button onClick={() => setIsVisitModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-md transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleCreateVisit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Chọn Bác sĩ (Tùy chọn)</label>
                <select name="doctor_id" value={visitData.doctor_id} onChange={handleVisitChange} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none">
                  <option value="">-- Khám bất kỳ bác sĩ nào --</option>
                  {doctors.map(doc => (
                    <option key={doc.id} value={doc.user_id}>{doc.doctor_name || doc.name} - {doc.specialization}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Mức độ Ưu tiên</label>
                <select name="priority" value={visitData.priority} onChange={handleVisitChange} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none">
                  <option value="normal">Khám Thường</option>
                  <option value="urgent">Ưu Tiên (Trẻ em, người cao tuổi)</option>
                  <option value="emergency">Cấp Cứu (Xử lý ngay)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Ghi chú (Lý do khám)</label>
                <textarea required name="notes" rows="3" value={visitData.notes} onChange={handleVisitChange} placeholder="Triệu chứng ban đầu..." className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 outline-none"></textarea>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                <button type="button" onClick={() => setIsVisitModalOpen(false)} className="px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl font-medium transition-colors">
                  Hủy bỏ
                </button>
                <button type="submit" className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium shadow-sm transition-colors">
                  Đăng ký & Lấy số thứ tự
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Appointment Modal */}
      {isAptModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animation-fade-in">
          <div className="bg-white rounded-md shadow-sm w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-purple-50">
              <h3 className="text-lg font-bold text-purple-800 flex items-center gap-2">
                <CalendarPlus size={20} /> Đặt Lịch Hẹn Khám
              </h3>
              <button onClick={() => setIsAptModalOpen(false)} className="text-slate-400 hover:text-slate-600 p-1 rounded-md transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleCreateApt} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Chọn Bác sĩ (Bắt buộc) <span className="text-red-500">*</span></label>
                <select required value={aptData.doctor_id} onChange={(e) => setAptData({...aptData, doctor_id: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none">
                  <option value="">-- Chọn bác sĩ --</option>
                  {doctors.map(doc => (
                    <option key={doc.id} value={doc.id}>{doc.doctor_name || doc.name} - {doc.specialization}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Ngày Giờ Hẹn <span className="text-red-500">*</span></label>
                <input required type="datetime-local" value={aptData.appointment_date} onChange={(e) => setAptData({...aptData, appointment_date: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none" />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Lý do khám <span className="text-red-500">*</span></label>
                <textarea required rows="3" value={aptData.reason} onChange={(e) => setAptData({...aptData, reason: e.target.value})} placeholder="Triệu chứng..." className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-purple-500 outline-none"></textarea>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                <button type="button" onClick={() => setIsAptModalOpen(false)} className="px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl font-medium transition-colors">
                  Hủy bỏ
                </button>
                <button type="submit" className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium shadow-sm transition-colors">
                  Lưu Lịch Hẹn
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Patients;
