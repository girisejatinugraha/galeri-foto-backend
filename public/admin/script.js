const API_BASE = window.location.origin + '/api';
let authToken = localStorage.getItem('adminToken');

// Check if already logged in
if (authToken) {
    verifyToken();
}

function showAlert(message, type = 'success') {
    const alertsContainer = document.getElementById('alerts');
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.textContent = message;
    alertsContainer.appendChild(alert);
    
    setTimeout(() => {
        alert.remove();
    }, 5000);
}

function showLoading(show = true) {
    document.getElementById('loading').style.display = show ? 'block' : 'none';
}

async function login() {
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    const loginError = document.getElementById('loginError');

    if (!username || !password) {
        loginError.innerHTML = '<div class="alert alert-error">Please fill in all fields</div>';
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (response.ok) {
            authToken = data.token;
            localStorage.setItem('adminToken', authToken);
            showAdminPanel();
            loadPhotos();
        } else {
            loginError.innerHTML = `<div class="alert alert-error">${data.error}</div>`;
        }
    } catch (error) {
        loginError.innerHTML = '<div class="alert alert-error">Connection error</div>';
    }
}

async function verifyToken() {
    try {
        const response = await fetch(`${API_BASE}/auth/verify`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        if (response.ok) {
            showAdminPanel();
            loadPhotos();
        } else {
            logout();
        }
    } catch (error) {
        logout();
    }
}

function logout() {
    authToken = null;
    localStorage.removeItem('adminToken');
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('adminPanel').style.display = 'none';
}

function showAdminPanel() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('adminPanel').style.display = 'block';
}

async function loadPhotos() {
    showLoading(true);
    try {
        const response = await fetch(`${API_BASE}/photos/admin`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        if (response.ok) {
            const photos = await response.json();
            displayPhotos(photos);
        } else {
            showAlert('Failed to load photos', 'error');
        }
    } catch (error) {
        showAlert('Connection error', 'error');
    }
    showLoading(false);
}

function displayPhotos(photos) {
    const photosGrid = document.getElementById('photosGrid');
    
    if (photos.length === 0) {
        photosGrid.innerHTML = '<div style="text-align: center; padding: 40px; color: white;"><h3>No photos yet</h3><p>Upload your first photo above!</p></div>';
        return;
    }

    photosGrid.innerHTML = photos.map(photo => `
        <div class="photo-card">
            <img src="${photo.image_url}" alt="${photo.title}" class="photo-preview">
            <div class="photo-info">
                <h3>${photo.title}</h3>
                <p>${photo.description || 'No description'}</p>
                <p><small>Status: ${photo.is_active ? '✅ Active' : '❌ Inactive'}</small></p>
                <p><small>Uploaded: ${new Date(photo.upload_date).toLocaleDateString()}</small></p>
            </div>
            <div class="photo-actions">
                <button onclick="togglePhotoStatus(${photo.id}, ${!photo.is_active})" class="btn btn-small">
                    ${photo.is_active ? 'Hide' : 'Show'}
                </button>
                <button onclick="editPhoto(${photo.id}, '${photo.title}', '${photo.description || ''}')" class="btn btn-small">
                    Edit
                </button>
                <button onclick="deletePhoto(${photo.id})" class="btn btn-danger btn-small">
                    Delete
                </button>
            </div>
        </div>
    `).join('');
}

document.getElementById('uploadForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData();
    const title = document.getElementById('title').value;
    const description = document.getElementById('description').value;
    const photo = document.getElementById('photo').files[0];

    if (!title || !photo) {
        showAlert('Please fill in title and select a photo', 'error');
        return;
    }

    formData.append('title', title);
    formData.append('description', description);
    formData.append('photo', photo);

    try {
        showLoading(true);
        const response = await fetch(`${API_BASE}/photos`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${authToken}` },
            body: formData
        });

        const data = await response.json();

        if (response.ok) {
            showAlert('Photo uploaded successfully!');
            document.getElementById('uploadForm').reset();
            document.querySelector('.file-input-label div').textContent = '📷 Click to select photo';
            loadPhotos();
        } else {
            showAlert(data.error || 'Upload failed', 'error');
        }
    } catch (error) {
        showAlert('Upload failed', 'error');
    }
    showLoading(false);
});

async function togglePhotoStatus(photoId, newStatus) {
    try {
        const response = await fetch(`${API_BASE}/photos/${photoId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ is_active: newStatus })
        });

        if (response.ok) {
            showAlert(`Photo ${newStatus ? 'shown' : 'hidden'} successfully!`);
            loadPhotos();
        } else {
            showAlert('Failed to update photo status', 'error');
        }
    } catch (error) {
        showAlert('Update failed', 'error');
    }
}

function editPhoto(photoId, currentTitle, currentDescription) {
    const newTitle = prompt('Enter new title:', currentTitle);
    if (newTitle === null) return;

    const newDescription = prompt('Enter new description:', currentDescription);
    if (newDescription === null) return;

    updatePhoto(photoId, newTitle, newDescription);
}

async function updatePhoto(photoId, title, description) {
    try {
        const response = await fetch(`${API_BASE}/photos/${photoId}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ title, description, is_active: true })
        });

        if (response.ok) {
            showAlert('Photo updated successfully!');
            loadPhotos();
        } else {
            showAlert('Failed to update photo', 'error');
        }
    } catch (error) {
        showAlert('Update failed', 'error');
    }
}

async function deletePhoto(photoId) {
    if (!confirm('Are you sure you want to delete this photo? This action cannot be undone.')) {
        return;
    }

    try {
        const response = await fetch(`${API_BASE}/photos/${photoId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${authToken}` }
        });

        if (response.ok) {
            showAlert('Photo deleted successfully!');
            loadPhotos();
        } else {
            showAlert('Failed to delete photo', 'error');
        }
    } catch (error) {
        showAlert('Delete failed', 'error');
    }
}

// File input preview
document.getElementById('photo').addEventListener('change', function(e) {
    const file = e.target.files[0];
    const label = document.querySelector('.file-input-label div');
    
    if (file) {
        label.textContent = `📷 Selected: ${file.name}`;
    } else {
        label.textContent = '📷 Click to select photo';
    }
});

// Enter key login
document.addEventListener('keypress', function(e) {
    if (e.key === 'Enter' && document.getElementById('loginForm').style.display !== 'none') {
        login();
    }
});