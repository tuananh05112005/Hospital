import React, { useState, useEffect, useContext } from 'react';
import api from '../api/axios';
import { AuthContext } from '../context/AuthContext';
import { Plus, X, Edit2 } from 'lucide-react';

const Doctors = () => {
  const { user } = useContext(AuthContext);
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null); // id = doctor id
  
  // Default structure
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', // Dùng cho tạo tài khoản mới
    specialization: '', phone: '', department: ''
  });

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const response = await api.get('/doctors');
      setDoctors(response.data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (doctor = null) => {
    if (doctor) {
      setEditingId(doctor.id);
      setFormData({
        name: doctor.name, // readonly khi sửa vì name thuộc bảng users
        email: doctor.email, // readonly
        password: '',
        specialization: doctor.specialization || '',
        phone: doctor.phone || '',
        department: doctor.department || ''
      });
    } else {
      setEditingId(null);
      setFormData({ name: '', email: '', password: '', specialization: '', phone: '', department: '' });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        // Update doctor details
        await api.put(`/doctors/${editingId}`, {
          specialization: formData.specialization,
          phone: formData.phone,
          department: formData.department
        });
      } else {
        // Register new doctor via Auth endpoint
        await api.post('/auth/register', {
          name: formData.name,
          email: formData.email,
          password: formData.password,
          role: 'doctor'
        });
      }
      handleCloseModal();
      fetchDoctors();
    } catch (error) {
      alert('Có lỗi xảy ra: ' + (error.response?.data?.message || error.message));
    }
  };

  return (
    <div>
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Cán bộ Bác sĩ</h1>
          <p className="text-slate-500 text-sm mt-1">Quản lý đội ngũ y tế của bệnh viện</p>
        </div>
        {user?.role === 'admin' && (
          <button 
            onClick={() => handleOpenModal()} 
            className="bg-primary hover:bg-secondary text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-sm shadow-primary/30 flex items-center gap-2"
          >
            <Plus size={18} />
            Cấp tài khoản Bác sĩ
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-3 text-center text-slate-500 p-8 font-medium">Đang tải danh sách bác sĩ...</div>
        ) : doctors.length === 0 ? (
          <div className="col-span-3 text-center text-slate-500 p-8 bg-white rounded-md border border-slate-200 font-medium">
            Chưa có thông tin bác sĩ nào.
          </div>
        ) : (
          doctors.map(doctor => (
            <div key={doctor.id} className="bg-white rounded-md border border-slate-200 p-6 shadow-sm hover:shadow-sm transition-all group">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-14 h-14 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xl font-bold border border-green-200 group-hover:bg-green-500 group-hover:text-white transition-colors">
                  {doctor.name.charAt(0)}
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-lg leading-tight">{doctor.name}</h3>
                  <p className="text-primary text-sm font-medium mt-1">{doctor.specialization || 'Khoa Nội (Mặc định)'}</p>
                </div>
              </div>
              
              <div className="space-y-3 mt-5 pt-4 border-t border-slate-100">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 font-medium">Phòng/Khoa</span>
                  <span className="font-semibold text-slate-700">{doctor.department || '-'}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 font-medium">Email</span>
                  <span className="font-semibold text-slate-700">{doctor.email}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500 font-medium">SĐT</span>
                  <span className="font-semibold text-slate-700">{doctor.phone || '-'}</span>
                </div>
              </div>
              
              {user?.role === 'admin' && (
                <div className="mt-5 flex gap-2">
                   <button 
                    onClick={() => handleOpenModal(doctor)}
                    className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-700 py-2.5 flex items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-colors border border-slate-200"
                   >
                     <Edit2 size={16} /> Cập nhật hồ sơ
                   </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animation-fade-in">
          <div className="bg-white rounded-md shadow-sm w-full max-w-md overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex justify-between items-center bg-slate-50">
              <h3 className="text-lg font-bold text-slate-800">
                {editingId ? 'Cập nhật hồ sơ Bác sĩ' : 'Cấp tài khoản Bác sĩ mới'}
              </h3>
              <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600 p-1 rounded-md transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {!editingId && (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Họ và Tên <span className="text-red-500">*</span></label>
                    <input required type="text" name="name" value={formData.name} onChange={handleChange} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Email <span className="text-red-500">*</span></label>
                    <input required type="email" name="email" value={formData.email} onChange={handleChange} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Mật khẩu <span className="text-red-500">*</span></label>
                    <input required type="password" name="password" value={formData.password} onChange={handleChange} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none" minLength={6} placeholder="Tối thiểu 6 ký tự"/>
                  </div>
                </>
              )}
              {editingId && (
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-100 text-sm text-slate-600 mb-4">
                  Đang chỉnh sửa: <span className="font-bold text-slate-800">{formData.name}</span> ({formData.email})
                </div>
              )}

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Chuyên môn</label>
                <input type="text" name="specialization" value={formData.specialization} onChange={handleChange} placeholder="Vd: Tim mạch, Chấn thương chỉnh hình..." className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Khoa trực</label>
                  <input type="text" name="department" value={formData.department} onChange={handleChange} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Số điện thoại</label>
                  <input type="tel" name="phone" value={formData.phone} onChange={handleChange} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary outline-none" />
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-slate-100">
                <button type="button" onClick={handleCloseModal} className="px-4 py-2 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl font-medium transition-colors">
                  Hủy bỏ
                </button>
                <button type="submit" className="px-4 py-2 bg-primary hover:bg-secondary text-white rounded-xl font-medium shadow-sm shadow-primary/30 transition-colors">
                  {editingId ? 'Lưu thay đổi' : 'Tạo tài khoản'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Doctors;
