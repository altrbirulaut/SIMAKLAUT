// auth.js - Authentication handler untuk SIMAKLAUT
const API_BASE_URL = 'http://localhost:3000/api';

// Helper function untuk menyimpan token
function saveToken(token) {
    localStorage.setItem('simaklaut_token', token);
}

function getToken() {
    return localStorage.getItem('simaklaut_token');
}

function removeToken() {
    localStorage.removeItem('simaklaut_token');
}

// Helper function untuk menyimpan user data
function saveUserData(userData) {
    localStorage.setItem('simaklaut_user', JSON.stringify(userData));
}

function getUserData() {
    const userData = localStorage.getItem('simaklaut_user');
    return userData ? JSON.parse(userData) : null;
}

function removeUserData() {
    localStorage.removeItem('simaklaut_user');
}

// Register function
async function registerUser(username, email, password, full_name) {
    try {
        const response = await fetch(`${API_BASE_URL}/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username,
                email,
                password,
                full_name
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Terjadi kesalahan saat mendaftar');
        }

        return { success: true, data };
    } catch (error) {
        console.error('Register error:', error);
        return { success: false, error: error.message };
    }
}

// Login function
async function loginUser(username, password) {
    try {
        const response = await fetch(`${API_BASE_URL}/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username,
                password
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Terjadi kesalahan saat login');
        }

        // Simpan token dan user data
        saveToken(data.token);
        saveUserData(data.user);

        return { success: true, data };
    } catch (error) {
        console.error('Login error:', error);
        return { success: false, error: error.message };
    }
}

// Get user profile
async function getUserProfile() {
    try {
        const token = getToken();
        
        if (!token) {
            throw new Error('Token tidak ditemukan');
        }

        const response = await fetch(`${API_BASE_URL}/profile`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Terjadi kesalahan saat mengambil profil');
        }

        // Update local user data
        saveUserData(data.user);

        return { success: true, data: data.user };
    } catch (error) {
        console.error('Get profile error:', error);
        return { success: false, error: error.message };
    }
}

// Update user profile
async function updateUserProfile(profileData) {
    try {
        const token = getToken();
        
        if (!token) {
            throw new Error('Token tidak ditemukan');
        }

        const response = await fetch(`${API_BASE_URL}/profile`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(profileData)
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Terjadi kesalahan saat mengupdate profil');
        }

        // Update local user data
        saveUserData(data.user);

        return { success: true, data: data.user };
    } catch (error) {
        console.error('Update profile error:', error);
        return { success: false, error: error.message };
    }
}

// Change password
async function changePassword(currentPassword, newPassword) {
    try {
        const token = getToken();
        
        if (!token) {
            throw new Error('Token tidak ditemukan');
        }

        const response = await fetch(`${API_BASE_URL}/change-password`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                current_password: currentPassword,
                new_password: newPassword
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Terjadi kesalahan saat mengubah password');
        }

        return { success: true, message: data.message };
    } catch (error) {
        console.error('Change password error:', error);
        return { success: false, error: error.message };
    }
}

// Logout function
function logoutUser() {
    removeToken();
    removeUserData();
}

// Check if user is logged in
function isLoggedIn() {
    return !!getToken();
}

// Export functions untuk digunakan di script lain
if (typeof window !== 'undefined') {
    window.AuthService = {
        registerUser,
        loginUser,
        getUserProfile,
        updateUserProfile,
        changePassword,
        logoutUser,
        isLoggedIn,
        getUserData,
        getToken
    };
}