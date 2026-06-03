const db = require('../config/db');

class BedRepository {
  async getRoomsWithBeds() {
    // We get departments and rooms, but let's just get rooms with department name
    const [rooms] = await db.execute(`
      SELECT r.*, r.department as department_name 
      FROM rooms r 
      ORDER BY r.room_number ASC
    `);

    const [beds] = await db.execute(`
        SELECT b.*, p.name as patient_name 
        FROM beds b
        LEFT JOIN patients p ON b.patient_id = p.id
        ORDER BY b.bed_number ASC
    `);

    return rooms.map(room => ({
        ...room,
        beds: beds.filter(bed => bed.room_id === room.id)
    }));
  }

  async dischargePatientFromAllBeds(patientId) {
    await db.execute('UPDATE beds SET patient_id = NULL, status = "available" WHERE patient_id = ?', [patientId]);
  }

  async assignBed(bedId, patientId) {
    const [result] = await db.execute('UPDATE beds SET patient_id = ?, status = "occupied" WHERE id = ?', [patientId, bedId]);
    return result.affectedRows > 0;
  }

  async dischargeBed(bedId) {
    const [result] = await db.execute('UPDATE beds SET patient_id = NULL, status = "available" WHERE id = ?', [bedId]);
    return result.affectedRows > 0;
  }
}

module.exports = new BedRepository();
