const db = require('../db');

const Booking = {
  create: async (
    roomId, topic, startTime, endTime,
    guestName, guestEmail, guestPhone, guestCompany,
    participantsEmails, requirements, userId = null
  ) => {
    const participantsEmailsStr = JSON.stringify(participantsEmails);
    const requirementsStr = JSON.stringify(requirements);

    const [result] = await db.execute(
      `INSERT INTO bookings
       (room_id, topic, start_time, end_time, guest_name, guest_email, guest_phone, guest_company, participants_emails, requirements, user_id)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        roomId, topic, startTime, endTime,
        guestName, guestEmail, guestPhone, guestCompany,
        participantsEmailsStr, requirementsStr, userId
      ]
    );
    return { id: result.insertId, roomId, topic, startTime, endTime, guestName, guestEmail };
  },

  getAll: async () => {
    const [rows] = await db.query(
      `SELECT b.*, r.name as room_name
       FROM bookings b JOIN rooms r ON b.room_id = r.id`
    );
    return rows;
  },

  getById: async (id) => {
    const [rows] = await db.query(
      `SELECT b.*, r.name as room_name
       FROM bookings b JOIN rooms r ON b.room_id = r.id
       WHERE b.id = ?`,
      [id]
    );
    return rows[0];
  },

  getByDate: async (date) => {
    const [rows] = await db.query(
      `SELECT b.id, b.room_id, b.topic, b.start_time, b.end_time, b.guest_name, b.guest_email, b.guest_phone, b.status,
              r.name as room_name,
              u.username AS employee_username, u.email AS employee_email
       FROM bookings b
       JOIN rooms r ON b.room_id = r.id
       LEFT JOIN users u ON b.user_id = u.id
       WHERE DATE(b.start_time) = ? OR DATE(b.end_time) = ?
       ORDER BY b.start_time ASC`,
      [date, date]
    );
    return rows;
  },

  getByGuestInfo: async (email, phone) => {
    const [rows] = await db.query(
      `SELECT b.*, r.name as room_name
       FROM bookings b JOIN rooms r ON b.room_id = r.id
       WHERE b.guest_email = ? OR b.guest_phone = ?
       ORDER BY b.created_at DESC`,
      [email, phone]
    );
    return rows;
  },

  updateStatus: async (id, status) => {
    const [result] = await db.execute(
      'UPDATE bookings SET status = ? WHERE id = ?',
      [status, id]
    );
    return result.affectedRows > 0;
  },

  delete: async (id) => {
    const [result] = await db.execute('DELETE FROM bookings WHERE id = ?', [id]);
    return result.affectedRows > 0;
  },

  checkRoomAvailability: async (roomId, startTime, endTime, excludeBookingId = null) => {
    let query = `
      SELECT id FROM bookings
      WHERE room_id = ?
      AND (
        (? < end_time AND ? > start_time)
        OR (? = start_time OR ? = end_time)
        OR (start_time < ? AND end_time > ?)
      )
      AND status IN ('PENDING', 'APPROVED')
    `;
    let params = [roomId, startTime, endTime, startTime, endTime, startTime, endTime];

    if (excludeBookingId) {
      query += ` AND id != ?`;
      params.push(excludeBookingId);
    }

    const [rows] = await db.query(query, params);
    return rows.length === 0;
  },

  getByUserId: async (userId) => {
    const [rows] = await db.query(
      `SELECT
          b.id, b.room_id, r.name AS room_name, b.topic, b.start_time, b.end_time,
          b.guest_name, b.guest_email, b.guest_phone, b.guest_company,
          b.participants_emails, b.requirements, b.user_id, b.created_at
       FROM bookings b
       JOIN rooms r ON b.room_id = r.id
       WHERE b.user_id = ?
       ORDER BY b.start_time DESC`,
      [userId]
    );
    return rows.map(row => ({
      ...row,
      participants_emails: row.participants_emails ? JSON.parse(row.participants_emails) : [],
      requirements: row.requirements ? JSON.parse(row.requirements) : []
    }));
  },

  getNotificationsByUserId: async (userId) => {
    console.log(`Fetching dummy notifications for userId: ${userId}`);
    const dummyNotifications = [
      { id: 1, message: 'การประชุม Topic A จะเริ่มในอีก 15 นาที!', status: 'upcoming', date: '2025-07-11 15:00', booking_id: 101 },
      { id: 2, message: 'คำขอจองห้อง Meeting 1 ของคุณได้รับการอนุมัติแล้ว!', status: 'approved', date: '2025-07-10 10:00', booking_id: 100 },
      { id: 3, message: 'การจองห้อง Meeting 2 ของคุณถูกยกเลิกแล้ว!', status: 'canceled', date: '2025-07-09 09:30', booking_id: 99 },
    ];
    return dummyNotifications;
  },

  getByStatus: async (status) => {
    const [rows] = await db.query(
      `SELECT b.*, r.name as room_name
       FROM bookings b JOIN rooms r ON b.room_id = r.id
       WHERE b.status = ?`,
      [status]
    );
    return rows;
  },

  findAllByUserOrGuest: async (userId, email, phone) => {
    const [rows] = await db.query(
      `SELECT
         b.*, r.name AS room_name
       FROM bookings b
       JOIN rooms r ON b.room_id = r.id
       WHERE b.user_id = ? OR b.guest_email = ? OR b.guest_phone = ?
       ORDER BY b.start_time DESC`,
      [userId, email, phone]
    );

    return rows.map(row => ({
      ...row,
      participants_emails: row.participants_emails ? JSON.parse(row.participants_emails) : [],
      requirements: row.requirements ? JSON.parse(row.requirements) : []
    }));
  }
};

module.exports = Booking;
