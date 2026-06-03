const authService = require('../services/authService');
const catchAsync = require('../utils/catchAsync');

exports.register = catchAsync(async (req, res) => {
    const userId = await authService.register(req.body);
    res.status(201).json({ message: 'User registered successfully', userId });
});

exports.login = catchAsync(async (req, res) => {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    res.json(result);
});
