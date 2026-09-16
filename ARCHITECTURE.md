# Architecture และผลตรวจระบบ Arrangemeet

ตรวจจาก source, Git, GitHub deployment history และการทดสอบทั้งในเครื่องและ production เมื่อ 15–16 กันยายน 2026

## 1. Repository และ deployment ที่พบ

- GitHub: https://github.com/SadBoySoyBad/Booking-room-continue
- Local HEAD ก่อนแก้: `7c15513` (Fix logout-login)
- `origin/main`: `33c617c` (merge PR #25); source tree ตรงกับ local HEAD ก่อนแก้
- Frontend เดิม: https://booking-room-continue.vercel.app — HTTP 200, Nuxt, Server: Vercel
- Backend ที่หน้าเว็บเดิมเรียก: https://booking-room-continue-backend.vercel.app
- Backend เดิมตอบ `FUNCTION_INVOCATION_FAILED` ทั้ง `/api/healthz` และ `/api/rooms`
- ผู้ใช้สร้าง Atlas ใหม่ `booking.7uebkhr.mongodb.net`; initialize database `booking` แล้ว ทั้ง Docker และ Vercel production ใช้ฐานข้อมูลใหม่นี้ มี 4 ห้องเริ่มต้น
- GitHub มี production deployment สำเร็จของทั้งสอง project วันที่ 4 ธันวาคม 2025 การ deploy สำเร็จในอดีตไม่ได้ยืนยันว่า API ยังทำงานในวันนี้
- Runtime Log ที่ผู้ใช้ส่งยืนยัน `querySrv ENOTFOUND _mongodb._tcp.booking.vs1tbkz.mongodb.net` แล้ว process exit 1; ตรวจ SRV ผ่าน DNS 1.1.1.1/8.8.8.8 ได้ NXDOMAIN เช่นกัน ต้องตรวจสถานะ cluster/hostname ใน Atlas
- ผู้ใช้ยืนยัน Vercel CLI แล้ว ตั้งค่า environment และ deploy ทั้งสองโปรเจกต์สำเร็จ ล่าสุดใช้ commit `9b31775` บน branch `codex/restore-booking-system` โดยยังไม่ได้ merge เข้า `main`; Docker ในเครื่องอัปเดต source ชุดเดียวกันแล้ว

หลักฐาน deployment: [Frontend](https://api.github.com/repos/SadBoySoyBad/Booking-room-continue/deployments/3421328287/statuses), [Backend](https://api.github.com/repos/SadBoySoyBad/Booking-room-continue/deployments/3421341692/statuses)

## 2. ภาพรวมหลังแก้

```mermaid
flowchart LR
    Browser[Browser: Vue pages] --> Nuxt[Nuxt 3 / Nitro]
    Nuxt -->|same-origin /api proxy| Express[Express REST API]
    Express --> Auth[JWT + Passport OAuth]
    Express --> Controllers[Controllers: validation / permissions]
    Controllers --> Models[Mongoose models]
    Models --> Mongo[(MongoDB replica set / Atlas)]
    Auth <--> Google[Google OAuth]
    Auth <--> Microsoft[Microsoft OAuth]
    Controllers -. optional .-> Calendar[Google Calendar API]
```

เป็น monorepo แบบแยก frontend/backend ไม่มี microservices, message queue หรือ background worker

### Frontend (`front/`)

| ส่วน | หน้าที่ |
|---|---|
| Nuxt 3, Vue 3, Vue Router | SSR, hydration และ routing ตามไฟล์ใน `pages/` |
| Nitro | server ของ Nuxt และ proxy `/api/**` ไป Express |
| `server/utils/backendProxy.ts` | ส่ง HTTP redirect และ Set-Cookie กลับ browser โดยไม่ตาม OAuth redirect ใน server |
| Tailwind CSS ผ่าน `@nuxtjs/tailwindcss` | หน้าตาและ responsive classes เดิม |
| `layouts/default.vue`, `AdminLayout.vue`, `blank.vue` | header/navigation และ layout ของแต่ละกลุ่มหน้า |
| `useAuth.ts` | shared user state, ตรวจ session และ logout |
| `useApi.js` | เรียก API พร้อม cookie หรือ Bearer token และจัดการ HTTP errors |
| `auth.js`, `auth-admin.js` | client navigation guards; สิทธิ์ข้อมูลจริงตรวจซ้ำที่ backend |
| `auth-init.ts` | โหลดผู้ใช้เมื่อเปิดแอปและติดตาม token ข้ามแท็บ |
| `usePendingRequestsCount.js` | จำนวนคำขอรออนุมัติ polling ทุก 30 วินาที |
| `BookingModal.vue` | วันที่/เวลา ห้อง ผู้จอง ผู้เข้าร่วม และอุปกรณ์ |
| `useCsvExport.js` | export ตาราง โดย escape CSV และป้องกัน formula injection |

หน้าใช้งาน: `/`, `/login`, `/booking`, `/bookingconfirm`, `/history`, `/terms`, `/privacy` และ `/admin/{dashboard,analytics,requests,manage-accounts,manage-rooms,activities,settings}`

อัปเดต Nuxt ภายใน major 3 เดิม พร้อม lockfile ถอด modules ที่ไม่มีการใช้งานจริง ได้แก่ Content/SQLite, UI components, Fonts, Icon, Image, Scripts และ test-utils รวมถึง Passport ฝั่ง frontend ทั้งหมดนี้ไม่ได้เป็นฐานข้อมูลหรือระบบ login ที่ใช้งานจริงของแอป

### Backend (`back/`)

| ชั้น | ไฟล์ / หน้าที่ |
|---|---|
| Entry | `server.js` สำหรับ Node/Docker; `app.js` export Express สำหรับ Vercel |
| Configuration | `config/env.js` โหลด environment โดยไม่ขึ้นกับ current directory |
| HTTP | Express 4, CORS allow-list, JSON body limit, response แบบไม่ cache |
| Authentication | JWT, cookie-session สำหรับ OAuth state, Passport Google/Microsoft |
| Authorization | `authMiddleware` โหลด user ล่าสุดจาก DB; `authorizeRoles` จำกัด admin |
| Routes | `routes/*Routes.js` จับคู่ URL กับ controller |
| Controllers | validate request, ตรวจ role/เจ้าของข้อมูล, ตอบ status และ JSON |
| Models | Mongoose schema/query ใน `models/` |
| DB connection | `db.js` reuse connection, ไม่ exit process หรือ drop indexes ตอนรับ request |
| Calendar | `services/calendarService.js`, เปิดด้วย `GOOGLE_CALENDAR_ENABLED=true` |
| Utilities | `utils/dates.js` ใช้ขอบเขตวัน Asia/Bangkok; `utils/http.js` กรองข้อมูลลับและแปลง error |

ใช้ Node 22.12+ สำหรับชุด dependency ที่อัปเดต Docker ใช้ Node 22

## 3. ข้อมูลและความสัมพันธ์

```mermaid
erDiagram
    USER ||--o{ BOOKING : creates
    ROOM ||--o{ BOOKING : contains
    USER {
      ObjectId id
      string username
      string email
      string phone
      string role
      object settings
    }
    ROOM {
      ObjectId id
      string name
      string status
      number booking_version
    }
    BOOKING {
      ObjectId id
      ObjectId room_id
      ObjectId user_id
      string topic
      date start_time
      date end_time
      string status
      array participants_emails
      array requirements
    }
```

- `users`: guest/employee/admin, password hash สำหรับ local credentials, provider IDs/tokens, company และ settings
- `rooms`: ชื่อ unique, สถานะ AVAILABLE/OCCUPIED/MAINTENANCE
- `bookings`: ผู้จอง ข้อมูลติดต่อ เวลา UTC, room/user references, ผู้เข้าร่วม อุปกรณ์ และสถานะ
- API ส่ง `id`, `room_id`, `user_id` เป็น string สม่ำเสมอ ไม่อาศัย virtual `id` จาก `lean()`
- MongoDB ไม่มี foreign-key constraint แบบ SQL จึงตรวจห้องและรักษาประวัติใน application ห้องที่มีประวัติให้ใช้ maintenance แทนการลบ
- คอลัมน์ optional แบบ unique ไม่บันทึก `null` ซ้ำ; `npm run db:init` มี migration สำหรับข้อมูลเดิมและ indexes
- ชื่อแสดงผลผู้ใช้ซ้ำได้ อีเมล/เบอร์/provider IDs เป็น identifiers ตามประเภทบัญชี

`db_init/*.sql`, Nginx/Certbot และคู่มือ Rukcom เดิมเป็นหลักฐานระบบ MariaDB รุ่นก่อน commit `962c0cf` ปัจจุบัน models ไม่ได้ใช้ SQL แล้ว

## 4. ลำดับงานเดิม

```mermaid
flowchart TD
    A[Guest หรือ Employee เข้าสู่ระบบ] --> B[เลือกวัน เวลา ห้อง และกรอกข้อมูล]
    B --> C{ข้อมูลถูกต้องและเวลาว่าง?}
    C -->|ไม่ผ่าน| D[แจ้งข้อผิดพลาดให้แก้ข้อมูล]
    D --> B
    C -->|ผ่าน| E[บันทึก PENDING]
    E --> F[แสดงหน้ายืนยันและประวัติ]
    E --> G[Admin ตรวจ Requests]
    G --> H[APPROVED]
    G --> I[REJECTED]
    H --> J[ติดตามสถานะ/แจ้งเตือน]
    I --> J
    E --> K[CANCELED ตามสิทธิ์ API]
```

ไม่พบไฟล์ BPMN อย่างเป็นทางการใน repository แผนภาพนี้สรุปจาก implementation การรับคำขอและรอ admin อนุมัติยังเหมือนเดิม

### ป้องกันจองซ้อน

ใช้ MongoDB transaction และเขียน `booking_version` ของห้องก่อนตรวจช่วงเวลาเพื่อให้ผู้จองห้องเดียวกันพร้อมกันเกิด write conflict แล้ว retry จากข้อมูลล่าสุด ตรวจ overlap ด้วย `existing.start < new.end && existing.end > new.start` เฉพาะ PENDING/APPROVED การอนุมัติ/เปิดสถานะกลับตรวจอีกครั้ง เวลาต่อกันพอดีจองได้

ต้องใช้ MongoDB replica set หรือ Atlas; standalone MongoDB ไม่รองรับ transaction นี้ Docker Compose จัด replica set ให้

### เวลา

Frontend ส่ง ISO datetime ที่มี `+07:00` ชัดเจน MongoDB เก็บ UTC ส่วน query รายวันใช้เที่ยงคืนถึงเที่ยงคืนถัดไปของกรุงเทพฯ และนับรายการที่คร่อมวันด้วย

## 5. API และสิทธิ์

| Endpoint | สิทธิ์ / ผลลัพธ์ |
|---|---|
| GET `/api/healthz` | process ยังตอบ HTTP |
| GET `/api/readyz` | ping MongoDB; 503 เมื่อไม่พร้อม |
| POST `/api/users/guest-login` | guest ชื่อ/เบอร์; ไม่สามารถสวมบัญชี employee/admin |
| POST `/api/users/employee-login` | legacy local email/password; ไม่รับ mock provider assertion |
| GET `/api/auth/google`, `/microsoft` | เริ่ม provider OAuth พร้อม state |
| GET `/api/auth/{provider}/callback` | ตรวจ state และแลก token กับ provider |
| GET `/api/auth/myinfo`, `/verify` | ตรวจ cookie หรือ Bearer; ไม่คืน password/provider tokens |
| POST `/api/auth/logout` | ล้าง auth และ OAuth-state cookies |
| GET `/api/rooms`, `/:id` | รายการห้องและสถานะ |
| POST/PUT/DELETE `/api/rooms[/id]` | admin |
| POST `/api/bookings` | ผู้ใช้ที่ login; validate และจองด้วย transaction |
| GET `/api/bookings?status=PENDING` | admin |
| GET `/api/bookings/daily/:date` | ผู้ใช้ login; ซ่อนรายละเอียดของผู้อื่น |
| GET `/api/bookings/my-history`, `/notifications` | เฉพาะเจ้าของจาก authenticated user ID |
| PUT `/api/bookings/:id/status`, DELETE `/:id` | admin |
| GET/POST/PUT/DELETE `/api/users[/id]` | admin; รองรับ role, page, limit, q และ paginate |
| GET/PUT `/api/users/settings` | admin; บันทึก preference ลง MongoDB |
| GET `/api/analytics/summary` | admin; totals, leaderboard, monthly counts และจำนวนตาม role |

## 6. สิ่งที่แก้และตรวจแล้ว

- ติดตั้ง dependency/lockfile ให้ตรงกัน และแก้จุดเริ่มต้นฐานข้อมูล
- แก้ ID ที่หายหลังย้าย MongoDB ส่งผลต่อ login, ห้อง, ประวัติ และการอนุมัติ
- แก้ guest impersonation ของ employee/admin และยกเลิก Microsoft mock login
- เชื่อม user CRUD/settings routes และปุ่มจัดการบัญชี/อนุมัติ/แบ่งหน้า/filter/export
- รองรับ Google cookie auth ใน history/admin/notifications พร้อม proxy ที่ frontend origin
- ส่ง participants field ตรงกัน, ตรวจ datetime, overlap และสถานะซ้ำแบบ idempotent
- เปลี่ยน notification จำลองเป็นข้อมูลของผู้ใช้จริง
- แก้การ refresh Google token ไม่ให้ลบ provider ID/refresh token และแยก OAuth client ต่อ request
- แก้จำนวน chart ที่หารด้วยศูนย์, role ของ activity และ mapping statistics
- แก้ Docker จาก MariaDB เป็น MongoDB replica set และแยก secret ออกจาก image/frontend config

ผลทดสอบที่ทำในเครื่อง:

1. Backend tests 25 กรณี ใช้ MongoDB จริง รวม 8 concurrent requests ที่บันทึกสำเร็จ 1 และ conflict 7 และโหมด production/Passport ด้วย provider stub; frontend proxy tests อีก 4 กรณี
2. Vue SFC ทุกไฟล์ parse/compile ผ่าน และ Nuxt TypeScript typecheck ผ่าน
3. Nuxt production build และ Vercel preset ผ่าน; Docker build ทั้งสอง image ผ่าน; handler จาก Vercel build ส่งหน้าเว็บ/readiness/rooms 200 และ OAuth 302 พร้อม cookies
4. Browser walkthrough: Guest login → booking → confirmation → history; guest เข้า admin ไม่ได้; admin โหลดทุกหน้าและอนุมัติคำขอได้
5. ภาพหน้า login ของ Docker หลังอัปเดตเทียบ production ที่ viewport/zoom เดียวกัน มี PNG SHA-256 ตรงกัน รายละเอียดใน TEST-REPORT.md
6. npm audit หลังอัปเดต: 0 vulnerabilities ทั้ง frontend และ backend ณ เวลาตรวจ (ไม่ได้หมายความว่าจะไม่มีช่องโหว่ใหม่ในอนาคต)

ผลตรวจ production: Guest login → จองผ่านฟอร์ม → confirmation → history, admin อนุมัติผ่าน browser, หน้า admin ทั้ง 7 หน้า, settings persistence และการจองพร้อมกันผ่าน Vercel (201/409) ผ่าน ไม่พบ page/console error หรือ API 5xx ในรอบทดสอบ ลบเฉพาะข้อมูล QA แล้ว รายละเอียดอยู่ใน TEST-REPORT.md

## 7. ขอบเขตที่ยังยืนยันไม่ได้ / ส่วนที่ต้องตัดสินใจ

- Vercel production deploy และเชื่อม Atlas ใหม่แล้ว ทั้ง backend และ frontend `/api/readyz` ตอบ 200
- Google production callback ลงทะเบียนแล้ว เจ้าของยืนยันว่าล็อกอินและเข้าหน้าจองสำเร็จ ตรวจพบ provider identity และ token ที่ใช้งานได้ใน Atlas
- ตั้งบัญชีเจ้าของที่ยืนยันแล้วเป็น admin ตามคำสั่งเจ้าของ และอ่าน role จากฐานข้อมูลตรวจซ้ำแล้ว; บัญชี admin ชั่วคราวสำหรับ QA ถูกลบแล้ว
- เปิด `GOOGLE_CALENDAR_ENABLED=true` บน production และ Docker แล้ว ตรวจ Google authorization redirect มี scope `calendar.events` และ callback ของ frontend ถูกต้อง บัญชีที่ล็อกอินก่อนเปิด flag ต้องให้ consent เพิ่มก่อนทดสอบ Calendar event จริง; Microsoft ยังไม่มี credentials
- Guest แบบชื่อ+เบอร์ยังไม่ใช่การพิสูจน์ความเป็นเจ้าของเบอร์ การเพิ่ม OTP/password จะเปลี่ยน UX/กระบวนการเดิม จึงยังไม่ได้เพิ่ม
- Email/calendar settings ใช้กับ Google Calendar integration เมื่อเปิดใช้งาน ไม่มีระบบ SMTP หรือ worker ส่ง reminder แยกสำหรับ guest/Microsoft
- Activity page เป็นภาพรวมสถานะ booking ไม่ใช่ immutable audit trail ของทุก login/logout/แก้ไข
- `Total Attendance` ในระบบเดิมคือจำนวน APPROVED ไม่ใช่จำนวนคนเช็กอินจริง ไม่มี attendance/check-in model
- แผง company donut เชื่อมข้อมูลจองจริงแล้ว รวมรายการไม่ระบุบริษัท; กราฟรายเดือนแสดงจำนวนจองและจำนวนอนุมัติ โดยยังใช้ตำแหน่งและสีของหน้าเดิม
- ช่อง district ไม่มี field ต้นทาง การสร้างข้อมูล district/check-in ต้องมีข้อกำหนดเพิ่ม ไม่ควรสร้างตัวเลขแทนข้อมูลจริง
- ไม่ได้รับรองว่าไม่มีบัค 100%: ผลข้างต้นเป็นสิ่งที่ตรวจยืนยันได้ พร้อมขอบเขตที่ยังต้องทดสอบบริการจริง

OAuth ใช้ provider subject ID เป็นตัวระบุบัญชี Microsoft ไม่ผูกบัญชีจากอีเมลอย่างเดียว และไม่ผูกบัญชีข้าม provider อัตโนมัติ เพราะอีเมล Microsoft เป็นข้อมูลติดต่อที่เปลี่ยนได้ ผู้ดูแลที่ใช้ Microsoft ต้อง login เพื่อสร้างบัญชี provider ก่อน แล้วให้ผู้ดูแลเดิมเปลี่ยน role ของบัญชีนั้น ส่วนบัญชีที่เตรียมด้วยอีเมลและยังไม่ผูก provider ใช้ Google ที่ยืนยันอีเมลแล้วได้

## เอกสารอ้างอิงทางเทคนิค

- [Mongoose lean และ virtuals](https://mongoosejs.com/docs/tutorials/lean.html)
- [MongoDB partial indexes](https://www.mongodb.com/docs/manual/core/index-partial/)
- [Express on Vercel](https://vercel.com/docs/frameworks/backend/express)
- [Atlas: troubleshooting DNS and paused/deleted clusters](https://www.mongodb.com/docs/atlas/troubleshoot-connection/)
