const express = require('express');
const router = express.Router();
const shiftController = require('../controllers/shiftController');
const { verifyToken, verifyRole } = require('../middleware/auth');

router.use(verifyToken);

// Lấy danh sách toàn bộ ca (Admin & Lễ tân & Bác sĩ đều được xem)
router.get('/', shiftController.getShifts);

// Đăng ký hoặc Gỡ ca trực (Toggle)
router.post('/toggle', verifyRole(['doctor']), shiftController.toggleShift);

// Lưu ca trực hàng loạt (Bác sĩ & Admin)
router.post('/bulk', verifyRole(['admin', 'doctor']), shiftController.bulkSaveShifts);

// Lấy thông tin ca trực hiện tại của Bác sĩ đang đăng nhập
router.get('/my-current-shift', verifyRole(['doctor']), shiftController.getMyCurrentShift);

module.exports = router;
