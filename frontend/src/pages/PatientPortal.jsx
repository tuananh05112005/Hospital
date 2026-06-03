import React, { useState, useEffect, useContext } from 'react';
import api from '../api/axios';
import { AuthContext } from '../context/AuthContext';
import { Calendar, UserCircle, Activity, CreditCard, ChevronRight, FileText, Smartphone } from 'lucide-react';

const PatientPortal = () => {
    const { user } = useContext(AuthContext);
    const [emr, setEmr] = useState(null);
    const [loading, setLoading] = useState(true);
    const [doctors, setDoctors] = useState([]);
    
    // Form state
    const [bookingData, setBookingData] = useState({ doctor_id: '', appointment_date: '', time: '08:00', notes: '' });
    const [activeTab, setActiveTab] = useState('overview');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const [emrRes, docRes] = await Promise.all([
                api.get('/patient-portal/emr'),
                api.get('/doctors')
            ]);
            setEmr(emrRes.data);
            setDoctors(docRes.data);
            if(docRes.data.length > 0) {
                setBookingData(prev => ({...prev, doctor_id: docRes.data[0].id}));
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleBook = async (e) => {
        e.preventDefault();
        try {
            const dt = `${bookingData.appointment_date}T${bookingData.time}:00`;
            await api.post('/patient-portal/appointments', {
                doctor_id: bookingData.doctor_id,
                appointment_date: dt,
                notes: bookingData.notes
            });
            alert('Đăng ký khám thành công!');
            fetchData();
            setActiveTab('overview');
        } catch (e) {
            alert('Lỗi đặt lịch: ' + e.message);
        }
    };

    const handleCheckout = async (invoiceId) => {
        if(window.confirm('Chuyển hướng sang Cổng thanh toán trực tuyến (VNPay/MoMo ảo)?')) {
            try {
                await api.post(`/patient-portal/invoices/${invoiceId}/pay`);
                alert('Giao dịch thành công! Hóa đơn đã được thanh toán.');
                fetchData();
            } catch (e) {
                alert('Lỗi: ' + e.message);
            }
        }
    };

    if (loading) return <div className="p-8 text-center animate-pulse text-indigo-500 font-bold">Đồng bộ Hệ Sinh Thái Apple Health / MedCare...</div>;

    if (!emr || !emr.patient) return <div className="p-8 text-center text-red-500">Lỗi không tìm thấy Hồ sơ Y tế.</div>;

    const { patient, timeline } = emr;

    return (
        <div className="max-w-4xl mx-auto pb-12">
            {/* Header M-Health */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg p-8 text-white shadow-sm mb-8 relative overflow-hidden">
                 <div className="absolute top-0 right-0 opacity-10">
                     <Smartphone size={200} />
                 </div>
                 <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
                     <div className="w-24 h-24 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border-4 border-white/30 shadow-sm">
                         <UserCircle size={60} className="text-white" />
                     </div>
                     <div className="text-center md:text-left">
                         <h1 className="text-3xl font-black mb-1">{patient.name}</h1>
                         <p className="text-indigo-100 font-medium">Bệnh án Y Tế Số: #PID-{patient.id}</p>
                         <div className="flex flex-wrap gap-2 mt-4 justify-center md:justify-start">
                             <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-bold backdrop-blur-md">Email: {patient.email}</span>
                             <span className="px-3 py-1 bg-white/20 rounded-full text-xs font-bold backdrop-blur-md">Cấp độ Thẻ: Titanium</span>
                         </div>
                     </div>
                 </div>
            </div>

            {/* Navigation Tabs */}
            <div className="flex overflow-x-auto gap-2 mb-8 no-scrollbar bg-white p-2 rounded-md shadow-sm border border-slate-100">
                {['overview', 'book', 'history', 'billing'].map(tab => {
                    const labels = { overview: 'Tổng Quan', book: 'Đặt Lịch', history: 'Lịch Sử EMR', billing: 'Viện Phí' };
                    const icons = { overview: <Activity size={18}/>, book: <Calendar size={18}/>, history: <FileText size={18}/>, billing: <CreditCard size={18}/> };
                    return (
                        <button 
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm whitespace-nowrap transition-all ${activeTab === tab ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30' : 'text-slate-500 hover:bg-slate-50 hover:text-indigo-600'}`}
                        >
                            {icons[tab]} {labels[tab]}
                        </button>
                    )
                })}
            </div>

            {/* Tab: Overview */}
            {activeTab === 'overview' && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Lịch tiếp theo */}
                        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-100">
                            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><Calendar className="text-indigo-500"/> Lịch Hẹn Sắp Tới</h3>
                            {timeline.appointments.filter(a => a.status === 'scheduled').length === 0 ? (
                                <p className="text-slate-500 text-sm">Bạn không có lịch hẹn nào sắp tới.</p>
                            ) : (
                                timeline.appointments.filter(a => a.status === 'scheduled').slice(0, 2).map(apt => (
                                    <div key={apt.id} className="p-4 bg-indigo-50 rounded-md mb-3 border border-indigo-100">
                                        <p className="font-bold text-indigo-900">{new Date(apt.appointment_date).toLocaleString('vi-VN')}</p>
                                        <p className="text-sm font-medium text-indigo-700 mt-1">BS. {apt.doctor_name}</p>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* Thanh toán chờ */}
                        <div className="bg-white p-6 rounded-lg shadow-sm border border-slate-100">
                            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2"><CreditCard className="text-red-500"/> Viện phí Cần thanh toán</h3>
                            {timeline.invoices.filter(i => i.status === 'unpaid').length === 0 ? (
                                <p className="text-slate-500 text-sm">Tuyệt vời! Bạn không nợ chi phí nào.</p>
                            ) : (
                                timeline.invoices.filter(i => i.status === 'unpaid').slice(0, 1).map(inv => (
                                    <div key={inv.id} className="p-5 bg-red-50 rounded-md border border-red-100 flex justify-between items-center">
                                        <div>
                                            <p className="font-bold text-red-900">Mã Bill: INV-{inv.id}</p>
                                            <p className="text-xl font-black text-red-600 mt-1">{parseInt(inv.total_amount).toLocaleString('vi-VN')} ₫</p>
                                        </div>
                                        <button onClick={() => {setActiveTab('billing')}} className="w-10 h-10 bg-red-600 text-white rounded-full flex items-center justify-center hover:bg-red-700 transition-colors shadow-sm">
                                            <ChevronRight size={20} />
                                        </button>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Tab: Book */}
            {activeTab === 'book' && (
                <div className="bg-white p-8 rounded-lg shadow-sm border border-slate-100">
                    <h2 className="text-2xl font-bold text-slate-800 mb-2">Đăng Ký Khám Bệnh</h2>
                    <p className="text-slate-500 mb-6 text-sm">Hệ thống sẽ chuyển thông tin đến trực tiếp bác sĩ chuyên khoa.</p>
                    
                    <form onSubmit={handleBook} className="space-y-5 max-w-lg">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Chọn Bác Sĩ Cấp 1</label>
                            <select required value={bookingData.doctor_id} onChange={e => setBookingData({...bookingData, doctor_id: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium text-slate-800 cursor-pointer">
                                {doctors.map(d => <option key={d.id} value={d.id}>BS. {d.name} ({d.specialization})</option>)}
                            </select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Ngày Khám</label>
                                <input required type="date" value={bookingData.appointment_date} onChange={e => setBookingData({...bookingData, appointment_date: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2">Giờ Dự Kiến</label>
                                <input required type="time" value={bookingData.time} onChange={e => setBookingData({...bookingData, time: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-2">Triệu chứng lâm sàng (Bạn đang mệt ở đâu?)</label>
                            <textarea rows="3" value={bookingData.notes} onChange={e => setBookingData({...bookingData, notes: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Ví dụ: Đau đầu dai dẳng, ho có đờm..."></textarea>
                        </div>
                        <button type="submit" className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-lg shadow-sm shadow-indigo-600/30 transition-all">Xác Nhận Đặt Lịch</button>
                    </form>
                </div>
            )}

            {/* Tab: History */}
            {activeTab === 'history' && (
                <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-slate-800 px-2">Bệnh Án Điện Tử (EMR)</h2>
                    <div className="bg-white rounded-lg shadow-sm border border-slate-100 overflow-hidden">
                        {timeline.appointments.length === 0 ? <p className="p-8 text-center text-slate-500">Chưa có lịch sử di khám.</p> : timeline.appointments.map(apt => (
                            <div key={apt.id} className="p-6 border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                                <div className="flex justify-between mb-2">
                                    <div className="font-bold text-slate-800">{new Date(apt.appointment_date).toLocaleString('vi-VN')}</div>
                                    <div>
                                        {apt.status === 'completed' ? <span className="px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full">Đã Khám</span> : <span className="px-3 py-1 bg-slate-200 text-slate-600 text-xs font-bold rounded-full">{apt.status}</span>}
                                    </div>
                                </div>
                                <p className="text-sm text-slate-600 mb-1">Bác sĩ: <strong>{apt.doctor_name}</strong> - {apt.specialization}</p>
                                <p className="text-sm bg-slate-100 p-3 rounded-xl text-slate-700 font-medium italic">"Chẩn đoán: {apt.notes || 'Không có ghi chú'}"</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Tab: Billing */}
            {activeTab === 'billing' && (
                <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-slate-800 px-2">Quản Lý Chi Phí</h2>
                    <div className="space-y-4">
                        {timeline.invoices.length === 0 ? <p className="text-slate-500 text-center">Chưa có hóa đơn nào.</p> : timeline.invoices.map(inv => (
                            <div key={inv.id} className="bg-white p-6 rounded-lg shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
                                <div className="w-full md:w-auto">
                                    <p className="font-bold text-slate-500 text-sm mb-1 uppercase tracking-wide">Hóa Đơn Dịch Vụ</p>
                                    <p className="text-2xl font-black text-slate-800">{parseInt(inv.total_amount).toLocaleString('vi-VN')} ₫</p>
                                    <p className="text-xs text-slate-400 mt-1">{new Date(inv.created_at).toLocaleString('vi-VN')}</p>
                                </div>
                                {inv.status === 'unpaid' ? (
                                    <button onClick={() => handleCheckout(inv.id)} className="w-full md:w-auto px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-bold shadow-sm shadow-blue-500/30 transition-all flex justify-center items-center gap-2">
                                        <CreditCard size={18}/> Thanh Toán Trực Tuyến
                                    </button>
                                ) : (
                                    <div className="px-6 py-3 bg-emerald-50 text-emerald-600 rounded-xl font-bold border border-emerald-100 text-center">
                                        Đã Hoàn Tất
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default PatientPortal;
