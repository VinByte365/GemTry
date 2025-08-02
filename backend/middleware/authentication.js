const jwt = require("jsonwebtoken");

exports.isAuthenticatedUser = (req, res, next) => {
    const authHeader = req.header('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Login first to access this resource' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = { id: decoded.id, role: decoded.role };
        next();
    } catch (error) {
        return res.status(401).json({ message: 'Invalid or expired token' });
    }
};

exports.authorizeRoles = (...allowedRoles) => {
    return (req, res, next) => {
        // Make sure the user is already authenticated and has a role
        if (!req.user || !req.user.role) {
            return res.status(403).json({ message: 'Access denied: role not found' });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({ message: `Role (${req.user.role}) is not authorized to access this resource` });
        }

        next();
    };
};
