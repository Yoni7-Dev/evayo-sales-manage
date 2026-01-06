-- -- Migration Script: Add Users Table for Authentication
-- -- Run this if you already have an existing database and want to add login/register

-- -- Users Table for Authentication
-- CREATE TABLE IF NOT EXISTS users (
--     id INT AUTO_INCREMENT PRIMARY KEY,
--     username VARCHAR(50) NOT NULL UNIQUE,
--     email VARCHAR(100) NOT NULL UNIQUE,
--     password VARCHAR(255) NOT NULL,
--     full_name VARCHAR(100) NOT NULL,
--     role ENUM('admin', 'manager', 'staff') DEFAULT 'staff',
--     is_active BOOLEAN DEFAULT TRUE,
--     last_login TIMESTAMP NULL,
--     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
-- );

-- -- Activity Log Table (optional, for tracking user actions)
-- CREATE TABLE IF NOT EXISTS activity_log (
--     id INT AUTO_INCREMENT PRIMARY KEY,
--     user_id INT NOT NULL,
--     action VARCHAR(50) NOT NULL,
--     description VARCHAR(255),
--     ip_address VARCHAR(45),
--     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
--     FOREIGN KEY (user_id) REFERENCES users(id)
-- );

-- -- Add user_id column to sales table (optional, to track which user created the sale)
-- ALTER TABLE sales ADD COLUMN IF NOT EXISTS user_id INT DEFAULT NULL;
-- ALTER TABLE sales ADD CONSTRAINT fk_sale_user FOREIGN KEY (user_id) REFERENCES users(id);

-- -- Create a default admin user
-- -- Password: admin123 (you should change this immediately after first login)
-- -- The hash below is for 'admin123' - replace with a real bcrypt hash in production
-- INSERT INTO users (username, email, password, full_name, role) 
-- VALUES ('admin', 'admin@evayo7.com', '$2a$10$N9qo8uLOickgx2ZMRZoMy.MqrqBuBMtBkBQC6O9iKhV.nMM3UQZW6', 'Administrator', 'admin')
-- ON DUPLICATE KEY UPDATE username = username;

-- -- Note: The default password 'admin123' should be changed immediately!
-- -- To generate a new bcrypt hash, you can use this Node.js code:
-- -- const bcrypt = require('bcryptjs');
-- -- bcrypt.hash('your-new-password', 10).then(hash => console.log(hash));
