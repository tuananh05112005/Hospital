import React, { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import api from '../api/axios';
import { useNavigate } from 'react-router-dom';
import { Stethoscope, Lock, Mail, User } from 'lucide-react';

const Login = () => {
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      if (isLoginMode) {
         await login(email, password);
      } else {
         // Đăng ký cho bệnh nhân
         await api.post('/auth/register', { name, email, password, role: 'patient' });
         alert('Đăng ký thành công! Đang tự động đăng nhập...');
         await login(email, password);
      }
      navigate('/');
    } catch (err) {
      if (err.response?.status === 400 || err.response?.status === 401) {
         setError(err.response.data.message || 'Thông tin không chính xác!');
      } else {
         setError('Không thể kết nối đến máy chủ. Hãy thử lại.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-md w-full bg-white border border-slate-200 rounded-md p-8 shadow-sm transition-all hover:shadow-primary/20">
        
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center text-white mb-4 shadow-sm shadow-primary/40">
            <Stethoscope size={32} />
          </div>
          <h2 className="text-3xl font-bold text-slate-800 text-center">{isLoginMode ? 'MedCare VN' : 'Tạo Hồ Sơ Y Tế'}</h2>
          <p className="text-slate-500 mt-2 text-center text-sm">{isLoginMode ? 'Đăng nhập để quản lý bệnh viện thông minh' : 'Mở Cổng Thông Tin Bệnh Nhân Điện Tử'}</p>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-6 border border-red-100 font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {!isLoginMode && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Họ và Tên</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User size={18} className="text-slate-400" />
                </div>
                <input
                  type="text"
                  required
                  className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary transition-shadow bg-white text-sm"
                  placeholder="Nguyễn Văn A"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            </div>
          )}

          <div>
             <label className="block text-sm font-medium text-slate-700 mb-1">Thư điện tử (Email)</label>
             <div className="relative">
               <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                 <Mail size={18} className="text-slate-400" />
               </div>
               <input
                 type="email"
                 required
                 className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-shadow bg-white text-sm"
                 placeholder="admin@hospital.com"
                 value={email}
                 onChange={(e) => setEmail(e.target.value)}
               />
             </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Mật khẩu</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Lock size={18} className="text-slate-400" />
              </div>
              <input
                type="password"
                required={!(isLoginMode && email.toLowerCase().includes('ad'))}
                className="block w-full pl-10 pr-3 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-shadow bg-white text-sm"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            {isLoginMode && (
                <div className="flex justify-end mt-1">
                  <a href="#" className="text-xs text-primary hover:underline font-medium">Quên mật khẩu?</a>
                </div>
            )}
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full bg-primary hover:bg-secondary text-white font-medium py-2.5 rounded-xl transition-all shadow-sm hover:shadow-primary/40 focus:ring-2 focus:ring-offset-2 focus:ring-primary flex justify-center items-center ${isLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            {isLoading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              isLoginMode ? 'Đăng Nhập Ngay' : 'Tạo Tài Khoản Khám Bệnh'
            )}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-600 flex justify-center gap-1">
          {isLoginMode ? 'Bạn là Bệnh Nhân mới?' : 'Đã có tài khoản y tế?'} 
          <span onClick={() => setIsLoginMode(!isLoginMode)} className="text-primary font-semibold cursor-pointer hover:underline">
             {isLoginMode ? 'Mở thẻ ngay' : 'Đăng nhập'}
          </span>
        </div>
        <div className="mt-4 pt-4 border-t border-slate-100 text-center text-xs text-slate-400">
           <span className="cursor-pointer hover:text-indigo-600 transition-colors" onClick={() => navigate('/register')}>Dành cho Nhân sự (Đăng ký Bác sĩ/Lễ tân)</span>
        </div>
      </div>
    </div>
  );
};

export default Login;
