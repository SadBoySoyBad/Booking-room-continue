// tailwind.config.js
module.exports = {
  // >>>>> ส่วน 'content' ต้องแน่ใจว่าถูกต้อง <<<<<
  content: [
    './components/**/*.{vue,js,ts}',
    './layouts/**/*.vue',
    './pages/**/*.vue',
    './plugins/**/*.{js,ts}',
    './app.vue',
    // บรรทัดนี้ซ้ำซ้อนกับข้างบนและอาจทำให้เกิดปัญหาได้ ควรลบออกหรือใช้ path ที่เฉพาะเจาะจง
    // './{pages,layouts,components,plugins,composables,app}.vue', 
    './nuxt.config.{ts,js}',
    // ถ้าคุณมีไฟล์ JS/TS/HTML ที่ใช้ Tailwind Classes ด้วย
    // ก็สามารถเพิ่ม path เหล่านั้นได้ เช่น './src/**/*.{js,ts,vue,html}'
    './composables/**/*.{js,ts}',
  ],
  // >>>>> สิ้นสุดส่วน 'content' <<<<<

  theme: {
    extend: {
      
    },
  },

  // >>>>> ลบส่วน variants นี้ออกไปทั้งหมด <<<<<
  // variants: {
  //   extend: {
  //     backgroundColor: ['responsive'],
  //     textColor: ['responsive'],
  //     display: ['responsive'],
  //     gridTemplateColumns: ['responsive'],
  //     gridColumn: ['responsive'],
  //     margin: ['responsive'],
  //     padding: ['responsive'],
  //   },
  // },

  // >>>>> ส่วน safelist นี้ยังคงเก็บไว้ได้ แต่ควรจะทำงานได้เองหาก variants ถูกแก้ไข <<<<<
  safelist: [
    'grid-cols-1',
    'md:grid-cols-2', // เปลี่ยนจาก 3 เป็น 2 ตามโค้ด dashboard.vue ล่าสุด
    'lg:grid-cols-4', // เพิ่ม lg:grid-cols-4
    'col-span-1',
    'lg:col-span-2', // เพิ่ม lg:col-span-2
    'md:text-red-500', // เพื่อทดสอบต่อไป
    // หากมี Class ไหนที่คุณสงสัยว่าไม่โผล่มาอีก ก็เพิ่มที่นี่
  ],
  // >>>>> สิ้นสุดส่วน safelist <<<<<

  plugins: [],
};