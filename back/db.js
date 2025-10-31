// db.js
require('dotenv').config();
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

// เพิ่มฟังก์ชันสำหรับ delay (รอ)
const delay = ms => new Promise(res => setTimeout(res, ms));

async function testDbConnection() {
    let retries = 5; // ลองเชื่อมต่อ 5 ครั้ง
    const delayMs = 5000; // รอ 5 วินาทีระหว่างการลองแต่ละครั้ง

    while (retries > 0) {
        try {
            const connection = await pool.getConnection();
            console.log('Successfully connected to MariaDB!');
            connection.release();
            return; // เชื่อมต่อสำเร็จ ออกจากลูป
        } catch (error) {
            console.error(`Error connecting to MariaDB: ${error.message}. Retrying... (${retries} attempts left)`);
            retries--;
            if (retries === 0) {
                console.error('Failed to connect to MariaDB after multiple retries. Exiting process.');
                process.exit(1); // หากลองหลายครั้งแล้วยังไม่ได้ ให้จบ process
            }
            await delay(delayMs); // รอสักครู่ก่อนลองใหม่
        }
    }
}

testDbConnection();

module.exports = pool;