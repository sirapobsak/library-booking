import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BookMarked,
  Mail,
  Phone,
  Lock,
  User,
  Eye,
  EyeOff,
  LogIn,
  UserPlus,
  Sparkles,
} from 'lucide-react'
import { useStore } from '../store.jsx'

// ช่องกรอกข้อมูลพร้อมไอคอนและข้อความ error
function Field({ icon: Icon, error, rightSlot, ...props }) {
  return (
    <div>
      <div
        className={`flex items-center gap-2 rounded-xl border bg-white px-3.5 transition focus-within:ring-2 ${
          error
            ? 'border-red-300 focus-within:ring-red-100'
            : 'border-slate-200 focus-within:border-slateblue-400 focus-within:ring-slateblue-100'
        }`}
      >
        <Icon className="h-4 w-4 shrink-0 text-slate-400" />
        <input
          {...props}
          className="w-full bg-transparent py-3 text-sm text-slate-800 outline-none placeholder:text-slate-400"
        />
        {rightSlot}
      </div>
      {error && <p className="mt-1 pl-1 text-xs font-medium text-red-500">{error}</p>}
    </div>
  )
}

export default function AuthPage({ mode }) {
  const isLogin = mode === 'login'
  const navigate = useNavigate()
  const { login, register, pushToast } = useStore()

  const [showPassword, setShowPassword] = useState(false)
  const [errors, setErrors] = useState({})

  // ค่าในฟอร์ม
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
    identifier: '',
  })

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }))
    setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  const switchMode = (target) => {
    setErrors({})
    navigate(target === 'login' ? '/login' : '/register')
  }

  // ---------- ตรวจสอบและส่งฟอร์ม ----------
  const validateRegister = () => {
    const e = {}
    if (!form.firstName.trim()) e.firstName = 'กรุณากรอกชื่อ'
    if (!form.lastName.trim()) e.lastName = 'กรุณากรอกนามสกุล'
    if (!/^[0-9]{9,10}$/.test(form.phone.trim()))
      e.phone = 'เบอร์โทรควรเป็นตัวเลข 9-10 หลัก'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()))
      e.email = 'รูปแบบอีเมลไม่ถูกต้อง'
    if (form.password.length < 6) e.password = 'รหัสผ่านอย่างน้อย 6 ตัวอักษร'
    if (form.password !== form.confirmPassword)
      e.confirmPassword = 'รหัสผ่านไม่ตรงกัน'
    return e
  }

  const validateLogin = () => {
    const e = {}
    if (!form.identifier.trim()) e.identifier = 'กรุณากรอกอีเมลหรือเบอร์โทร'
    if (!form.password) e.password = 'กรุณากรอกรหัสผ่าน'
    return e
  }

  const handleSubmit = (ev) => {
    ev.preventDefault()

    if (isLogin) {
      const e = validateLogin()
      if (Object.keys(e).length) return setErrors(e)
      const res = login(form.identifier.trim(), form.password)
      if (!res.ok) {
        setErrors({ password: res.error })
        pushToast(res.error, 'error')
        return
      }
      pushToast('เข้าสู่ระบบสำเร็จ ยินดีต้อนรับ!', 'success')
      navigate('/dashboard')
    } else {
      const e = validateRegister()
      if (Object.keys(e).length) return setErrors(e)
      const res = register({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        password: form.password,
      })
      if (!res.ok) {
        setErrors({ email: res.error })
        pushToast(res.error, 'error')
        return
      }
      pushToast('ลงทะเบียนสำเร็จ! กรุณาเข้าสู่ระบบ', 'success')
      // ส่งอีเมลไปเติมให้หน้า login อัตโนมัติ
      setForm((f) => ({ ...f, identifier: f.email }))
      navigate('/login')
    }
  }

  const passwordToggle = (
    <button
      type="button"
      onClick={() => setShowPassword((s) => !s)}
      className="text-slate-400 transition hover:text-slate-600"
      aria-label="สลับการแสดงรหัสผ่าน"
    >
      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
    </button>
  )

  return (
    <div className="min-h-screen bg-gradient-to-br from-slateblue-50 via-white to-sage-50">
      <div className="mx-auto grid min-h-screen max-w-6xl items-center gap-8 px-4 py-8 lg:grid-cols-2 lg:px-6">
        {/* ฝั่งซ้าย: แบรนด์ / คำโปรย (ซ่อนบนจอเล็ก) */}
        <div className="hidden flex-col justify-center lg:flex">
          <div className="flex items-center gap-3">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-slateblue-500 to-slateblue-700 text-white shadow-lg shadow-slateblue-500/30">
              <BookMarked className="h-7 w-7" />
            </span>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Library Booking</h1>
              <p className="text-sm text-slate-500">ระบบจองโต๊ะและห้องประชุมในห้องสมุด</p>
            </div>
          </div>

          <h2 className="mt-10 text-4xl font-bold leading-tight text-slate-800">
            จองที่นั่งในห้องสมุด
            <br />
            <span className="text-slateblue-600">ง่าย รวดเร็ว ในไม่กี่คลิก</span>
          </h2>
          <p className="mt-4 max-w-md text-slate-500">
            เลือกโซนที่ชอบ ดูผังที่นั่งแบบเรียลไทม์ แล้วจองโต๊ะหรือห้องประชุมได้ทันที
            พร้อมจัดการและยกเลิกการจองได้ด้วยตัวเอง
          </p>

          <div className="mt-8 grid grid-cols-3 gap-4">
            {[
              { emoji: '🖥️', title: 'Working Space', sub: '8 ที่นั่ง' },
              { emoji: '🧑‍💻', title: 'Focus Pods', sub: '12 ที่นั่ง' },
              { emoji: '🪑', title: 'Flex Desks', sub: '10 ที่นั่ง' },
            ].map((c) => (
              <div
                key={c.title}
                className="rounded-2xl border border-slate-100 bg-white/70 p-4 shadow-sm"
              >
                <div className="text-2xl">{c.emoji}</div>
                <p className="mt-2 text-sm font-semibold text-slate-700">{c.title}</p>
                <p className="text-xs text-slate-400">{c.sub}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ฝั่งขวา: การ์ดฟอร์ม */}
        <div className="mx-auto w-full max-w-md">
          <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-xl shadow-slate-900/5 sm:p-8">
            {/* โลโก้บนจอเล็ก */}
            <div className="mb-6 flex items-center gap-2.5 lg:hidden">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-slateblue-500 to-slateblue-700 text-white">
                <BookMarked className="h-5 w-5" />
              </span>
              <div>
                <p className="font-bold text-slate-800">Library Booking</p>
                <p className="text-xs text-slate-500">ระบบจองห้องสมุด</p>
              </div>
            </div>

            {/* แท็บสลับ Login / Register */}
            <div className="mb-6 grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1">
              <button
                onClick={() => switchMode('login')}
                className={`flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition ${
                  isLogin
                    ? 'bg-white text-slateblue-700 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <LogIn className="h-4 w-4" /> เข้าสู่ระบบ
              </button>
              <button
                onClick={() => switchMode('register')}
                className={`flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition ${
                  !isLogin
                    ? 'bg-white text-slateblue-700 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                <UserPlus className="h-4 w-4" /> ลงทะเบียน
              </button>
            </div>

            <h3 className="text-xl font-bold text-slate-800">
              {isLogin ? 'ยินดีต้อนรับกลับมา 👋' : 'สร้างบัญชีใหม่'}
            </h3>
            <p className="mt-1 text-sm text-slate-500">
              {isLogin
                ? 'เข้าสู่ระบบเพื่อจองที่นั่งในห้องสมุด'
                : 'กรอกข้อมูลเพื่อเริ่มใช้งานระบบจอง'}
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-3.5">
              {!isLogin && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <Field
                      icon={User}
                      placeholder="ชื่อ"
                      value={form.firstName}
                      onChange={set('firstName')}
                      error={errors.firstName}
                    />
                    <Field
                      icon={User}
                      placeholder="นามสกุล"
                      value={form.lastName}
                      onChange={set('lastName')}
                      error={errors.lastName}
                    />
                  </div>
                  <Field
                    icon={Phone}
                    placeholder="เบอร์โทรศัพท์"
                    inputMode="numeric"
                    value={form.phone}
                    onChange={set('phone')}
                    error={errors.phone}
                  />
                  <Field
                    icon={Mail}
                    type="email"
                    placeholder="อีเมล"
                    value={form.email}
                    onChange={set('email')}
                    error={errors.email}
                  />
                </>
              )}

              {isLogin && (
                <Field
                  icon={Mail}
                  placeholder="อีเมล หรือ เบอร์โทรศัพท์"
                  value={form.identifier}
                  onChange={set('identifier')}
                  error={errors.identifier}
                />
              )}

              <Field
                icon={Lock}
                type={showPassword ? 'text' : 'password'}
                placeholder="รหัสผ่าน"
                value={form.password}
                onChange={set('password')}
                error={errors.password}
                rightSlot={passwordToggle}
              />

              {!isLogin && (
                <Field
                  icon={Lock}
                  type={showPassword ? 'text' : 'password'}
                  placeholder="ยืนยันรหัสผ่าน"
                  value={form.confirmPassword}
                  onChange={set('confirmPassword')}
                  error={errors.confirmPassword}
                />
              )}

              <button
                type="submit"
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-slateblue-500 to-slateblue-700 py-3 text-sm font-semibold text-white shadow-lg shadow-slateblue-500/30 transition hover:from-slateblue-600 hover:to-slateblue-800 active:scale-[0.99]"
              >
                {isLogin ? (
                  <>
                    <LogIn className="h-4 w-4" /> เข้าสู่ระบบ
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4" /> ลงทะเบียน
                  </>
                )}
              </button>
            </form>

            {/* กล่องบัญชีตัวอย่าง เฉพาะหน้า login */}
            {isLogin && (
              <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-sage-200 bg-sage-50 p-3.5">
                <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-sage-600" />
                <div className="text-xs leading-relaxed text-sage-800">
                  <p className="font-semibold">บัญชีทดลอง (พร้อมใช้ทันที)</p>
                  <p>
                    อีเมล: <span className="font-mono">demo@library.ac.th</span> หรือเบอร์{' '}
                    <span className="font-mono">0812345678</span>
                  </p>
                  <p>
                    รหัสผ่าน: <span className="font-mono">123456</span>
                  </p>
                </div>
              </div>
            )}
          </div>

          <p className="mt-4 text-center text-xs text-slate-400">
            © 2026 Library Booking System · ออกแบบเพื่อการใช้งานจริง
          </p>
        </div>
      </div>
    </div>
  )
}
