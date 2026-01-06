const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// Get all bread types
router.get('/bread-types', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM bread_types ORDER BY name');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get all salespersons (employees)
router.get('/salespersons', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT e.id, e.name, ep.position_name 
            FROM employees e 
            JOIN employee_positions ep ON e.position_id = ep.id 
            ORDER BY e.name
        `);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get all sales
router.get('/', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT s.*, bt.name as bread_name, e.name as salesperson_name 
            FROM sales s 
            JOIN bread_types bt ON s.bread_type_id = bt.id 
            LEFT JOIN employees e ON s.salesperson_id = e.id
            ORDER BY s.sale_date DESC, s.created_at DESC
        `);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get sales by date range
router.get('/range', async (req, res) => {
    try {
        const { startDate, endDate } = req.query;
        const [rows] = await pool.query(`
            SELECT s.*, bt.name as bread_name, e.name as salesperson_name 
            FROM sales s 
            JOIN bread_types bt ON s.bread_type_id = bt.id 
            LEFT JOIN employees e ON s.salesperson_id = e.id
            WHERE s.sale_date BETWEEN ? AND ?
            ORDER BY s.sale_date DESC
        `, [startDate, endDate]);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Add new sale
router.post('/', async (req, res) => {
    try {
        const { bread_type_id, salesperson_id, quantity, single_price, sale_date, notes } = req.body;
        const total_price = quantity * single_price;
        
        const [result] = await pool.query(
            'INSERT INTO sales (bread_type_id, salesperson_id, quantity, single_price, total_price, sale_date, notes) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [bread_type_id, salesperson_id || null, quantity, single_price, total_price, sale_date, notes]
        );
        
        res.status(201).json({ id: result.insertId, message: 'Sale added successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update sale
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { bread_type_id, salesperson_id, quantity, single_price, sale_date, notes } = req.body;
        const total_price = quantity * single_price;
        
        await pool.query(
            'UPDATE sales SET bread_type_id = ?, salesperson_id = ?, quantity = ?, single_price = ?, total_price = ?, sale_date = ?, notes = ? WHERE id = ?',
            [bread_type_id, salesperson_id || null, quantity, single_price, total_price, sale_date, notes, id]
        );
        
        res.json({ message: 'Sale updated successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete sale
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM sales WHERE id = ?', [id]);
        res.json({ message: 'Sale deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get sales summary
router.get('/summary', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT 
                bt.name as bread_name,
                SUM(s.quantity) as total_quantity,
                SUM(s.total_price) as total_revenue
            FROM sales s
            JOIN bread_types bt ON s.bread_type_id = bt.id
            GROUP BY bt.id, bt.name
            ORDER BY total_revenue DESC
        `);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get sales summary by salesperson
router.get('/summary-by-salesperson', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT 
                e.name as salesperson_name,
                COUNT(s.id) as total_sales,
                SUM(s.quantity) as total_quantity,
                SUM(s.total_price) as total_revenue
            FROM sales s
            LEFT JOIN employees e ON s.salesperson_id = e.id
            GROUP BY s.salesperson_id, e.name
            ORDER BY total_revenue DESC
        `);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
