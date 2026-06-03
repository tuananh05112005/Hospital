const db = require('../config/db');

exports.getAllAppointments = async (req, res) => {
    try {
        let query = `
            SELECT a.*, p.name AS patient_name, p.dob AS patient_dob, u.name AS doctor_name, u.id AS doctor_user_id, d.specialization AS doctor_specialization 
            FROM appointments a
            LEFT JOIN patients p ON a.patient_id = p.id
            LEFT JOIN doctors d ON a.doctor_id = d.id
            LEFT JOIN users u ON d.user_id = u.id
        `;
        let params = [];
        
        if (req.user && req.user.role === 'doctor') {
            query += ` WHERE u.id = ? `;
            params.push(req.user.id);
        }
        
        query += ` ORDER BY a.appointment_date DESC`;
        
        const [appointments] = await db.execute(query, params);
        res.json(appointments);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.getAppointmentById = async (req, res) => {
    try {
        const [appointments] = await db.execute(`
            SELECT a.*, p.name AS patient_name, u.name AS doctor_name 
            FROM appointments a
            LEFT JOIN patients p ON a.patient_id = p.id
            LEFT JOIN doctors d ON a.doctor_id = d.id
            LEFT JOIN users u ON d.user_id = u.id
            WHERE a.id = ?
        `, [req.params.id]);
        
        if (appointments.length === 0) {
            return res.status(404).json({ message: 'Appointment not found' });
        }
        res.json(appointments[0]);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.createAppointment = async (req, res) => {
    try {
        const { patient_id, doctor_id, appointment_date, notes } = req.body;
        const [result] = await db.execute(
            'INSERT INTO appointments (patient_id, doctor_id, appointment_date, notes) VALUES (?, ?, ?, ?)',
            [patient_id, doctor_id, appointment_date, notes]
        );
        res.status(201).json({ message: 'Appointment created successfully', id: result.insertId });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.updateAppointmentStatus = async (req, res) => {
    try {
        const { patient_id, doctor_id, appointment_date, status, notes } = req.body;
        
        let query = 'UPDATE appointments SET ';
        const params = [];
        const updates = [];
        
        if (patient_id !== undefined) {
            updates.push('patient_id = ?');
            params.push(patient_id);
        }
        if (doctor_id !== undefined) {
            updates.push('doctor_id = ?');
            params.push(doctor_id);
        }
        if (appointment_date !== undefined) {
            updates.push('appointment_date = ?');
            params.push(appointment_date);
        }
        if (status !== undefined) {
            updates.push('status = ?');
            params.push(status);
        }
        if (notes !== undefined) {
            updates.push('notes = ?');
            params.push(notes);
        }
        
        if (updates.length === 0) {
            return res.json({ message: 'No fields to update' });
        }
        
        query += updates.join(', ') + ' WHERE id = ?';
        params.push(req.params.id);
        
        const [result] = await db.execute(query, params);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Appointment not found' });
        }
        res.json({ message: 'Appointment updated successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

exports.deleteAppointment = async (req, res) => {
    try {
        const [result] = await db.execute('DELETE FROM appointments WHERE id = ?', [req.params.id]);
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Appointment not found' });
        }
        res.json({ message: 'Appointment deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
