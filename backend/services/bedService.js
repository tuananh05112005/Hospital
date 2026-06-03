const bedRepo = require('../repositories/bedRepository');
const AppError = require('../utils/AppError');

class BedService {
  async getRoomsWithBeds() {
    return await bedRepo.getRoomsWithBeds();
  }

  async assignBed(bedId, patientId) {
    if (!patientId) throw new AppError('Patient ID is required', 400);

    // Remove patient from other beds
    await bedRepo.dischargePatientFromAllBeds(patientId);

    // Assign new bed
    const success = await bedRepo.assignBed(bedId, patientId);
    if (!success) throw new AppError('Bed not found', 404);
    
    return true;
  }

  async dischargeBed(bedId) {
    const success = await bedRepo.dischargeBed(bedId);
    if (!success) throw new AppError('Bed not found', 404);
    return true;
  }
}

module.exports = new BedService();
