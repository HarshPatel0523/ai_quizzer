const jwt = require('jsonwebtoken');
const config = require('../config/env.config');

const generateToken = (payload) => {
    return jwt.sign(payload, config.jwtSecret, { expiresIn: '1h' }); // Token expires in 1 hour
};

const verifyToken = (token) => {
    try {
        return jwt.verify(token, config.jwtSecret);
    } catch (error) {
        return null;
    }
};

module.exports = {
    generateToken,
    verifyToken,
};