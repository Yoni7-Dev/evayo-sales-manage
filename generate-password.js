// Password Hash Generator for Evayo7
// Run this script to generate a bcrypt hash for a new password

const bcrypt = require('bcryptjs');

const password = process.argv[2] || 'admin123';

bcrypt.hash(password, 10).then(hash => {
    console.log('\n========================================');
    console.log('Password Hash Generator');
    console.log('========================================');
    console.log(`\nOriginal Password: ${password}`);
    console.log(`\nBcrypt Hash:\n${hash}`);
    console.log('\n========================================');
    console.log('Copy this hash to your database or use it in SQL INSERT statement');
    console.log('========================================\n');
});

// Usage: node generate-password.js [your-password]
// Example: node generate-password.js mySecretPassword123
