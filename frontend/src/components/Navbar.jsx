import React, { useContext, useState, useRef, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Bell, Search, LogOut, Clock, ShieldAlert } from 'lucide-react';
import api from '../api/axios';

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [currentShift, setCurrentShift] = useState(null);
  const [department, setDepartment] = useState('');
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (user?.role === 'doctor') {
      const fetchShift = async () => {
        try {
          const res = await api.get('/shifts/my-current-shift');
          setCurrentShift(res.data.shift);
          setDepartment(res.data.department);
        } catch (e) {
          console.error(e);
        }
      };
      fetchShift();
    }
  }, [user]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getRoleName = (role) => {
     switch(role) {
       case 'admin': return 'Quản trị viên';
       case 'doctor': return 'Bác sĩ';
       case 'receptionist': return 'Tiếp tân';
       default: return role;
     }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shadow-[0_1px_3px_0_rgba(0,0,0,0.05)] z-10 w-full">
      {/* Search Bar */}
      <div className="relative w-96">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search size={18} className="text-slate-400" />
        </div>
        <input
          type="text"
          className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-full text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all bg-slate-50"
          placeholder="Tìm kiếm bệnh nhân, bác sĩ..."
        />
      </div>

      {/* Information & User Actions */}
      <div className="flex items-center gap-6">
        
        <div className="hidden md:flex items-center gap-4 border-r border-slate-200 pr-6">
           <div className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-md ${currentShift ? 'text-blue-600 bg-blue-50 border border-blue-200' : 'text-slate-500 bg-slate-100 border border-transparent'}`}>
              <Clock size={14}/> 
              {currentShift ? `CA TRỰC: ${currentShift === 'morning' ? 'SÁNG' : currentShift === 'afternoon' ? 'CHIỀU' : 'ĐÊM'}` : 'NGOẠI TUYẾN'}
           </div>
           {user?.role === 'doctor' && department && (
               <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-md">
                 <ShieldAlert size={14}/> KHOA: {department.toUpperCase()}
               </div>
           )}
        </div>

        <button className="relative text-slate-500 hover:text-primary transition-colors">
          <Bell size={20} />
          <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white"></span>
        </button>

        <div className="relative" ref={dropdownRef}>
          <div 
            className="flex items-center gap-3 cursor-pointer p-1 pr-3 rounded-md hover:bg-slate-50 border border-transparent hover:border-slate-200 transition-all"
            onClick={() => setDropdownOpen(!dropdownOpen)}
          >
            <div className="h-9 w-9 rounded-md bg-primary text-white flex items-center justify-center font-bold text-lg shadow-sm shadow-primary/30">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold text-slate-800 leading-tight">{user?.name}</span>
              <span className="text-xs font-semibold text-secondary uppercase tracking-wider">{getRoleName(user?.role)}</span>
            </div>
          </div>

          {/* Dropdown */}
          {dropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-slate-200 py-1 opacity-100 transition-all animation-fade-in origin-top-right z-50">
              <div className="px-4 py-3 border-b border-slate-100 bg-slate-50">
                <p className="text-sm text-slate-800 font-bold">Phiên làm việc</p>
                <p className="text-xs text-slate-500 truncate font-medium mt-0.5">{user?.email}</p>
              </div>
              <button 
                onClick={handleLogout}
                className="w-full text-left px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors font-bold"
              >
                <LogOut size={16} />
                Kết thúc ca (Đăng xuất)
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
