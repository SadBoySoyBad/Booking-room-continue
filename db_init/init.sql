-- db_init/init.sql

-- สร้างตาราง users
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(255) UNIQUE,
    password VARCHAR(255) NULL,
    user_id INT NULL,
    google_id VARCHAR(255) UNIQUE,
    google_access_token TEXT,
    google_refresh_token TEXT,
    google_token_expiry DATETIME,
    microsoft_id VARCHAR(255) UNIQUE,
    microsoft_access_token TEXT,
    microsoft_refresh_token TEXT,
    microsoft_token_expiry DATETIME,
    last_login_provider VARCHAR(50),
    role ENUM('employee', 'admin', 'guest') DEFAULT 'employee',
    phone VARCHAR(20) UNIQUE,
    company VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- สร้างตาราง rooms
CREATE TABLE IF NOT EXISTS rooms (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    status ENUM('AVAILABLE', 'OCCUPIED', 'MAINTENANCE') DEFAULT 'AVAILABLE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- สร้างตาราง bookings
CREATE TABLE IF NOT EXISTS bookings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NULL,
    room_id INT NOT NULL,
    topic VARCHAR(255),
    start_time DATETIME NOT NULL,
    end_time DATETIME NOT NULL,
    guest_name VARCHAR(255) NOT NULL,
    guest_email VARCHAR(255) NOT NULL,
    guest_phone VARCHAR(255),
    guest_company VARCHAR(255),
    participants_emails TEXT,
    requirements TEXT,
    status ENUM('PENDING', 'APPROVED', 'REJECTED', 'CANCELED') DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (room_id) REFERENCES rooms(id) ON DELETE CASCADE
);

-- ใส่ข้อมูลห้องเริ่มต้น
INSERT IGNORE INTO rooms (name, status) VALUES -- ใช้ INSERT IGNORE เพื่อไม่ให้ Error ถ้าข้อมูลมีอยู่แล้ว
('Meeting 1', 'AVAILABLE'),
('Meeting 2', 'AVAILABLE'),
('Meeting 3', 'AVAILABLE'),
('Meeting 4', 'AVAILABLE');

-- Note: MARIADB_USER และ MARIADB_PASSWORD ใน docker-compose.yml จะสร้าง user dbmaster อัตโนมัติแล้ว
-- และให้สิทธิ์กับ bookingruk_db แล้ว ไม่ต้องสร้างใน init.sql ซ้ำ