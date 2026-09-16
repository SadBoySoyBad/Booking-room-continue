const { errorResponse, publicUser } = require('../utils/http');
const { isTimezoneDateTime } = require('../utils/dates');
const Booking = require("../models/Booking");
const Room = require("../models/Room");
const User = require("../models/User"); // เพิ่ม User model สำหรับดึง info
const calendarService = require("../services/calendarService"); // สำหรับ Calendar Integration

const bookingController = {
  createBooking: async (req, res) => {
    // แก้ไขชื่อตัวแปรตรงนี้ให้ตรงกับ Payload ที่มาจาก Front-end
    const {
      room_id, // เปลี่ยนจาก roomId
      topic,
      start_time, // เปลี่ยนจาก startTime
      end_time, // เปลี่ยนจาก endTime
      guest_name, // เปลี่ยนจาก guestName
      guest_email, // เปลี่ยนจาก guestEmail
      guest_phone, // เปลี่ยนจาก guestPhone
      guest_company, // เปลี่ยนจาก guestCompany
      participants_emails,
      participantsEmails = participants_emails,
      requirements,
    } = req.body;
    const userId = req.user ? req.user.id : null; // ดึง userId จาก JWT payload ถ้ามี


    // แก้ไขการตรวจสอบ validation ให้ใช้ชื่อตัวแปรที่ถูกต้อง
    if (
      !room_id ||
      !topic ||
      !start_time ||
      !end_time ||
      !guest_name ||
      !guest_email
    ) {
      return res
        .status(400)
        .json({ message: "Missing required booking fields." });
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (![topic, guest_name, guest_email].every(v => typeof v === 'string' && v.trim()) ||
        !emailPattern.test(guest_email) ||
        ![start_time, end_time].every(isTimezoneDateTime) ||
        (participantsEmails !== undefined && (!Array.isArray(participantsEmails) || !participantsEmails.every(v => typeof v === 'string' && emailPattern.test(v)))) ||
        (requirements !== undefined && (!Array.isArray(requirements) || !requirements.every(v => typeof v === 'string')))) {
      return res.status(400).json({ message: 'Invalid booking fields, email, or timezone-aware date/time.' });
    }
    if (new Date(start_time) >= new Date(end_time)) {
      return res
        .status(400)
        .json({ message: "End time must be after start time." });
    }
    if (new Date(start_time) < new Date()) {
      return res
        .status(400)
        .json({ message: "Booking start time cannot be in the past." });
    }

    try {
      const room = await Room.getById(room_id); // ใช้ room_id
      if (!room) {
        return res.status(404).json({ message: "Selected room not found." });
      }
      if (room.status === "MAINTENANCE") {
        return res
          .status(400)
          .json({
            message: "Selected room is under maintenance and cannot be booked.",
          });
      }

      const isAvailable = await Booking.checkRoomAvailability(
        room_id, // ใช้ room_id
        start_time, // ใช้ start_time
        end_time // ใช้ end_time
      );
      if (!isAvailable) {
        return res
          .status(409)
          .json({
            message: "Room is already booked for the selected time slot.",
          });
      }

      const newBooking = await Booking.create(
        room_id,
        topic,
        start_time,
        end_time,
        guest_name,
        guest_email,
        guest_phone,
        guest_company,
        participantsEmails || [],
        requirements || [],
        userId
      );

      // Calendar Integration (Google Calendar)
      if (userId && process.env.GOOGLE_CALENDAR_ENABLED === 'true') {
        const currentUser = await User.getById(userId);
        if (currentUser && currentUser.last_login_provider === "google" && currentUser.settings?.auto_add_calendar !== 0) {
          try {
            await calendarService.createGoogleCalendarEvent(currentUser.id, {
              ...newBooking,
              room_name: room.name,
              start_time: new Date(newBooking.start_time).toISOString(),
              end_time: new Date(newBooking.end_time).toISOString(),
            });
          } catch (calendarError) {
            console.warn(
              "Failed to create Google Calendar event:",
              calendarError.message
            );
          }
        }
      }

      res
        .status(201)
        .json({
          message: "Booking request submitted successfully. Awaiting approval.",
          booking: newBooking,
        });
    } catch (error) {
      console.error("Error in createBooking:", error);
      return errorResponse(res, error);
    }
  },

  // getAll: async (req, res) => {
  //   try {
  //   //   const bookings = await Booking.getAll();
  //   //   res.status(200).json(bookings);
  //   // } catch (error) {
  //   //   console.error("Error in getAll:", error);
  //   //   return errorResponse(res, error);
  //   // }
  //   const { status } = req.query; // ดึง status จาก query parameter
  //       let bookings;
  //       if (status) {
  //           // ถ้ามี status ให้เรียก Model function ที่กรอง status ได้
  //           // คุณจะต้องสร้าง Booking.getByStatus(status) ใน Booking.js
  //           bookings = await Booking.getByStatus(status);
  //       } else {
  //           bookings = await Booking.getAll();
  //       }
  //       res.status(200).json(bookings);
  //   } catch (error) {
  //       console.error("Error in getAll:", error);
  //       return errorResponse(res, error);
  //   }
  // },


  getAll: async (req, res) => {
    try {
      const { status } = req.query; // <--- ดึง status จาก query parameter
      let bookings;
      if (status) {
        bookings = await Booking.getByStatus(status); // <--- เรียก Booking.getByStatus ถ้ามี status
      } else {
        bookings = await Booking.getAll(); // <--- เรียก Booking.getAll ถ้าไม่มี status
      }
      res.status(200).json(bookings);
    } catch (error) {
      console.error("Error in getAll:", error);
      return errorResponse(res, error);
    }
  },



  getByDate: async (req, res) => {
    const { date } = req.params;
    const currentUserId = req.user?.id;
    const currentUserEmail = req.user?.email;
    const currentUserPhone = req.user?.phone;

    try {
      const bookings = await Booking.getByDate(date);

      const filteredBookings = bookings.map((booking) => {
        const isOwner =
          req.user.role === 'admin' || (booking.user_id && booking.user_id === currentUserId);

        if (isOwner) {
          return booking; // แสดงข้อมูลเต็มของตัวเอง
        } else {
          return {
            id: booking.id,
            room_id: booking.room_id,
            start_time: booking.start_time,
            end_time: booking.end_time,
            status: booking.status,
            isAvailable: false,
          }; // ซ่อนข้อมูลของคนอื่น
        }
      });

      res.status(200).json(filteredBookings);
    } catch (error) {
      console.error("Error in getByDate:", error);
      return errorResponse(res, error);
    }
  },


  getByUserId: async (req, res) => {
    try {

      const bookings = await Booking.getByUserId(req.user.id);

      res.status(200).json(bookings);
    } catch (error) {
      console.error("Error in getByUserId:", error);
      return errorResponse(res, error);
    }
  },

  getByGuestInfo: async (req, res) => {
    const { email, phone } = req.query;
    if (!email || !phone) {
      return res.status(400).json({ message: "Email and phone are required." });
    }
    try {
      const bookings = await Booking.getByUserId(req.user.id);
      res.status(200).json(bookings);
    } catch (error) {
      console.error("Error in getByGuestInfo:", error);
      return errorResponse(res, error);
    }
  },

  updateStatus: async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    if (!status || !['PENDING', 'APPROVED', 'REJECTED', 'CANCELED'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status provided.' });
    }
    try {
      const isUpdated = await Booking.updateStatus(id, status);
      if (isUpdated) {
        if (process.env.GOOGLE_CALENDAR_ENABLED === 'true') {
          try { await calendarService.syncGoogleCalendarStatus(await Booking.getById(id)); }
          catch (error) { console.warn('Calendar status sync failed:', error.message); }
        }
        res.status(200).json({ message: 'Booking status updated successfully.' });
      } else {
        res.status(404).json({ message: 'Booking not found.' });
      }
    } catch (error) {
      console.error("Error in updateStatus:", error);
      return errorResponse(res, error);
    }
  },

  delete: async (req, res) => {
    const { id } = req.params;
    try {
      const booking = await Booking.getById(id);
      if (!booking) return res.status(404).json({ message: 'Booking not found.' });
      if (booking.google_event_id && process.env.GOOGLE_CALENDAR_ENABLED === 'true') {
        try { await calendarService.syncGoogleCalendarStatus({ ...booking, status: 'CANCELED' }); }
        catch (error) {
          // Keep the booking/event reference so the administrator can retry.
          console.warn('Calendar deletion failed:', error.response?.status || error.code || error.name);
          return res.status(502).json({ message: 'Calendar cleanup failed. Booking was not deleted; please retry.' });
        }
      }
      const isDeleted = await Booking.delete(id);
      if (isDeleted) {
        res.status(200).json({ message: 'Booking deleted successfully.' });
      } else {
        res.status(404).json({ message: 'Booking not found.' });
      }
    } catch (error) {
      console.error("Error in delete:", error);
      return errorResponse(res, error);
    }
  },

  getNotificationsByUserId: async (req, res) => {
    try {
      const notifications = await Booking.getNotificationsByUserId(req.user.id);
      res.status(200).json(notifications);
    } catch (error) {
      console.error("Error in getNotificationsByUserId:", error);
      return errorResponse(res, error);
    }
  }
};

module.exports = bookingController;

const getMyHistory = async (req, res) => {
  const { id, email, phone } = req.user;

  try {
    const myBookings = await Booking.findAllByUserOrGuest(id, email, phone);
    res.json(myBookings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch booking history' });
  }
};
