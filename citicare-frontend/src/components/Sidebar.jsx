// components/Sidebar.jsx
import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  Heart,
  Calendar,
  MapPin,
  LogOut,
  Menu,
  X,
  ChevronLeft
} from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { Pill } from 'lucide-react'
import logo from '../assets/logo.png'

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const location = useLocation()
  const { user, logout } = useAuth()

  const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/residents', icon: Users, label: 'Residents' },
    { path: '/bhw', icon: Heart, label: 'Health Workers' },
    { path: '/schedules', icon: Calendar, label: 'Schedules' },
    { path: '/purok', icon: MapPin, label: 'Puroks' },
    { path: '/medicines', icon: Pill, label: 'Medicines' }
  ]

  const isActive = path => {
    if (path === '/dashboard') return location.pathname === '/dashboard'
    return location.pathname.startsWith(path)
  }

  return (
    <>
      {mobileOpen && (
        <div
          className='fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm'
          onClick={() => setMobileOpen(false)}
        />
      )}

      <button
        onClick={() => setMobileOpen(true)}
        className='fixed top-4 left-4 z-30 lg:hidden glass p-2 rounded-xl'
      >
        <Menu className='w-5 h-5 text-white' />
      </button>

      <aside
        className={`
        fixed lg:static inset-y-0 left-0 z-50
        flex flex-col
        transition-[width,transform] duration-300 ease-in-out border border-white/20
        ${collapsed ? 'w-20' : 'w-64'}
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        bg-white/10 backdrop-blur-lg shadow-xl
        m-0 lg:m-4 rounded-none lg:rounded-2xl
      `}
      >
        <div className='p-6 border-b border-white/10'>
          <div className='flex items-center justify-between'>
            <div
              className={`flex items-center ${
                collapsed ? 'justify-center w-full' : 'space-x-2'
              }`}
            >
              <div
                className='w-12 h-12 rounded-full overflow-hidden bg-white/10 border-2 border-white/20 flex items-center justify-center flex-shrink-0 p-0.5 hover:border-blue-400/50 hover:bg-white/20 transition-colors duration-200 cursor-pointer'
                onClick={() => collapsed && setCollapsed(false)}
              >
                <img
                  src={logo}
                  alt='CitiCare'
                  className='w-full h-full object-contain rounded-full'
                />
              </div>
              {!collapsed && (
                <div>
                  <h1
                    className='text-lg font-bold text-white'
                    style={{ fontFamily: "'Sora', sans-serif" }}
                  >
                    CitiCare
                  </h1>
                  <p
                    className='text-xs text-blue-300'
                    style={{ fontFamily: "'Sora', sans-serif" }}
                  >
                    Barangay Gumamela
                  </p>
                </div>
              )}
            </div>
            {!collapsed && (
              <button
                onClick={() => setCollapsed(true)}
                className='hidden lg:block text-white/50 hover:text-white transition-colors'
              >
                <ChevronLeft className='w-5 h-5' />
              </button>
            )}
          </div>
        </div>

        <nav className='flex-1 p-4 space-y-1 overflow-y-auto'>
          {navItems.map(item => {
            const Icon = item.icon
            const active = isActive(item.path)
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setMobileOpen(false)}
                className={`
                  flex items-center space-x-3 px-4 py-3 rounded-xl 
                  text-white/70 hover:text-white hover:bg-white/10 
                  transition-colors duration-200 cursor-pointer
                  ${active ? 'bg-blue-500/20 text-blue-300' : ''}
                  ${collapsed ? 'justify-center' : ''}
                `}
                title={collapsed ? item.label : ''}
              >
                <Icon className='w-5 h-5 flex-shrink-0' />
                {!collapsed && <span>{item.label}</span>}
              </Link>
            )
          })}
        </nav>

        <div className='p-4 border-t border-white/10'>
          <button
            onClick={logout}
            className={`w-full flex items-center space-x-2 px-4 py-2 rounded-xl 
              text-white/70 hover:text-red-400 hover:bg-red-500/10 
              transition-colors duration-200 ${
                collapsed ? 'justify-center' : ''
              }`}
          >
            <LogOut className='w-4 h-4' />
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>
    </>
  )
}

export default Sidebar
