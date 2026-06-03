import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { Stethoscope, Lock, Mail, User, UserCheck } from 'lucide-react';

const Register = () => {
  const [formData, setFormData] = useState({
     name: '', email: '', password: '', role: 'receptionist'
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);
    try {
      // Gọi lên API backend sử dụng api client cấu hình đúng cổng
      await api.post('/auth/register', formData);
      setSuccess('Đăng ký thành công! Hãy Đăng nhập bằng tài khoản vừa tạo.');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Có lỗi xảy ra khi đăng ký!');
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e) => setFormData({...formData, [e.target.name]: e.target.value});

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-md w-full bg-white border border-slate-200 rounded-md p-8 shadow-sm transition-all hover:shadow-primary/20">
        
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-white mb-4 shadow-sm shadow-primary/40">
            <UserCheck size={32} />
          </div>
          <h2 className="text-3xl font-bold text-slate-800 text-center">Tạo Tài Khoản</h2>
          <p className="text-slate-500 mt-2 text-center text-sm">Gia nhập đội ngũ Quản lý Bệnh Viện MedCare</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-6 border border-red-100 font-medium">
            {error}
          </div>
        )}
        {success && (
          <div className="bg-green-50 text-green-600 p-3 rounded-lg text-sm mb-6 border border-green-100 font-medium">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Họ và Tên</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <User size={18} className="text-slate-400" />
              </div>
              <input
                type="text" required name="name" value={formData.name} onChange={handleChange}
                className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white text-sm"
                placeholder="Vd: Nguyễn Văn A"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Thư điện tử (Email)</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Mail size={18} className="text-slate-400" />
              </div>
              <input
                type="email" required name="email" value={formData.email} onChange={handleChange}
                className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white text-sm"
                placeholder="email@hospital.com"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Chức vụ</label>
              <select name="role" value={formData.role} onChange={handleChange} className="block w-full px-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white text-sm">
                 <option value="receptionist">Tiếp tân</option>
                 <option value="doctor">Bác sĩ</option>
                 <option value="pharmacist">Dược sĩ</option>
                 <option value="admin">Quản trị viên</option>
              </select>
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Mật khẩu</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock size={18} className="text-slate-400" />
                  </div>
                  <input
                    type="password" required name="password" minLength={6} value={formData.password} onChange={handleChange}
                    className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-white text-sm"
                    placeholder="Tối thiểu 6 ký tự"
                  />
                </div>
            </div>
          </div>

          <button
            type="submit" disabled={isLoading}
            className={`w-full mt-2 bg-primary hover:bg-secondary text-white font-medium py-2.5 rounded-xl transition-all shadow-sm hover:shadow-primary/40 focus:ring-2 focus:ring-offset-2 focus:ring-primary flex justify-center items-center ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {isLoading ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> : 'Đăng Ký Tài Khoản'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-600 flex justify-center gap-1">
          Đã có tài khoản? 
          <span onClick={() => navigate('/login')} className="text-primary font-semibold cursor-pointer hover:underline">Đăng nhập</span>
        </div>
      </div>
    </div>
  );
};

export default Register;
