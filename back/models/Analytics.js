// back/models/Analytics.js
const db = require('../db');

const Analytics = {
    // ดึงจำนวนการจองทั้งหมด
    getTotalReservations: async () => {
        const [rows] = await db.query(`SELECT COUNT(*) as count FROM bookings`);
        return rows[0];
    },

    // ดึงจำนวนผู้เข้าร่วมทั้งหมด (อาจนับจากการจองที่ 'APPROVED' หรือจำนวน participants)
    getTotalAttendance: async () => {
        // ตัวอย่าง: นับการจองที่ APPROVED
        const [rows] = await db.query(`SELECT COUNT(*) as count FROM bookings WHERE status = 'APPROVED'`);
        // ถ้า participants_emails เป็น JSON array:
        // const [rows] = await db.query(`SELECT SUM(JSON_LENGTH(participants_emails)) as count FROM bookings WHERE status = 'APPROVED'`);
        return rows[0];
    },

    // ดึงอันดับบริษัทที่จองบ่อยที่สุด
    getLeaderboardReservations: async (limit = 5) => {
        const [rows] = await db.query(
            `SELECT guest_company as company, COUNT(*) as reservations
             FROM bookings
             WHERE guest_company IS NOT NULL AND guest_company != ''
             GROUP BY guest_company
             ORDER BY reservations DESC
             LIMIT ?`,
            [limit]
        );
        return rows;
    },

    // ดึงจำนวนการจองรายเดือนสำหรับกราฟ (Monthly Attendance)
    getMonthlyBookingCounts: async (year = new Date().getFullYear()) => {
        const [rows] = await db.query(
            `SELECT
                DATE_FORMAT(start_time, '%Y-%m') as month,
                COUNT(*) as count
             FROM bookings
             WHERE YEAR(start_time) = ? AND status IN ('PENDING', 'APPROVED')
             GROUP BY month
             ORDER BY month ASC`,
            [year]
        );
        // สามารถแปลงให้อยู่ในรูปแบบที่ Frontend ต้องการได้ที่นี่ หรือใน Controller
        return rows;
    },

    // ดึงจำนวน Events (bookings) แยกตาม Role ของผู้จอง (Guest, Employee, Admin)
    getEventsByRole: async () => {
        const [rows] = await db.query(
            `SELECT u.role, COUNT(b.id) as count
             FROM bookings b
             JOIN users u ON b.user_id = u.id
             GROUP BY u.role`
        );
        // สำหรับ Guest Booking ที่ไม่มี user_id แต่มี guest_email
        const [guestBookings] = await db.query(
            `SELECT COUNT(*) as count FROM bookings WHERE user_id IS NULL AND guest_email IS NOT NULL`
        );

        let result = {};
        rows.forEach(row => {
            result[row.role.toLowerCase()] = row.count;
        });
        
        // เพิ่ม Guest ที่ไม่ได้ผูกกับ user_id
        result['guest'] = (result['guest'] || 0) + guestBookings[0].count;

        return result; // เช่น { employee: 10, admin: 2, guest: 5 }
    },
};

module.exports = Analytics;