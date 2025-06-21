const mysql = require('mysql2');

const pool = mysql.createPool({
    socketPath: '/var/run/mysqld/mysqld.sock',
    host: '127.0.0.1',
    user: 'root',
    password: '',
    database: 'DogWalkService'
});

module.exports = pool.promise();
