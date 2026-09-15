# Arrangemeet — Booking Room

Nuxt 3 + Vue 3 + Tailwind CSS → Express → MongoDB replica set / Atlas

อ่าน [Architecture และผลตรวจระบบ](ARCHITECTURE.md) และ [วิธี deploy Vercel](DEPLOY-BACKEND-VERCEL.md)

## เปิดระบบในเครื่องด้วย Docker

1. เปิด Docker Desktop
2. ถ้ายังไม่มี `.env` ให้ copy `.env.example` เป็น `.env` และตั้ง `JWT_SECRET` เป็นค่าสุ่มของคุณ
3. รันจาก root:

```powershell
docker compose up --build -d
docker compose ps
```

เปิด http://localhost:3000 — API: http://localhost:3001/api/readyz

Compose ใช้ฐานข้อมูล MongoDB ใหม่ใน volume `mongo_data` ไม่ใช่ MariaDB/ฐานข้อมูล production เดิม Guest login ใช้ได้ทันที ส่วน Google/Microsoft ต้องลงทะเบียน callback ตาม `.env.example`

หยุดระบบด้วย `docker compose stop` ข้อมูลยังอยู่ใน volume

### ใช้ Atlas กับ Docker

ตั้ง `MONGODB_URI` และ `MONGODB_DB` ใน `back/.env` (Git ไม่ติดตามไฟล์นี้) แล้วรัน:

```powershell
docker compose --env-file .env --env-file back/.env -f docker-compose.yml -f docker-compose.atlas.yml up -d --build
docker compose exec -T backend npm run db:check
```

backend จะใช้ Atlas ส่วน Mongo volume ในเครื่องยังเก็บไว้ หากรัน Compose โดยไม่ใส่ไฟล์ override จะกลับไปใช้ฐานข้อมูลในเครื่อง สำหรับเครือข่ายที่ Node ตอบ DNS `ECONNREFUSED` ตั้ง `DNS_SERVERS=1.1.1.1,8.8.8.8` ใน `back/.env` ได้ ค่านี้มีผลเฉพาะ process ของ backend ไม่แก้ DNS ของ Windows

## พัฒนาโดยรัน Node แยก

ต้องใช้ Node 22.12+:

```powershell
docker compose up -d db db-init
cd back
npm ci
npm run dev
```

ตั้ง `.env` ตามตัวอย่างก่อนรัน backend โดยเฉพาะ MONGODB_URI และ NODE_ENV อีก terminal:

```powershell
cd front
npm ci
npm run dev
```

Frontend ใช้ `/api` และ proxy ไป `http://127.0.0.1:3001` เป็นค่าเริ่มต้น ค่าที่ override อยู่ใน `front/.env.example`

## สร้าง admin ครั้งแรก

เลือกอีเมล Google/Microsoft ที่คุณควบคุมเอง ใช้คำสั่งภายใน `back/`:

```powershell
$env:ADMIN_EMAIL='your-email@example.com'
$env:ADMIN_NAME='Your Name'
npm run admin:create
```

จากนั้น login ผ่านปุ่ม provider เดิมและเปิด `/admin/dashboard` ไม่ใช้บัญชี mock และไม่กำหนด admin ให้บุคคลใดโดยอัตโนมัติ

## ตรวจระบบ

Backend integration test ใช้ MongoDB replica set แยกที่ `127.0.0.1:27018` และสร้าง/ลบเฉพาะฐานข้อมูลชื่อ `booking_test_*` ของการรันนั้น:

```powershell
# เริ่ม Mongo สำหรับ tests หากยังไม่มี
docker run -d --name booking-room-audit-mongo -p 127.0.0.1:27018:27017 mongo:8 --replSet rs0 --bind_ip_all
"rs.initiate({_id:'rs0',members:[{_id:0,host:'localhost:27017'}]})" | docker exec -i booking-room-audit-mongo mongosh --quiet
cd back
npm test
```

ถ้ามี container ทดสอบนี้อยู่แล้ว ให้ใช้ `docker start booking-room-audit-mongo` แทน `docker run`

Frontend:

```powershell
cd front
npm test
npm run typecheck
npm run build
npm audit
```

ทดสอบ build สำหรับ Vercel โดยไม่ deploy: ตั้ง `$env:NITRO_PRESET='vercel'` ก่อน `npm run build` แล้วลบตัวแปรด้วย `Remove-Item Env:NITRO_PRESET` เมื่อต้องการกลับไป build แบบ Node server

ตรวจการเชื่อมฐานข้อมูลปัจจุบันแบบอ่านอย่างเดียว: จาก `back` รัน `npm run db:check` โดยตั้ง `MONGODB_URI`/`MONGODB_DB` ของฐานข้อมูลที่ต้องการตรวจไว้ใน environment ก่อน คำสั่งนี้ไม่แก้ข้อมูลและไม่พิมพ์รหัสผ่าน

ไม่ commit `.env`, provider secrets หรือไฟล์ test session ใช้ `.env.example` เป็นแม่แบบเท่านั้น
