import React, { useState, useEffect, useContext } from 'react';
import api from '../api/axios';
import { AuthContext } from '../context/AuthContext';
import { Package, AlertTriangle, ArrowDownToLine, CheckCircle, Bot, Sparkles } from 'lucide-react';

const Inventory = () => {
  const { user } = useContext(AuthContext);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Add Stock State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAILoading, setIsAILoading] = useState(false);
  const [formData, setFormData] = useState({
     item_name: '', category: 'medicine', quantity: 0, unit: 'viên', unit_price: 0, low_stock_threshold: 10
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/inventory');
      setItems(res.data);
    } catch (error) {
       console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const seedInventory = async () => {
      try {
          await api.post('/inventory/seed');
          fetchData();
      } catch (e) {
          alert('Chỉ Admin mới có quyền khởi tạo Dữ liệu Kho');
      }
  };

  const handleSubmit = async (e) => {
      e.preventDefault();
      try {
          await api.post('/inventory/add', formData);
          setIsModalOpen(false);
          fetchData();
          alert("Nhập kho thành công!");
      } catch (error) {
          alert("Lỗi nhập kho: " + error.response?.data?.message);
      }
  };

  const handleAISuggest = async () => {
      if (!formData.item_name) return alert("Vui lòng gõ 1 vài từ khóa (tên thuốc một phần hoặc bệnh lý) để AI đoán!");
      setIsAILoading(true);
      try {
          const res = await api.post('/inventory/ai-suggest', { keyword: formData.item_name });
          const suggestion = res.data.result;
          if (suggestion) {
              setFormData({
                  ...formData,
                  item_name: suggestion.item_name || formData.item_name,
                  category: suggestion.category || 'medicine',
                  unit: suggestion.unit || 'viên',
                  unit_price: suggestion.unit_price || 0
              });
          }
      } catch (error) {
          console.error(error);
      } finally {
          setIsAILoading(false);
      }
  };

  if(loading) return <div className="p-8 text-center text-slate-500">Đang quét kho dữ liệu...</div>;

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Kho Dược & Vật Tư Trực Tuyến</h1>
          <p className="text-slate-500 text-sm mt-1">Hệ thống Logistic Cảnh báo thông minh (Smart Alert)</p>
        </div>
        <div className="flex gap-2">
            {(user?.role === 'admin' && items.length === 0) && (
            <button onClick={seedInventory} className="px-4 py-2 bg-slate-800 text-white rounded-lg font-bold shadow-sm hover:bg-slate-900">Nạp Dữ Liệu Gốc</button>
            )}
            {(user?.role === 'admin' || user?.role === 'receptionist') && (
            <button onClick={() => setIsModalOpen(true)} className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-bold shadow-sm shadow-emerald-500/30 hover:bg-emerald-700 flex items-center gap-2">
                <ArrowDownToLine size={18} /> Nhập Kho
            </button>
            )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
         <div className="bg-white p-6 rounded-md border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-blue-100 text-blue-600 rounded-xl"><Package size={28}/></div>
            <div>
               <p className="text-sm font-semibold text-slate-500">Tổng Danh Mục</p>
               <p className="text-2xl font-black text-slate-800">{items.length} Mã</p>
            </div>
         </div>
         <div className="bg-white p-6 rounded-md border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-red-100 text-red-600 rounded-xl"><AlertTriangle size={28}/></div>
            <div>
               <p className="text-sm font-semibold text-slate-500">Cảnh Báo Hết Hàng</p>
               <p className="text-2xl font-black text-red-600">{items.filter(i => i.quantity <= i.low_stock_threshold).length}</p>
            </div>
         </div>
         <div className="bg-white p-6 rounded-md border border-slate-200 shadow-sm flex items-center gap-4">
            <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl"><CheckCircle size={28}/></div>
            <div>
               <p className="text-sm font-semibold text-slate-500">Trạng Thái Kho</p>
               <p className="text-2xl font-black text-emerald-600">Ổn Định</p>
            </div>
         </div>
      </div>

      <div className="bg-white rounded-md shadow-sm border border-slate-200 overflow-hidden">
         <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
               <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider">
                  <th className="p-4 font-bold">Mã / Tên Phẩm</th>
                  <th className="p-4 font-bold">Phân Loại</th>
                  <th className="p-4 font-bold text-center">Tồn Kho</th>
                  <th className="p-4 font-bold">Đơn Giá</th>
                  <th className="p-4 font-bold">Cập Nhật Lần Cuối</th>
                </tr>
              </thead>
              <tbody>
                  {items.map(it => {
                      const isLow = it.quantity <= it.low_stock_threshold;
                      return (
                      <tr key={it.id} className={`border-b border-slate-100 transition-colors ${isLow ? 'bg-red-50 hover:bg-red-100' : 'hover:bg-slate-50'}`}>
                         <td className="p-4">
                             <div className="font-bold text-slate-800 flex items-center gap-2">
                                 {isLow && <AlertTriangle size={16} className="text-red-500 stroke-2" />}
                                 {it.item_name}
                             </div>
                             <div className="text-xs text-slate-500 mt-1">Ngưỡng báo động: {it.low_stock_threshold} {it.unit}</div>
                         </td>
                         <td className="p-4">
                             <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-md text-xs font-bold uppercase">{it.category}</span>
                         </td>
                         <td className="p-4 text-center">
                             <span className={`text-lg font-black ${isLow ? 'text-red-600' : 'text-slate-800'}`}>{it.quantity}</span>
                             <span className="text-sm font-medium text-slate-500 ml-1">{it.unit}</span>
                         </td>
                         <td className="p-4 font-bold text-emerald-600">{parseInt(it.unit_price).toLocaleString('vi-VN')} ₫</td>
                         <td className="p-4 text-sm font-medium text-slate-500">{new Date(it.last_restocked).toLocaleString('vi-VN')}</td>
                      </tr>
                  )})}
              </tbody>
            </table>
         </div>
      </div>

       {/* Modal Nhập Kho */}
      {isModalOpen && (
         <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-md shadow-sm w-full max-w-lg overflow-hidden">
               <div className="px-6 py-4 border-b border-slate-200 bg-emerald-50">
                  <h3 className="text-lg font-bold text-emerald-900 flex items-center gap-2"><ArrowDownToLine size={20}/> Khai Báo Phiếu Nhập Kho</h3>
               </div>
               <form onSubmit={handleSubmit} className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Tra Cứu Thông Minh AI / Tên Vật Tư <span className="text-red-500">*</span></label>
                    <div className="flex gap-2">
                        <input required type="text" value={formData.item_name} onChange={e => setFormData({...formData, item_name: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" placeholder="VD: Thuốc dạ dày / Aspirin" />
                        <button type="button" onClick={handleAISuggest} disabled={isAILoading} className="shrink-0 px-4 py-2 bg-gradient-to-r from-purple-500 to-indigo-500 text-white rounded-lg font-bold shadow-sm hover:opacity-90 flex items-center gap-1 disabled:opacity-50">
                            {isAILoading ? <span className="animate-spin text-xl">✨</span> : <Sparkles size={18}/>} Gợi ý AI
                        </button>
                    </div>
                    <p className="text-xs text-slate-500 mt-2">Tính năng AI: Gõ từ khóa bệnh lý (VD: mỏi mắt, dạ dày) rồi bấm "Gợi ý AI" để điền tự động dữ liệu y khoa chuẩn xác.</p>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Phân Loại</label>
                        <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none">
                            <option value="medicine">Thuốc (Medicine)</option>
                            <option value="equipment">Thiết bị (Equipment)</option>
                            <option value="supply">Vật tư (Supply)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Đơn vị đo</label>
                        <input type="text" value={formData.unit} onChange={e => setFormData({...formData, unit: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" />
                      </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Slg Nhập <span className="text-red-500">*</span></label>
                        <input required type="number" min="1" value={formData.quantity} onChange={e => setFormData({...formData, quantity: parseInt(e.target.value)})} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Báo Động Đỏ</label>
                        <input type="number" min="0" value={formData.low_stock_threshold} onChange={e => setFormData({...formData, low_stock_threshold: parseInt(e.target.value)})} title="Ngưỡng cảnh báo hết hàng" className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Đơn Giá</label>
                        <input type="number" min="0" value={formData.unit_price} onChange={e => setFormData({...formData, unit_price: parseInt(e.target.value)})} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none" />
                      </div>
                  </div>
                  <div className="flex justify-end gap-3 pt-4">
                     <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl font-medium transition-colors">Hủy</button>
                     <button type="submit" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium shadow-sm shadow-emerald-600/30 transition-colors">Lưu Phiếu Nhập</button>
                  </div>
               </form>
            </div>
         </div>
      )}
    </div>
  );
};

export default Inventory;
