import React, { useContext } from 'react';
import { NavLink } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { LayoutDashboard, Users, Calendar, Clock, Activity, FileText, BedDouble, Pill, Banknote, Stethoscope, Settings, CalendarCheck, TestTube } from 'lucide-react';

const Sidebar = () => {
  const { user } = useContext(AuthContext);

  const menuItems = {
    admin: [
      { path: '/', name: 'Tổng quan', icon: <LayoutDashboard size={20} /> },
      { path: '/patients', name: 'Bệnh nhân', icon: <Users size={20} /> },
      { path: '/appointments', name: 'Lịch khám', icon: <Calendar size={20} /> },
      { path: '/schedules', name: 'Lịch trực ca', icon: <CalendarCheck size={20} /> },
      { path: '/queue', name: 'Hàng đợi', icon: <Clock size={20} /> },
      { path: '/emr', name: 'Bệnh án Điện tử', icon: <FileText size={20} /> },
      { path: '/lab', name: 'Cận lâm sàng', icon: <TestTube size={20} /> },
      { path: '/rooms', name: 'Giường & Phòng', icon: <BedDouble size={20} /> },
      { path: '/pharmacy', name: 'Quầy Thuốc', icon: <Pill size={20} /> },
      { path: '/billing', name: 'Thu Ngân', icon: <Banknote size={20} /> },
    ],
    doctor: [
      { path: '/', name: 'Tổng quan', icon: <LayoutDashboard size={20} /> },
      { path: '/patients', name: 'Bệnh nhân', icon: <Users size={20} /> },
      { path: '/appointments', name: 'Lịch khám', icon: <Calendar size={20} /> },
      { path: '/schedules', name: 'Lịch trực ca', icon: <CalendarCheck size={20} /> },
      { path: '/queue', name: 'Hàng đợi', icon: <Clock size={20} /> },
      { path: '/emr', name: 'Bệnh án Điện tử', icon: <FileText size={20} /> },
      { path: '/lab', name: 'Cận lâm sàng', icon: <TestTube size={20} /> },
      { path: '/rooms', name: 'Giường & Phòng', icon: <BedDouble size={20} /> },
    ],
    receptionist: [
      { path: '/', name: 'Tổng quan', icon: <LayoutDashboard size={20} /> },
      { path: '/patients', name: 'Bệnh nhân', icon: <Users size={20} /> },
      { path: '/appointments', name: 'Lịch khám', icon: <Calendar size={20} /> },
      { path: '/queue', name: 'Hàng đợi', icon: <Clock size={20} /> },
      { path: '/lab', name: 'Cận lâm sàng', icon: <TestTube size={20} /> },
      { path: '/rooms', name: 'Giường & Phòng', icon: <BedDouble size={20} /> },
      { path: '/billing', name: 'Thu Ngân', icon: <Banknote size={20} /> },
    ],
    pharmacist: [
      { path: '/pharmacy', name: 'Quầy Thuốc', icon: <Pill size={20} /> },
    ],
    patient: [
      { path: '/', name: 'Tổng quan', icon: <LayoutDashboard size={20} /> },
    ]
  };

  const currentRole = user?.role || 'patient';
  const items = menuItems[currentRole] || menuItems.patient;

  return (
    <div className="w-64 h-full bg-slate-900 border-r border-slate-800 flex flex-col shadow-lg shadow-slate-900/20">
      <div className="h-16 flex items-center px-6 border-b border-slate-800 bg-slate-950">
        <h1 className="text-xl font-bold text-white flex items-center gap-3 tracking-wide">
          <div className="bg-secondary p-1.5 rounded-md">
             <Stethoscope className="text-white" size={20} />
          </div>
          MedCare HIS
        </h1>
      </div>
      
      <div className="flex-1 py-6 px-4 space-y-1 overflow-y-auto">
        <p className="px-4 text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Hệ Thống Phân Hệ</p>
        {items.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-md transition-all duration-200 border-l-4 ${
                    isActive 
                      ? 'bg-slate-800 border-secondary text-white font-semibold' 
                      : 'border-transparent text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 font-medium'
                  }`
                }
              >
                {item.icon}
                <span className="text-sm">{item.name}</span>
              </NavLink>
        ))}
      </div>
      
      <div className="p-4 border-t border-slate-800 bg-slate-950/50">
        <div className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:bg-slate-800 hover:text-white rounded-md cursor-pointer transition-colors border-l-4 border-transparent">
          <Settings size={20} />
          <span className="text-sm font-medium">Hệ thống & Cài đặt</span>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
