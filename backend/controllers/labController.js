const db = require('../config/db');

exports.getLabRequests = async (req, res) => {
    try {
        const [requests] = await db.execute(`
            SELECT l.*, p.name as patient_name, u.name as doctor_name 
            FROM lab_requests l
            JOIN patients p ON l.patient_id = p.id
            JOIN doctors d ON l.doctor_id = d.id
            JOIN users u ON d.user_id = u.id
            ORDER BY l.created_at DESC
        `);
        res.json(requests);
    } catch (e) {
        res.status(500).json({ message: 'Lỗi tra cứu Cận Lâm Sàng', error: e.message });
    }
};

exports.createLabRequest = async (req, res) => {
    try {
        const { appointment_id, patient_id, test_type } = req.body;
        
        const [doctorRows] = await db.execute('SELECT id FROM doctors WHERE user_id = ?', [req.user.id]);
        if (doctorRows.length === 0) return res.status(403).json({ message: 'Chỉ Bác sĩ mới được cấp chỉ định Xét nghiệm' });
        const doctor_id = doctorRows[0].id;

        await db.execute(
            'INSERT INTO lab_requests (appointment_id, patient_id, doctor_id, test_type) VALUES (?, ?, ?, ?)',
            [appointment_id || null, patient_id, doctor_id, test_type]
        );
        res.json({ message: 'Đã phát lệnh Chỉ định Xét Nghiệm / Chụp Chiếu' });
    } catch (e) {
        res.status(500).json({ message: 'Lỗi tạo chỉ định', error: e.message });
    }
};

exports.updateLabResult = async (req, res) => {
    try {
        const { id } = req.params;
        const { results_details } = req.body;
        
        let results_url = req.body.results_url || null;
        
        // If a file was uploaded, use its path
        if (req.file) {
            results_url = '/uploads/' + req.file.filename;
        }

        await db.execute(
            'UPDATE lab_requests SET status = "completed", results_details = ?, results_url = ? WHERE id = ?',
            [results_details || null, results_url, id]
        );
        
        res.json({ message: 'Đã cập nhật Phiếu Kết quả thành công', results_url });
    } catch (e) {
        res.status(500).json({ message: 'Lỗi cập nhật Lab', error: e.message });
    }
};

const { GoogleGenerativeAI } = require('@google/generative-ai');

exports.aiResult = async (req, res) => {
    try {
        const { test_type, appointment_id, patient_id } = req.body;
        
        let diagnosis = 'Khám tổng quát';
        
        if (appointment_id) {
            const [appts] = await db.execute('SELECT notes FROM appointments WHERE id = ?', [appointment_id]);
            if (appts.length > 0 && appts[0].notes) {
                diagnosis = appts[0].notes;
            }
        }
        
        if ((!appointment_id || diagnosis === 'Khám tổng quát') && patient_id) {
            const [visits] = await db.execute(
                'SELECT notes FROM visits WHERE patient_id = ? ORDER BY id DESC LIMIT 1',
                [patient_id]
            );
            if (visits.length > 0 && visits[0].notes) {
                diagnosis = visits[0].notes;
            }
        }

        if (process.env.GEMINI_API_KEY) {
            try {
                const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
                const model = genAI.getGenerativeModel({ model: "gemini-pro" });
                const prompt = `Viết kết quả xét nghiệm / chẩn đoán hình ảnh tiếng Việt cho loại xét nghiệm: "${test_type}". 
                Gợi ý triệu chứng lâm sàng từ bác sĩ: "${diagnosis}". 
                Trả về một cụm text ngắn gọn khoảng 3-4 dòng chứa các chỉ số đo đạc thực tế phù hợp với bệnh lý đó (Ví dụ HC, BC, X-Quang mờ). Trả về plain text.`;
                
                const result = await model.generateContent(prompt);
                let text = result.response.text();
                return res.json({ result: text.trim() });
            } catch (error) {
                console.error('Gemini fellback');
            }
        }

        // Heuristic Fallback
        setTimeout(() => {}, 800);
        let fallbackMsg = '';
        if (test_type.includes('Máu')) {
             fallbackMsg = `RBC: 4.2 T/L (Bình thường)\nWBC: 11.5 G/L (Tăng nhẹ, nghi viêm nhiễm do ${diagnosis})\nGlucose: 5.2 mmol/L`;
        } else if (test_type.includes('X-Quang')) {
             fallbackMsg = `Hình ảnh X-Quang: Phát hiện đám mờ khu trú. Kết luận: Có dấu hiệu viêm phù hợp với triệu chứng ${diagnosis}.`;
        } else {
             fallbackMsg = `Kết quả chỉ số nằm trong khoảng an toàn, loại trừ các nguy cơ liên quan đến: ${diagnosis}.`;
        }

        res.json({ result: fallbackMsg });

    } catch (e) {
        res.status(500).json({ message: 'Lỗi AI Lab', error: e.message });
    }
};
