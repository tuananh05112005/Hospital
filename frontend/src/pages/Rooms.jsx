import React, { useState, useEffect, useContext } from 'react';
import api from '../api/axios';
import { useSocket } from '../context/SocketContext';
import { AuthContext } from '../context/AuthContext';
import { BedDouble, Users, PlusCircle, CheckCircle, Activity, DoorOpen, Trash2, Plus } from 'lucide-react';

const Rooms = () => {
  const { user } = useContext(AuthContext);
  const [rooms, setRooms] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const socket = useSocket();

  // Assign Bed State
  const [activeBed, setActiveBed] = useState(null);
  const [selectedPatient, setSelectedPatient] = useState('');

  // Create Room State
  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  const [roomForm, setRoomForm] = useState({ department: 'Khoa Ngoại', room_number: '', type: 'General' });

  // Create Bed State
  const [activeRoomId, setActiveRoomId] = useState(null);
  const [bedNumber, setBedNumber] = useState('');

  useEffect(() => {
    fetchData();

    if (socket) {
      socket.on('rooms_updated', () => {
        fetchData();
      });
    }

    return () => {
      if (socket) {
        socket.off('rooms_updated');
      }
    };
  }, [socket]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [roomRes, patientRes] = await Promise.all([
         api.get('/rooms'),
         api.get('/patients')
      ]);
      setRooms(roomRes.data);
      setPatients(patientRes.data);
    } catch (error) {
       console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRoom = async (e) => {
      e.preventDefault();
      try {
          await api.post('/rooms', roomForm);
          setIsRoomModalOpen(false);
          setRoomForm({ department: 'Khoa Ngoại', room_number: '', type: 'General' });
          fetchData();
      } catch (e) {
          alert('Lỗi tạo phòng: ' + e.message);
      }
  };

  const handleTransferICU = async (bedId, patientId) => {
      if(window.confirm('Chuyển bệnh nhân này sang phòng Hồi Sức (ICU)?')) {
          try {
              await api.post('/rooms/transfer-icu', { patient_id: patientId, from_bed_id: bedId });
              alert('Đã chuyển bệnh nhân sang ICU thành công!');
              fetchData();
          } catch (e) {
              alert('Lỗi: ' + (e.response?.data?.message || e.message));
          }
      }
  };

  const handleDeleteRoom = async (id) => {
      if(window.confirm('Xác nhận xóa phòng này?')) {
          try {
              await api.delete(`/rooms/${id}`);
              fetchData();
          } catch (e) {
              alert('Lỗi: ' + (e.response?.data?.message || e.message));
          }
      }
  };

  const handleCreateBed = async (e) => {
      e.preventDefault();
      try {
          await api.post(`/rooms/${activeRoomId}/beds`, { bed_number: bedNumber });
          setActiveRoomId(null);
          setBedNumber('');
          fetchData();
      } catch (e) {
          alert('Lỗi tạo giường: ' + e.message);
      }
  };

  const handleDeleteBed = async (id) => {
      if(window.confirm('Xác nhận xóa giường này?')) {
          try {
              await api.delete(`/rooms/beds/${id}`);
              fetchData();
          } catch (e) {
              alert('Lỗi: ' + (e.response?.data?.message || e.message));
          }
      }
  };

  const handleAssignSubmit = async (e) => {
      e.preventDefault();
      try {
          await api.post(`/rooms/beds/${activeBed.id}/assign`, { patient_id: selectedPatient });
          setActiveBed(null);
          setSelectedPatient('');
          fetchData();
      } catch (error) {
          alert("Lỗi cấp giường: " + error.response?.data?.message);
      }
  };

  const handleDischarge = async (bedId) => {
      if(window.confirm('Xác nhận bệnh nhân xuất viện / trả giường?')) {
          try {
              await api.post(`/rooms/beds/${bedId}/discharge`);
              fetchData();
          } catch (e) {}
      }
  };

  if(loading) return <div className="p-8 text-center text-slate-500">Đang đồng bộ Sơ đồ giường bệnh...</div>;

  return (
    <div>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Sơ Đồ Phòng & Giường Bệnh</h1>
          <p className="text-slate-500 text-sm mt-1">Điều phối bệnh nhân nội trú thời gian thực</p>
        </div>
        {user?.role === 'admin' && (
          <button onClick={() => setIsRoomModalOpen(true)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-bold shadow-sm hover:bg-indigo-700 flex items-center gap-2">
              <Plus size={18} /> Thêm Phòng Mới
          </button>
        )}
      </div>

      <div className="space-y-8">
         {rooms.map(room => (
            <div key={room.id} className="bg-white rounded-md shadow-sm border border-slate-200 overflow-hidden">
               <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex justify-between items-center">
                  <div className="flex items-center gap-3">
                     <div className={`p-2 rounded-lg ${room.type === 'ICU' ? 'bg-red-100 text-red-600' : room.type === 'Private' ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'}`}>
                        <DoorOpen size={24} />
                     </div>
                     <div>
                        <h2 className="text-lg font-bold text-slate-800">{room.room_number}</h2>
                        <p className="text-xs font-semibold text-slate-500 uppercase">{room.department} • {room.type}</p>
                     </div>
                  </div>
                  <div className="flex items-center gap-3">
                     <div className="text-sm font-semibold text-slate-600 mr-4">
                        Trạng thái: <span className={room.status === 'full' ? 'text-red-500' : 'text-green-500'}>{room.status === 'full' ? 'Hết chỗ' : 'Còn trống'}</span>
                     </div>
                     {user?.role === 'admin' && (
                       <button onClick={() => handleDeleteRoom(room.id)} className="text-red-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-colors" title="Xóa phòng">
                          <Trash2 size={18} />
                       </button>
                     )}
                  </div>
               </div>
               
               <div className="p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  {room.beds.map(bed => (
                     <div key={bed.id} className={`relative p-4 rounded-xl border-2 transition-all ${bed.status === 'occupied' ? 'bg-indigo-50 border-indigo-200 shadow-inner' : 'bg-white border-slate-100 hover:border-slate-300 shadow-sm'}`}>
                        <div className="flex justify-between items-start mb-4">
                           <div className={`p-1.5 rounded-md ${bed.status === 'occupied' ? 'bg-indigo-200 text-indigo-700' : 'bg-slate-100 text-slate-400'}`}>
                              <BedDouble size={20} />
                           </div>
                           <span className={`text-xs font-bold uppercase tracking-wider px-2 py-1 rounded-full ${bed.status === 'occupied' ? 'bg-indigo-100 text-indigo-600' : 'bg-green-100 text-green-600'}`}>
                              {bed.bed_number}
                           </span>
                           {bed.status !== 'occupied' && user?.role === 'admin' && (
                              <button onClick={() => handleDeleteBed(bed.id)} className="text-slate-300 hover:text-red-500 transition-colors absolute top-2 right-2">
                                  <Trash2 size={14} />
                              </button>
                           )}
                        </div>
                        
                        {bed.status === 'occupied' ? (
                           <div>
                              <p className="text-sm font-black text-slate-800 truncate" title={bed.patient_name}>{bed.patient_name}</p>
                              <p className="text-xs font-medium text-slate-500 mt-1 flex items-center gap-1"><Activity size={12}/> Đang Điều Trị</p>
                              <div className="mt-4 border-t border-indigo-100 pt-3 flex gap-2">
                                 <button onClick={() => handleDischarge(bed.id)} className="w-full py-1.5 bg-white text-indigo-600 border border-indigo-200 hover:bg-indigo-50 text-xs font-bold rounded-lg transition-colors">Xuất Viện</button>
                                 {room.type === 'Operating' && (
                                     <button onClick={() => handleTransferICU(bed.id, bed.patient_id)} className="w-full py-1.5 bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 text-xs font-bold rounded-lg transition-colors">Chuyển ICU</button>
                                 )}
                              </div>
                           </div>
                        ) : (
                           <div className="flex flex-col items-center justify-center h-20">
                              <p className="text-sm font-semibold text-slate-400 mb-2">Trống</p>
                              <button onClick={() => setActiveBed(bed)} className="flex items-center gap-1 px-3 py-1.5 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 rounded-lg text-xs font-bold transition-colors">
                                 <PlusCircle size={14} /> Điền Bệnh Nhân
                              </button>
                           </div>
                        )}
                     </div>
                  ))}
                   {/* Add Bed Button */}
                   {user?.role === 'admin' && (
                     <div onClick={() => setActiveRoomId(room.id)} className="relative p-4 rounded-xl border-2 border-dashed border-slate-300 hover:border-indigo-400 hover:bg-indigo-50/50 cursor-pointer flex flex-col items-center justify-center h-full min-h-[140px] transition-all group">
                          <PlusCircle size={32} className="text-slate-400 group-hover:text-indigo-500 mb-2 transition-colors" />
                          <span className="text-sm font-bold text-slate-500 group-hover:text-indigo-600 transition-colors">Thêm Giường</span>
                      </div>
                   )}
               </div>
            </div>
         ))}
      </div>

      {/* Modal Cấp Giường */}
      {activeBed && (
         <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animation-fade-in">
            <div className="bg-white rounded-md shadow-sm w-full max-w-sm overflow-hidden">
               <div className="px-6 py-4 border-b border-slate-200 bg-emerald-50">
                  <h3 className="text-lg font-bold text-emerald-900 flex items-center gap-2"><CheckCircle size={20}/> Cấp Giường Điều Trị</h3>
               </div>
               <form onSubmit={handleAssignSubmit} className="p-6">
                  <p className="text-sm text-slate-600 mb-4">Bạn đang cấp <strong>{activeBed.bed_number}</strong> cho bệnh nhân. Nếu bệnh nhân đang có giường cũ, hệ thống sẽ tự động chuyển giường mới.</p>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">Chọn Bệnh Nhân (Nội Trú) <span className="text-red-500">*</span></label>
                  <select required value={selectedPatient} onChange={e => setSelectedPatient(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500 outline-none mb-6">
                     <option value="">-- Chọn danh sách --</option>
                     {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                  </select>
                  <div className="flex justify-end gap-3">
                     <button type="button" onClick={() => setActiveBed(null)} className="px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl font-medium transition-colors">Hủy</button>
                     <button type="submit" className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium shadow-sm shadow-emerald-600/30 transition-colors">Xác Nhận</button>
                  </div>
               </form>
            </div>
         </div>
      )}

      {/* Modal Tạo Phòng Mới */}
      {isRoomModalOpen && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animation-fade-in">
             <div className="bg-white rounded-md shadow-sm w-full max-w-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 bg-indigo-50">
                   <h3 className="text-lg font-bold text-indigo-900">Thêm Phòng Bệnh Mới</h3>
                </div>
                <form onSubmit={handleCreateRoom} className="p-6 space-y-4">
                   <div>
                       <label className="block text-sm font-semibold text-slate-700 mb-1">Khoa / Ban</label>
                       <input required value={roomForm.department} onChange={e => setRoomForm({...roomForm, department: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="VD: Khoa Ngoại" />
                   </div>
                   <div>
                       <label className="block text-sm font-semibold text-slate-700 mb-1">Tên / Số Phòng</label>
                       <input required value={roomForm.room_number} onChange={e => setRoomForm({...roomForm, room_number: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="VD: P-101" />
                   </div>
                   <div>
                       <label className="block text-sm font-semibold text-slate-700 mb-1">Loại Phòng</label>
                       <select value={roomForm.type} onChange={e => setRoomForm({...roomForm, type: e.target.value})} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none">
                           <option value="General">Thường (General)</option>
                           <option value="Private">Dịch Vụ (Private)</option>
                           <option value="ICU">Hồi Sức Cấp Cứu (ICU)</option>
                           <option value="Operating">Phòng Mổ (Operating)</option>
                       </select>
                   </div>
                   <div className="flex justify-end gap-3 pt-4">
                      <button type="button" onClick={() => setIsRoomModalOpen(false)} className="px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl font-medium transition-colors">Hủy</button>
                      <button type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium shadow-sm transition-colors">Tạo Phòng</button>
                   </div>
                </form>
             </div>
          </div>
       )}

       {/* Modal Tạo Giường Mới */}
       {activeRoomId && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-center justify-center p-4 animation-fade-in">
             <div className="bg-white rounded-md shadow-sm w-full max-w-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-200 bg-indigo-50">
                   <h3 className="text-lg font-bold text-indigo-900">Thêm Giường Mới</h3>
                </div>
                <form onSubmit={handleCreateBed} className="p-6 space-y-4">
                   <div>
                       <label className="block text-sm font-semibold text-slate-700 mb-1">Tên / Số Giường</label>
                       <input required autoFocus value={bedNumber} onChange={e => setBedNumber(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="VD: Giường 1" />
                   </div>
                   <div className="flex justify-end gap-3 pt-4">
                      <button type="button" onClick={() => setActiveRoomId(null)} className="px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl font-medium transition-colors">Hủy</button>
                      <button type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium shadow-sm transition-colors">Tạo Giường</button>
                   </div>
                </form>
             </div>
          </div>
       )}
    </div>
  );
};

export default Rooms;
