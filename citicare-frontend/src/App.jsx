// App.jsx
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext.jsx'
import Layout from './components/Layout.jsx'
import Login from './pages/Login.jsx'
import Dashboard from './pages/Dashboard.jsx'
import Residents from './pages/Residents.jsx'
import ResidentDetail from './pages/ResidentDetail.jsx'
import ResidentForm from './pages/ResidentForm.jsx'
import BHW from './pages/BHW.jsx'
import BHWDetail from './pages/BHWDetail.jsx'
import BHWForm from './pages/BHWForm.jsx'
import Schedules from './pages/Schedules.jsx'
import ScheduleForm from './pages/ScheduleForm.jsx'
import Purok from './pages/Purok.jsx'
import Medicines from './pages/Medicines.jsx'
import gumamelaBg from './assets/gumamela.jpg'

function App () {
  const { isAuthenticated, loading } = useAuth()

  if (loading) {
    return (
      <div
        className='min-h-screen flex items-center justify-center relative'
        style={{
          backgroundImage: `url(${gumamelaBg})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      >
        <div className='absolute inset-0 bg-gradient-to-br from-blue-950/90 via-blue-900/85 to-indigo-950/80 backdrop-blur-sm' />
        <div className='text-center animate-fade-in relative z-10'>
          <div className='inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-blue-500/30 backdrop-blur-lg border border-blue-400/30 mb-4 animate-float'>
            <svg
              className='w-10 h-10 text-blue-300'
              fill='none'
              viewBox='0 0 24 24'
              stroke='currentColor'
            >
              <path
                strokeLinecap='round'
                strokeLinejoin='round'
                strokeWidth={2}
                d='M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z'
              />
            </svg>
          </div>
          <h1 className='text-2xl font-bold text-white mb-2'>CitiCare</h1>
          <p className='text-blue-200/80'>Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div
      className='relative min-h-screen'
      style={{
        backgroundImage: `url(${gumamelaBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
        backgroundRepeat: 'no-repeat'
      }}
    >
      {/* Overlay for all pages except login */}
      {isAuthenticated && (
        <div className='fixed inset-0 bg-gradient-to-br from-blue-950/85 via-blue-900/80 to-indigo-950/75 backdrop-blur-[3px] z-0' />
      )}

      {/* Animated background elements for authenticated pages */}
      {isAuthenticated && (
        <div className='fixed inset-0 z-0 overflow-hidden pointer-events-none'>
          <div
            className='absolute -top-1/2 -left-1/2 w-full h-full opacity-20'
            style={{
              background:
                'radial-gradient(circle at 20% 80%, rgba(59, 130, 246, 0.3) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(99, 102, 241, 0.3) 0%, transparent 50%)',
              animation: 'rotate 30s linear infinite'
            }}
          />
        </div>
      )}

      <Routes>
        <Route
          path='/login'
          element={
            isAuthenticated ? <Navigate to='/dashboard' replace /> : <Login />
          }
        />
        <Route
          path='/'
          element={
            isAuthenticated ? <Layout /> : <Navigate to='/login' replace />
          }
        >
          <Route index element={<Navigate to='/dashboard' replace />} />
          <Route path='dashboard' element={<Dashboard />} />
          <Route path='residents' element={<Residents />} />
          <Route path='residents/new' element={<ResidentForm />} />
          <Route path='residents/:id' element={<ResidentDetail />} />
          <Route path='residents/:id/edit' element={<ResidentForm />} />
          <Route path='bhw' element={<BHW />} />
          <Route path='bhw/new' element={<BHWForm />} />
          <Route path='bhw/:id' element={<BHWDetail />} />
          <Route path='bhw/:id/edit' element={<BHWForm />} />
          <Route path='schedules' element={<Schedules />} />
          <Route path='schedules/new' element={<ScheduleForm />} />
          <Route path='schedules/:id/edit' element={<ScheduleForm />} />
          <Route path='purok' element={<Purok />} />
          <Route path='medicines' element={<Medicines />} />
        </Route>
        <Route path='*' element={<Navigate to='/dashboard' replace />} />
      </Routes>
    </div>
  )
}

export default App
