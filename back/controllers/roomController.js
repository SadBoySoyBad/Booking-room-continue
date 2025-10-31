const Room = require('../models/Room');

const roomController = {
    getAllRooms: async (req, res) => {
        const date = req.query.date || new Date().toISOString().split('T')[0];
        try {
            const rooms = await Room.getAllWithCalculatedStatus(date);
            res.json(rooms);
        } catch (error) {
            console.error('Error in getAllRooms (calculated status):', error);
            res.status(500).json({ message: 'Internal Server Error' });
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
            res.status(500).json({ message: 'Internal Server Error' });
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
            if (error.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({ message: 'Room name already exists.' });
            }
            res.status(500).json({ message: 'Internal Server Error' });
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
            if (error.code === 'ER_DUP_ENTRY') {
                return res.status(409).json({ message: 'Room name already exists.' });
            }
            res.status(500).json({ message: 'Internal Server Error' });
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
            res.status(500).json({ message: 'Internal Server Error' });
        }
    },
};

module.exports = roomController;