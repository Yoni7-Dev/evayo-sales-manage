const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// Get all expense categories
router.get('/categories', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM expense_categories ORDER BY category_name');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get all other expenses
router.get('/', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT oe.*, ec.category_name 
            FROM other_expenses oe 
            JOIN expense_categories ec ON oe.category_id = ec.id 
            ORDER BY oe.expense_date DESC
        `);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get expenses by date range
router.get('/range', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const [rows] = await pool.query(`
            SELECT oe.*, ec.category_name 
            FROM other_expenses oe 
            JOIN expense_categories ec ON oe.category_id = ec.id 
            WHERE oe.expense_date BETWEEN ? AND ?
            ORDER BY oe.expense_date DESC
        `, [startDate, endDate]);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Add new expense
router.post('/', async (req, res) => {
    try {
        const { category_id, amount, expense_date, description } = req.body;
        
        const [result] = await pool.query(
            'INSERT INTO other_expenses (category_id, amount, expense_date, description) VALUES (?, ?, ?, ?)',
            [category_id, amount, expense_date, description]
        );
        
        res.status(201).json({ id: result.insertId, message: 'Expense added successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update expense
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { category_id, amount, expense_date, description } = req.body;
        
        await pool.query(
            'UPDATE other_expenses SET category_id = ?, amount = ?, expense_date = ?, description = ? WHERE id = ?',
            [category_id, amount, expense_date, description, id]
        );
        
        res.json({ message: 'Expense updated successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete expense
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM other_expenses WHERE id = ?', [id]);
        res.json({ message: 'Expense deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get expense summary by category
router.get('/summary', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT 
                ec.category_name,
                SUM(oe.amount) as total_amount,
                COUNT(*) as count
            FROM other_expenses oe
            JOIN expense_categories ec ON oe.category_id = ec.id
            GROUP BY ec.id, ec.category_name
            ORDER BY total_amount DESC
        `);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
