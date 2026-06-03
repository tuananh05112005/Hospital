import React, { useState, useEffect, useContext } from 'react';
import api from '../api/axios';
import { AuthContext } from '../context/AuthContext';
import { TestTube, FileSearch, CheckCircle, Clock, UploadCloud, Sparkles } from 'lucide-react';

const Lab = () => {
    const { user } = useContext(AuthContext);
    const [requests, setRequests] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [resultData, setResultData] = useState({ results_details: '', results_url: '' });
    const [isAILoading, setIsAILoading] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const res = await api.get('/labs');
            setRequests(res.data);
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateResult = async (e) => {
        e.preventDefault();
        try {
            await api.put(`/labs/${selectedRequest.id}/result`, resultData);
            setSelectedRequest(null);
            fetchData();
            alert('Đã tải lên Kết quả Cận Lâm Sàng!');
        } catch (e) {
            alert('Lỗi: ' + e.message);
        }
    };

    const handleAIGenerate = async () => {
        setIsAILoading(true);
        try {
            const res = await api.post('/labs/ai-result', { 
                test_type: selectedRequest.test_type, 
                appointment_id: selectedRequest.appointment_id,
                patient_id: selectedRequest.patient_id
            });
            setResultData({...resultData, results_details: res.data.result});
        } catch (e) {
            alert('Lỗi kết nối AI: ' + e.message);
        } finally {
            setIsAILoading(false);
        }
    };

    if (loading) return <div className="p-8 text-center text-slate-500">Đang quét máy chủ Lab...</div>;

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-2xl font-bold text-slate-800">Trung Tâm Cận Lâm Sàng (Lab & Imaging)</h1>
                <p className="text-slate-500 text-sm mt-1">Quản lý và trả kết quả Xét nghiệm Máu, Siêu âm, X-Quang MRI</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Danh sách Chỉ định */}
                <div className="lg:col-span-2 space-y-4">
                    {requests.length === 0 ? (
                        <div className="bg-white p-8 rounded-md border border-slate-200 text-center text-slate-500">
                            Chưa có chỉ định xét nghiệm nào
                        </div>
                    ) : (
                        requests.map(req => (
                            <div key={req.id} className="bg-white p-5 rounded-md border border-slate-200 shadow-sm flex flex-col sm:flex-row justify-between sm:items-center gap-4 hover:shadow-sm transition-shadow">
                                <div className="flex items-start gap-4">
                                    <div className={`p-3 rounded-xl mt-1 ${req.status === 'completed' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                                        <TestTube size={24} />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-slate-800">{req.test_type}</h3>
                                        <p className="text-sm font-semibold text-slate-600">Bệnh nhân: <span className="text-indigo-600">{req.patient_name}</span></p>
                                        <p className="text-xs text-slate-500 mt-1">Bác sĩ chỉ định: BS. {req.doctor_name} • {new Date(req.created_at).toLocaleString('vi-VN')}</p>
                                    </div>
                                </div>
                                <div className="flex flex-col sm:items-end gap-2 shrink-0">
                                    {req.status === 'completed' ? (
                                        <span className="px-3 py-1 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-lg flex items-center gap-1 border border-emerald-200">
                                            <CheckCircle size={14} /> Đã Trả Kết Quả
                                        </span>
                                    ) : (
                                        <span className="px-3 py-1 bg-amber-50 text-amber-700 text-xs font-bold rounded-lg flex items-center gap-1 border border-amber-200">
                                            <Clock size={14} /> Chờ Lấy Mẫu
                                        </span>
                                    )}
                                    <button 
                                        onClick={() => { setSelectedRequest(req); setResultData({ results_details: req.results_details || '', results_url: req.results_url || '' }); }}
                                        className={`px-4 py-1.5 text-xs font-bold rounded-lg transition-colors ${req.status === 'completed' ? 'bg-slate-100 text-slate-600 hover:bg-slate-200' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm'}`}
                                    >
                                        {req.status === 'completed' ? 'Xem Kết Quả' : 'Nhập Kết Quả Nhanh'}
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Khung Chi tiết Result */}
                <div>
                    {!selectedRequest ? (
                        <div className="bg-slate-50 rounded-md border border-slate-200/60 p-8 flex flex-col items-center justify-center text-center h-full min-h-[300px] border-dashed">
                            <FileSearch size={48} className="text-slate-300 mb-4" />
                            <p className="text-slate-500 font-semibold">Chọn một Phiếu Chỉ định bên trái để thao tác</p>
                        </div>
                    ) : (
                        <div className="bg-white rounded-md shadow-sm border border-indigo-100 overflow-hidden sticky top-6">
                            <div className="bg-indigo-50 px-6 py-4 border-b border-indigo-100 flex justify-between items-center">
                                <h3 className="font-bold text-indigo-900">Chi Tiết Phiếu Lab</h3>
                                <button onClick={() => setSelectedRequest(null)} className="text-slate-400 hover:text-slate-600">&times;</button>
                            </div>
                            <div className="p-6">
                                <div className="mb-6 p-4 bg-slate-50 rounded-xl border border-slate-100">
                                    <h4 className="text-sm font-bold text-slate-800 mb-1">{selectedRequest.test_type}</h4>
                                    <p className="text-xs font-medium text-slate-500">Người bệnh: {selectedRequest.patient_name}</p>
                                </div>

                                <form onSubmit={handleUpdateResult} className="space-y-4">
                                    <div>
                                        <div className="flex justify-between items-center mb-2">
                                            <label className="block text-sm font-semibold text-slate-700">Chỉ số đo đạc / Kết luận <span className="text-red-500">*</span></label>
                                            <button 
                                                type="button" 
                                                onClick={handleAIGenerate} 
                                                disabled={isAILoading || selectedRequest.status === 'completed'} 
                                                className="text-xs bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white font-bold py-1.5 px-3 rounded-lg shadow-sm flex items-center gap-1 disabled:opacity-50 transition-all"
                                            >
                                                {isAILoading ? 'Đang phân tích...' : <><Sparkles size={14}/> AI Mô Phỏng Bệnh Lý</>}
                                            </button>
                                        </div>
                                        <textarea required disabled={selectedRequest.status === 'completed' && false} rows="4" value={resultData.results_details} onChange={e => setResultData({...resultData, results_details: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none resize-none" placeholder="Ví dụ: Hồng cầu 4.5 T/L, âm tính..."></textarea>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-slate-700 mb-2">Link Ảnh chụp Đính kèm (X-Quang, MRI)</label>
                                        <div className="relative">
                                            <UploadCloud size={16} className="absolute left-3 top-3 text-slate-400" />
                                            <input disabled={selectedRequest.status === 'completed' && false} type="text" value={resultData.results_url} onChange={e => setResultData({...resultData, results_url: e.target.value})} className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm" placeholder="URL hình ảnh (Mock)" />
                                        </div>
                                    </div>
                                    {selectedRequest.results_url && (
                                        <div className="mt-2 rounded-xl border border-slate-200 overflow-hidden">
                                           <img src={selectedRequest.results_url} alt="Chụp chiếu" className="w-full h-32 object-cover object-top" onError={(e) => e.target.style.display='none'} />
                                        </div>
                                    )}

                                    <div className="pt-4 border-t border-slate-100">
                                         <button type="submit" className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-sm shadow-indigo-600/30 transition-colors">
                                            Lưu Hồ Sơ Lab
                                         </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Lab;
