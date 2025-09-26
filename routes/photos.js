const express = require('express');
const upload = require('../middleware/upload');
const { authenticateToken } = require('../middleware/auth');
const {
    getAllPhotos,
    getAllPhotosAdmin,
    uploadPhoto,
    updatePhoto,
    deletePhoto
} = require('../controllers/photoController');

const router = express.Router();

// Public routes
router.get('/', getAllPhotos);

// Admin routes
router.get('/admin', authenticateToken, getAllPhotosAdmin);
router.post('/', authenticateToken, upload.single('photo'), uploadPhoto);
router.put('/:id', authenticateToken, updatePhoto);
router.delete('/:id', authenticateToken, deletePhoto);

module.exports = router;