const { ZodError } = require('zod');

const validate = (schema) => (req, res, next) => {
  try {
    schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    next();
  } catch (error) {
    if (error.name === 'ZodError' || error instanceof ZodError) {
      return res.status(400).json({
        status: 'fail',
        message: 'Invalid input data',
        errors: (error.errors || error.issues || []).map(err => ({
          field: err.path ? err.path.join('.') : 'unknown',
          message: err.message
        }))
      });
    }
    next(error);
  }
};

module.exports = validate;
