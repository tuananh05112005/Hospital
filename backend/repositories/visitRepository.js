const db = require('../config/db');

class VisitRepository {
  async findAll({ status, doctorId, limit = 100, offset = 0 }) {
    let query = `
      SELECT v.*, p.name as patient_name, p.mrn, u.name as doctor_name
      FROM visits v
      JOIN patients p ON v.patient_id = p.id
      LEFT JOIN users u ON v.doctor_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      query += ' AND v.status = ?';
      params.push(status);
    }
    if (doctorId) {
      query += ' AND v.doctor_id = ?';
      params.push(doctorId);
    }

    query += ' ORDER BY v.visit_date ASC, FIELD(v.priority, "emergency", "urgent", "normal"), v.queue_number ASC LIMIT ? OFFSET ?';
    params.push(String(limit), String(offset));

    const [rows] = await db.execute(query, params);
    return rows;
  }

  async findById(id) {
    const [rows] = await db.execute('SELECT * FROM visits WHERE id = ?', [id]);
    return rows[0];
  }

  async create(visitData) {
    const { patient_id, doctor_id, priority, notes } = visitData;
    
    const d = new Date();
    d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
    const visit_date = d.toISOString().split('T')[0];

    const [queueResult] = await db.execute(
        'SELECT COALESCE(MAX(queue_number), 0) + 1 as next_queue FROM visits WHERE visit_date = ?',
        [visit_date]
    );
    const queue_number = queueResult[0].next_queue;

    const [result] = await db.execute(
      'INSERT INTO visits (patient_id, doctor_id, visit_date, queue_number, priority, status, notes) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [patient_id, doctor_id || null, visit_date, queue_number, priority || 'normal', 'waiting', notes || null]
    );
    return { id: result.insertId, queue_number };
  }

  async updateStatus(id, status) {
    const [result] = await db.execute('UPDATE visits SET status = ? WHERE id = ?', [status, id]);
    return result.affectedRows > 0;
  }
}

module.exports = new VisitRepository();
