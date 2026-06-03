const patientRepo = require('../repositories/patientRepository');
const AppError = require('../utils/AppError');

class PatientService {
  async getAllPatients(query) {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 100;
    const offset = (page - 1) * limit;
    const search = query.search || '';
    
    return await patientRepo.findAll({ limit, offset, search });
  }

  async getPatientById(id) {
    const patient = await patientRepo.findById(id);
    if (!patient) {
        throw new AppError('Patient not found', 404);
    }
    return patient;
  }

  async createPatient(patientData) {
    if (!patientData.name) {
        throw new AppError('Patient name is required', 400);
    }
    const insertId = await patientRepo.create(patientData);
    return insertId;
  }

  async updatePatient(id, patientData) {
    const success = await patientRepo.update(id, patientData);
    if (!success) {
        throw new AppError('Patient not found or no changes made', 404);
    }
    return success;
  }

  async deletePatient(id) {
    const success = await patientRepo.delete(id);
    if (!success) {
        throw new AppError('Patient not found', 404);
    }
    return success;
  }
}

module.exports = new PatientService();
