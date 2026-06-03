const express = require('express');
const router = express.Router();
const roomController = require('../controllers/roomController');
const { verifyToken, verifyRole } = require('../middleware/auth');

// Allow Receptionist and Doctors to view beds
router.get('/', verifyToken, roomController.getRoomsWithBeds);

// Seed data route
router.post('/seed', verifyToken, verifyRole(['admin']), roomController.generateDemoData);

// Assign and Discharge (Receptionists, Admins)
router.post('/beds/:bed_id/assign', verifyToken, verifyRole(['admin', 'receptionist', 'doctor']), roomController.assignBed);
router.post('/beds/:bed_id/discharge', verifyToken, verifyRole(['admin', 'receptionist', 'doctor']), roomController.dischargeBed);

// CRUD Rooms
router.post('/', verifyToken, verifyRole(['admin']), roomController.createRoom);
router.delete('/:id', verifyToken, verifyRole(['admin']), roomController.deleteRoom);

// CRUD Beds
router.post('/:id/beds', verifyToken, verifyRole(['admin']), roomController.createBed);
router.delete('/beds/:bed_id', verifyToken, verifyRole(['admin']), roomController.deleteBed);

// Emergency Workflow
router.post('/transfer-surgery', verifyToken, verifyRole(['doctor', 'admin']), roomController.transferToSurgery);
router.post('/transfer-icu', verifyToken, verifyRole(['doctor', 'admin', 'receptionist']), roomController.transferToICU);

module.exports = router;
