const errorHandler = (err, req, res, next) => {
    console.error(err.stack);

    // Supabase errors
    if (err.code) {
        return res.status(400).json({
            error: 'Database error',
            details: err.message
        });
    }

    // Validation errors
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            error: 'Validation error',
            details: err.message
        });
    }

    // Default error
    res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
    });
};

module.exports = errorHandler;
