const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', message: 'Evayo7 API is running' });
});

// Database connection test
app.get('/api/test-db', async (req, res) => {
    try {
        const pool = require('./config/db');
        const [rows] = await pool.query('SELECT 1 as test');
        res.json({ status: 'OK', message: 'Database connected!', data: rows });
    } catch (error) {
        console.error('Database error:', error);
        res.status(500).json({ 
            status: 'ERROR', 
            message: error.message,
            code: error.code,
            details: error
        });
    }
});

// Routes
const authRoutes = require('./routes/auth');
const salesRoutes = require('./routes/sales');
const employeesRoutes = require('./routes/employees');
const expensesRoutes = require('./routes/expenses');

app.use('/api/auth', authRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/employees', employeesRoutes);
app.use('/api/expenses', expensesRoutes);

// Dashboard summary
app.get('/api/dashboard', async (req, res) => {
    try {
        const pool = require('./config/db');
        
        // Get today's sales
        const [todaySales] = await pool.query(`
            SELECT COALESCE(SUM(total_price), 0) as total 
            FROM sales 
            WHERE sale_date = CURDATE()
        `);
        
        // Get this month's sales
        const [monthSales] = await pool.query(`
            SELECT COALESCE(SUM(total_price), 0) as total 
            FROM sales 
            WHERE MONTH(sale_date) = MONTH(CURDATE()) AND YEAR(sale_date) = YEAR(CURDATE())
        `);
        
        // Get total employees
        const [employeeCount] = await pool.query('SELECT COUNT(*) as count FROM employees');
        
        // Get this month's expenses
        const [monthExpenses] = await pool.query(`
            SELECT COALESCE(SUM(amount), 0) as total 
            FROM other_expenses 
            WHERE MONTH(expense_date) = MONTH(CURDATE()) AND YEAR(expense_date) = YEAR(CURDATE())
        `);
        
        // Get this month's employee expenses
        const [employeeExpenses] = await pool.query(`
            SELECT COALESCE(SUM(total_expense), 0) as total 
            FROM employee_expenses 
            WHERE MONTH(expense_month) = MONTH(CURDATE()) AND YEAR(expense_month) = YEAR(CURDATE())
        `);
        
        res.json({
            todaySales: todaySales[0].total,
            monthSales: monthSales[0].total,
            employeeCount: employeeCount[0].count,
            monthExpenses: parseFloat(monthExpenses[0].total) + parseFloat(employeeExpenses[0].total)
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.listen(PORT, () => {
    console.log(`🍞 Evayo7 Server running on port ${PORT}`);
});
