const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const path = require('path');
const { isInternalThread } = require('worker_threads');

const app = express();
const PORT = 3000;
const JWT_SECRET = 'simaklaut_secret_key_2024'; // Ganti dengan secret key yang lebih aman di production

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public')); // Serve static files

// Database setup
const db = new sqlite3.Database('./simaklaut.db', (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to SQLite database');
        initializeDatabase();
    }
});

// Initialize database tables
function initializeDatabase() {
    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            full_name TEXT,
            institution TEXT,
            field_of_study TEXT,
            phone TEXT,
            profile_picture TEXT,
            bio TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `, (err) => {
        if (err) {
            console.error('Error creating users table:', err.message);
        } else {
            console.log('Users table ready');
        }
    });
}

// Middleware untuk verifikasi token
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Token tidak ditemukan' });
    }

    jwt.verify(token, JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Token tidak valid' });
        }
        req.user = user;
        next();
    });
}

// Routes

// Register user baru
app.post('/api/register', async (req, res) => {
    const { username, email, password, full_name } = req.body;

    // Validasi input
    if (!username || !email || !password) {
        return res.status(400).json({ error: 'Username, email, dan password wajib diisi' });
    }

    if (password.length < 6) {
        return res.status(400).json({ error: 'Password harus minimal 6 karakter' });
    }

    try {
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insert user ke database
        db.run(
            `INSERT INTO users (username, email, password, full_name) VALUES (?, ?, ?, ?)`,
            [username, email, hashedPassword, full_name || username],
            function(err) {
                if (err) {
                    if (err.message.includes('UNIQUE constraint failed')) {
                        return res.status(400).json({ error: 'Username atau email sudah terdaftar' });
                    }
                    return res.status(500).json({ error: 'Terjadi kesalahan saat mendaftar' });
                }

                res.status(201).json({
                    message: 'Registrasi berhasil',
                    userId: this.lastID
                });
            }
        );
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ error: 'Terjadi kesalahan server' });
    }
});

// Login
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username dan password wajib diisi' });
    }

    db.get(
        `SELECT * FROM users WHERE username = ? OR email = ?`,
        [username, username],
        async (err, user) => {
            if (err) {
                return res.status(500).json({ error: 'Terjadi kesalahan server' });
            }

            if (!user) {
                return res.status(401).json({ error: 'Username atau password salah' });
            }

            try {
                const passwordMatch = await bcrypt.compare(password, user.password);
                
                if (!passwordMatch) {
                    return res.status(401).json({ error: 'Username atau password salah' });
                }

                // Generate JWT token
                const token = jwt.sign(
                    { id: user.id, username: user.username },
                    JWT_SECRET,
                    { expiresIn: '7d' }
                );

                res.json({
                    message: 'Login berhasil',
                    token: token,
                    user: {
                        id: user.id,
                        username: user.username,
                        email: user.email,
                        full_name: user.full_name,
                        institution: user.institution,
                        field_of_study: user.field_of_study,
                        phone: user.phone,
                        profile_picture: user.profile_picture,
                        bio: user.bio
                    }
                });
            } catch (error) {
                console.error('Login error:', error);
                res.status(500).json({ error: 'Terjadi kesalahan server' });
            }
        }
    );
});

// Get user profile (protected)
app.get('/api/profile', authenticateToken, (req, res) => {
    db.get(
        `SELECT id, username, email, full_name, institution, field_of_study, phone, profile_picture, bio, created_at FROM users WHERE id = ?`,
        [req.user.id],
        (err, user) => {
            if (err) {
                return res.status(500).json({ error: 'Terjadi kesalahan server' });
            }

            if (!user) {
                return res.status(404).json({ error: 'User tidak ditemukan' });
            }

            res.json({ user });
        }
    );
});

// Update user profile (protected)
app.put('/api/profile', authenticateToken, (req, res) => {
    const { full_name, email, institution, field_of_study, phone, bio, profile_picture } = req.body;

    // Validasi email jika diubah
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ error: 'Format email tidak valid' });
    }

    const updateFields = [];
    const values = [];

    if (full_name !== undefined) {
        updateFields.push('full_name = ?');
        values.push(full_name);
    }
    if (email !== undefined) {
        updateFields.push('email = ?');
        values.push(email);
    }
    if (institution !== undefined) {
        updateFields.push('institution = ?');
        values.push(institution);
    }
    if (field_of_study !== undefined) {
        updateFields.push('field_of_study = ?');
        values.push(field_of_study);
    }
    if (phone !== undefined) {
        updateFields.push('phone = ?');
        values.push(phone);
    }
    if (bio !== undefined) {
        updateFields.push('bio = ?');
        values.push(bio);
    }
    if (profile_picture !== undefined) {
        updateFields.push('profile_picture = ?');
        values.push(profile_picture);
    }

    if (updateFields.length === 0) {
        return res.status(400).json({ error: 'Tidak ada data yang diupdate' });
    }

    updateFields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(req.user.id);

    const query = `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`;

    db.run(query, values, function(err) {
        if (err) {
            if (err.message.includes('UNIQUE constraint failed')) {
                return res.status(400).json({ error: 'Email sudah digunakan oleh user lain' });
            }
            return res.status(500).json({ error: 'Terjadi kesalahan saat mengupdate profil' });
        }

        // Get updated user data
        db.get(
            `SELECT id, username, email, full_name, institution, field_of_study, phone, profile_picture, bio FROM users WHERE id = ?`,
            [req.user.id],
            (err, user) => {
                if (err) {
                    return res.status(500).json({ error: 'Terjadi kesalahan server' });
                }

                res.json({
                    message: 'Profil berhasil diupdate',
                    user: user
                });
            }
        );
    });
});

// Change password (protected)
app.post('/api/change-password', authenticateToken, async (req, res) => {
    const { current_password, new_password } = req.body;

    if (!current_password || !new_password) {
        return res.status(400).json({ error: 'Password lama dan password baru wajib diisi' });
    }

    if (new_password.length < 6) {
        return res.status(400).json({ error: 'Password baru harus minimal 6 karakter' });
    }

    try {
        // Get current user
        db.get(
            `SELECT password FROM users WHERE id = ?`,
            [req.user.id],
            async (err, user) => {
                if (err) {
                    return res.status(500).json({ error: 'Terjadi kesalahan server' });
                }

                if (!user) {
                    return res.status(404).json({ error: 'User tidak ditemukan' });
                }

                // Verify current password
                const passwordMatch = await bcrypt.compare(current_password, user.password);
                
                if (!passwordMatch) {
                    return res.status(401).json({ error: 'Password lama tidak sesuai' });
                }

                // Hash new password
                const hashedPassword = await bcrypt.hash(new_password, 10);

                // Update password
                db.run(
                    `UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
                    [hashedPassword, req.user.id],
                    (err) => {
                        if (err) {
                            return res.status(500).json({ error: 'Terjadi kesalahan saat mengubah password' });
                        }

                        res.json({ message: 'Password berhasil diubah' });
                    }
                );
            }
        );
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ error: 'Terjadi kesalahan server' });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`SIMAKLAUT Backend Server running on http://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    db.close((err) => {
        if (err) {
            console.error('Error closing database:', err.message);
        } else {
            console.log('Database connection closed');
        }
        process.exit(0);
    });
});