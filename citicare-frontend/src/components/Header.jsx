// components/Header.jsx
import { useState, useEffect, useRef } from 'react'
import {
  Bell,
  Settings,
  User,
  Mail,
  Key,
  Eye,
  EyeOff,
  Calendar,
  AlertTriangle,
  Clock,
  Activity,
  Search,
  ChevronRight
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { authApi } from '../api/authApi'
import { dashboardApi } from '../api/dashboardApi'
import GlassButton from './GlassButton'
import GlassInput from './GlassInput'
import Modal from './Modal'

const Header = () => {
  const { user } = useAuth()
  const [showSettings, setShowSettings] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [showAllNotifications, setShowAllNotifications] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [loadingNotifications, setLoadingNotifications] = useState(false)
  const [passwordForm, setPasswordForm] = useState({
    newPassword: '',
    confirmPassword: ''
  })
  const [passwordError, setPasswordError] = useState('')
  const [passwordSuccess, setPasswordSuccess] = useState('')
  const [changingPassword, setChangingPassword] = useState(false)

  const [notifSearch, setNotifSearch] = useState('')
  const [notifType, setNotifType] = useState('all')
  const [notifMonth, setNotifMonth] = useState('all')
  const [notifYear, setNotifYear] = useState('all')

  const notifDropdownRef = useRef(null)

  useEffect(() => {
    if (showNotifications || showAllNotifications) {
      fetchNotifications()
    }
  }, [showNotifications, showAllNotifications])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = e => {
      if (
        notifDropdownRef.current &&
        !notifDropdownRef.current.contains(e.target)
      ) {
        setShowNotifications(false)
      }
    }
    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showNotifications])

  const fetchNotifications = async () => {
    setLoadingNotifications(true)
    try {
      const [activitiesRes, statsRes] = await Promise.all([
        dashboardApi.getTodayActivities(),
        dashboardApi.getStats()
      ])

      const allNotifications = []

      if (activitiesRes.data.success) {
        activitiesRes.data.data.forEach(activity => {
          allNotifications.push({
            id: `activity-${activity.id}`,
            type: 'Activity',
            title: activity.serviceType,
            description: `${activity.residentName} - ${activity.time}`,
            date: new Date().toISOString().split('T')[0],
            status: activity.status,
            icon: Calendar,
            color: 'text-blue-400',
            bgColor: 'bg-blue-500/10'
          })
        })
      }

      if (statsRes.data.success) {
        statsRes.data.data.criticalResidents?.forEach(resident => {
          allNotifications.push({
            id: `critical-${resident.id}`,
            type: 'Critical Risk',
            title: resident.name,
            description: `Risk Score: ${resident.riskScore} - ${resident.purok}`,
            date: new Date().toISOString().split('T')[0],
            status: 'Critical',
            icon: AlertTriangle,
            color: 'text-red-400',
            bgColor: 'bg-red-500/10'
          })
        })

        statsRes.data.data.highRiskResidents?.forEach(resident => {
          allNotifications.push({
            id: `high-${resident.id}`,
            type: 'High Risk',
            title: resident.name,
            description: `Risk Score: ${resident.riskScore} - ${resident.purok}`,
            date: new Date().toISOString().split('T')[0],
            status: 'High',
            icon: AlertTriangle,
            color: 'text-orange-400',
            bgColor: 'bg-orange-500/10'
          })
        })
      }

      allNotifications.sort((a, b) => new Date(b.date) - new Date(a.date))
      setNotifications(allNotifications)
    } catch (error) {
      console.error('Error fetching notifications:', error)
    } finally {
      setLoadingNotifications(false)
    }
  }

  const handleChangePassword = async e => {
    e.preventDefault()
    setPasswordError('')
    setPasswordSuccess('')

    if (!passwordForm.newPassword) {
      setPasswordError('New password is required')
      return
    }
    if (passwordForm.newPassword.length < 6) {
      setPasswordError('New password must be at least 6 characters')
      return
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('Passwords do not match')
      return
    }

    setChangingPassword(true)
    try {
      await authApi.changePassword({ newPassword: passwordForm.newPassword })
      setShowSettings(false)
      setPasswordForm({ newPassword: '', confirmPassword: '' })
      setPasswordError('')
      setPasswordSuccess('')
      alert('Password changed successfully!')
    } catch (error) {
      setPasswordError(
        error.response?.data?.message || 'Failed to change password'
      )
    } finally {
      setChangingPassword(false)
    }
  }

  const closeSettings = () => {
    setShowSettings(false)
    setPasswordError('')
    setPasswordSuccess('')
    setPasswordForm({ newPassword: '', confirmPassword: '' })
    setShowNewPassword(false)
    setShowConfirmPassword(false)
  }

  const closeAllNotifications = () => {
    setShowAllNotifications(false)
    setNotifSearch('')
    setNotifType('all')
    setNotifMonth('all')
    setNotifYear('all')
  }

  const filteredNotifications = notifications.filter(n => {
    if (
      notifSearch &&
      !n.title?.toLowerCase().includes(notifSearch.toLowerCase()) &&
      !n.description?.toLowerCase().includes(notifSearch.toLowerCase())
    )
      return false
    if (notifType !== 'all' && n.type !== notifType) return false
    if (
      notifMonth !== 'all' &&
      new Date(n.date).getMonth() !== parseInt(notifMonth)
    )
      return false
    if (
      notifYear !== 'all' &&
      new Date(n.date).getFullYear() !== parseInt(notifYear)
    )
      return false
    return true
  })

  const notificationCount = notifications.length
  const recentNotifications = notifications.slice(0, 5)

  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec'
  ]
  const years = [
    ...new Set(notifications.map(n => new Date(n.date).getFullYear()))
  ].sort((a, b) => b - a)
  const notificationTypes = [...new Set(notifications.map(n => n.type))]

  return (
    <>
      <header className='sticky top-0 z-20 glass m-0 lg:m-4 lg:mb-0 px-6 py-4 rounded-none lg:rounded-2xl'>
        <div className='flex items-center justify-between'>
          <div className='hidden md:block'>
            <h2 className='text-lg font-medium text-white/70' style={{ fontFamily: "'Sora', sans-serif" }}>
              Welcome back, <span className='text-white font-bold text-xl' style={{ fontFamily: "'Sora', sans-serif" }}>{user?.name}</span>
            </h2>
          </div>

          <div className='flex items-center space-x-3 ml-auto'>
            {/* Notification Bell */}
            <div className='relative' ref={notifDropdownRef}>
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className='relative p-2 rounded-xl glass hover:bg-white/20 transition-all duration-200'
              >
                <Bell className='w-5 h-5 text-white/70' />
                {notificationCount > 0 && (
                  <span className='absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-[10px] flex items-center justify-center font-bold'>
                    {notificationCount > 99 ? '99+' : notificationCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown - Glassmorphism Blue */}
              {showNotifications && (
                <div className='absolute right-0 top-12 w-80 rounded-2xl bg-[#0a0f28]/80 backdrop-blur-xl border border-white/10 shadow-2xl shadow-black/40 z-50 overflow-hidden'>
                  <div className='p-4 border-b border-white/10 flex items-center justify-between'>
                    <h3
                      className='text-md font-semibold text-white'
                      style={{ fontFamily: "'Sora', sans-serif" }}
                    >
                      Notifications
                    </h3>
                    <span className='text-xs bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full border border-blue-400/30'>
                      {notificationCount}
                    </span>
                  </div>

                  <div className='max-h-80 overflow-y-auto'>
                    {loadingNotifications ? (
                      <div className='text-center py-8'>
                        <div className='w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto' />
                      </div>
                    ) : recentNotifications.length > 0 ? (
                      recentNotifications.map(notif => (
                        <div
                          key={notif.id}
                          className='p-4 border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer'
                        >
                          <div className='flex items-start gap-3'>
                            <div
                              className={`w-8 h-8 rounded-lg ${notif.bgColor} border border-white/10 flex items-center justify-center flex-shrink-0`}
                            >
                              <notif.icon
                                className={`w-4 h-4 ${notif.color}`}
                              />
                            </div>
                            <div className='flex-1 min-w-0'>
                              <div className='flex items-center justify-between'>
                                <span className='text-[10px] text-white/40'>
                                  {notif.type}
                                </span>
                                <span className='text-[10px] text-white/30'>
                                  {notif.date}
                                </span>
                              </div>
                              <p className='text-white text-sm font-medium truncate'>
                                {notif.title}
                              </p>
                              <p className='text-xs text-white/50 truncate'>
                                {notif.description}
                              </p>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className='text-center py-8'>
                        <Bell className='w-8 h-8 text-white/20 mx-auto mb-2' />
                        <p className='text-xs text-white/30'>
                          No notifications
                        </p>
                      </div>
                    )}
                  </div>

                  {notifications.length > 5 && (
                    <button
                      onClick={() => {
                        setShowNotifications(false)
                        setShowAllNotifications(true)
                      }}
                      className='w-full p-3 text-center text-xs text-blue-400 hover:text-blue-300 border-t border-white/10 hover:bg-white/5 transition-colors flex items-center justify-center gap-1'
                    >
                      See all notifications
                      <ChevronRight className='w-3 h-3' />
                    </button>
                  )}
                </div>
              )}
            </div>

            <button
              onClick={() => setShowSettings(true)}
              className='p-2 rounded-xl glass hover:bg-white/20 transition-all duration-200'
              title='Account Settings'
            >
              <Settings className='w-5 h-5 text-white/70' />
            </button>
          </div>
        </div>
      </header>

      {/* All Notifications Modal */}
      <Modal
        isOpen={showAllNotifications}
        onClose={closeAllNotifications}
        title='All Notifications'
        size='lg'
      >
        <div className='space-y-4'>
          <div className='flex flex-wrap gap-2'>
            <div className='relative flex-1 min-w-[200px]'>
              <Search className='absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40' />
              <input
                type='text'
                placeholder='Search notifications...'
                value={notifSearch}
                onChange={e => setNotifSearch(e.target.value)}
                className='glass-input pl-9 pr-3 py-2 text-sm w-full'
              />
            </div>
            <select
              value={notifType}
              onChange={e => setNotifType(e.target.value)}
              className='glass-select text-sm w-auto'
            >
              <option value='all'>All Types</option>
              {notificationTypes.map(type => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
            <select
              value={notifMonth}
              onChange={e => setNotifMonth(e.target.value)}
              className='glass-select text-sm w-auto'
            >
              <option value='all'>All Months</option>
              {months.map((m, i) => (
                <option key={m} value={i}>
                  {m}
                </option>
              ))}
            </select>
            <select
              value={notifYear}
              onChange={e => setNotifYear(e.target.value)}
              className='glass-select text-sm w-auto'
            >
              <option value='all'>All Years</option>
              {years.map(y => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          <p className='text-xs text-white/40'>
            {filteredNotifications.length} notification
            {filteredNotifications.length !== 1 ? 's' : ''}
          </p>

          <div className='max-h-96 overflow-y-auto space-y-2'>
            {filteredNotifications.length > 0 ? (
              filteredNotifications.map(notif => (
                <div
                  key={notif.id}
                  className='bg-white/5 rounded-lg p-4 hover:bg-white/[0.07] transition-colors'
                >
                  <div className='flex items-start gap-3'>
                    <div
                      className={`w-10 h-10 rounded-lg ${notif.bgColor} border border-white/10 flex items-center justify-center flex-shrink-0`}
                    >
                      <notif.icon className={`w-5 h-5 ${notif.color}`} />
                    </div>
                    <div className='flex-1 min-w-0'>
                      <div className='flex items-center justify-between mb-1'>
                        <span className='text-xs text-blue-300/70'>
                          {notif.type}
                        </span>
                        <span className='text-xs text-white/30'>
                          {notif.date}
                        </span>
                      </div>
                      <p className='text-white text-sm font-medium'>
                        {notif.title}
                      </p>
                      <p className='text-xs text-white/50 mt-0.5'>
                        {notif.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className='text-center py-12'>
                <Bell className='w-12 h-12 text-white/20 mx-auto mb-3' />
                <p className='text-white/30 text-sm'>
                  No notifications match your filters
                </p>
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* Settings Modal */}
      <Modal
        isOpen={showSettings}
        onClose={closeSettings}
        title='Account Settings'
        size='md'
      >
        <div className='space-y-6'>
          <div>
            <h3 className='text-sm font-semibold text-blue-300 mb-4 uppercase tracking-wider'>
              Account Information
            </h3>
            <div className='space-y-4'>
              <div className='bg-white/5 rounded-xl p-4 px-6'>
                <div className='flex items-center gap-3'>
                  <div>
                    <p className='text-xs text-white/40 uppercase tracking-wider'>
                      Name
                    </p>
                    <p className='text-white font-medium'>
                      {user?.name || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
              <div className='bg-white/5 rounded-xl p-4 px-6'>
                <div className='flex items-center gap-3'>
                  <div>
                    <p className='text-xs text-white/40 uppercase tracking-wider'>
                      Email
                    </p>
                    <p className='text-white font-medium'>
                      {user?.email || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
              <div className='bg-white/5 rounded-xl p-4 px-6'>
                <div className='flex items-center gap-3'>
                  <div>
                    <p className='text-xs text-white/40 uppercase tracking-wider'>
                      Role
                    </p>
                    <p className='text-white font-medium'>
                      {user?.role || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className='border-t border-white/10 pt-6'>
            <h3 className='text-sm font-semibold text-blue-300 mb-4 uppercase tracking-wider'>
              Change Password
            </h3>
            {passwordError && (
              <div className='mb-4 p-4 rounded-xl bg-red-500/20 border border-red-400/30 text-red-200 text-sm'>
                {passwordError}
              </div>
            )}
            <form onSubmit={handleChangePassword} className='space-y-4'>
              <div className='relative'>
                <GlassInput
                  label='New Password'
                  type={showNewPassword ? 'text' : 'password'}
                  value={passwordForm.newPassword}
                  onChange={e =>
                    setPasswordForm(prev => ({
                      ...prev,
                      newPassword: e.target.value
                    }))
                  }
                  placeholder='Enter new password'
                  icon={Key}
                />
                <button
                  type='button'
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className='absolute right-3 top-[38px] text-white/40 hover:text-white/70'
                >
                  {showNewPassword ? (
                    <EyeOff className='w-4 h-4' />
                  ) : (
                    <Eye className='w-4 h-4' />
                  )}
                </button>
              </div>
              <div className='relative'>
                <GlassInput
                  label='Confirm New Password'
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={passwordForm.confirmPassword}
                  onChange={e =>
                    setPasswordForm(prev => ({
                      ...prev,
                      confirmPassword: e.target.value
                    }))
                  }
                  placeholder='Confirm new password'
                  icon={Key}
                />
                <button
                  type='button'
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className='absolute right-3 top-[38px] text-white/40 hover:text-white/70'
                >
                  {showConfirmPassword ? (
                    <EyeOff className='w-4 h-4' />
                  ) : (
                    <Eye className='w-4 h-4' />
                  )}
                </button>
              </div>
              <div className='flex justify-end pt-2'>
                <GlassButton type='submit' loading={changingPassword}>
                  Change Password
                </GlassButton>
              </div>
            </form>
          </div>
        </div>
      </Modal>
    </>
  )
}

export default Header
