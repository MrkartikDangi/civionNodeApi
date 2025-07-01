const mysql = require('mysql');


const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    charset: process.env.DB_CHARSET
});



connection.connect((err) => {
    if (err) {
        console.error('Database connection failed:', err.code, '-', err.message);
        process.exit(1);
    } else {
        console.log(' Database connection established successfully.');
    }
});

connection.on('error', (err) => {
    console.error('MySQL connection error:', err.code, '-', err.message);
    if (err.code === 'PROTOCOL_CONNECTION_LOST') {
        console.error('Attempting to reconnect...');
    } else {
        throw err;
    }
});

module.exports = connection;
