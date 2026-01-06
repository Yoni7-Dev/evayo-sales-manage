const express = require('express');
const router = express.Router();
const pool = require('../config/db');

// Get all positions
router.get('/positions', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT * FROM employee_positions ORDER BY position_name');
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get all employees
router.get('/', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT e.*, ep.position_name 
            FROM employees e 
            JOIN employee_positions ep ON e.position_id = ep.id 
            ORDER BY e.name
        `);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Add new employee
router.post('/', async (req, res) => {
    try {
        const { name, position_id, salary, hire_date, phone, email } = req.body;
        
        const [result] = await pool.query(
            'INSERT INTO employees (name, position_id, salary, hire_date, phone, email) VALUES (?, ?, ?, ?, ?, ?)',
            [name, position_id, salary, hire_date, phone, email]
        );
        
        res.status(201).json({ id: result.insertId, message: 'Employee added successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update employee
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name, position_id, salary, hire_date, phone, email } = req.body;
        
        await pool.query(
            'UPDATE employees SET name = ?, position_id = ?, salary = ?, hire_date = ?, phone = ?, email = ? WHERE id = ?',
            [name, position_id, salary, hire_date, phone, email, id]
        );
        
        res.json({ message: 'Employee updated successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete employee
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM employees WHERE id = ?', [id]);
        res.json({ message: 'Employee deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get all employee expenses
router.get('/expenses', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT ee.*, e.name as employee_name, ep.position_name
            FROM employee_expenses ee
            JOIN employees e ON ee.employee_id = e.id
            JOIN employee_positions ep ON e.position_id = ep.id
            ORDER BY ee.expense_month DESC
        `);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Add employee expense
router.post('/expenses', async (req, res) => {
    try {
        const { employee_id, expense_month, salary_paid, bonus, deductions, notes } = req.body;
        const total_expense = parseFloat(salary_paid) + parseFloat(bonus || 0) - parseFloat(deductions || 0);
        
        const [result] = await pool.query(
            'INSERT INTO employee_expenses (employee_id, expense_month, salary_paid, bonus, deductions, total_expense, notes) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [employee_id, expense_month, salary_paid, bonus || 0, deductions || 0, total_expense, notes]
        );
        
        res.status(201).json({ id: result.insertId, message: 'Employee expense added successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Update employee expense
router.put('/expenses/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { employee_id, expense_month, salary_paid, bonus, deductions, notes } = req.body;
        const total_expense = parseFloat(salary_paid) + parseFloat(bonus || 0) - parseFloat(deductions || 0);
        
        await pool.query(
            'UPDATE employee_expenses SET employee_id = ?, expense_month = ?, salary_paid = ?, bonus = ?, deductions = ?, total_expense = ?, notes = ? WHERE id = ?',
            [employee_id, expense_month, salary_paid, bonus || 0, deductions || 0, total_expense, notes, id]
        );
        
        res.json({ message: 'Employee expense updated successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Delete employee expense
router.delete('/expenses/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query('DELETE FROM employee_expenses WHERE id = ?', [id]);
        res.json({ message: 'Employee expense deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
