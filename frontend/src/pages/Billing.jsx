import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { CreditCard, CheckCircle, Clock, Banknote } from 'lucide-react';

const Billing = () => {
    const [invoices, setInvoices] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchInvoices = async () => {
        try {
            const res = await api.get('/clinical/invoices');
            // Filter only unpaid
            setInvoices(res.data.filter(inv => inv.status === 'unpaid'));
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchInvoices();
        const interval = setInterval(fetchInvoices, 10000);
        return () => clearInterval(interval);
    }, []);

    const handlePay = async (id) => {
        if (window.confirm('Xác nhận bệnh nhân đã thanh toán viện phí?')) {
            try {
                await api.post(`/clinical/invoices/${id}/pay`);
                alert('Đã cập nhật thanh toán thành công!');
                fetchInvoices();
            } catch (e) {
                alert('Lỗi thanh toán: ' + (e.response?.data?.message || e.message));
            }
        }
    };

    if (loading) return <div className="p-8 text-slate-500 font-medium">Đang tải danh sách chờ thanh toán...</div>;

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-800">Quầy Thu Ngân (Billing)</h1>
                <p className="text-slate-500 text-sm mt-1">Quản lý hóa đơn viện phí chờ thanh toán</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {invoices.length === 0 && (
                    <div className="col-span-full p-12 bg-white rounded-2xl border border-slate-200 text-center flex flex-col items-center justify-center">
                        <Banknote size={48} className="text-slate-300 mb-4" />
                        <h3 className="text-lg font-bold text-slate-600 mb-1">Chưa có hóa đơn chờ thu</h3>
                        <p className="text-sm text-slate-500">Các hóa đơn viện phí từ phòng khám sẽ tự động hiện ở đây.</p>
                    </div>
                )}
                {invoices.map(inv => {
                    return (
                        <div key={inv.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-indigo-500"></div>
                            
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <span className="text-xs font-bold text-blue-600 uppercase tracking-wider bg-blue-50 px-2.5 py-1 rounded-full mb-2 inline-block">Hóa đơn #{inv.id}</span>
                                    <h3 className="text-lg font-bold text-slate-800">{inv.patient_name}</h3>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-slate-500 font-medium flex items-center justify-end gap-1"><Clock size={12}/> {new Date(inv.created_at).toLocaleTimeString('vi-VN')}</p>
                                    <p className="text-xs text-slate-400 mt-1">{new Date(inv.created_at).toLocaleDateString('vi-VN')}</p>
                                </div>
                            </div>

                            <div className="bg-blue-50/50 p-4 rounded-xl flex-1 mb-6 border border-blue-100/50">
                                <p className="text-sm font-semibold text-slate-600 mb-1">Tổng viện phí:</p>
                                <p className="text-2xl font-bold text-blue-700">{parseInt(inv.total_amount).toLocaleString('vi-VN')} VNĐ</p>
                            </div>

                            <button 
                                onClick={() => handlePay(inv.id)}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl shadow-sm shadow-blue-500/30 transition-colors flex justify-center items-center gap-2"
                            >
                                <CheckCircle size={20} /> Đã Thu Tiền
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default Billing;
