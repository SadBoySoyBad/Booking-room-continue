# FILE: back/Dockerfile

# ✅ ใช้ Node.js LTS
FROM node:lts-alpine

# ✅ สร้างตัวแปร ARG ที่รับจาก docker-compose (หรือ docker build)
ARG NODE_ENV=production

# ✅ ตั้งค่าตัวแปร ENV จาก ARG
ENV NODE_ENV=$NODE_ENV

# ✅ สร้างโฟลเดอร์ทำงาน
WORKDIR /app

# ✅ คัดลอก package*.json ก่อน เพื่อ caching
COPY package*.json ./

# ✅ ถ้าเป็น production ให้ข้าม devDependencies
RUN if [ "$NODE_ENV" = "production" ]; \
    then npm install --omit=dev; \
    else npm install; \
    fi

# ✅ คัดลอก source code ทั้งหมด
COPY . .

# ✅ เปิดพอร์ต
EXPOSE 3001

# ✅ รัน server แบบแยก dev/prod
CMD ["sh", "-c", "if [ \"$NODE_ENV\" = 'development' ]; then /app/node_modules/.bin/nodemon --exec node server.js; else node server.js; fi"]
