const { errorResponse, publicUser } = require('../utils/http');
const Room = require('../models/Room');

const roomController = {
    getAllRooms: async (req, res) => {
        const date = req.query.date || require('../utils/dates').bangkokDate();
        try {
            const rooms = await Room.getAllWithCalculatedStatus(date);
            res.json(rooms.map(room => {
                const booking = room.current_booking;
                if (!booking || req.user?.role === 'admin' || (req.user?.id && booking.user_id === req.user.id)) return room;
                return { ...room, current_booking: { id: booking.id, start_time: booking.start_time, end_time: booking.end_time, status: booking.status } };
            }));
        } catch (error) {
            console.error('Error in getAllRooms (calculated status):', error);
            return errorResponse(res, error);
        }
    },

    getRoomById: async (req, res) => {
        try {
            const room = await Room.getById(req.params.id);
            if (room) {
                res.json(room);
            } else {
                res.status(404).json({ message: 'Room not found' });
            }
        } catch (error) {
            console.error('Error in getRoomById:', error);
            return errorResponse(res, error);
        }
    },

    createRoom: async (req, res) => {
        const { name, status } = req.body;
        if (!name) {
            return res.status(400).json({ message: 'Room name is required.' });
        }
        try {
            const newRoom = await Room.create(name, status || 'AVAILABLE');
            res.status(201).json({ message: 'Room created successfully', room: newRoom });
        } catch (error) {
            console.error('Error in createRoom:', error);
            if (error.code === 11000) {
                return res.status(409).json({ message: 'Room name already exists.' });
            }
            return errorResponse(res, error);
        }
    },

    updateRoom: async (req, res) => {
        const { id } = req.params;
        const { name, status } = req.body;
        if (!name && !status) {
            return res.status(400).json({ message: 'At least one field (name or status) is required for update.' });
        }
        try {
            const success = await Room.update(id, name, status);
            if (success) {
                res.json({ message: 'Room updated successfully' });
            } else {
                res.status(404).json({ message: 'Room not found or no changes made' });
            }
        } catch (error) {
            console.error('Error in updateRoom:', error);
            if (error.code === 11000) {
                return res.status(409).json({ message: 'Room name already exists.' });
            }
            return errorResponse(res, error);
        }
    },

    deleteRoom: async (req, res) => {
        try {
            const success = await Room.delete(req.params.id);
            if (success) {
                res.json({ message: 'Room deleted successfully' });
            } else {
                res.status(404).json({ message: 'Room not found' });
            }
        } catch (error) {
            console.error('Error in deleteRoom:', error);
            return errorResponse(res, error);
        }
    },
};

module.exports = roomController;
