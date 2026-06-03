const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    let token = req.headers.authorization;
    if (!token) {
        return res.status(403).json({ message: 'No token provided' });
    }

    if (token.startsWith('Bearer ')) {
        token = token.slice(7, token.length).trimLeft();
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'supersecretkey');
        req.user = decoded; // Contains id, role, etc.
        next();
    } catch (err) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
};

const verifyRole = (roles) => {
    return (req, res, next) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({ message: 'Forbidden: Insufficient privileges' });
        }
        next();
    };
};

module.exports = {
    verifyToken,
    verifyRole
};
