const db = require('../config/db');

exports.getAllDoctors = async (req, res) => {
    try {
        const [doctors] = await db.execute(`
            SELECT d.id, d.user_id, u.name, u.email, d.specialization, d.phone, d.department 
            FROM doctors d 
            JOIN users u ON d.user_id = u.id
        `);
        res.json(doctors);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.getDoctorById = async (req, res) => {
    try {
        const [doctors] = await db.execute(`
            SELECT d.id, d.user_id, u.name, u.email, d.specialization, d.phone, d.department 
            FROM doctors d 
            JOIN users u ON d.user_id = u.id 
            WHERE d.id = ?
        `, [req.params.id]);
        
        if (doctors.length === 0) {
            return res.status(404).json({ message: 'Doctor not found' });
        }
        res.json(doctors[0]);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.updateDoctor = async (req, res) => {
    try {
        const { specialization, phone, department } = req.body;
        const [result] = await db.execute(
            'UPDATE doctors SET specialization = ?, phone = ?, department = ? WHERE id = ?',
            [specialization, phone, department, req.params.id]
        );
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Doctor not found' });
        }
        res.json({ message: 'Doctor updated successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
