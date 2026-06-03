const inventoryService = require('../services/inventoryService');
const catchAsync = require('../utils/catchAsync');

exports.getInventory = catchAsync(async (req, res) => {
    const items = await inventoryService.getInventory();
    res.json(items);
});

exports.addStock = catchAsync(async (req, res) => {
    const result = await inventoryService.addStock(req.body);
    // If it's a new item, return 201
    if (result.message.includes('mới')) {
        return res.status(201).json(result);
    }
    res.json(result);
});

exports.seedInventory = catchAsync(async (req, res) => {
    const result = await inventoryService.seedInventory();
    res.json(result);
});

exports.aiSuggest = catchAsync(async (req, res) => {
    const { keyword } = req.body;
    const result = await inventoryService.aiSuggest(keyword);
    res.json(result);
});
