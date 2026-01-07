const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5000;

// ✅ CORS (MUST BE FIRST)
app.use(cors({
  origin: [
    "http://localhost:5174",
    "https://evayo.netlify.app"
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true
}));

// ✅ PRE-FLIGHT
app.options("*", cors());

// ✅ JSON BODY PARSER (YOU MISSED THIS)
app.use(express.json());

// Health check
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", message: "Evayo7 API is running" });
});

// Routes
app.use("/api/auth", require("./routes/auth"));
app.use("/api/sales", require("./routes/sales"));
app.use("/api/employees", require("./routes/employees"));
app.use("/api/expenses", require("./routes/expenses"));

// Dashboard
app.get("/api/dashboard", async (req, res) => {
  try {
    const pool = require("./config/db");

    const [todaySales] = await pool.query(`
      SELECT COALESCE(SUM(total_price), 0) as total 
      FROM sales 
      WHERE sale_date = CURDATE()
    `);

    const [monthSales] = await pool.query(`
      SELECT COALESCE(SUM(total_price), 0) as total 
      FROM sales 
      WHERE MONTH(sale_date) = MONTH(CURDATE()) 
        AND YEAR(sale_date) = YEAR(CURDATE())
    `);

    const [employeeCount] = await pool.query(
      "SELECT COUNT(*) as count FROM employees"
    );

    const [monthExpenses] = await pool.query(`
      SELECT COALESCE(SUM(amount), 0) as total 
      FROM other_expenses 
      WHERE MONTH(expense_date) = MONTH(CURDATE()) 
        AND YEAR(expense_date) = YEAR(CURDATE())
    `);

    const [employeeExpenses] = await pool.query(`
      SELECT COALESCE(SUM(total_expense), 0) as total 
      FROM employee_expenses 
      WHERE MONTH(expense_month) = MONTH(CURDATE()) 
        AND YEAR(expense_month) = YEAR(CURDATE())
    `);

    res.json({
      todaySales: todaySales[0].total,
      monthSales: monthSales[0].total,
      employeeCount: employeeCount[0].count,
      monthExpenses:
        Number(monthExpenses[0].total) +
        Number(employeeExpenses[0].total),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`🍞 Evayo7 Server running on port ${PORT}`);
});
