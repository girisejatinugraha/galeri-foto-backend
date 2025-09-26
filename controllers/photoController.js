const db = require('../config/database');
const fs = require('fs');
const path = require('path');

const getAllPhotos = (req, res) => {
    const query = 'SELECT * FROM photos WHERE is_active = TRUE ORDER BY upload_date DESC';
    
    db.query(query, (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }

        const photos = results.map(photo => ({
            ...photo,
            image_url: `${req.protocol}://${req.get('host')}/uploads/photos/${photo.filename}`
        }));

        res.json(photos);
    });
};

const getAllPhotosAdmin = (req, res) => {
    const query = 'SELECT * FROM photos ORDER BY upload_date DESC';
    
    db.query(query, (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }

        const photos = results.map(photo => ({
            ...photo,
            image_url: `${req.protocol}://${req.get('host')}/uploads/photos/${photo.filename}`
        }));

        res.json(photos);
    });
};

const uploadPhoto = (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const { title, description } = req.body;
        const filename = req.file.filename;
        const filePath = req.file.path;

        const query = 'INSERT INTO photos (title, description, filename, file_path) VALUES (?, ?, ?, ?)';
        
        db.query(query, [title, description, filename, filePath], (err, result) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ error: 'Failed to save photo data' });
            }

            res.status(201).json({
                message: 'Photo uploaded successfully',
                photo: {
                    id: result.insertId,
                    title,
                    description,
                    filename,
                    image_url: `${req.protocol}://${req.get('host')}/uploads/photos/${filename}`
                }
            });
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const updatePhoto = (req, res) => {
    const { id } = req.params;
    const { title, description, is_active } = req.body;

    const query = 'UPDATE photos SET title = ?, description = ?, is_active = ? WHERE id = ?';
    
    db.query(query, [title, description, is_active, id], (err, result) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Failed to update photo' });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Photo not found' });
        }

        res.json({ message: 'Photo updated successfully' });
    });
};

const deletePhoto = (req, res) => {
    const { id } = req.params;

    // First get the photo info to delete the file
    const selectQuery = 'SELECT * FROM photos WHERE id = ?';
    
    db.query(selectQuery, [id], (err, results) => {
        if (err) {
            console.error('Database error:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }

        if (results.length === 0) {
            return res.status(404).json({ error: 'Photo not found' });
        }

        const photo = results[0];
        
        // Delete from database
        const deleteQuery = 'DELETE FROM photos WHERE id = ?';
        
        db.query(deleteQuery, [id], (err, result) => {
            if (err) {
                console.error('Database error:', err);
                return res.status(500).json({ error: 'Failed to delete photo' });
            }

            // Delete file from filesystem
            const filePath = path.join(__dirname, '../uploads/photos', photo.filename);
            fs.unlink(filePath, (err) => {
                if (err) {
                    console.error('Failed to delete file:', err);
                }
            });

            res.json({ message: 'Photo deleted successfully' });
        });
    });
};

module.exports = {
    getAllPhotos,
    getAllPhotosAdmin,
    uploadPhoto,
    updatePhoto,
    deletePhoto
};