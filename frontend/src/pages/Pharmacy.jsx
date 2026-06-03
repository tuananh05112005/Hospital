import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { Pill, CheckCircle, Clock } from 'lucide-react';

const Pharmacy = () => {
    const [prescriptions, setPrescriptions] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchPrescriptions = async () => {
        try {
            const res = await api.get('/clinical/pending'); // Wait, the route is /api/clinical/pending
            setPrescriptions(res.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPrescriptions();
        const interval = setInterval(fetchPrescriptions, 10000); // Auto refresh
        return () => clearInterval(interval);
    }, []);

    const handleDispense = async (id) => {
        if (window.confirm('Xác nhận xuất thuốc cho bệnh nhân này?')) {
            try {
                await api.post(`/clinical/${id}/dispense`);
                alert('Đã xuất thuốc và trừ kho thành công!');
                fetchPrescriptions();
            } catch (e) {
                alert('Lỗi xuất thuốc: ' + (e.response?.data?.message || e.message));
            }
        }
    };

    if (loading) return <div className="p-8 text-slate-500 font-medium">Đang tải danh sách chờ xuất thuốc...</div>;

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-800">Quầy Thuốc (Pharmacy)</h1>
                <p className="text-slate-500 text-sm mt-1">Quản lý xuất thuốc theo toa bác sĩ chỉ định</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {prescriptions.length === 0 && (
                    <div className="col-span-full p-12 bg-white rounded-2xl border border-slate-200 text-center flex flex-col items-center justify-center">
                        <Pill size={48} className="text-slate-300 mb-4" />
                        <h3 className="text-lg font-bold text-slate-600 mb-1">Chưa có toa thuốc nào chờ xuất</h3>
                        <p className="text-sm text-slate-500">Các toa thuốc mới từ phòng khám sẽ tự động hiện ở đây.</p>
                    </div>
                )}
                {prescriptions.map(presc => {
                    let meds = [];
                    try { meds = JSON.parse(presc.medications_json || '[]'); } catch(e){}
                    return (
                        <div key={presc.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-teal-500"></div>
                            
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider bg-emerald-50 px-2.5 py-1 rounded-full mb-2 inline-block">Toa #{presc.id}</span>
                                    <h3 className="text-lg font-bold text-slate-800">{presc.patient_name}</h3>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-slate-500 font-medium flex items-center justify-end gap-1"><Clock size={12}/> {new Date(presc.created_at).toLocaleTimeString('vi-VN')}</p>
                                    <p className="text-xs text-slate-400 mt-1">{new Date(presc.created_at).toLocaleDateString('vi-VN')}</p>
                                </div>
                            </div>

                            <div className="mb-4">
                                <p className="text-sm font-semibold text-slate-700 mb-1">Bác sĩ chỉ định:</p>
                                <p className="text-sm text-slate-600">{presc.doctor_name || 'Không rõ'}</p>
                            </div>

                            <div className="bg-slate-50 p-4 rounded-xl flex-1 mb-6">
                                <p className="text-xs font-bold text-slate-500 mb-2 uppercase">Danh sách thuốc xuất:</p>
                                <ul className="space-y-2">
                                    {meds.length === 0 && <li className="text-sm text-slate-500 italic">Không có thuốc</li>}
                                    {meds.map((m, i) => (
                                        <li key={i} className="flex justify-between text-sm border-b border-slate-200/50 pb-2 last:border-0 last:pb-0">
                                            <span className="font-semibold text-slate-700">{m.name}</span>
                                            <span className="font-bold text-slate-900 bg-white px-2 py-0.5 rounded shadow-sm border border-slate-100">SL: {m.quantity}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <button 
                                onClick={() => handleDispense(presc.id)}
                                className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 rounded-xl shadow-sm shadow-emerald-500/30 transition-colors flex justify-center items-center gap-2"
                            >
                                <CheckCircle size={20} /> Xuất Thuốc (Trừ kho)
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default Pharmacy;
