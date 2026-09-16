# ผลตรวจ — 15–16 กันยายน 2026

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
| Backend integration tests กับ Mongo replica set จริง รวมโหมด production | 24 ผ่าน, 0 ไม่ผ่าน |
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

- Google production callback ยังตอบ `redirect_uri_mismatch`; ต้องลงทะเบียน callback ของ frontend ใน Google Cloud
- บัญชีผู้ดูแลถาวรรออีเมลที่เจ้าของระบุ; Microsoft credentials ยังไม่มี
- Google/Microsoft OAuth round-trip และการส่ง Calendar event ด้วย provider credentials จริง
- Attendance/check-in จริง, immutable audit log และ SMTP reminders; company donut ที่เดิมเป็น placeholder เชื่อมข้อมูลจริงแล้วในรอบแก้เพิ่มเติมด้านล่าง

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

Push commit `0a5785a99528d71417f5ef247300c0102b91eb4b` บน branch `codex/restore-booking-system` แล้ว และ deploy เป็น production ของทั้งสองโปรเจกต์ โดยไม่ได้ merge เข้า `main`

## Production verification — 16 กันยายน 2026 (Asia/Bangkok)

- Frontend: https://booking-room-continue.vercel.app
- Backend: https://booking-room-continue-backend.vercel.app
- Vercel project root: `front` / `back`, Node 22.x ทั้งคู่
- Production deployments: frontend `dpl_94VJLKwbWgzioh2VxQhBsBBWTk8E`, backend `dpl_3UGbrin781Uw3AySTj64cCkF4ndR` — READY
- ตั้ง Atlas URI/database, frontend/backend URLs, CORS, host-only cookie และ OAuth callback ใน backend
- ตั้ง frontend `NUXT_BACKEND_URL`, `NUXT_PUBLIC_API_BASE_URL=/api` และล้าง `NUXT_PUBLIC_AUTH_URL` เดิมเพื่อเริ่ม OAuth ผ่านโดเมนหน้าเว็บ
- เปลี่ยน JWT/session signing secret เดิมเป็นค่าสุ่มใหม่ใน Vercel และ Docker; ตรวจ guest login, signature, cookie, myinfo และ logout หลัง deploy รอบล่าสุดผ่าน (`artifacts/production-final-check.json`)
- ทั้ง backend และ frontend `/api/readyz` ตอบ 200 และ `/api/rooms` คืน 4 ห้อง
- Guest login ผ่านหน้าเว็บจริง มี HttpOnly/Secure cookie บนโดเมน frontend
- จองผ่านฟอร์มจริง → confirmation → เปิด history ใหม่ ข้อมูลเวลา Bangkok, ห้อง, เบอร์, participants และ requirements ครบ
- เข้าสู่ระบบบัญชี admin ทดสอบผ่าน password endpoint จริง และอนุมัติใน browser ด้วย cookie โดยไม่มี localStorage token
- หน้า dashboard, requests, manage-rooms, manage-accounts, settings, analytics, activities โหลดสำเร็จ; settings บันทึกแล้วอ่านกลับตรงกัน
- Guest เห็นสถานะ APPROVED หลังอนุมัติ และถูกปฏิเสธด้วย 403 เมื่อเรียก API ผู้ดูแล
- ยิงคำขอจองช่วงเดียวกัน 2 คำขอผ่าน frontend Vercel พร้อมกัน: 201 หนึ่งคำขอ / 409 หนึ่งคำขอ
- ไม่พบ page error, console error หรือ API 5xx ในรอบ production admin verification
- ลบเฉพาะ 2 bookings, guest QA และ admin QA ที่สร้างทดสอบแล้ว: เหลือ users 0, bookings 0, rooms 4
- หลักฐาน: `artifacts/production-browser-results.json`, `artifacts/production-qa-cleanup.json`, `artifacts/production-admin-*.png` (Git ignored)

Google Calendar ปิดอยู่และไม่ได้ทดสอบส่ง event จริง; Google/Microsoft sign-in ยังไม่ผ่าน provider round-trip

## รอบแก้เพิ่มเติม: analytics และ OAuth

- กราฟบริษัทอ่านยอดจองจริงทั้งหมด รวมบริษัทที่ไม่ได้ระบุชื่อ; leaderboard ตัดช่องว่างหัวท้ายเหมือนกราฟ เพื่อให้นับตรงกัน
- แก้ไฟล์กราฟที่มีนามสกุล `.vue.vue` และความสูงแท่งกราฟที่ยุบเป็นศูนย์; แสดงยอดอนุมัติด้วยสีจาก legend เดิม
- ทดสอบ browser กับข้อมูลใน MongoDB ทดสอบแยก: 8 รายการจอง, 4 อนุมัติ, Acme 25%, บริษัทไม่ระบุชื่อ 12.5%; ความสูงแท่งกราฟตรวจได้ 144/72 px
- ทดสอบฐานข้อมูลว่าง: แสดงข้อความไม่มีข้อมูล ไม่มี page/console error; หลักฐาน `artifacts/analytics-browser-results.json` และภาพ `analytics-populated.png` / `analytics-empty.png`
- API ทดสอบ timezone ที่ขอบปี Bangkok และการแยกสถานะ APPROVED/PENDING/CANCELED ผ่าน
- ปิดการผูกบัญชี Microsoft จากอีเมลอย่างเดียวและการผูกข้าม provider อัตโนมัติ; ทดสอบอีเมลตรงกันแต่ provider subject ต่างกันแล้วไม่ได้รับ session หรือสิทธิ์ admin
- Backend ทั้งชุด 24 ผ่าน; รันทดสอบ system ซ้ำหลังแก้การรวมชื่อบริษัท 15 ผ่าน
- ตรวจ provider จริงซ้ำ: Google ยัง `redirect_uri_mismatch`, Microsoft ยัง 503 เพราะไม่มี credentials
