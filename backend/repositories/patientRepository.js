const db = require('../config/db');

class PatientRepository {
  async findAll({ limit = 100, offset = 0, search = '' }) {
    let query = 'SELECT * FROM patients';
    const params = [];
    
    if (search) {
      query += ' WHERE name LIKE ? OR phone LIKE ?';
      params.push(`%${search}%`, `%${search}%`);
    }
    
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    params.push(String(limit), String(offset)); // Some mysql drivers require strings for limits if not cast
    
    const [rows] = await db.execute(query, params);
    return rows;
  }

  async findById(id) {
    const [rows] = await db.execute('SELECT * FROM patients WHERE id = ?', [id]);
    return rows[0];
  }

  async create(patientData) {
    const { name, email, phone, dob, gender, address } = patientData;
    const [result] = await db.execute(
        'INSERT INTO patients (name, email, phone, dob, gender, address) VALUES (?, ?, ?, ?, ?, ?)',
        [name, email || null, phone || null, dob || null, gender || null, address || null]
    );
    return result.insertId;
  }

  async update(id, patientData) {
    const { name, email, phone, dob, gender, address } = patientData;
    const [result] = await db.execute(
        'UPDATE patients SET name = ?, email = ?, phone = ?, dob = ?, gender = ?, address = ? WHERE id = ?',
        [name, email || null, phone || null, dob || null, gender || null, address || null, id]
    );
    return result.affectedRows > 0;
  }

  async delete(id) {
    const [result] = await db.execute('DELETE FROM patients WHERE id = ?', [id]);
    return result.affectedRows > 0;
  }
}

module.exports = new PatientRepository();
