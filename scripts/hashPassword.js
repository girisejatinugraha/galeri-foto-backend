const bcrypt = require('bcrypt');

async function hashPassword(password) {
    try {
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);
        console.log('Original password:', password);
        console.log('Hashed password:', hashedPassword);
        console.log('\nSQL to insert admin:');
        console.log(`INSERT INTO admins (username, password) VALUES ('admin', '${hashedPassword}');`);
    } catch (error) {
        console.error('Error hashing password:', error);
    }
}

const password = process.argv[2] || 'admin123';
hashPassword(password);