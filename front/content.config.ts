// content.config.ts
import { defineCollection, defineContentConfig } from '@nuxt/content'

export default defineContentConfig({
  collections: {
    // กำหนด collection ชื่อ 'content' ที่รวมไฟล์ Markdown ทั้งหมด
    content: defineCollection({
      type: 'page', // 'page' สำหรับเนื้อหาที่ map กับหน้าเว็บ, 'data' สำหรับข้อมูลดิบ
      source: '**/*.md', // Wildcard เพื่อรวมไฟล์ Markdown ทั้งหมดในไดเรกทอรี content/
    }),
    // คุณสามารถกำหนด collections เพิ่มเติมได้ที่นี่หากต้องการ
    // blog: defineCollection({
    //   type: 'page',
    //   source: 'blog/*.md', // เฉพาะไฟล์ Markdown ใน content/blog/ เท่านั้น
    // }),
    // docs: defineCollection({
    //   type: 'page',
    //   source: 'docs/**/*.md', // ไฟล์ Markdown ทั้งหมดใน content/docs/ และซับไดเรกทอรี
    // }),
  },
})