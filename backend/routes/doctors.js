const express = require('express');
const router = express.Router();
const doctorController = require('../controllers/doctorController');
const { verifyToken, verifyRole } = require('../middleware/auth');

router.use(verifyToken);

router.get('/', doctorController.getAllDoctors);
router.get('/:id', doctorController.getDoctorById);
router.put('/:id', verifyRole(['admin']), doctorController.updateDoctor);
// Doctors are created via User Registration with role 'doctor'
// Deleting a user with role 'doctor' will cascade delete the doctor record

module.exports = router;
