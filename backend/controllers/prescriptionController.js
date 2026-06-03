const db = require('../config/db');

exports.createPrescription = async (req, res) => {
    try {
        // expected body: { appointment_id, visit_id, patient_id, notes, medications: [{name, price, quantity}] }
        const { appointment_id, visit_id, patient_id, notes, medications } = req.body;
        
        // 1. Get doctor_id via user_id
        const [doctorRows] = await db.execute('SELECT id FROM doctors WHERE user_id = ?', [req.user.id]);
        if (doctorRows.length === 0) return res.status(403).json({ message: 'Must be a doctor to prescribe' });
        const doctor_id = doctorRows[0].id;

        // 2. Insert Prescription
        let prescRes;
        const medsJson = JSON.stringify(medications || []);
        if (visit_id) {
             [prescRes] = await db.execute(
                'INSERT INTO prescriptions (visit_id, doctor_id, patient_id, notes, status, medications_json) VALUES (?, ?, ?, ?, "pending", ?)',
                [visit_id, doctor_id, patient_id, notes || '', medsJson]
            );
            await db.execute('UPDATE visits SET status = "completed" WHERE id = ?', [visit_id]);
        } else {
             [prescRes] = await db.execute(
                'INSERT INTO prescriptions (appointment_id, doctor_id, patient_id, notes, status, medications_json) VALUES (?, ?, ?, ?, "pending", ?)',
                [appointment_id, doctor_id, patient_id, notes || '', medsJson]
            );
            await db.execute('UPDATE appointments SET status = "completed" WHERE id = ?', [appointment_id]);
        }
        const prescription_id = prescRes.insertId;

        // 4. Calculate total amount for invoice (Consultation Fee + Medications)
        const consultation_fee = 150000;
        let medication_cost = 0;
        
        // For simplicity, medications are stored as a JSON string in 'medications_json'.
        if (medications && medications.length > 0) {
           for(let med of medications) {
               const qty = med.quantity || 1;
               medication_cost += (med.price || 50000) * qty;
           }
        }
        
        const total_amount = consultation_fee + medication_cost;

        // 5. Generate Invoice
        await db.execute(
            'INSERT INTO invoices (appointment_id, visit_id, patient_id, total_amount, status, items) VALUES (?, ?, ?, ?, "unpaid", ?)',
            [appointment_id || null, visit_id || null, patient_id, total_amount, JSON.stringify(medications || [])]
        );

        res.status(201).json({ message: 'Đã kê đơn thành công', prescription_id });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

exports.getPendingPrescriptions = async (req, res) => {
    try {
        const [prescriptions] = await db.execute(`
            SELECT pr.*, p.name AS patient_name, u.name AS doctor_name
            FROM prescriptions pr
            JOIN patients p ON pr.patient_id = p.id
            LEFT JOIN users u ON pr.doctor_id = u.id
            WHERE pr.status = 'pending'
            ORDER BY pr.created_at DESC
        `);
        res.json(prescriptions);
    } catch (error) {
         res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

exports.dispensePrescription = async (req, res) => {
    try {
        const { id } = req.params;
        // 1. Get prescription
        const [prescRows] = await db.execute('SELECT * FROM prescriptions WHERE id = ?', [id]);
        if (prescRows.length === 0) return res.status(404).json({ message: 'Không tìm thấy toa thuốc' });
        const presc = prescRows[0];
        
        if (presc.status === 'dispensed') return res.status(400).json({ message: 'Toa thuốc này đã được xuất' });

        // 2. Deduct inventory
        let medications = [];
        try { medications = JSON.parse(presc.medications_json || '[]'); } catch(e){}
        
        for(let med of medications) {
            const qty = med.quantity || 1;
            try {
                await db.execute('UPDATE inventory SET quantity = quantity - ? WHERE item_name = ?', [qty, med.name]);
            } catch (e) {
                console.error('Lỗi khi trừ kho: ' + e.message);
            }
        }

        // 3. Update status
        await db.execute('UPDATE prescriptions SET status = "dispensed" WHERE id = ?', [id]);

        res.json({ message: 'Đã xuất thuốc thành công' });
    } catch (error) {
         res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

exports.getInvoices = async (req, res) => {
    try {
        const [invoices] = await db.execute(`
            SELECT i.*, p.name AS patient_name, a.appointment_date
            FROM invoices i
            JOIN patients p ON i.patient_id = p.id
            JOIN appointments a ON i.appointment_id = a.id
            ORDER BY i.created_at DESC
        `);
        res.json(invoices);
    } catch (error) {
         res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

exports.payInvoice = async (req, res) => {
    try {
        const [result] = await db.execute('UPDATE invoices SET status = "paid" WHERE id = ?', [req.params.id]);
        res.json({ message: 'Thanh toán thành công' });
    } catch (error) {
         res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

const { GoogleGenerativeAI } = require('@google/generative-ai');

exports.aiSuggest = async (req, res) => {
    try {
        const { symptoms } = req.body;
        const text = (symptoms || '').toLowerCase();
        let suggestions = [];

        // Kiểm tra xem có cấu hình Gemini API Key thật sự hay không
        if (process.env.GEMINI_API_KEY) {
            try {
                const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
                const model = genAI.getGenerativeModel({ model: "gemini-pro" });
                const prompt = `You are an expert Medical AI Assistant. Based on the following symptoms: "${text}". 
                Give me a JSON array of 1 to 3 over-the-counter or common medications (e.g., [{"name": "Paracetamol 500mg", "quantity": 10, "price": 50000}]). 
                Only respond with the raw JSON array string.`;
                
                const result = await model.generateContent(prompt);
                const responseText = result.response.text().replace(/```json/g, '').replace(/```/g, '').trim();
                suggestions = JSON.parse(responseText);
                return res.json({ source: 'gemini', result: suggestions });
            } catch (aiError) {
                console.error("Gemini AI failed, falling back to heuristic:", aiError.message);
            }
        }

        // --- HYBRID FALLBACK: Mô hình Heuristic Đóng giả AI (Nếu mất mạng / thiếu API Key) ---
        // Giả lập độ trễ suy nghĩ của AI (1.5s) để giao diện nhìn xịn xò
        await new Promise(resolve => setTimeout(resolve, 1500));

        if (text.includes('sốt') || text.includes('đau đầu') || text.includes('cảm')) {
            suggestions.push({ name: 'Paracetamol 500mg', quantity: 10, price: 50000 });
            suggestions.push({ name: 'Vitamin C 1000mg', quantity: 10, price: 80000 });
        }
        if (text.includes('ho') || text.includes('họng') || text.includes('đờm')) {
            suggestions.push({ name: 'Amoxicillin 500mg (Kháng sinh)', quantity: 15, price: 120000 });
            suggestions.push({ name: 'Siro Trị Ho Bổ Phế', quantity: 1, price: 65000 });
        }
        if (text.includes('dạ dày') || text.includes('ợ') || text.includes('tiêu hóa')) {
            suggestions.push({ name: 'Omeprazole 20mg', quantity: 14, price: 90000 });
            suggestions.push({ name: 'Phosphalugel (Chữ P)', quantity: 20, price: 110000 });
        }
        if (text.includes('tiêu chảy') || text.includes('đi ngoài')) {
            suggestions.push({ name: 'Oresol', quantity: 10, price: 30000 });
            suggestions.push({ name: 'Berberin', quantity: 30, price: 20000 });
            suggestions.push({ name: 'Smecta', quantity: 10, price: 45000 });
        }

        // Tẩy trùng lặp
        suggestions = Array.from(new Map(suggestions.map(s => [s.name, s])).values());

        // Mặc định nếu không triệu chứng nào match
        if (suggestions.length === 0) {
            suggestions.push({ name: 'Thuốc bổ tổng hợp Multivitamin', quantity: 1, price: 150000 });
            suggestions.push({ name: 'Nước muối sinh lý', quantity: 2, price: 20000 });
        }

        res.json({ source: 'heuristic', result: suggestions });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi mô hình AI Component', error: error.message });
    }
};
