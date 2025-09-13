const { verifyToken } = require('../../utils/jwt.utils');

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ message: 'Access token is missing or invalid' });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
        return res.status(403).json({ message: 'Token is not valid or expired' });
    }

    req.user = decoded; 
    next();
};

module.exports = authenticateToken;