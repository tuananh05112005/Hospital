const visitRepo = require('../repositories/visitRepository');
const AppError = require('../utils/AppError');

class VisitService {
  async getQueue(query) {
    const page = parseInt(query.page) || 1;
    const limit = parseInt(query.limit) || 100;
    const offset = (page - 1) * limit;
    
    return await visitRepo.findAll({
        status: query.status,
        doctorId: query.doctorId,
        limit, offset
    });
  }

  async createVisit(data) {
    if (!data.patient_id) throw new AppError('Patient ID is required', 400);
    const result = await visitRepo.create(data);
    
    // Emit real-time event
    const { getIo } = require('../socket');
    try { getIo().emit('queue_updated'); } catch(e) {}
    
    return result;
  }

  async updateVisitStatus(id, status) {
    const validStatuses = ['waiting', 'examining', 'testing', 'completed', 'admitted'];
    if (!validStatuses.includes(status)) {
        throw new AppError('Invalid status', 400);
    }
    const success = await visitRepo.updateStatus(id, status);
    if (!success) throw new AppError('Visit not found', 404);
    
    // Emit real-time event
    const { getIo } = require('../socket');
    try { getIo().emit('queue_updated'); } catch(e) {}
    
    return success;
  }
}

module.exports = new VisitService();
