const db = require('../db');

const Room = {
    // getAllWithCalculatedStatus: async (forDate = new Date().toISOString().split('T')[0]) => {
    //     const [rooms] = await db.query('SELECT id, name, status FROM rooms');

    //     const roomsWithStatus = await Promise.all(rooms.map(async (room) => {
    //         if (room.status === 'MAINTENANCE') {
    //             return { ...room, display_status: 'MAINTENANCE' };
    //         }

    //         const [bookings] = await db.query(
    //             `SELECT start_time, end_time, status FROM bookings
    //              WHERE room_id = ? AND DATE(start_time) = ?
    //              AND status IN ('PENDING', 'APPROVED')`,
    //             [room.id, forDate]
    //         );

    //         const isFullyBooked = Room._checkIfFullyBooked(bookings);

    //         return {
    //             ...room,
    //             display_status: isFullyBooked ? 'OCCUPIED' : 'AVAILABLE'
    //         };
    //     }));

    //     return roomsWithStatus;
    // },

    getAllWithCalculatedStatus: async (forDate = new Date().toISOString().split('T')[0]) => {
        const [rooms] = await db.query('SELECT id, name, status FROM rooms');

        const roomsWithDetails = await Promise.all(rooms.map(async (room) => {
             // Current datetime string

            let currentBooking = null; // เริ่มต้นให้เป็น null
            let displayStatus = room.status; // ใช้ status เริ่มต้นจาก DB

            if (room.status === 'MAINTENANCE') {
                displayStatus = 'MAINTENANCE';
            } else {
                // ดึงการจองที่ 'PENDING' หรือ 'APPROVED' และอยู่ในช่วงเวลาปัจจุบัน
                const [liveBookings] = await db.query(
                    `SELECT b.id, b.topic, b.start_time, b.end_time, b.guest_name, b.guest_company, b.status
                     FROM bookings b
                     WHERE b.room_id = ?
                     AND b.status IN ('PENDING', 'APPROVED')
                     AND NOW() < b.end_time AND NOW() > b.start_time`, // การจองที่ทับซ้อนกับเวลาปัจจุบัน
                    [room.id]
                );

                if (liveBookings.length > 0) {
                    currentBooking = liveBookings[0]; // สมมติว่ามีแค่ 1 การจองที่ทับซ้อนกันในเวลาจริง
                    displayStatus = 'OCCUPIED';
                } else {
                    // ถ้าไม่มีการจองที่กำลังดำเนินอยู่ ให้ตรวจสอบว่ามีจองในวันนี้แล้วหรือยัง
                    const [todayBookings] = await db.query(
                        `SELECT start_time, end_time, status FROM bookings
                         WHERE room_id = ? AND DATE(start_time) = ?
                         AND status IN ('PENDING', 'APPROVED')`,
                        [room.id, forDate]
                    );

                    const isFullyBookedForDay = Room._checkIfFullyBooked(todayBookings);
                    displayStatus = isFullyBookedForDay ? 'OCCUPIED' : 'AVAILABLE'; // ถ้าเต็มวันก็ให้เป็น OCCUPIED
                }
            }

            return {
                ...room,
                display_status: displayStatus,
                current_booking: currentBooking, // ส่งข้อมูลการจองปัจจุบันกลับไปด้วย
            };
        }));

        return roomsWithDetails;
    },

    _checkIfFullyBooked: (bookings) => {
        const dayStart = 8 * 60; // 8:00 AM in minutes from midnight
        const dayEnd = 18 * 60; // 6:00 PM in minutes from midnight
        const totalBookingMinutes = dayEnd - dayStart;

        let bookedIntervals = [];

        bookings.forEach(booking => {
            const start = new Date(booking.start_time);
            const end = new Date(booking.end_time);

            let bookingStartMinutes = start.getHours() * 60 + start.getMinutes();
            let bookingEndMinutes = end.getHours() * 60 + end.getMinutes();

            bookingStartMinutes = Math.max(bookingStartMinutes, dayStart);
            bookingEndMinutes = Math.min(bookingEndMinutes, dayEnd);

            if (bookingEndMinutes > bookingStartMinutes) {
                bookedIntervals.push({ start: bookingStartMinutes, end: bookingEndMinutes });
            }
        });

        bookedIntervals.sort((a, b) => a.start - b.start);
        let mergedIntervals = [];
        if (bookedIntervals.length > 0) {
            mergedIntervals.push(bookedIntervals[0]);
            for (let i = 1; i < bookedIntervals.length; i++) {
                let lastMerged = mergedIntervals[mergedIntervals.length - 1];
                if (bookedIntervals[i].start <= lastMerged.end) {
                    lastMerged.end = Math.max(lastMerged.end, bookedIntervals[i].end);
                } else {
                    mergedIntervals.push(bookedIntervals[i]);
                }
            }
        }

        let totalBookedDuration = 0;
        mergedIntervals.forEach(interval => {
            const actualStart = Math.max(interval.start, dayStart);
            const actualEnd = Math.min(interval.end, dayEnd);
            totalBookedDuration += (actualEnd - actualStart);
        });

        return totalBookedDuration >= totalBookingMinutes;
    },

    getById: async (id) => {
        const [rows] = await db.query('SELECT id, name, status FROM rooms WHERE id = ?', [id]);
        return rows[0];
    },
    create: async (name, status = 'AVAILABLE') => {
        const [result] = await db.execute(
            'INSERT INTO rooms (name, status) VALUES (?, ?)',
            [name, status]
        );
        return { id: result.insertId, name, status };
    },
    update: async (id, name, status) => {
        const [result] = await db.execute(
            'UPDATE rooms SET name = ?, status = ? WHERE id = ?',
            [name, status, id]
        );
        return result.affectedRows > 0;
    },
    delete: async (id) => {
        const [result] = await db.execute('DELETE FROM rooms WHERE id = ?', [id]);
        return result.affectedRows > 0;
    },
};

module.exports = Room;