-- -- Migration Script: Add Salesperson to Sales Table
-- -- Run this if you already have an existing database and just want to add the salesperson feature

-- -- Add salesperson_id column to sales table if it doesn't exist
-- ALTER TABLE sales 
-- ADD COLUMN IF NOT EXISTS salesperson_id INT DEFAULT NULL,
-- ADD CONSTRAINT fk_salesperson 
-- FOREIGN KEY (salesperson_id) REFERENCES employees(id);

-- -- If the above doesn't work (some MySQL versions don't support IF NOT EXISTS), use this instead:
-- -- ALTER TABLE sales ADD COLUMN salesperson_id INT DEFAULT NULL;
-- -- ALTER TABLE sales ADD CONSTRAINT fk_salesperson FOREIGN KEY (salesperson_id) REFERENCES employees(id);
