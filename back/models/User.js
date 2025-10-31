// back/models/User.js
const db = require("../db");
const bcrypt = require("bcryptjs");

const User = {
  getAll: async (role = null, page = 1, limit = 10) => {
    let query =
      "SELECT id, username, email, role, phone, company, last_login_provider, created_at FROM users";
    let params = [];
    if (role && role !== "all") {
      query += " WHERE role = ?";
      params.push(role);
    }
    const offset = (page - 1) * limit;
    query += ` ORDER BY created_at DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), parseInt(offset));
    const [rows] = await db.query(query, params);
    return rows;
  },

  getById: async (id) => {
    const [rows] = await db.query("SELECT * FROM users WHERE id = ?", [id]);
    return rows[0];
  },

  create: async (username, email, password, role = "employee", phone = null, company = null) => {
    const hashedPassword = password ? await bcrypt.hash(password, 10) : null;
    const [result] = await db.execute(
      "INSERT INTO users (username, email, password, role, phone, company) VALUES (?, ?, ?, ?, ?, ?)",
      [username, email || null, hashedPassword, role, phone || null, company || null]
    );
    return { id: result.insertId, username, email, role, phone, company };
  },

  // ✅ สำหรับ Guest (ไม่ใช้ email หรือ password)
  createGuest: async (username, phone, company = null) => {
    const [result] = await db.execute(
      "INSERT INTO users (username, phone, company, role, last_login_provider) VALUES (?, ?, ?, 'guest', 'guest')",
      [username, phone, company]
    );
    return await User.getById(result.insertId);
  },

  update: async (id, data) => {
    const fields = Object.keys(data).map((key) => `${key} = ?`).join(", ");
    const values = Object.values(data);
    if (values.length === 0) return false;
    const [result] = await db.execute(`UPDATE users SET ${fields} WHERE id = ?`, [...values, id]);
    return result.affectedRows > 0;
  },

  delete: async (id) => {
    const [result] = await db.execute("DELETE FROM users WHERE id = ?", [id]);
    return result.affectedRows > 0;
  },

  findByUsernameOrEmail: async (identifier) => {
    const [rows] = await db.query(
      "SELECT id, username, email, password, role FROM users WHERE username = ? OR email = ?",
      [identifier, identifier]
    );
    return rows[0];
  },

  // ✅ สำหรับ Guest Login (ค้นหาเบอร์โทร)
  findByPhone: async (phone) => {
    const [rows] = await db.query("SELECT * FROM users WHERE phone = ?", [phone]);
    return rows[0];
  },

  findByGoogleId: async (googleId) => {
    const [rows] = await db.query("SELECT * FROM users WHERE google_id = ?", [googleId]);
    return rows[0];
  },

  findByMicrosoftId: async (microsoftId) => {
    const [rows] = await db.query("SELECT * FROM users WHERE microsoft_id = ?", [microsoftId]);
    return rows[0];
  },

  findByEmail: async (email) => {
    const [rows] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
    return rows[0];
  },

  createOAuthUser: async (
    displayName,
    email,
    googleId,
    googleAccessToken,
    googleRefreshToken,
    googleTokenExpiry,
    microsoftId,
    microsoftAccessToken,
    microsoftRefreshToken,
    microsoftTokenExpiry,
    provider,
    company
  ) => {
    const [result] = await db.execute(
      `INSERT INTO users (username, email, google_id, google_access_token, google_refresh_token, google_token_expiry,
                          microsoft_id, microsoft_access_token, microsoft_refresh_token, microsoft_token_expiry,
                          last_login_provider, company, role)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'employee')`,
      [
        displayName,
        email || null,
        googleId || null,
        googleAccessToken || null,
        googleRefreshToken || null,
        googleTokenExpiry || null,
        microsoftId || null,
        microsoftAccessToken || null,
        microsoftRefreshToken || null,
        microsoftTokenExpiry || null,
        provider,
        company || "unknown"
      ]
    );
    const [newUserRow] = await db.query("SELECT * FROM users WHERE id = ?", [result.insertId]);
    return newUserRow[0];
  },

  updateGoogleAuth: async (userId, googleId, accessToken, refreshToken, tokenExpiry) => {
    await db.execute(
      `UPDATE users SET google_id = ?, google_access_token = ?, google_refresh_token = ?, google_token_expiry = ?, last_login_provider = 'google' WHERE id = ?`,
      [
        googleId || null,
        accessToken || null,
        refreshToken || null,
        tokenExpiry || null,
        userId
      ]
    );
  },

  updateMicrosoftAuth: async (userId, microsoftId, accessToken, refreshToken, tokenExpiry) => {
    await db.execute(
      `UPDATE users SET microsoft_id = ?, microsoft_access_token = ?, microsoft_refresh_token = ?, microsoft_token_expiry = ?, last_login_provider = 'microsoft' WHERE id = ?`,
      [
        microsoftId || null,
        accessToken || null,
        refreshToken || null,
        tokenExpiry || null,
        userId
      ]
    );
  }
};

module.exports = User;
