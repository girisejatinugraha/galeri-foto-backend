const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const photoRoutes = require('./routes/photos');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/admin', express.static(path.join(__dirname, 'public/admin')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/photos', photoRoutes);

// Default route
app.get('/', (req, res) => {
    res.json({ 
        message: 'Photo Gallery API Server',
        version: '1.0.0',
        endpoints: {
            admin: '/admin',
            api: '/api',
            uploads: '/uploads'
        }
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    
    if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'File too large. Maximum size is 10MB' });
    }
    
    if (err.message.includes('Only image files are allowed')) {
        return res.status(400).json({ error: 'Only image files are allowed' });
    }
    
    res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📱 Admin panel: http://localhost:${PORT}/admin`);
    console.log(`🌐 API base: http://localhost:${PORT}/api`);
});