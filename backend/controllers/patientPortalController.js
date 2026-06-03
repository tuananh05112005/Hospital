const db = require('../config/db');

exports.getMyEMR = async (req, res) => {
    try {
        const patientId = req.user.patientId;
        if (!patientId) return res.status(403).json({ message: 'Không tìm thấy hồ sơ bệnh nhân gốc' });

        // Fetch basic info
        const [patients] = await db.execute('SELECT * FROM patients WHERE id = ?', [patientId]);
        if (patients.length === 0) return res.status(404).json({ message: 'Patient not found' });

        // Timelines
        const [appointments] = await db.execute(`
            SELECT a.*, u.name as doctor_name, d.specialization 
            FROM appointments a 
            LEFT JOIN doctors d ON a.doctor_id = d.id 
            LEFT JOIN users u ON d.user_id = u.id
            WHERE a.patient_id = ? ORDER BY a.appointment_date DESC`, 
            [patientId]
        );

        const [labs] = await db.execute(
            'SELECT * FROM lab_requests WHERE patient_id = ? ORDER BY created_at DESC', 
            [patientId]
        );

        const [invoices] = await db.execute(
            'SELECT * FROM invoices WHERE patient_id = ? ORDER BY created_at DESC', 
            [patientId]
        );

        res.json({
            patient: patients[0],
            timeline: {
                appointments,
                labs,
                invoices
            }
        });
    } catch (e) {
        res.status(500).json({ message: 'Lỗi tải EMR Cá Nhân', error: e.message });
    }
};

exports.bookOnline = async (req, res) => {
    try {
        const patientId = req.user.patientId;
        const { doctor_id, appointment_date, notes } = req.body;

        await db.execute(
            'INSERT INTO appointments (patient_id, doctor_id, appointment_date, notes, status) VALUES (?, ?, ?, ?, "scheduled")',
            [patientId, doctor_id, appointment_date, notes]
        );

        res.json({ message: 'Đặt lịch khám trực tuyến thành công!' });
    } catch (e) {
        res.status(500).json({ message: 'Lỗi đặt lịch online', error: e.message });
    }
};

exports.myInvoices = async (req, res) => {
    try {
        const patientId = req.user.patientId;
        const [invoices] = await db.execute('SELECT * FROM invoices WHERE patient_id = ? ORDER BY created_at DESC', [patientId]);
        res.json(invoices);
    } catch (e) {
        res.status(500).json({ message: 'Lỗi tải hóa đơn', error: e.message });
    }
};

exports.payOnline = async (req, res) => {
    try {
        const { invoiceId } = req.params;
        const patientId = req.user.patientId;
        
        await db.execute('UPDATE invoices SET status = "paid" WHERE id = ? AND patient_id = ?', [invoiceId, patientId]);
        res.json({ message: 'Thanh toán trực tuyến thành công!' });
    } catch (e) {
        res.status(500).json({ message: 'Lỗi thanh toán', error: e.message });
    }
};
