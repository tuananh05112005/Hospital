const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');
const { verifyToken, verifyRole } = require('../middleware/auth');

router.get('/', verifyToken, inventoryController.getInventory);
router.post('/add', verifyToken, verifyRole(['admin', 'receptionist']), inventoryController.addStock);
router.post('/seed', verifyToken, verifyRole(['admin']), inventoryController.seedInventory);
router.post('/ai-suggest', verifyToken, verifyRole(['admin', 'receptionist']), inventoryController.aiSuggest);

module.exports = router;
