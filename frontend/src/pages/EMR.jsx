import React, { useState, useEffect } from 'react';
import api from '../api/axios';
import { FileText, Calendar, Pill, TestTube, Activity, User, CreditCard } from 'lucide-react';

const EMR = () => {
    const [patients, setPatients] = useState([]);
    const [selectedPatientId, setSelectedPatientId] = useState('');
    const [emrData, setEmrData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [fetchLoading, setFetchLoading] = useState(false);

    useEffect(() => {
        const fetchPatients = async () => {
            try {
                const res = await api.get('/patients');
                setPatients(res.data);
            } catch (e) {
                console.error(e);
            } finally {
                setLoading(false);
            }
        };
        fetchPatients();
    }, []);

    const fetchEMR = async (id) => {
        if (!id) return setEmrData(null);
        setFetchLoading(true);
        try {
            const res = await api.get(`/emr/${id}`);
            setEmrData(res.data);
        } catch (e) {
            console.error(e);
        } finally {
            setFetchLoading(false);
        }
    };

    const handleSelectPatient = (e) => {
        const id = e.target.value;
        setSelectedPatientId(id);
        fetchEMR(id);
    };

    if (loading) return <div className="p-8 text-center text-slate-500">Đang quét kho dữ liệu Bệnh án...</div>;

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-800">Hồ Sơ Bệnh Án Điện Tử (EMR)</h1>
                <p className="text-slate-500 text-sm mt-1">Truy xuất lịch sử Y tế và Xét nghiệm xuyên thời gian</p>
            </div>

            <div className="bg-white p-6 rounded-md shadow-sm border border-slate-200 mb-8 max-w-xl">
                <label className="block text-sm font-semibold text-slate-700 mb-2">Tra cứu theo Bệnh nhân</label>
                <select value={selectedPatientId} onChange={handleSelectPatient} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-medium">
                    <option value="">-- Lựa chọn Bệnh Nhân --</option>
                    {patients.map(p => <option key={p.id} value={p.id}>{p.name} - {p.phone}</option>)}
                </select>
            </div>

            {fetchLoading && <div className="text-center py-8 text-indigo-500 font-bold animate-pulse">Triệu hồi Dữ liệu EMR...</div>}

            {emrData && !fetchLoading && (
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    {/* CỘT TRÁI: THÔNG TIN HÀNH CHÍNH */}
                    <div className="lg:col-span-1">
                        <div className="bg-white p-6 rounded-md shadow-sm border border-slate-200 sticky top-6">
                            <div className="w-20 h-20 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <User size={40} />
                            </div>
                            <h2 className="text-xl font-bold text-slate-800 text-center mb-1">{emrData.patient.name}</h2>
                            <p className="text-sm font-semibold text-slate-500 text-center uppercase mb-6">Mã BA: EMR-{emrData.patient.id}</p>
                            
                            <div className="space-y-4 text-sm">
                                <div className="flex justify-between border-b border-slate-100 pb-2">
                                    <span className="text-slate-500">Giới tính</span>
                                    <span className="font-bold text-slate-800 capitalize">{emrData.patient.gender}</span>
                                </div>
                                <div className="flex justify-between border-b border-slate-100 pb-2">
                                    <span className="text-slate-500">Tuổi (DOB)</span>
                                    <span className="font-bold text-slate-800">{new Date(emrData.patient.dob).toLocaleDateString()}</span>
                                </div>
                                <div className="flex justify-between border-b border-slate-100 pb-2">
                                    <span className="text-slate-500">Liên hệ</span>
                                    <span className="font-bold text-slate-800">{emrData.patient.phone}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* CỘT PHẢI: DÒNG THỜI GIAN LÂM SÀNG */}
                    <div className="lg:col-span-3 space-y-6">
                        
                        <div className="bg-white p-6 rounded-md shadow-sm border border-slate-200">
                           <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2"><Calendar className="text-blue-500"/> Lịch sử Khám Bệnh ({emrData.timeline.appointments.length})</h3>
                           <div className="space-y-4">
                               {emrData.timeline.appointments.length === 0 && <p className="text-slate-500 italic text-sm">Chưa có dữ liệu</p>}
                               {emrData.timeline.appointments.map(app => (
                                   <div key={app.id} className="p-4 rounded-xl border border-blue-100 bg-blue-50/50 flex flex-col md:flex-row justify-between gap-4">
                                       <div>
                                           <p className="font-bold text-slate-800">Khám {app.specialization}</p>
                                           <p className="text-sm text-slate-600 mt-1">Lý do: {app.reason}</p>
                                           <div className="flex items-center gap-2 mt-2">
                                              <span className={`px-2 py-0.5 rounded text-xs font-bold ${app.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>{app.status}</span>
                                           </div>
                                       </div>
                                       <div className="text-right">
                                           <p className="font-bold text-blue-600">{new Date(app.appointment_date).toLocaleDateString('vi-VN')}</p>
                                           <p className="text-xs text-slate-500 mt-1">BS. {app.doctor_name}</p>
                                       </div>
                                   </div>
                               ))}
                           </div>
                        </div>

                        <div className="bg-white p-6 rounded-md shadow-sm border border-slate-200">
                           <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2"><TestTube className="text-amber-500"/> Hồ sơ Cận Lâm Sàng & Xét nghiệm ({emrData.timeline.labs.length})</h3>
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                               {emrData.timeline.labs.length === 0 && <p className="text-slate-500 italic text-sm">Chưa có dữ liệu xét nghiệm</p>}
                               {emrData.timeline.labs.map(lab => (
                                   <div key={lab.id} className="p-4 rounded-xl border border-amber-100 bg-amber-50 relative overflow-hidden group">
                                       <div className="absolute right-[-10px] top-[-10px] opacity-10 group-hover:scale-110 transition-transform">
                                          <Activity size={80} />
                                       </div>
                                       <p className="font-bold text-amber-900 relative z-10">{lab.test_type}</p>
                                       {lab.status === 'completed' ? (
                                           <div className="mt-2 relative z-10">
                                              <p className="text-sm font-semibold text-slate-700">K/Q: {lab.results_details}</p>
                                              {lab.results_url && <a href={lab.results_url} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline mt-1 block">Xem file đính kèm</a>}
                                           </div>
                                       ) : (
                                           <p className="text-xs font-bold text-amber-600 mt-2 relative z-10">Đang chờ kết quả...</p>
                                       )}
                                       <p className="text-xs text-slate-400 mt-3 relative z-10">{new Date(lab.created_at).toLocaleDateString()}</p>
                                   </div>
                               ))}
                           </div>
                        </div>

                        <div className="bg-white p-6 rounded-md shadow-sm border border-slate-200">
                           <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2"><Pill className="text-purple-500"/> Đơn thuốc & Viện phí ({emrData.timeline.prescriptions.length})</h3>
                           <div className="space-y-4">
                               {emrData.timeline.prescriptions.length === 0 && <p className="text-slate-500 italic text-sm">Chưa có dữ liệu đơn thuốc</p>}
                               {emrData.timeline.prescriptions.map(presc => {
                                   let meds = [];
                                   try { meds = JSON.parse(presc.medications_json || '[]'); } catch(e){}
                                   return (
                                   <div key={presc.id} className="p-4 rounded-xl border border-purple-100 bg-purple-50/30">
                                       <div className="flex justify-between items-start mb-3">
                                           <div>
                                              <p className="font-bold text-purple-900">Toa thuốc #{presc.id}</p>
                                              <p className="text-xs text-slate-500 mt-1">{new Date(presc.created_at).toLocaleString('vi-VN')}</p>
                                           </div>
                                           {presc.total_amount && (
                                              <span className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-emerald-600 font-bold text-sm tracking-wide">
                                                  {parseInt(presc.total_amount).toLocaleString('vi-VN')} ₫
                                              </span>
                                           )}
                                       </div>
                                       <p className="text-sm text-slate-700 mb-3 bg-white p-2 rounded-lg border border-slate-100 font-semibold italic">"{presc.notes}"</p>
                                       <div className="flex flex-wrap gap-2">
                                           {meds.map((m, i) => (
                                              <span key={i} className="px-2.5 py-1 bg-purple-100 text-purple-700 font-semibold text-xs rounded-full">
                                                  {m.name} x{m.quantity}
                                              </span>
                                           ))}
                                       </div>
                                   </div>
                               )})}
                           </div>
                        </div>

                    </div>
                </div>
            )}
        </div>
    );
};

export default EMR;
