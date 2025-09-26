const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../config/database');

const login = async (req, res) => {
    try {
        const { username, password } = req.body;

        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }

        const query = 'SELECT * FROM admins WHERE username = ?';
        db.query(query, [username], async (err, results) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ error: 'Internal server error' });
            }

            if (results.length === 0) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            const admin = results[0];
            const validPassword = await bcrypt.compare(password, admin.password);

            if (!validPassword) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            const token = jwt.sign(
                { id: admin.id, username: admin.username },
                process.env.JWT_SECRET,
                { expiresIn: '24h' }
            );

            res.json({
                message: 'Login successful',
                token,
                admin: {
                    id: admin.id,
                    username: admin.username
                }
            });
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const verifyToken = (req, res) => {
    res.json({
        message: 'Token is valid',
        admin: req.user
    });
};

module.exports = { login, verifyToken };