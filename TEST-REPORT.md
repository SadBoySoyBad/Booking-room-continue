# ผลตรวจ — 15 กันยายน 2026

## ระบบที่เปิดไว้

- หน้าเว็บ: http://localhost:3000
- Backend readiness: http://localhost:3001/api/readyz
- Frontend proxy readiness: http://localhost:3000/api/readyz
- Docker Compose: frontend, backend และ MongoDB ทำงาน; backend/database มีสถานะ healthy
- ล่าสุด backend ใน Docker ใช้ Atlas ใหม่ `booking.7uebkhr.mongodb.net` / database `booking` ผ่าน `docker-compose.atlas.yml`; Mongo volume เดิมในเครื่องยังเก็บไว้
- ล้างเฉพาะ 2 บัญชีและ 1 booking จำลองที่สร้างสำหรับทดสอบ Docker แล้ว
- หยุด container ฐานข้อมูลทดสอบแยก `booking-room-audit-mongo` แล้ว เริ่มอีกครั้งด้วย `docker start booking-room-audit-mongo` เมื่อต้องการรัน tests

## ผลการตรวจ

| การตรวจ | ผล |
|---|---|
| Backend integration tests กับ Mongo replica set จริง รวมโหมด production | 20 ผ่าน, 0 ไม่ผ่าน |
| Frontend HTTP proxy tests | 4 ผ่าน, 0 ไม่ผ่าน |
| Production cookie, Google/Microsoft callback, OAuth state | ผ่านด้วย provider network stub และ Mongo จริง |
| Concurrent reservations 8 คำขอ | สำเร็จ 1, HTTP 409 จำนวน 7 |
| Vue SFC parse/compile | ทุกไฟล์ผ่าน |
| Nuxt TypeScript typecheck | ผ่าน |
| Production build | ผ่าน |
| Build ด้วย Nitro Vercel preset / Node 22 | ผ่าน; function bundle 2.35 MB |
| รัน handler จาก Vercel build ในเครื่อง | หน้าเว็บ/readiness/rooms 200; OAuth 302 พร้อม state cookies 2 ตัว |
| Docker build frontend/backend และ Compose startup | ผ่าน |
| npm audit — frontend | 0 vulnerabilities |
| npm audit — backend | 0 vulnerabilities |
| Guest login → จอง → confirmation → history | ผ่านใน browser |
| แก้เบอร์ในฟอร์มจอง | ผ่าน ไม่มี undefined-variable exception |
| Admin ผ่าน HttpOnly cookie โดยไม่มี localStorage token | ผ่าน |
| อนุมัติคำขอจริงและโหลดทุกหน้า admin | ผ่าน |
| Settings บันทึกแล้ว reload | ค่าเดิมยังอยู่ |
| Filter และ export บัญชี | ผ่าน |
| แก้ชื่อ Guest ที่ไม่มีอีเมล | ผ่าน |
| Console ของ workflow Docker รอบสุดท้าย | ไม่พบ error/warning ระหว่าง flow ที่ตรวจ |
| ภาพหน้า login เทียบ production ที่ viewport/zoom เดียวกัน | PNG SHA-256 ตรงกัน |

SHA-256 ของภาพ login คู่สุดท้าย:

`dfbe8df91c1bbcf9ba13c83db98e65aa7275dd082136979ecc52cbdcac8dd896`

ภาพและ logs เก็บใน `artifacts/`, `.playwright-mcp/` และ `*-results.log` ซึ่งถูก ignore จาก Git

## ตรวจเจอเพิ่มเติมจากระบบจริง

1. **Vercel backend ล้มที่ DNS ของ Atlas** — Runtime Log ที่ผู้ใช้ส่งระบุ `querySrv ENOTFOUND _mongodb._tcp.booking.vs1tbkz.mongodb.net` แล้ว process exit 1 การตรวจ SRV ผ่าน DNS `1.1.1.1` และ `8.8.8.8` ก็ได้ NXDOMAIN (ไม่พบชื่อ) จึงยืนยันจุดที่ล้มได้แล้ว แต่ยังต้องดู Atlas ว่า cluster ถูกพัก ลบ หรือ hostname เปลี่ยน ไม่ใช่หลักฐานว่ารหัสผ่านผิด
2. **แก้บั๊ก OAuth ใน Nitro proxy** — ก่อนแก้ backend ตอบ 302 + state cookies 2 ตัว แต่ proxy ตาม redirect เองจนตอบ HTML 200 หลังแก้ใช้ `redirect: 'manual'` ผลผ่าน Docker จริงเป็น 302 + cookies ครบทั้งสองตัว และ browser ไปยัง Google ได้
3. **Google localhost callback ไม่ตรง** — Google จริงตอบ `redirect_uri_mismatch` เมื่อใช้ `http://localhost:3000/api/auth/google/callback` ต้องเพิ่ม URL นี้ใน Authorized redirect URIs ของ OAuth client ที่ใช้ สำหรับ production ใหม่ใช้ `https://booking-room-continue.vercel.app/api/auth/google/callback`
4. **Microsoft local ยังไม่ตั้งค่า** — `/api/auth/microsoft` ตอบ 503 พร้อมข้อความ sign-in has not been configured ต้องตั้ง client credentials และ callback ใน environment/Entra
5. **เพิ่ม `npm run db:check`** — ตรวจ DNS, Mongo ping และจำนวน documents แบบอ่านอย่างเดียว ไม่ seed/migrate และไม่พิมพ์ URI/password ผ่านกับฐานข้อมูลทดสอบในเครื่อง
6. **ปฏิเสธวันที่ไม่มีจริง** — `Date.parse` เดิมยอมรับ 30 กุมภาพันธ์แล้วเลื่อนไปเดือนมีนาคม เพิ่มการตรวจวันปฏิทินและรูปแบบ ISO พร้อม timezone ก่อนบันทึก ทดสอบ malformed dates ผ่าน API ได้ 400

หลักฐานเพิ่มเติม: `artifacts/deployment-recheck.json`, `artifacts/oauth-proxy-recheck.json`, `artifacts/vercel-artifact-check.json`, `back/production-test-results.log`, `front/vercel-build-results.log`

## ยังไม่ได้ยืนยัน

- Deployment ของ source ใหม่นี้บน Vercel
- การเชื่อมต่อจาก Vercel ไปยัง Atlas ใหม่ (ยืนยัน credentials และการเชื่อมต่อจากเครื่อง/Docker แล้ว; ผู้ใช้เพิ่ม IP Access List สำหรับ Vercel และแสดงสถานะ Active แล้ว)
- Google/Microsoft OAuth round-trip และการส่ง Calendar event ด้วย provider credentials จริง
- Attendance/check-in จริง, immutable audit log, SMTP reminders และกราฟ company donut ที่ใน source เดิมยังเป็น placeholder

Calendar adapter ทดสอบด้วย stub ของ Google API จึงไม่ได้ส่ง event/email ให้บุคคลอื่น การทดสอบที่ผ่านไม่ได้รับรองว่าไม่มีบัค 100% หรือไม่มีช่องโหว่ที่ยังไม่มีการรายงาน

## Atlas ใหม่: เชื่อมและทดสอบแล้ว

- ผู้ใช้สร้าง cluster ใหม่ชื่อ Booking ที่ `booking.7uebkhr.mongodb.net`; เป็นข้อมูลใหม่ ไม่ใช่การกู้ข้อมูลเดิม
- บันทึก URI ใน `back/.env` ซึ่ง Git ignore แล้ว ไม่มี credentials ในเอกสารหรือไฟล์ Compose
- ตรวจพบฐานข้อมูลว่างก่อนเริ่ม; รัน `db:init` สร้าง collections/indexes และห้อง Meeting 1–4 แล้ว
- ทดสอบ API กับ Atlas จริงในฐานข้อมูลชั่วคราวแยก: guest login/cookie, จองพร้อมกัน 2 คำขอได้ 201/409, admin approval, history/participants, readiness ผ่าน และลบฐานข้อมูลทดสอบนั้นแล้ว
- Docker backend ใช้ hostname ใหม่จริง; frontend proxy `/api/readyz` และ `/api/rooms` ตอบ 200 มี 4 ห้อง
- ผลตรวจ DB ใช้งานหลังล้างข้อมูลทดสอบ: users 0, rooms 4, bookings 0
- หลักฐาน: `artifacts/atlas-smoke-results.json`, `atlas-smoke-results.log`, `atlas-backend-results.log`

## Git / production

จัดชุดแก้บน branch `codex/restore-booking-system` สำหรับตรวจและ deploy ต่อ; ณ เวลาบันทึกรายงานนี้ยังไม่ได้ push หรือ deploy โค้ดใหม่
หากจะ push ต่อ ต้องแจ้ง branch/commit, รายการแก้ไข และผลทดสอบตามที่ผู้ใช้กำหนด
