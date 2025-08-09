const mysql = require('mysql');
let connection;

function handleDisconnect() {
  connection = mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    charset: process.env.DB_CHARSET,
    timezone: 'Z',
    typeCast: function (field, next) {
      if (field.type === 'JSON') {
        return JSON.parse(field.string());
      }
      return next();
    }
  });

  connection.connect(err => {
    if (err) {
      console.error('Error connecting:', err.code, err.message);
      setTimeout(handleDisconnect, 2000);
    } else {
      console.log('Database connection established.');
    }
  });

  connection.on('error', err => {
    console.error('DB error', err);
    if (err.code === 'PROTOCOL_CONNECTION_LOST') {
      console.log('Reconnecting...');
      handleDisconnect();
    } else {
      throw err;
    }
  });
}

handleDisconnect();

module.exports = connection;
