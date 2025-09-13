const { generateToken } = require('../../utils/jwt.utils');
const User = require('../../models/User.model');

exports.login = async (req, res) => {
    const { username, password, email } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'Username and password are required' });
    }

    try {
        let user = await User.findOne({ username });
        
        if (!user && email) {
            user = new User({ username, email });
            await user.save();
            console.log(`New user created: ${username} with email: ${email}`);
        } else if (user && email && user.email !== email) {
            user.email = email;
            await user.save();
            console.log(`Updated email for user: ${username}`);
        }

        const tokenPayload = {
            userId: username,
            email: email || user?.email || null
        };
        const token = generateToken(tokenPayload);

        res.status(200).json({
            message: 'Login successful',
            token: token,
            user: {
                username: username,
                email: email || user?.email || null
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        const tokenPayload = { userId: username, email: email || null };
        const token = generateToken(tokenPayload);

        res.status(200).json({
            message: 'Login successful',
            token: token,
            user: { username: username, email: email || null }
        });
    }
};