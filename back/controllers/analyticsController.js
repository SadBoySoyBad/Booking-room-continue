// back/controllers/analyticsController.js
const Analytics = require('../models/Analytics'); // Import Analytics model

const analyticsController = {
    getSummaryAnalytics: async (req, res) => {
        try {
            const totalReservations = await Analytics.getTotalReservations();
            const totalAttendance = await Analytics.getTotalAttendance();
            const leaderboard = await Analytics.getLeaderboardReservations();
            const monthlyBookings = await Analytics.getMonthlyBookingCounts();
            const eventsByRole = await Analytics.getEventsByRole();

            res.status(200).json({
                totalReservations: totalReservations.count || 0,
                totalAttendance: totalAttendance.count || 0,
                leaderboard: leaderboard,
                monthlyBookings: monthlyBookings,
                eventsByRole: eventsByRole,
            });
        } catch (error) {
            console.error("Error in getSummaryAnalytics:", error);
            res.status(500).json({ message: "Internal Server Error" });
        }
    },

    // (สามารถเพิ่มฟังก์ชันอื่นๆ ที่เกี่ยวกับ Analytics ได้ที่นี่)
};

module.exports = analyticsController;