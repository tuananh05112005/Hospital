const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');
const { verifyToken, verifyRole } = require('../middleware/auth');

router.use(verifyToken);

router.get('/', appointmentController.getAllAppointments);
router.get('/:id', appointmentController.getAppointmentById);
router.post('/', verifyRole(['admin', 'receptionist']), appointmentController.createAppointment);
router.put('/:id/status', verifyRole(['admin', 'doctor', 'receptionist']), appointmentController.updateAppointmentStatus);
router.delete('/:id', verifyRole(['admin', 'receptionist']), appointmentController.deleteAppointment);

module.exports = router;
