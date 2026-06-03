const express = require('express');
const router = express.Router();
const patientController = require('../controllers/patientController');
const { verifyToken, verifyRole } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { createPatientSchema, updatePatientSchema } = require('../validations/patient.validation');

router.use(verifyToken);

router.get('/', patientController.getAllPatients);
router.get('/:id', patientController.getPatientById);
router.post('/', verifyRole(['admin', 'receptionist']), validate(createPatientSchema), patientController.createPatient);
router.put('/:id', verifyRole(['admin', 'receptionist']), validate(updatePatientSchema), patientController.updatePatient);
router.delete('/:id', verifyRole(['admin']), patientController.deletePatient);

module.exports = router;
