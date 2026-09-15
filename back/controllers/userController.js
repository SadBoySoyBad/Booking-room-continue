const { errorResponse, publicUser } = require('../utils/http');
const User = require('../models/User'); // Import User model
const bcrypt = require("bcryptjs"); // สำหรับ hash รหัสผ่านหากมีการสร้าง/อัปเดตผู้ใช้แบบ Local Login

const userController = {
    // ฟังก์ชันสำหรับดึงผู้ใช้ทั้งหมด (กรองตาม role และ pagination)
    getAllUsers: async (req, res) => {
        try {
            const { role, page = 1, limit = 10 } = req.query; // รับ role, page, limit จาก query parameter
            const pageNumber = Number(page), pageSize = Number(limit);
            if (!Number.isInteger(pageNumber) || pageNumber < 1 || !Number.isInteger(pageSize) || pageSize < 1 || pageSize > 100) return res.status(400).json({ message: 'Invalid pagination.' });
            const users = await User.getAll(role, pageNumber, pageSize, req.query.q); // เรียกจาก User model
            if (req.query.paginate === 'true') {
              const count = await require('../db').models.User.countDocuments(User.filter(role, req.query.q));
              return res.json({ users, totalPages: Math.max(1, Math.ceil(count / pageSize)), currentPage: pageNumber });
            }
            res.status(200).json(users);
        } catch (error) {
            console.error("Error in getAllUsers:", error);
            return errorResponse(res, error);
        }
    },

    // ฟังก์ชันสำหรับดึงผู้ใช้ตาม ID
    getUserById: async (req, res) => {
        try {
            const user = await User.getById(req.params.id); // เรียกจาก User model
            if (user) {
                // ไม่ควรส่ง password hash กลับไปยัง frontend
                const { password, ...userWithoutPassword } = user;
                res.status(200).json(publicUser(userWithoutPassword));
            } else {
                res.status(404).json({ message: 'User not found' });
            }
        } catch (error) {
            console.error("Error in getUserById:", error);
            return errorResponse(res, error);
        }
    },

    // ฟังก์ชันสำหรับสร้างผู้ใช้ใหม่ (สำหรับ Admin หรือการสมัครสมาชิก Local Login)
    createUser: async (req, res) => {
        const { username, email, password, role = 'employee', phone, company } = req.body;

        if (typeof username !== 'string' || !username.trim() || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || (password != null && typeof password !== 'string')) {
            return res.status(400).json({ message: 'Username and email are required.' });
        }

        try {
            const existingUser = await User.findByUsernameOrEmail(email); // ตรวจสอบว่าอีเมล/ username ซ้ำไหม
            if (existingUser) {
                return res.status(409).json({ message: 'User with this email or username already exists.' });
            }

            const newUser = await User.create(username, email, password, role, phone, company); // เรียกจาก User model
            res.status(201).json({ message: 'User created successfully', user: publicUser(newUser) });
        } catch (error) {
            console.error("Error in createUser:", error);
            return errorResponse(res, error);
        }
    },

    // ฟังก์ชันสำหรับอัปเดตข้อมูลผู้ใช้ (สำหรับ Admin)
    updateUser: async (req, res) => {
        const { id } = req.params;
        const { username, email, password, role, phone, company } = req.body; // รับฟิลด์ที่ต้องการอัปเดต
        const updateData = {};
        if ([username, email, password, phone, company].some(value => value != null && typeof value !== 'string')) return res.status(400).json({ message: 'Invalid user fields.' });
        if (role !== undefined && !['guest', 'employee', 'admin'].includes(role)) return res.status(400).json({ message: 'Invalid role.' });

        if (username !== undefined) updateData.username = username;
        if (email !== undefined) updateData.email = email;
        if (role !== undefined) updateData.role = role;
        if (phone !== undefined) updateData.phone = phone;
        if (company !== undefined) updateData.company = company;

        // ถ้ามีการส่ง password มา ให้อัปเดตและ hash ด้วย
        if (password !== undefined && password !== null && password !== '') {
            updateData.password = await bcrypt.hash(password, 10);
        }

        if (Object.keys(updateData).length === 0) {
            return res.status(400).json({ message: 'No fields provided for update.' });
        }

        try {
            const isUpdated = await User.update(id, updateData); // สมมติว่ามี User.update ใน models/User.js (คุณต้องเพิ่มเอง)
            if (isUpdated) {
                res.status(200).json({ message: 'User updated successfully' });
            } else {
                res.status(404).json({ message: 'User not found or no changes made.' });
            }
        } catch (error) {
            console.error("Error in updateUser:", error);
            return errorResponse(res, error);
        }
    },

    // ฟังก์ชันสำหรับลบผู้ใช้ (สำหรับ Admin)
    deleteUser: async (req, res) => {
        try {
            if (req.params.id === req.user.id) return res.status(409).json({ message: 'You cannot delete your own admin account.' });
            const isDeleted = await User.delete(req.params.id); // สมมติว่ามี User.delete ใน models/User.js (คุณต้องเพิ่มเอง)
            if (isDeleted) {
                res.status(200).json({ message: 'User deleted successfully.' });
            } else {
                res.status(404).json({ message: 'User not found.' });
            }
        } catch (error) {
            console.error("Error in deleteUser:", error);
            return errorResponse(res, error);
        }
    },
};

module.exports = userController;
