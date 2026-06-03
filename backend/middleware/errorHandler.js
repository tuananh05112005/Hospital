module.exports = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    // Log the error in development
    console.error(`[ERROR] ${err.statusCode} - ${err.message}`);
    if (err.stack) {
        console.error(err.stack);
    }

    if (err.isOperational) {
        res.status(err.statusCode).json({
            status: err.status,
            message: err.message
        });
    } else {
        // Programming or other unknown error: don't leak error details
        res.status(500).json({
            status: 'error',
            message: 'Something went very wrong!'
        });
    }
};
