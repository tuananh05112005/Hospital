const bedService = require('../services/bedService');
const catchAsync = require('../utils/catchAsync');
const db = require('../config/db');
const { getIo } = require('../socket');

exports.getRoomsWithBeds = catchAsync(async (req, res) => {
    const roomsData = await bedService.getRoomsWithBeds();
    res.json(roomsData);
});

exports.assignBed = catchAsync(async (req, res) => {
    await bedService.assignBed(req.params.bed_id, req.body.patient_id);
    try { getIo().emit('rooms_updated'); } catch(e) {}
    res.json({ message: 'Đã phân bổ giường bệnh thành công' });
});

exports.dischargeBed = catchAsync(async (req, res) => {
    await bedService.dischargeBed(req.params.bed_id);
    try { getIo().emit('rooms_updated'); } catch(e) {}
    res.json({ message: 'Đã trả giường, hoàn tất nội trú' });
});

exports.createRoom = catchAsync(async (req, res) => {
    const { department, room_number, type } = req.body;
    const [result] = await db.execute('INSERT INTO rooms (department, room_number, type) VALUES (?, ?, ?)', [department, room_number, type || 'General']);
    try { getIo().emit('rooms_updated'); } catch(e) {}
    res.status(201).json({ message: 'Tạo phòng thành công', id: result.insertId });
});

exports.deleteRoom = catchAsync(async (req, res) => {
    // MySQL ON DELETE CASCADE should handle beds if configured, else manual check
    const [beds] = await db.execute('SELECT id FROM beds WHERE room_id = ? AND status = "occupied"', [req.params.id]);
    if (beds.length > 0) return res.status(400).json({ message: 'Không thể xóa phòng đang có bệnh nhân' });
    
    await db.execute('DELETE FROM rooms WHERE id = ?', [req.params.id]);
    try { getIo().emit('rooms_updated'); } catch(e) {}
    res.json({ message: 'Đã xóa phòng' });
});

exports.createBed = catchAsync(async (req, res) => {
    const { bed_number } = req.body;
    const [result] = await db.execute('INSERT INTO beds (room_id, bed_number) VALUES (?, ?)', [req.params.id, bed_number]);
    try { getIo().emit('rooms_updated'); } catch(e) {}
    res.status(201).json({ message: 'Thêm giường thành công', id: result.insertId });
});

exports.deleteBed = catchAsync(async (req, res) => {
    const [beds] = await db.execute('SELECT status FROM beds WHERE id = ?', [req.params.bed_id]);
    if (beds.length === 0) return res.status(404).json({ message: 'Không tìm thấy giường' });
    if (beds[0].status === 'occupied') return res.status(400).json({ message: 'Không thể xóa giường đang có bệnh nhân' });
    
    await db.execute('DELETE FROM beds WHERE id = ?', [req.params.bed_id]);
    try { getIo().emit('rooms_updated'); } catch(e) {}
    res.json({ message: 'Đã xóa giường' });
});

// -- EMERGENCY WORKFLOW --
exports.transferToSurgery = catchAsync(async (req, res) => {
    const { visit_id, patient_id } = req.body;
    
    // Tìm 1 giường trống trong phòng Phẫu thuật (Operating)
    const [beds] = await db.execute(`
        SELECT b.id FROM beds b
        JOIN rooms r ON b.room_id = r.id
        WHERE r.type = 'Operating' AND b.status = 'available'
        LIMIT 1
    `);
    
    if (beds.length === 0) {
        return res.status(400).json({ message: 'Phòng Phẫu Thuật hiện đã kín chỗ. Không thể chuyển!' });
    }
    
    const bedId = beds[0].id;
    await bedService.assignBed(bedId, patient_id);
    
    // Đánh dấu luồng khám là admitted
    await db.execute('UPDATE visits SET status = "admitted" WHERE id = ?', [visit_id]);
    
    try { getIo().emit('rooms_updated'); getIo().emit('queue_updated'); } catch(e) {}
    
    res.json({ message: 'Đã chuyển bệnh nhân thẳng vào Phòng Phẫu Thuật', bed_id: bedId });
});

exports.transferToICU = catchAsync(async (req, res) => {
    const { patient_id, from_bed_id } = req.body;
    
    // Tìm 1 giường trống trong phòng Hồi Sức (ICU)
    const [beds] = await db.execute(`
        SELECT b.id FROM beds b
        JOIN rooms r ON b.room_id = r.id
        WHERE r.type = 'ICU' AND b.status = 'available'
        LIMIT 1
    `);
    
    if (beds.length === 0) {
        return res.status(400).json({ message: 'Phòng Hồi Sức (ICU) hiện đã kín chỗ. Không thể chuyển!' });
    }
    
    const icuBedId = beds[0].id;
    
    // Gán giường mới
    await bedService.assignBed(icuBedId, patient_id);
    
    // Trả giường mổ cũ
    await bedService.dischargeBed(from_bed_id);
    
    try { getIo().emit('rooms_updated'); } catch(e) {}
    
    res.json({ message: 'Ca phẫu thuật thành công. Bệnh nhân đã được chuyển qua phòng Hồi Sức (ICU).' });
});

exports.generateDemoData = catchAsync(async (req, res) => {
    const [existing] = await db.execute('SELECT COUNT(*) as c FROM rooms');
    if (existing[0].c > 0) return res.json({ message: 'Dữ liệu Phòng bệnh đã tồn tại.' });

    // Create rooms
    const roomsToInsert = [
        ['Khoa Ngoại', 'P-101', 'General'],
        ['Khoa Phẫu Thuật', 'Phòng Mổ 1', 'Operating'],
        ['Hồi sức Cấp cứu', 'P-ICU 1', 'ICU'],
        ['Dịch vụ VIP', 'P-Vip 1', 'Private']
    ];

    for (let r of roomsToInsert) {
        const [resRoom] = await db.execute('INSERT INTO rooms (department, room_number, type) VALUES (?, ?, ?)', r);
        const roomId = resRoom.insertId;
        
        const bedCount = r[1] === 'P-Vip 1' ? 1 : 4;
        for(let i = 1; i <= bedCount; i++) {
            await db.execute('INSERT INTO beds (room_id, bed_number) VALUES (?, ?)', [roomId, `Giường ${i}`]);
        }
    }

    res.json({ message: 'Đã khởi tạo Kiến trúc Phòng Giường Bệnh thành công!' });
});
