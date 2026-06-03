import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { Users, Stethoscope, Calendar, Activity } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalPatients: 0,
    totalDoctors: 0,
    totalAppointments: 0,
    todayAppointments: 0,
    chartData: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/dashboard/stats');
        setStats(response.data);
      } catch (error) {
        console.error("Lỗi khi tải thống kê", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const cards = [
    { title: 'Tổng Bệnh Nhân', value: stats.totalPatients, icon: <Users size={24} className="text-blue-500" />, color: 'bg-blue-50 border-blue-100' },
    { title: 'Tổng Bác Sĩ', value: stats.totalDoctors, icon: <Stethoscope size={24} className="text-green-500" />, color: 'bg-green-50 border-green-100' },
    { title: 'Tổng Lịch Khám', value: stats.totalAppointments, icon: <Calendar size={24} className="text-purple-500" />, color: 'bg-purple-50 border-purple-100' },
    { title: "Lịch Phục Vụ Hôm Nay", value: stats.todayAppointments, icon: <Activity size={24} className="text-orange-500" />, color: 'bg-orange-50 border-orange-100' },
  ];

  if (loading) {
    return <div className="text-center py-10 text-slate-500">Đang tải dữ liệu thống kê...</div>;
  }

  return (
    <div>
      <div className="mb-8 block">
        <h1 className="text-2xl font-bold text-slate-800">Tổng quan Bảng điều khiển</h1>
        <p className="text-slate-500 text-sm mt-1">Chào mừng quay trở lại. Dưới đây là thống kê thời gian thực của Bệnh Viện.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
        {cards.map((card, index) => (
          <div key={index} className={`p-6 rounded-md border bg-white shadow-sm hover:shadow-sm transition-shadow cursor-default group`}>
            <div className="flex justify-between items-center mb-4">
              <div className={`p-3 rounded-xl ${card.color} group-hover:scale-110 transition-transform`}>
                {card.icon}
              </div>
            </div>
            <h3 className="text-3xl font-bold text-slate-800">{card.value}</h3>
            <p className="text-sm font-semibold text-slate-500 uppercase tracking-wide mt-1">{card.title}</p>
          </div>
        ))}
      </div>
      
      {/* Biểu đồ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
         {/* Biểu đồ Doanh thu (Viện phí) */}
         <div className="bg-white p-6 rounded-md border border-slate-200 shadow-sm">
            <h2 className="text-lg font-bold text-slate-800 mb-6">Doanh Thu Viện Phí (7 ngày qua)</h2>
            <div className="h-72 w-full">
               <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={stats.chartData || []} margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                   <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748B'}} dy={10} />
                   <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748B'}} dx={-10} tickFormatter={(val) => (val / 1000) + 'k'} />
                   <Tooltip cursor={{fill: '#F1F5F9'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                   <Bar dataKey="revenue" fill="#3B82F6" radius={[4, 4, 0, 0]} name="Doanh thu (VNĐ)" />
                 </BarChart>
               </ResponsiveContainer>
            </div>
         </div>

         {/* Biểu đồ Lịch Khám */}
         <div className="bg-white p-6 rounded-md border border-slate-200 shadow-sm">
            <h2 className="text-lg font-bold text-slate-800 mb-6">Tần Suất Khám Bệnh (7 ngày qua)</h2>
            <div className="h-72 w-full">
               <ResponsiveContainer width="100%" height="100%">
                 <LineChart data={stats.chartData || []} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                   <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748B'}} dy={10} />
                   <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748B'}} dx={-10} />
                   <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                   <Line type="monotone" dataKey="appointments" stroke="#8B5CF6" strokeWidth={3} dot={{r: 4, strokeWidth: 2}} activeDot={{r: 6}} name="Số lượt khám" />
                 </LineChart>
               </ResponsiveContainer>
            </div>
         </div>
      </div>
    </div>
  );
};

export default Dashboard;
