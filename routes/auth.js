const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'evayo7-secret-key-change-in-production';
const JWT_EXPIRES_IN = '24h';

// Register new user
router.post('/register', async (req, res) => {
    try {
        const { username, email, password, full_name, role } = req.body;

        // Validate input
        if (!username || !email || !password || !full_name) {
            return res.status(400).json({ error: 'All fields are required' });
        }

        // Check if username or email already exists
        const [existingUsers] = await pool.query(
            'SELECT id FROM users WHERE username = ? OR email = ?',
            [username, email]
        );

        if (existingUsers.length > 0) {
            return res.status(400).json({ error: 'Username or email already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Insert new user
        const [result] = await pool.query(
            'INSERT INTO users (username, email, password, full_name, role) VALUES (?, ?, ?, ?, ?)',
            [username, email, hashedPassword, full_name, role || 'staff']
        );

        // Generate JWT token
        const token = jwt.sign(
            { id: result.insertId, username, role: role || 'staff' },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );

        res.status(201).json({
            message: 'User registered successfully',
            token,
            user: {
                id: result.insertId,
                username,
                email,
                full_name,
                role: role || 'staff'
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Login user
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;

        // Validate input
        if (!username || !password) {
            return res.status(400).json({ error: 'Username and password are required' });
        }

        // Find user by username or email
        const [users] = await pool.query(
            'SELECT * FROM users WHERE username = ? OR email = ?',
            [username, username]
        );

        if (users.length === 0) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const user = users[0];

        // Check if user is active
        if (!user.is_active) {
            return res.status(401).json({ error: 'Account is deactivated' });
        }

        // Verify password
        const isValidPassword = await bcrypt.compare(password, user.password);

        if (!isValidPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Update last login
        await pool.query('UPDATE users SET last_login = NOW() WHERE id = ?', [user.id]);

        // Generate JWT token
        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            JWT_SECRET,
            { expiresIn: JWT_EXPIRES_IN }
        );

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                full_name: user.full_name,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Get current user profile
router.get('/profile', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        
        const [users] = await pool.query(
            'SELECT id, username, email, full_name, role, created_at, last_login FROM users WHERE id = ?',
            [decoded.id]
        );

        if (users.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(users[0]);
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ error: 'Invalid token' });
        }
        res.status(500).json({ error: error.message });
    }
});

// Verify token
router.get('/verify', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(401).json({ valid: false, error: 'No token provided' });
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        
        const [users] = await pool.query(
            'SELECT id, username, email, full_name, role FROM users WHERE id = ? AND is_active = TRUE',
            [decoded.id]
        );

        if (users.length === 0) {
            return res.status(401).json({ valid: false, error: 'User not found or inactive' });
        }

        res.json({ valid: true, user: users[0] });
    } catch (error) {
        res.status(401).json({ valid: false, error: 'Invalid token' });
    }
});

// Change password
router.put('/change-password', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        const { currentPassword, newPassword } = req.body;

        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const decoded = jwt.verify(token, JWT_SECRET);

        // Get current user
        const [users] = await pool.query('SELECT * FROM users WHERE id = ?', [decoded.id]);

        if (users.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        const user = users[0];

        // Verify current password
        const isValidPassword = await bcrypt.compare(currentPassword, user.password);

        if (!isValidPassword) {
            return res.status(401).json({ error: 'Current password is incorrect' });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        // Update password
        await pool.query('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, decoded.id]);

        res.json({ message: 'Password changed successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get all users (admin only)
router.get('/users', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const decoded = jwt.verify(token, JWT_SECRET);

        if (decoded.role !== 'admin') {
            return res.status(403).json({ error: 'Admin access required' });
        }

        const [users] = await pool.query(
            'SELECT id, username, email, full_name, role, is_active, created_at, last_login FROM users ORDER BY created_at DESC'
        );

        res.json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
