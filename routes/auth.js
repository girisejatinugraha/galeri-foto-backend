const express = require('express');
const { login, verifyToken } = require('../controllers/authController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

router.post('/login', login);
router.post('/verify', authenticateToken, verifyToken);

module.exports = router;