const patientService = require('../services/patientService');
const catchAsync = require('../utils/catchAsync');

exports.getAllPatients = catchAsync(async (req, res) => {
    const patients = await patientService.getAllPatients(req.query);
    res.json(patients);
});

exports.getPatientById = catchAsync(async (req, res) => {
    const patient = await patientService.getPatientById(req.params.id);
    res.json(patient);
});

exports.createPatient = catchAsync(async (req, res) => {
    const id = await patientService.createPatient(req.body);
    res.status(201).json({ message: 'Patient created successfully', id });
});

exports.updatePatient = catchAsync(async (req, res) => {
    await patientService.updatePatient(req.params.id, req.body);
    res.json({ message: 'Patient updated successfully' });
});

exports.deletePatient = catchAsync(async (req, res) => {
    await patientService.deletePatient(req.params.id);
    res.json({ message: 'Patient deleted successfully' });
});
