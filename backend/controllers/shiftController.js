const db = require('../config/db');

exports.getShifts = async (req, res) => {
    try {
        const [shifts] = await db.execute(`
            SELECT s.id, s.doctor_id, DATE_FORMAT(s.shift_date, '%Y-%m-%d') as shift_date, s.shift_type, s.created_at, u.name as doctor_name, d.specialization 
            FROM doctor_shifts s
            JOIN doctors d ON s.doctor_id = d.user_id
            JOIN users u ON s.doctor_id = u.id
            ORDER BY s.shift_date ASC, s.shift_type ASC
        `);
        res.json(shifts);
    } catch (e) {
        res.status(500).json({ message: 'Lỗi tải danh sách ca trực', error: e.message });
    }
};

exports.toggleShift = async (req, res) => {
    try {
        const { shift_date, shift_type } = req.body;
        const [docRows] = await db.execute('SELECT id FROM doctors WHERE user_id = ?', [req.user.id]);
        if (docRows.length === 0) return res.status(403).json({ message: 'Chỉ Bác sĩ mới được đăng ký ca trực' });
        
        const doctor_id = req.user.id; // doctor_id in doctor_shifts is foreign key to users.id

        // Check if shift already exists
        const [exists] = await db.execute(
            'SELECT id FROM doctor_shifts WHERE doctor_id = ? AND shift_date = ? AND shift_type = ?',
            [doctor_id, shift_date, shift_type]
        );

        if (exists.length > 0) {
            // Unregister (Delete shift)
            await db.execute('DELETE FROM doctor_shifts WHERE id = ?', [exists[0].id]);
            return res.json({ message: 'Đã rút khỏi ca trực', action: 'removed' });
        } else {
            // Register (Insert shift)
            await db.execute(
                'INSERT INTO doctor_shifts (doctor_id, shift_date, shift_type) VALUES (?, ?, ?)',
                [doctor_id, shift_date, shift_type]
            );
            return res.json({ message: 'Đăng ký ca trực thành công', action: 'added' });
        }
    } catch (e) {
        res.status(500).json({ message: 'Lỗi xử lý ca trực', error: e.message });
    }
};

exports.getMyCurrentShift = async (req, res) => {
    try {
        if (req.user.role !== 'doctor') return res.json({ shift: null });
 
        const [docRows] = await db.execute('SELECT id, specialization FROM doctors WHERE user_id = ?', [req.user.id]);
        if (docRows.length === 0) return res.json({ shift: null });
        const doctor_id = req.user.id; // doctor_id in doctor_shifts is foreign key to users.id
        const specialization = docRows[0].specialization;

        // Determine current shift based on local time
        // Since we are mocking real-world time, we just check if there is ANY shift TODAY for this doctor.
        // Even better, check by exact time slots. (Morning: 0-12, Afternoon: 12-18, Night: 18-24)
        const currentHour = new Date().getHours();
        let expectedShift = 'morning';
        if (currentHour >= 12 && currentHour < 18) expectedShift = 'afternoon';
        else if (currentHour >= 18) expectedShift = 'night';

        // date formatted as YYYY-MM-DD in local time
        const todayStr = new Date();
        todayStr.setMinutes(todayStr.getMinutes() - todayStr.getTimezoneOffset());
        const today = todayStr.toISOString().split('T')[0];

        const [shifts] = await db.execute(
            'SELECT * FROM doctor_shifts WHERE doctor_id = ? AND shift_date = ? AND shift_type = ?',
            [doctor_id, today, expectedShift]
        );

        if (shifts.length > 0) {
            res.json({ shift: expectedShift, department: specialization });
        } else {
            res.json({ shift: null, department: specialization }); // Off duty
        }
    } catch (e) {
        res.status(500).json({ message: 'Lỗi kiểm tra ca trực', error: e.message });
    }
};

exports.bulkSaveShifts = async (req, res) => {
    try {
        const { shifts } = req.body;
        
        if (req.user.role === 'doctor') {
            const doctor_id = req.user.id;
            
            const todayStr = new Date();
            todayStr.setMinutes(todayStr.getMinutes() - todayStr.getTimezoneOffset());
            const today = todayStr.toISOString().split('T')[0];
            
            // Delete all future shifts for this doctor
            await db.execute(
                'DELETE FROM doctor_shifts WHERE doctor_id = ? AND shift_date >= ?',
                [doctor_id, today]
            );
            
            // Insert new ones
            for (let s of shifts) {
                if (s.shift_date >= today) {
                    await db.execute(
                        'INSERT INTO doctor_shifts (doctor_id, shift_date, shift_type) VALUES (?, ?, ?)',
                        [doctor_id, s.shift_date, s.shift_type]
                    );
                }
            }
            return res.json({ message: 'Lưu lịch trực thành công' });
        }
        
        if (req.user.role === 'admin') {
            const { currentWeekStart } = req.body;
            if (!currentWeekStart) return res.status(400).json({ message: 'Thiếu thông tin tuần làm việc' });
            
            // Parse currentWeekStart to YYYY-MM-DD
            const startObj = new Date(currentWeekStart);
            startObj.setMinutes(startObj.getMinutes() - startObj.getTimezoneOffset());
            const start = startObj.toISOString().split('T')[0];
            
            const endObj = new Date(currentWeekStart);
            endObj.setDate(endObj.getDate() + 7);
            endObj.setMinutes(endObj.getMinutes() - endObj.getTimezoneOffset());
            const end = endObj.toISOString().split('T')[0];
            
            // Delete all shifts in this week
            await db.execute(
                'DELETE FROM doctor_shifts WHERE shift_date >= ? AND shift_date < ?',
                [start, end]
            );
            
            // Insert new ones
            for (let s of shifts) {
                await db.execute(
                    'INSERT INTO doctor_shifts (doctor_id, shift_date, shift_type) VALUES (?, ?, ?)',
                    [s.doctor_id, s.shift_date, s.shift_type]
                );
            }
            return res.json({ message: 'Cập nhật lịch trực của bệnh viện thành công' });
        }
        
        res.status(403).json({ message: 'Quyền truy cập bị từ chối' });
    } catch (e) {
        res.status(500).json({ message: 'Lỗi lưu ca trực', error: e.message });
    }
};
