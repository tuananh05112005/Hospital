const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
require('dotenv').config();

const apiRoutes = require('./routes/index');

const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api', apiRoutes);

// Base route
app.get('/', (req, res) => {
    res.json({ message: 'Welcome to Hospital Management System API' });
});

const globalErrorHandler = require('./middleware/errorHandler');

// Error handling middleware
app.use(globalErrorHandler);

const http = require('http');
const { initSocket } = require('./socket');

const server = http.createServer(app);
initSocket(server);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

// trigger nodemon restart 2
