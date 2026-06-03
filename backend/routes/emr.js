const express = require('express');
const router = express.Router();
const emrController = require('../controllers/emrController');
const { verifyToken, verifyRole } = require('../middleware/auth');

router.get('/:patient_id', verifyToken, emrController.getPatientEMR);
router.post('/record', verifyToken, verifyRole(['doctor']), emrController.createEMRRecord);

module.exports = router;
