const express = require('express');
const router = express.Router();
const labController = require('../controllers/labController');
const { verifyToken, verifyRole } = require('../middleware/auth');
const upload = require('../middleware/upload');

router.get('/', verifyToken, labController.getLabRequests);
router.post('/request', verifyToken, verifyRole(['doctor']), labController.createLabRequest);
router.put('/:id/result', verifyToken, verifyRole(['admin', 'doctor', 'receptionist']), upload.single('result_file'), labController.updateLabResult);
router.post('/ai-result', verifyToken, verifyRole(['admin', 'doctor', 'receptionist']), labController.aiResult);

module.exports = router;
 