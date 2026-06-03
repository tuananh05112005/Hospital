const db = require('../config/db');

class UserRepository {
  async findByEmail(email) {
    const [users] = await db.execute('SELECT * FROM users WHERE email = ?', [email]);
    return users.length > 0 ? users[0] : null;
  }

  async create(userData) {
    const { name, email, password, role } = userData;
    const [result] = await db.execute(
      'INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)',
      [name, email, password, role]
    );
    return result.insertId;
  }

  async createDoctor(userId) {
    await db.execute('INSERT INTO doctors (user_id) VALUES (?)', [userId]);
  }

  async createPatientProfile(userId, name, email) {
    await db.execute('INSERT INTO patients (user_id, name, email) VALUES (?, ?, ?)', [userId, name, email]);
  }

  async findPatientByUserId(userId) {
    const [pats] = await db.execute('SELECT id FROM patients WHERE user_id = ?', [userId]);
    return pats.length > 0 ? pats[0] : null;
  }
}

module.exports = new UserRepository();
