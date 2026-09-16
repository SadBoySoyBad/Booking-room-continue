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
| Backend integration tests กับ Mongo replica set จริง รวมโหมด production และ Calendar | 35 ผ่าน, 0 ไม่ผ่าน |
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

- Microsoft credentials และ Microsoft OAuth round-trip พักไว้นอกขอบเขตตามคำสั่งเจ้าของ
- การส่งอีเมลถึงผู้เข้าร่วมภายนอกยังไม่ได้ทดสอบ; Calendar event จริงของบัญชีเจ้าของผ่านแล้วตามหัวข้อล่าสุดด้านล่าง
- Attendance/check-in จริง, immutable audit log และ SMTP reminders; company donut ที่เดิมเป็น placeholder เชื่อมข้อมูลจริงแล้วในรอบแก้เพิ่มเติมด้านล่าง

Calendar adapter มีทั้ง regression tests ด้วย stub และผลทดสอบ event จริงบน production โดยไม่มีผู้เข้าร่วมคนอื่น การทดสอบที่ผ่านไม่ได้รับรองว่าไม่มีบัค 100% หรือไม่มีช่องโหว่ที่ยังไม่มีการรายงาน

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

ณ รอบทดสอบนี้ Google Calendar ยังปิดอยู่ และ Google/Microsoft sign-in ยังไม่ผ่าน provider round-trip; สถานะ Google ล่าสุดอยู่ในหัวข้อด้านล่าง

## รอบแก้เพิ่มเติม: analytics และ OAuth

- กราฟบริษัทอ่านยอดจองจริงทั้งหมด รวมบริษัทที่ไม่ได้ระบุชื่อ; leaderboard ตัดช่องว่างหัวท้ายเหมือนกราฟ เพื่อให้นับตรงกัน
- แก้ไฟล์กราฟที่มีนามสกุล `.vue.vue` และความสูงแท่งกราฟที่ยุบเป็นศูนย์; แสดงยอดอนุมัติด้วยสีจาก legend เดิม
- ทดสอบ browser กับข้อมูลใน MongoDB ทดสอบแยก: 8 รายการจอง, 4 อนุมัติ, Acme 25%, บริษัทไม่ระบุชื่อ 12.5%; ความสูงแท่งกราฟตรวจได้ 144/72 px
- ทดสอบฐานข้อมูลว่าง: แสดงข้อความไม่มีข้อมูล ไม่มี page/console error; หลักฐาน `artifacts/analytics-browser-results.json` และภาพ `analytics-populated.png` / `analytics-empty.png`
- API ทดสอบ timezone ที่ขอบปี Bangkok และการแยกสถานะ APPROVED/PENDING/CANCELED ผ่าน
- ปิดการผูกบัญชี Microsoft จากอีเมลอย่างเดียวและการผูกข้าม provider อัตโนมัติ; ทดสอบอีเมลตรงกันแต่ provider subject ต่างกันแล้วไม่ได้รับ session หรือสิทธิ์ admin
- Backend รอบล่าสุด: system 15 ผ่าน และ production/OAuth 10 ผ่าน รวม 25 กรณี; production build และ browser verification ผ่าน
- ณ รอบทดสอบนี้ Google ยัง `redirect_uri_mismatch`, Microsoft ยัง 503 เพราะไม่มี credentials; สถานะ Google ล่าสุดอยู่ในหัวข้อด้านล่าง
- Deploy source `9b3177510a67c4c6b98da5619960da37398df6c7` ขึ้น production แล้ว: backend `dpl_HTBetGz8Hc38poisbAFTkyMitCKP`, frontend `dpl_EC3aZGSKjz9mYcdJQia6o1WuAR5Y` — READY
- ทดสอบหน้า Analytics/Dashboard และผลรวมบริษัทผ่าน API production ผ่าน ไม่พบ page/console error; หลักฐาน `artifacts/production-followup-results.json`
- Docker frontend/backend build และ startup ผ่าน; readiness ทั้งสองฝั่งในเครื่องตอบ 200

## Google login และบัญชีเจ้าของ — อัปเดต 16 กันยายน 2026

- เจ้าของบันทึก callback ของ frontend ใน Google Cloud แล้ว และยืนยันว่า Google login กลับเข้าหน้าจองสำเร็จ
- ก่อน consent เพิ่ม ตรวจ Atlas พบ Google identity และ refresh token; Google tokeninfo ยืนยัน access token ใช้งานได้ แต่ยังไม่มี scope `calendar.events` (หลัง consent ตรวจผ่านแล้วในหัวข้อล่าสุด)
- ตั้ง role บัญชีเจ้าของเป็น `admin` ตามคำยืนยัน และอ่าน role กลับจาก Atlas ได้ `admin`; middleware โหลดสิทธิ์ล่าสุดจากฐานข้อมูลทุกคำขอ
- เปิด `GOOGLE_CALENDAR_ENABLED=true` ใน Vercel backend และ Docker; backend deployment `dpl_An9Rmk4H6xrjzJa2zTQPiCxU5NgJ` เป็น READY ใช้ application source `9b3177510a67c4c6b98da5619960da37398df6c7`
- หลัง deploy: frontend/backend `/api/readyz` ตอบ 200; frontend `/api/auth/google` ตอบ 302 พร้อม Calendar scope และ callback `https://booking-room-continue.vercel.app/api/auth/google/callback`
- ณ ขั้นตอนนี้รอเจ้าของ consent สิทธิ์ Calendar เพิ่ม; ผลหลังอนุญาตอยู่ในหัวข้อล่าสุดด้านล่าง
- จำนวน users 0 ในรายงานรอบก่อนเป็นสถานะหลังล้าง QA ณ เวลานั้น ปัจจุบันมีบัญชีเจ้าของแล้วและไม่ได้ลบบัญชีนี้

## Calendar บน production — หลัง consent และแก้ไข 16 กันยายน 2026

- พัก Microsoft ตามคำสั่งเจ้าของ โดยไม่แก้หน้าตาหรือขั้นตอนการใช้งานเดิม
- ยืนยัน token ของเจ้าของมี `calendar.events`; อ่าน Calendar API จริงได้ HTTP 200
- แก้ permanent delete ให้ลบ Calendar event ก่อนลบ booking; ถ้า provider ล้มเหลว คืน 502 พร้อมเก็บ booking/event ID ไว้ให้ลองใหม่
- แก้การสร้าง event ภายหลังให้มีสถานะปัจจุบัน, เวลา ISO และผู้เข้าร่วมไม่ซ้ำ; approval/cancellation ใช้ notification preference เดียวกับ create
- รองรับ event ที่ถูกลบใน Google แล้ว (404/410): cancellation สำเร็จซ้ำได้ และ active booking สร้าง event ทดแทนได้เมื่อเปิด auto-add
- Backend tests ทั้งหมด 31 ผ่าน / 0 ไม่ผ่าน รวม 6 regression tests ใหม่และกรณี Calendar ล่มที่ booking/approval ยังสำเร็จ
- Push/deploy backend source `07e3d8b`: deployment `dpl_6WRPGnneZXRYHwnTV6Fnvefe95Yu` READY; frontend source คง `9b31775`
- ทดสอบผ่าน production frontend API → backend → Atlas → Google Calendar จริง: จองสร้าง PENDING event → อนุมัติเปลี่ยนชื่อเป็น APPROVED → ยกเลิกลบ event → อนุมัติใหม่สร้าง event ใหม่ → permanent delete ลบทั้ง booking และ event
- ตรวจเวลา Bangkok และจำกัด attendees เป็นเจ้าของบัญชีคนเดียว ไม่มีการเชิญผู้เข้าร่วมคนอื่น; ลบ booking/event QA เรียบร้อย
- รอบ API นี้ใช้ JWT ภายในอายุ 10 นาทีของบัญชีที่เจ้าของอนุญาต ไม่ใช่การทดสอบ Google browser login ซ้ำ; browser OAuth จริงยืนยันในรอบก่อนหน้าแล้ว
- Browser production ตรวจหน้า admin ทั้ง 7 หน้าและ analytics totals ผ่าน ไม่พบ page/console error; บัญชี admin QA ชั่วคราวถูกลบแล้ว
- Query error logs ของ backend deployment นี้ช่วง 15 นาทีล่าสุดสำเร็จ พบ 0 รายการ; เป็นการตรวจช่วงเวลาทดสอบ ไม่ใช่หลักประกันว่าจะไม่เกิด error ในอนาคต
- Docker backend rebuild/startup ผ่าน; backend และ frontend proxy readiness ในเครื่องตอบ 200
- หลักฐาน (Git ignored): `back/calendar-regression-results.log`, `artifacts/calendar-production-results.json`, `artifacts/calendar-postdeploy-browser-results.json`, `artifacts/calendar-production-error-scan.json`

## Calendar concurrency และ retry — 16 กันยายน 2026

- เพิ่ม tests แล้วพิสูจน์ว่าโค้ดเดิมไม่ผ่าน 3 กรณี: concurrent creates สร้าง event ซ้ำ, ยกเลิกระหว่างรอ insert แล้ว event ค้าง, และ retry หลัง Google สร้าง event แต่คำตอบสูญหายสร้างซ้ำ
- แก้ให้จอง `google_event_id` ใน MongoDB แบบ atomic ก่อนเรียก Google; คำขอพร้อมกันใช้ ID เดียว และ HTTP 409 จาก Google อ่าน event ที่มีอยู่แทนสร้างใหม่
- หลัง insert ตรวจสถานะจากฐานข้อมูลอีกครั้ง ถ้า booking ถูกยกเลิก/ลบ หรือ event ถูกแทนที่ระหว่างรอ ลบ event เก่าที่เพิ่งสร้าง; conditional updates ไม่ล้าง ID ของ event รุ่นใหม่
- การ sync เมื่อพบ 404 ใช้ ID เดิม เพราะอาจเป็น insert ที่ยังไม่ยืนยันผล ส่วน 410/cancelled จึงเปลี่ยนเป็น ID ใหม่
- เพิ่ม test กรณี status sync หลังผล insert ไม่แน่นอน รวม tests ใหม่ 4 กรณี; backend ทั้งหมด 35 ผ่าน / 0 ไม่ผ่าน
- ปรับ fixture ของ test เดิมให้เป็น booking ที่ยัง active จริง แทนใช้ booking ที่ถูกยกเลิกจาก test ก่อนหน้า
- หลักฐานก่อน/หลังแก้ (Git ignored): `artifacts/calendar-race-before.log`, `artifacts/calendar-race-after.log`, `artifacts/all-backend-regression.log`
- Backend source `9e1e926` deploy production READY: `dpl_Y5MoqFhb2uRNbPR5JyEtdGiDm3Ke`; frontend คง source `9b31775`
- ทดสอบ production กับ Google จริงซ้ำทั้ง create/approve/cancel/reapprove/delete ผ่าน แล้วส่ง approval พร้อมกัน 6 คำขอสำหรับ booking QA ที่ยังไม่มี event พบ Google event ที่ตรงรายการเพียง 1 รายการ
- ตรวจลบทั้ง booking และ Calendar event QA สำเร็จ ไม่เชิญบุคคลอื่น; หลักฐาน `artifacts/calendar-concurrency-production-results.json`
- Backend error logs ของ deployment นี้ช่วง 15 นาทีล่าสุด: 0 รายการ (`artifacts/calendar-race-production-error-scan.json`); Docker backend rebuild และ readiness backend/frontend proxy ผ่าน
