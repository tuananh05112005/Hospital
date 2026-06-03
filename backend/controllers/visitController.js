const visitService = require('../services/visitService');
const catchAsync = require('../utils/catchAsync');

exports.getQueue = catchAsync(async (req, res) => {
    const visits = await visitService.getQueue(req.query);
    res.json(visits);
});

exports.createVisit = catchAsync(async (req, res) => {
    const result = await visitService.createVisit(req.body);
    res.status(201).json({ message: 'Visit created successfully', ...result });
});

exports.updateStatus = catchAsync(async (req, res) => {
    await visitService.updateVisitStatus(req.params.id, req.body.status);
    res.json({ message: 'Visit status updated successfully' });
});
