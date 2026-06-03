const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');

const dbConfig = {
    host: 'localhost',
    user: 'root',
    password: '05112005',
    database: 'hospital_db'
};

const seedData = async () => {
    let connection;
    try {
        console.log("Starting mock data seeder...");
        connection = await mysql.createPool(dbConfig);
        const hash = bcrypt.hashSync('password123', 10);

        // 1. CLEAR EXISTING DATA
        await connection.query('SET FOREIGN_KEY_CHECKS = 0');
        await connection.query('TRUNCATE TABLE appointments');
        await connection.query('TRUNCATE TABLE patients');
        await connection.query('DELETE FROM doctors');
        await connection.query('DELETE FROM users');
        await connection.query('SET FOREIGN_KEY_CHECKS = 1');

        console.log("Cleared old test data.");

        // 1.5. SEED DEFAULT ADMIN USER
        await connection.query(
            'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
            ['Quản trị viên', 'admin@hospital.com', hash, 'admin']
        );
        console.log("Seeded default admin user: admin@hospital.com");

        // 2. SEED DOCTORS
        const doctorsData = [
            { name: "Phạm Văn Minh", email: "dr.minh@hospital.com", spec: "Nội Tim Mạch", dept: "Khoa Nội", phone: "0901111222" },
            { name: "Lê Hà Phương", email: "dr.phuong@hospital.com", spec: "Chấn thương chỉnh hình", dept: "Khoa Ngoại", phone: "0902222333" },
            { name: "Trần Hữu Trí", email: "dr.tri@hospital.com", spec: "Nhi khoa", dept: "Khoa Nhi", phone: "0903333444" },
            { name: "Nguyễn Thị Mai", email: "dr.mai@hospital.com", spec: "Sản phụ khoa", dept: "Khoa Sản", phone: "0904444555" },
            { name: "Đinh Công Hùng", email: "dr.hung@hospital.com", spec: "Tai Mũi Họng", dept: "Khoa Khám Bệnh", phone: "0905555666" }
        ];

        let doctorIds = [];
        let doctorUserIds = [];
        for (let d of doctorsData) {
            const [uRes] = await connection.query('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, "doctor")', [d.name, d.email, hash]);
            const [dRes] = await connection.query('INSERT INTO doctors (user_id, specialization, phone, department) VALUES (?, ?, ?, ?)', [uRes.insertId, d.spec, d.phone, d.dept]);
            doctorIds.push(dRes.insertId);
            doctorUserIds.push(uRes.insertId);
        }
        console.log(`Seeded ${doctorsData.length} doctors.`);

        // 3. SEED PATIENTS
        const patientsData = [
            { name: "Nguyễn Văn An", email: "an.nguyen@gmail.com", phone: "0912123123", dob: "1990-05-12", gender: "Male", addr: "123 Lê Lợi, Q1, TP.HCM" },
            { name: "Trần Bảo Ngọc", email: "ngoc.tran@gmail.com", phone: "0988777666", dob: "1985-11-20", gender: "Female", addr: "45 Nguyễn Trãi, Q5, TP.HCM" },
            { name: "Lý Gia Hân", email: "han.ly@gmail.com", phone: "0933444555", dob: "2010-02-14", gender: "Female", addr: "78 Võ Văn Tần, Q3, TP.HCM" },
            { name: "Phạm Tấn Trường", email: "truong.pham@gmail.com", phone: "0944111222", dob: "1975-09-08", gender: "Male", addr: "102 Điện Biên Phủ, Bình Thạnh" },
            { name: "Hoàng Minh Trí", email: "tri.hoang@gmail.com", phone: "0966555444", dob: "1995-12-01", gender: "Male", addr: "55 Trần Hưng Đạo, Q1, TP.HCM" },
            { name: "Vũ Thanh Phương", email: "phuong.vu@gmail.com", phone: "0909888999", dob: "1982-04-16", gender: "Female", addr: "10 Quang Trung, Gò Vấp" },
            { name: "Lê Nhật Linh", email: "linh.le@gmail.com", phone: "0977222333", dob: "1999-08-25", gender: "Female", addr: "220 Phan Đăng Lưu, Phú Nhuận" },
            { name: "Ngô Quang Hải", email: "hai.ngo@gmail.com", phone: "0922333444", dob: "1960-03-10", gender: "Male", addr: "15 Tôn Đức Thắng, Q1" }
        ];

        let patientIds = [];
        for (let p of patientsData) {
            const [pRes] = await connection.query('INSERT INTO patients (name, email, phone, dob, gender, address) VALUES (?, ?, ?, ?, ?, ?)', [p.name, p.email, p.phone, p.dob, p.gender, p.addr]);
            patientIds.push(pRes.insertId);
        }
        console.log(`Seeded ${patientsData.length} patients.`);

        // 4. SEED APPOINTMENTS
        // Format: YYYY-MM-DD HH:MM:00
        const today = new Date();
        const yest = new Date(today); yest.setDate(yest.getDate() - 1);
        const tmrw = new Date(today); tmrw.setDate(tmrw.getDate() + 1);
        
        const formatDate = (date) => date.toISOString().split('T')[0];

        const appointmentsData = [
            { p: patientIds[0], d: doctorIds[0], date: `${formatDate(today)} 08:30:00`, status: 'scheduled', note: 'Đau thắt ngực' },
            { p: patientIds[1], d: doctorIds[1], date: `${formatDate(today)} 09:15:00`, status: 'completed', note: 'Tái khám bó bột' },
            { p: patientIds[2], d: doctorIds[2], date: `${formatDate(today)} 10:00:00`, status: 'scheduled', note: 'Sốt xuất huyết' },
            { p: patientIds[3], d: doctorIds[3], date: `${formatDate(yest)} 14:00:00`, status: 'completed', note: 'Khám thai định kỳ' },
            { p: patientIds[4], d: doctorIds[4], date: `${formatDate(yest)} 15:30:00`, status: 'cancelled', note: 'Viêm họng hạt' },
            { p: patientIds[5], d: doctorIds[0], date: `${formatDate(tmrw)} 08:00:00`, status: 'scheduled', note: 'Huyết áp cao' },
            { p: patientIds[6], d: doctorIds[2], date: `${formatDate(tmrw)} 09:45:00`, status: 'scheduled', note: 'Ho lâu ngày' },
            { p: patientIds[7], d: doctorIds[4], date: `${formatDate(today)} 16:20:00`, status: 'scheduled', note: 'Trịch khớp vai' },
        ];

        for (let a of appointmentsData) {
            await connection.query('INSERT INTO appointments (patient_id, doctor_id, appointment_date, status, notes) VALUES (?, ?, ?, ?, ?)', [a.p, a.d, a.date, a.status, a.note]);
        }
        console.log(`Seeded ${appointmentsData.length} appointments.`);

        // 5. SEED VISITS (QUEUE)
        const visitsData = [
            { p: patientIds[0], d: doctorUserIds[0], priority: 'emergency', notes: 'Đau thắt ngực cấp tính, khó thở' },
            { p: patientIds[2], d: doctorUserIds[2], priority: 'urgent', notes: 'Sốt xuất huyết, trẻ em mệt mỏi' },
            { p: patientIds[5], d: doctorUserIds[0], priority: 'normal', notes: 'Huyết áp cao, tái khám định kỳ' },
            { p: patientIds[7], d: doctorUserIds[4], priority: 'normal', notes: 'Trịch khớp vai' }
        ];

        await connection.query('SET FOREIGN_KEY_CHECKS = 0');
        await connection.query('TRUNCATE TABLE visits');
        await connection.query('SET FOREIGN_KEY_CHECKS = 1');

        const visitDateStr = formatDate(today);
        let qNum = 1;
        for (let v of visitsData) {
            await connection.query(
                'INSERT INTO visits (patient_id, doctor_id, visit_date, queue_number, priority, status, notes) VALUES (?, ?, ?, ?, ?, "waiting", ?)',
                [v.p, v.d, visitDateStr, qNum++, v.priority, v.notes]
            );
        }
        console.log(`Seeded ${visitsData.length} queue visits.`);
        
        console.log("✅ All mock data seeded successfully!");
        process.exit(0);

    } catch (e) {
        console.error("Error seeding data:", e);
        process.exit(1);
    }
};

seedData();
