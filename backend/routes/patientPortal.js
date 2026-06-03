const express = require('express');
const router = express.Router();
const portalController = require('../controllers/patientPortalController');
const { verifyToken, verifyRole } = require('../middleware/auth');

router.use(verifyToken, verifyRole(['patient']));

router.get('/emr', portalController.getMyEMR);
router.post('/appointments', portalController.bookOnline);
router.get('/invoices', portalController.myInvoices);
router.post('/invoices/:invoiceId/pay', portalController.payOnline);

module.exports = router;
