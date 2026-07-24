# 📚 Library Desk & Meeting Room Booking System

ระบบจองโต๊ะและห้องประชุมในห้องสมุด สร้างด้วย **React + Vite + Tailwind CSS + Lucide Icons**

🌐 **เว็บไซต์ (Live):** https://sirapobsak.github.io/library-booking/

> Deploy อัตโนมัติผ่าน GitHub Actions ทุกครั้งที่ push ขึ้น branch `main`

## ✨ ฟีเจอร์

- **หน้า Login / Register** — สลับแท็บได้ พร้อมตรวจสอบข้อมูล (email format, รหัสผ่านตรงกัน ฯลฯ)
  - Login ใช้ **อีเมล หรือ เบอร์โทร** ก็ได้
- **Dashboard** — เลือกโซน 3 แบบ พร้อมนับที่นั่งว่างแบบเรียลไทม์
  - 💻 Working Zone (30 โต๊ะ)
  - 📚 Quiet Reading Zone (24 โต๊ะ)
  - 🧑‍🤝‍🧑 Meeting Room Zone (6 ห้อง)
- **ผังที่นั่ง (Floor Plan)** — คลิกจองได้ พร้อม legend สถานะ 🟢 ว่าง / 🟡 กำลังเลือก / 🔴 จองแล้ว
- **Modal จอง** — เลือกวันที่ + ช่วงเวลา, ข้อมูลผู้จองเติมจาก login อัตโนมัติ
- **ใบเสร็จ** — แสดงรหัสอ้างอิง (เช่น `LIB-8F3K2Q`) + คัดลอกได้
- **การจองของฉัน** — ดูรายการทั้งหมด และ **ยกเลิกการจอง** ได้ (ที่นั่งกลับมาว่างทันที)
- **Toast** แจ้งเตือนทุก action + Responsive มือถือ/แท็บเล็ต/เดสก์ท็อป

## 🚀 วิธีรัน

```bash
npm install
npm run dev
```

แล้วเปิดเบราว์เซอร์ไปที่ URL ที่ขึ้นในเทอร์มินัล (ปกติคือ http://localhost:5173)

## 🔑 บัญชีทดลอง (ล็อกอินได้ทันที)

| ช่อง | ค่า |
|------|-----|
| อีเมล / เบอร์ | `demo@library.ac.th` หรือ `0812345678` |
| รหัสผ่าน | `123456` |

หรือกด **ลงทะเบียน** เพื่อสร้างบัญชีใหม่ (เก็บใน state ชั่วคราว)

## 📁 โครงสร้างไฟล์

```
src/
├─ main.jsx              # จุดเริ่มต้น + Router + Store
├─ App.jsx               # เส้นทาง (routes) ทั้งหมด
├─ store.jsx            # State กลาง: auth, การจอง, toast
├─ data.js              # ข้อมูลจำลอง: โซน, โต๊ะ, ช่วงเวลา
├─ components/
│  ├─ Header.jsx        # แถบเมนูด้านบน
│  └─ Toasts.jsx        # การแจ้งเตือน
└─ pages/
   ├─ AuthPage.jsx      # Login / Register
   ├─ Dashboard.jsx     # เลือกโซน
   ├─ ZonePage.jsx      # ผังที่นั่ง + จอง
   └─ MyBookings.jsx    # ดู/ยกเลิกการจอง
```

> หมายเหตุ: ข้อมูลทั้งหมดเก็บใน state (mock) จะรีเซ็ตเมื่อรีเฟรชหน้า — เหมาะกับการเดโมและต่อยอดเชื่อม backend ภายหลัง
