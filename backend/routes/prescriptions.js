const express = require('express');
const router = express.Router();
const prescriptionController = require('../controllers/prescriptionController');
const { verifyToken, verifyRole } = require('../middleware/auth');

router.use(verifyToken);

// Kê đơn (Bác sĩ)
router.post('/prescribe', verifyRole(['doctor', 'admin']), prescriptionController.createPrescription);

// Quầy thuốc (Pharmacist, Admin)
router.get('/pending', verifyRole(['pharmacist', 'admin']), prescriptionController.getPendingPrescriptions);
router.post('/:id/dispense', verifyRole(['pharmacist', 'admin']), prescriptionController.dispensePrescription);

// Viện phí (Lễ tân, Admin)
router.get('/invoices', verifyRole(['admin', 'receptionist']), prescriptionController.getInvoices);
router.post('/invoices/:id/pay', verifyRole(['admin', 'receptionist']), prescriptionController.payInvoice);

// Bác sĩ Trợ lý AI (Kê đơn tự động)
router.post('/ai-suggest', verifyRole(['doctor', 'admin']), prescriptionController.aiSuggest);

module.exports = router;
