# Deploy บน Northflank (ไม่ต้องผูกบัตร, ไม่สลีป)

เอกสารถูกจัดทำเพื่อโปรเจกต์นี้ (backend: `back/`, frontend: `front/`, DB: MariaDB) โดยไม่ใช้ Nginx/Certbot เพราะ Northflank ออก HTTPS ให้เอง

หมายเหตุ: ได้แพตช์ `back/server.js` ให้ตั้งค่า CORS และโดเมนของคุกกี้ผ่าน ENV แล้ว (`CORS_ALLOWED_ORIGINS`, `COOKIE_DOMAIN`).

## ภาพรวมบริการ
- Database: MariaDB 10.6 (Northflank Managed DB/Add-on)
- Backend: Node.js/Express จาก `back/Dockerfile` (พอร์ต 3001)
- Frontend: Nuxt 3 จาก `front/Dockerfile` (พอร์ต 3000)

## เตรียมค่า ENV ที่ต้องมี
ดูตัวอย่างไฟล์ในโฟลเดอร์ `env/`:
- `env/.env.northflank.backend.example`
- `env/.env.northflank.frontend.example`

ตัวแปรหลัก:
- ระบบ: `NODE_ENV=production`, `JWT_SECRET=<random>`
- DB: `DB_HOST`, `DB_PORT=3306`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` (ได้จาก Add-on)
- URL/คุกกี้/CORS:
  - `FRONTEND_URL`: URL ของ frontend (เช่น `https://<front>.northflank.app`)
  - `CORS_ALLOWED_ORIGINS`: รายการ origin แบบ CSV ถ้ามีหลายโดเมน
  - `COOKIE_DOMAIN`: เช่น `.yourdomain.com` (ปล่อยว่างได้ถ้าใช้โดเมนเดี่ยว)
- Google OAuth:
  - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
  - `GOOGLE_REDIRECT_URI=https://<backend public URL>/api/auth/google/callback`
- ฝั่ง Frontend (public):
  - `NUXT_PUBLIC_API_BASE_URL=https://<backend public URL>/api`
  - `NUXT_PUBLIC_AUTH_URL=https://<frontend public URL>`
  - `NUXT_PUBLIC_GOOGLE_CLIENT_ID`, `NUXT_GOOGLE_CLIENT_SECRET`

## ขั้นตอนทีละก้าว
1) สร้าง Project ใน Northflank และเชื่อม Git repo นี้

2) สร้าง Database (Add-on)
   - เลือก MariaDB 10.6 (หรือรุ่นที่ Northflank มี)
   - สร้าง database และ user (Northflank จะให้ค่าการเชื่อมต่อ)
   - จด `Internal hostname`, `Port`, `Username`, `Password`, `Database`
   - สร้างสคีมาเริ่มต้น: ใช้ SQL client (เช่น DBeaver) ต่อเข้าฐาน แล้วรันไฟล์ `db_init/init.sql`
     - หรือใช้ Docker ช่วย (มี Docker บนเครื่องนักพัฒนา):
       - Linux/macOS:
         - `docker run --rm -i mariadb:10.6 sh -c "exec mysql -h $DB_HOST -P 3306 -u$DB_USER -p$DB_PASSWORD $DB_NAME" < db_init/init.sql`
       - Windows PowerShell:
         - `Get-Content .\db_init\init.sql | docker run --rm -i mariadb:10.6 sh -c "exec mysql -h $Env:DB_HOST -P 3306 -u$Env:DB_USER -p$Env:DB_PASSWORD $Env:DB_NAME"`
     - ค่า `$DB_HOST/$DB_USER/$DB_PASSWORD/$DB_NAME` ใช้ค่าจาก Add-on ของ Northflank

3) สร้าง Backend Service
   - New -> Service -> Workload type: Service
   - Source: Git repo นี้, Context path: `back/`, Build method: Dockerfile (`back/Dockerfile`)
   - Expose container port: `3001`
   - เปิด Public URL (Northflank จะให้โดเมนอัตโนมัติ)
   - ตั้งค่า ENV:
     - `NODE_ENV=production`
     - DB: `DB_HOST=<internal hostname>`, `DB_PORT=3306`, `DB_USER`, `DB_PASSWORD`, `DB_NAME`
     - Auth/CORS/Cookie: `JWT_SECRET=<random>`, `FRONTEND_URL=<frontend public URL>`, `CORS_ALLOWED_ORIGINS=<CSV>`, `COOKIE_DOMAIN=<.yourdomain.com หรือเว้นว่าง>`
     - Google: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REDIRECT_URI=https://<backend public URL>/api/auth/google/callback`
   - Deploy แล้วดู Logs ว่าเชื่อม MariaDB สำเร็จ และ `GET /api/healthz` เป็น ok

4) สร้าง Frontend Service
   - New -> Service -> Workload type: Service
   - Source: Git repo, Context path: `front/`, Build method: Dockerfile (`front/Dockerfile`)
   - Expose container port: `3000`
   - เปิด Public URL (จะได้โดเมนอีกอันสำหรับ frontend)
   - ตั้งค่า ENV:
     - `NITRO_HOST=0.0.0.0`, `NITRO_PORT=3000`
     - `NUXT_PUBLIC_API_BASE_URL=https://<backend public URL>/api`
     - `NUXT_PUBLIC_AUTH_URL=https://<frontend public URL>`
     - `NUXT_PUBLIC_GOOGLE_CLIENT_ID`, `NUXT_GOOGLE_CLIENT_SECRET`
   - (ถ้าใช้ custom domain) ผูกโดเมนกับแต่ละ service และอัปเดต ENV ให้ตรงโดเมนจริง

5) ตั้งค่า Google OAuth
   - Authorized redirect URI: `https://<backend public URL>/api/auth/google/callback`
   - Authorized JavaScript origins: `https://<frontend public URL>` และโดเมนจริงถ้ามี

6) ทดสอบ
   - เปิด `https://<frontend>/` และ `https://<backend>/api/healthz`
   - ถ้าล็อกอินไม่ติดคุกกี้ ให้เช็ค: ใช้ HTTPS, `FRONTEND_URL`/`CORS_ALLOWED_ORIGINS` ถูกต้อง, `NODE_ENV=production`, และตั้ง `COOKIE_DOMAIN` เมื่อมีหลายซับโดเมน

## หมายเหตุการสเกล/เสถียรภาพ
- ตอนนี้ใช้ memory store ของ express-session (เหมาะกับ 1 replica)
- ถ้าจะ scale หรือเพิ่มความทนทาน ควรเพิ่ม Redis session store (เช่น Upstash) และใช้ `connect-redis`

