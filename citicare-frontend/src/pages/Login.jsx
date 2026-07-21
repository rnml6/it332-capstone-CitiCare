// pages/Login.jsx
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import logo from '../assets/logo.png'

const Login = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async e => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (!email || !password) {
      setError('Please fill in all fields')
      setLoading(false)
      return
    }

    const result = await login(email, password)

    if (result.success) {
      navigate('/dashboard')
    } else {
      setError(result.message)
    }

    setLoading(false)
  }

  return (
    <div
      className='min-h-screen flex items-center justify-center relative p-10 overflow-hidden'
      style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}
    >
      {/* Blue overlay */}
      <div className='fixed inset-0 bg-gradient-to-br from-blue-950/80 via-blue-900/70 to-blue-800/55 backdrop-blur-[3px] z-[1]' />

      {/* Initial View */}
      <div
        className={`flex flex-col items-center justify-center absolute inset-0 transition-all duration-500 ease-in-out ${
          showForm
            ? 'opacity-0 scale-95 pointer-events-none'
            : 'opacity-100 scale-100'
        }`}
        style={{ zIndex: showForm ? 8 : 10 }}
      >
        <div className='w-[340px] h-[340px] rounded-full overflow-hidden bg-white/5 border-2 border-white/20 shadow-[0_25px_80px_rgba(0,0,0,0.6)] flex items-center justify-center p-8 animate-[logoEntrance_0.8s_ease_forwards]'>
          <img
            src={logo}
            alt='CitiCare Logo'
            className='w-full h-full object-contain rounded-full'
          />
        </div>

        <div
          className='mt-2 text-center animate-[slideUp_0.6s_ease_forwards] opacity-0'
          style={{ animationDelay: '0.25s' }}
        >
          <h1
            className='text-[40px] font-bold uppercase text-white mt-1 tracking-[-0.02em]'
            style={{ fontFamily: "'Sora', sans-serif" }}
          >
            CitiCare
          </h1>
          <p
            className='text-[17px] text-blue-200/80 font-medium -mt-2'
            style={{ fontFamily: "'Sora', sans-serif" }}
          >
            Barangay Gumamela Healthcare Monitoring System
          </p>
        </div>

        <button
          onClick={() => setShowForm(true)}
          className='mt-4 py-[12px] px-20 rounded-2xl bg-gradient-to-r from-blue-500 to-blue-700 text-white text-[16px] font-semibold shadow-lg shadow-blue-600/30 transition-all hover:from-blue-400 hover:to-blue-600 hover:-translate-y-0.5 animate-[slideUp_0.6s_ease_forwards] opacity-0'
          style={{ animationDelay: '0.45s', fontFamily: "'Sora', sans-serif" }}
        >
          Login
        </button>
      </div>

      {/* Form View */}
      <div
        className={`transition-all duration-500 ease-in-out ${
          showForm
            ? 'opacity-100 scale-100'
            : 'opacity-0 scale-95 pointer-events-none'
        }`}
        style={{ zIndex: showForm ? 10 : 8 }}
      >
        <div className='relative w-full max-w-[480px] mx-auto p-7 pt-12 rounded-3xl bg-white/[0.09] border border-white/30 shadow-[0_25px_55px_rgba(2,21,41,0.45),inset_0_1px_0_rgba(255,255,255,0.25)] backdrop-blur-2xl text-white'>
          <button
            onClick={() => setShowForm(false)}
            className='absolute top-4 right-4 w-[27px] h-[27px] bg-white/10 border border-white/20 rounded-full text-white/80 p-1.5 flex items-center justify-center hover:bg-white/20 transition-colors'
          >
            <svg viewBox='0 0 24 24' fill='none' className='w-full h-full'>
              <path
                d='M18 6L6 18M6 6l12 12'
                stroke='currentColor'
                strokeWidth='2'
                strokeLinecap='round'
                strokeLinejoin='round'
              />
            </svg>
          </button>

          <div className='text-center mb-6'>
            <h2
              className='text-3xl font-bold tracking-[-0.01em]'
              style={{ fontFamily: "'Sora', sans-serif" }}
            >
              Welcome Back
            </h2>
            <p
              className='text-[15px] text-white/60'
              style={{ fontFamily: "'Sora', sans-serif" }}
            >
              Sign in to your account
            </p>
          </div>

          <form onSubmit={handleSubmit} className='flex flex-col gap-[22px]'>
            <label className='flex flex-col gap-2'>
              <span
                className='text-[16px] font-semibold text-white/85'
                style={{ fontFamily: "'Sora', sans-serif" }}
              >
                Email
              </span>
              <div className='flex items-center gap-3 bg-white/[0.06] border border-white/20 rounded-2xl px-5 transition-all focus-within:border-white/65 focus-within:bg-white/[0.12] focus-within:shadow-[0_0_0_4px_rgba(133,183,235,0.22)] focus-within:-translate-y-px'>
                <svg
                  className='w-[20px] h-[20px] flex-shrink-0 text-white/50'
                  viewBox='0 0 24 24'
                  fill='none'
                  aria-hidden='true'
                >
                  <circle
                    cx='12'
                    cy='8'
                    r='3.5'
                    stroke='currentColor'
                    strokeWidth='1.6'
                  />
                  <path
                    d='M5 19c0-3.314 3.134-6 7-6s7 2.686 7 6'
                    stroke='currentColor'
                    strokeWidth='1.6'
                    strokeLinecap='round'
                  />
                </svg>
                <input
                  type='text'
                  placeholder='Enter your email'
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  autoComplete='username'
                  required
                  className='flex-1 bg-transparent border-none outline-none py-[16px] text-[15px] text-white placeholder:text-white/40 w-full'
                />
              </div>
            </label>

            <label className='flex flex-col gap-2'>
              <span
                className='text-[16px] font-semibold text-white/85'
                style={{ fontFamily: "'Sora', sans-serif" }}
              >
                Password
              </span>
              <div className='flex items-center gap-3 bg-white/[0.06] border border-white/20 rounded-2xl px-5 transition-all focus-within:border-white/65 focus-within:bg-white/[0.12] focus-within:shadow-[0_0_0_4px_rgba(133,183,235,0.22)] focus-within:-translate-y-px'>
                <svg
                  className='w-[20px] h-[20px] flex-shrink-0 text-white/50'
                  viewBox='0 0 24 24'
                  fill='none'
                  aria-hidden='true'
                >
                  <rect
                    x='5'
                    y='10.5'
                    width='14'
                    height='9'
                    rx='1.6'
                    stroke='currentColor'
                    strokeWidth='1.6'
                  />
                  <path
                    d='M8 10.5V8a4 4 0 0 1 8 0v2.5'
                    stroke='currentColor'
                    strokeWidth='1.6'
                  />
                </svg>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder='Enter your password'
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete='current-password'
                  required
                  className='flex-1 bg-transparent border-none outline-none py-[16px] text-[15px] text-white placeholder:text-white/40 w-full'
                />
                <button
                  type='button'
                  onClick={() => setShowPassword(v => !v)}
                  className='bg-transparent border-none p-1 cursor-pointer flex items-center text-white/50'
                >
                  {showPassword ? (
                    <svg viewBox='0 0 24 24' fill='none' className='w-5 h-5'>
                      <path
                        d='M3 3l18 18'
                        stroke='currentColor'
                        strokeWidth='1.6'
                        strokeLinecap='round'
                      />
                    </svg>
                  ) : (
                    <svg viewBox='0 0 24 24' fill='none' className='w-5 h-5'>
                      <path
                        d='M2 12c1.6-4.7 5.5-7.5 10-7.5s8.4 2.8 10 7.5c-1.6 4.7-5.5 7.5-10 7.5S3.6 16.7 2 12Z'
                        stroke='currentColor'
                        strokeWidth='1.6'
                      />
                      <circle
                        cx='12'
                        cy='12'
                        r='3'
                        stroke='currentColor'
                        strokeWidth='1.6'
                      />
                    </svg>
                  )}
                </button>
              </div>
            </label>

            {error && (
              <p className='text-[14px] text-red-200 bg-red-500/20 border border-red-400/30 rounded-xl p-4 animate-[shake_0.4s_both]'>
                {error}
              </p>
            )}

            <button
              type='submit'
              disabled={loading}
              className='py-[11px] border-none rounded-2xl bg-gradient-to-r from-blue-500 to-blue-700 text-white text-[16px] font-semibold cursor-pointer disabled:opacity-70 transition-all hover:from-blue-400 hover:to-blue-600 mt-0'
              style={{ fontFamily: "'Sora', sans-serif" }}
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>
        </div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=Sora:wght@500;600;700&display=swap');
        
        @keyframes logoEntrance { 0% { opacity: 0; transform: scale(0.9); } 100% { opacity: 1; transform: scale(1); } }
        @keyframes slideUp { 0% { opacity: 0; transform: translateY(12px); } 100% { opacity: 1; transform: translateY(0); } }
        @keyframes shake { 10%,90% { transform: translate3d(-1px,0,0); } 20%,80% { transform: translate3d(2px,0,0); } 30%,50%,70% { transform: translate3d(-3px,0,0); } 40%,60% { transform: translate3d(3px,0,0); } }
      `}</style>
    </div>
  )
}

export default Login
