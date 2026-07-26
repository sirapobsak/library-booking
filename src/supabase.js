import { createClient } from '@supabase/supabase-js'

// อ่านค่า config จาก .env (ไฟล์ .env ที่ root ของโปรเจกต์)
//   VITE_SUPABASE_URL=https://xxxx.supabase.co
//   VITE_SUPABASE_ANON_KEY=eyJhbGci...
const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// ถ้ายังไม่ใส่ key -> แอปจะทำงานแบบ mock (ข้อมูลอยู่ในหน่วยความจำ, รีเฟรชแล้วหาย)
// ถ้าใส่ key แล้ว   -> แอปจะเชื่อม Supabase จริง (เก็บข้อมูลถาวร + realtime)
export const isSupabaseEnabled = Boolean(url && anonKey)

export const supabase = isSupabaseEnabled
  ? createClient(url, anonKey, {
      auth: {
        persistSession: true, // จำ session ไว้ -> ล็อกอินค้างแม้รีเฟรช/ปิดเปิดใหม่
        autoRefreshToken: true,
      },
    })
  : null
