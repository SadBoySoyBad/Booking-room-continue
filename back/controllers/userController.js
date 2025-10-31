// // back/controllers/userController.js
// const User = require('../models/User'); // Import User model

// const userController = {
//     // ฟังก์ชันสำหรับดึงผู้ใช้ทั้งหมด (อาจกรองตาม role และ pagination)
//     getAllUsers: async (req, res) => {
//         try {
//             const { role, page = 1, limit = 10 } = req.query;
//             const users = await User.getAll(role, page, limit); // เรียกจาก User model
//             res.status(200).json(users);
//         } catch (error) {
//             console.error("Error in getAllUsers:", error);
//             res.status(500).json({ message: "Internal Server Error" });
//         }
//     },
//     // ฟังก์ชันสำหรับดึงผู้ใช้ตาม ID
//     getUserById: async (req, res) => {
//         try {
//             const user = await User.getById(req.params.id);
//             if (user) {
//                 res.status(200).json(user);
//             } else {
//                 res.status(404).json({ message: "User not found" });
//             }
//         } catch (error) {
//             console.error("Error in getUserById:", error);
//             res.status(500).json({ message: "Internal Server Error" });
//         }
//     },
//     // (เพิ่ม) ฟังก์ชันสำหรับอัปเดตข้อมูลผู้ใช้ (เช่น เปลี่ยน role)
//     updateUser: async (req, res) => {
//         const { id } = req.params;
//         const { username, email, role, phone, company } = req.body; // รับฟิลด์ที่ต้องการอัปเดต
//         try {
//             const isUpdated = await User.update(id, { username, email, role, phone, company }); // สมมติว่ามี User.update
//             if (isUpdated) {
//                 res.status(200).json({ message: 'User updated successfully' });
//             } else {
//                 res.status(404).json({ message: 'User not found or no changes made' });
//             }
//         } catch (error) {
//             console.error("Error in updateUser:", error);
//             res.status(500).json({ message: "Internal Server Error" });
//         }
//     },
//     // (เพิ่ม) ฟังก์ชันสำหรับลบผู้ใช้
//     deleteUser: async (req, res) => {
//         try {
//             const isDeleted = await User.delete(req.params.id); // สมมติว่ามี User.delete
//             if (isDeleted) {
//                 res.status(200).json({ message: 'User deleted successfully' });
//             } else {
//                 res.status(404).json({ message: 'User not found' });
//             }
//         } catch (error) {
//             console.error("Error in deleteUser:", error);
//             res.status(500).json({ message: "Internal Server Error" });
//         }
//     },
// };

// module.exports = userController;
// back/controllers/userController.js
const User = require('../models/User'); // Import User model
const bcrypt = require("bcryptjs"); // สำหรับ hash รหัสผ่านหากมีการสร้าง/อัปเดตผู้ใช้แบบ Local Login

const userController = {
    // ฟังก์ชันสำหรับดึงผู้ใช้ทั้งหมด (กรองตาม role และ pagination)
    getAllUsers: async (req, res) => {
        try {
            const { role, page = 1, limit = 10 } = req.query; // รับ role, page, limit จาก query parameter
            const users = await User.getAll(role, parseInt(page), parseInt(limit)); // เรียกจาก User model
            res.status(200).json(users);
        } catch (error) {
            console.error("Error in getAllUsers:", error);
            res.status(500).json({ message: "Internal Server Error", error: error.message });
        }
    },

    // ฟังก์ชันสำหรับดึงผู้ใช้ตาม ID
    getUserById: async (req, res) => {
        try {
            const user = await User.getById(req.params.id); // เรียกจาก User model
            if (user) {
                // ไม่ควรส่ง password hash กลับไปยัง frontend
                const { password, ...userWithoutPassword } = user; 
                res.status(200).json(userWithoutPassword);
            } else {
                res.status(404).json({ message: 'User not found' });
            }
        } catch (error) {
            console.error("Error in getUserById:", error);
            res.status(500).json({ message: "Internal Server Error", error: error.message });
        }
    },

    // ฟังก์ชันสำหรับสร้างผู้ใช้ใหม่ (สำหรับ Admin หรือการสมัครสมาชิก Local Login)
    createUser: async (req, res) => {
        const { username, email, password, role = 'employee', phone, company } = req.body;
        
        if (!username || !email || !password) {
            return res.status(400).json({ message: 'Username, email, and password are required.' });
        }

        try {
            const existingUser = await User.findByUsernameOrEmail(email); // ตรวจสอบว่าอีเมล/ username ซ้ำไหม
            if (existingUser) {
                return res.status(409).json({ message: 'User with this email or username already exists.' });
            }

            const newUser = await User.create(username, email, password, role, phone, company); // เรียกจาก User model
            res.status(201).json({ message: 'User created successfully', user: newUser });
        } catch (error) {
            console.error("Error in createUser:", error);
            res.status(500).json({ message: "Internal Server Error", error: error.message });
        }
    },

    // ฟังก์ชันสำหรับอัปเดตข้อมูลผู้ใช้ (สำหรับ Admin)
    updateUser: async (req, res) => {
        const { id } = req.params;
        const { username, email, password, role, phone, company } = req.body; // รับฟิลด์ที่ต้องการอัปเดต
        const updateData = {};

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
            res.status(500).json({ message: "Internal Server Error", error: error.message });
        }
    },

    // ฟังก์ชันสำหรับลบผู้ใช้ (สำหรับ Admin)
    deleteUser: async (req, res) => {
        try {
            const isDeleted = await User.delete(req.params.id); // สมมติว่ามี User.delete ใน models/User.js (คุณต้องเพิ่มเอง)
            if (isDeleted) {
                res.status(200).json({ message: 'User deleted successfully.' });
            } else {
                res.status(404).json({ message: 'User not found.' });
            }
        } catch (error) {
            console.error("Error in deleteUser:", error);
            res.status(500).json({ message: "Internal Server Error", error: error.message });
        }
    },
};

module.exports = userController;