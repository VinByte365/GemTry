const db = require('../config/database');

exports.login = async (req, res) => {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required.' });
    }

    try {
        // Check if user exists
        const [rows] = await db.promise().query('SELECT * FROM user WHERE email = ?', [email]);

        if (rows.length === 0) {
            return res.status(401).json({ message: 'Invalid email or password.' });
        }

        const user = rows[0];

        // Check if user is active
        if (user.is_active === 0) {
            return res.status(403).json({ message: 'Your account is inactive. Please contact admin.' });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid email or password.' });
        }

        // Generate token
        let token = generateToken(user.id);
        try {
            const tokenSQL = 'UPDATE user SET token = ? WHERE user_id = ?';
            const [result] = await db.promise().execute(tokenSQL, [token, user.user_id])

            // Remove password before sending response
        delete user.password;

        res.status(200).json({
            message: 'Login successful',
            token,
            user,
        });
            
        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({ message: 'Internal server error' });
        }
        
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
};