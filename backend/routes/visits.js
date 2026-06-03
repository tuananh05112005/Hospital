const express = require('express');
const router = express.Router();
const visitController = require('../controllers/visitController');
const { verifyToken, verifyRole } = require('../middleware/auth');

router.use(verifyToken);

router.get('/queue', visitController.getQueue);
router.post('/', verifyRole(['admin', 'receptionist']), visitController.createVisit);
router.put('/:id/status', verifyRole(['admin', 'doctor', 'nurse']), visitController.updateStatus);

module.exports = router;
