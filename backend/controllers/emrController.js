const db = require('../config/db');

exports.getPatientEMR = async (req, res) => {
    try {
        const { patient_id } = req.params;
        
        // 1. Lấy thông tin Bệnh nhân
        const [patients] = await db.execute('SELECT * FROM patients WHERE id = ?', [patient_id]);
        if(patients.length === 0) return res.status(404).json({ message: 'Không tìm thấy bệnh nhân' });
        const patientInfo = patients[0];

        // 2. Lấy Lịch sử Khám (Appointments) + Bác sĩ Khám
        const [appointments] = await db.execute(`
            SELECT a.*, d.specialization, u.name as doctor_name
            FROM appointments a
            JOIN doctors d ON a.doctor_id = d.id
            JOIN users u ON d.user_id = u.id
            WHERE a.patient_id = ?
            ORDER BY a.appointment_date DESC
        `, [patient_id]);

        // 3. Lấy Lịch sử Đơn thuốc
        const [prescriptions] = await db.execute(`
            SELECT p.*, i.items as medications_json, i.total_amount
            FROM prescriptions p
            LEFT JOIN invoices i ON p.appointment_id = i.appointment_id
            WHERE p.patient_id = ?
            ORDER BY p.created_at DESC
        `, [patient_id]);

        // 4. Lấy Lịch sử Xét nghiệm (Lab)
        const [labRequests] = await db.execute(`
            SELECT * FROM lab_requests WHERE patient_id = ? ORDER BY created_at DESC
        `, [patient_id]);

        // Đóng gói cấu trúc EMR Xuyên thời gian
        res.json({
            patient: patientInfo,
            timeline: {
                appointments,
                prescriptions,
                labs: labRequests
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi truy xuất EMR', error: error.message });
    }
};

// Luồng ghi Bệnh án điện tử tự động khi hoàn thành khám (Sẽ gọi trong lúc Bác sĩ xuất viện)
exports.createEMRRecord = async (req, res) => {
    try {
        const { patient_id, appointment_id, primary_diagnosis, treatment_plan, visit_type } = req.body;
        // Bác sĩ ID
        const [doctorRows] = await db.execute('SELECT id FROM doctors WHERE user_id = ?', [req.user.id]);
        if (doctorRows.length === 0) return res.status(403).json({ message: 'Must be a doctor' });
        const doctor_id = doctorRows[0].id;

        await db.execute(`
            INSERT INTO medical_records (patient_id, appointment_id, doctor_id, primary_diagnosis, treatment_plan, visit_type)
            VALUES (?, ?, ?, ?, ?, ?)
        `, [patient_id, appointment_id, doctor_id, primary_diagnosis, treatment_plan, visit_type || 'outpatient']);

        res.json({ message: 'Lưu vào Hồ sơ số EMR thành công' });
    } catch (e) {
        res.status(500).json({ message: 'Lỗi ghi EMR', error: e.message });
    }
};
