// pages/BHWDetail.jsx
import { useState, useEffect, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  Calendar,
  CheckCircle,
  XCircle,
  Clock,
  Edit,
  Trash2,
  List,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Search,
  User,
  Building2
} from 'lucide-react'
import { bhwApi } from '../api/bhwApi'
import GlassCard from '../components/GlassCard'
import GlassButton from '../components/GlassButton'
import GlassInput from '../components/GlassInput'
import LoadingSpinner from '../components/LoadingSpinner'
import Modal from '../components/Modal'
import {
  getStatusColor,
  getInitials,
  formatDate,
  formatTime
} from '../utils/helpers'

const BHWDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [bhw, setBhw] = useState(null)
  const [loading, setLoading] = useState(true)
  const [schedules, setSchedules] = useState([])
  const [schedulesLoading, setSchedulesLoading] = useState(false)

  const [scheduleView, setScheduleView] = useState('list')
  const [scheduleFilter, setScheduleFilter] = useState('all')
  const [scheduleSearch, setScheduleSearch] = useState('')

  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth())
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear())
  const [selectedDate, setSelectedDate] = useState(null)
  const [showDateModal, setShowDateModal] = useState(false)

  useEffect(() => {
    fetchBHW()
    fetchSchedules()
  }, [id])

  const fetchBHW = async () => {
    try {
      setLoading(true)
      const response = await bhwApi.getById(id)
      if (response.data.success) {
        setBhw(response.data.data)
      }
    } catch (error) {
      console.error('Error fetching BHW:', error)
      navigate('/bhw')
    } finally {
      setLoading(false)
    }
  }

  const fetchSchedules = async () => {
    try {
      setSchedulesLoading(true)
      const response = await bhwApi.getSchedules(id)
      if (response.data.success) {
        setSchedules(response.data.data || [])
      }
    } catch (error) {
      console.error('Error fetching schedules:', error)
    } finally {
      setSchedulesLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this BHW?')) return
    try {
      await bhwApi.delete(id)
      navigate('/bhw')
    } catch (error) {
      console.error('Error deleting BHW:', error)
      alert(error.response?.data?.message || 'Failed to delete BHW')
    }
  }

  const filteredSchedules = useMemo(() => {
    let filtered = schedules

    if (scheduleFilter !== 'all') {
      filtered = filtered.filter(s => s.status === scheduleFilter)
    }

    if (scheduleSearch) {
      const search = scheduleSearch.toLowerCase()
      filtered = filtered.filter(
        s =>
          s.residentName?.toLowerCase().includes(search) ||
          s.type?.toLowerCase().includes(search) ||
          s.purok?.toLowerCase().includes(search) ||
          s.programName?.toLowerCase().includes(search)
      )
    }

    // Sort ascending by date (earliest/upcoming first)
    return filtered.sort((a, b) => new Date(a.date) - new Date(b.date))
  }, [schedules, scheduleFilter, scheduleSearch])

  const getDaysInMonth = (month, year) => new Date(year, month + 1, 0).getDate()
  const getFirstDayOfMonth = (month, year) => new Date(year, month, 1).getDay()

  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December'
  ]

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  const getSchedulesForDate = date => {
    return filteredSchedules.filter(s => {
      const sDate = new Date(s.date)
      return (
        sDate.getDate() === date &&
        sDate.getMonth() === currentMonth &&
        sDate.getFullYear() === currentYear
      )
    })
  }

  const getScheduleCountForDate = date => {
    return getSchedulesForDate(date).length
  }

  const getDateStatusColor = date => {
    const daySchedules = getSchedulesForDate(date)
    if (daySchedules.length === 0) return ''
    if (daySchedules.some(s => s.status === 'Missed'))
      return 'bg-orange-500/30 text-orange-200 border-orange-400/30'
    if (daySchedules.some(s => s.status === 'Cancelled'))
      return 'bg-red-500/30 text-red-200 border-red-400/30'
    if (daySchedules.every(s => s.status === 'Completed'))
      return 'bg-green-500/30 text-green-200 border-green-400/30'
    if (daySchedules.some(s => s.status === 'Completed'))
      return 'bg-yellow-500/30 text-yellow-200 border-yellow-400/30'
    return 'bg-blue-500/30 text-blue-200 border-blue-400/30'
  }

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11)
      setCurrentYear(prev => prev - 1)
    } else setCurrentMonth(prev => prev - 1)
  }

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0)
      setCurrentYear(prev => prev + 1)
    } else setCurrentMonth(prev => prev + 1)
  }

  const handleDateClick = date => {
    const daySchedules = getSchedulesForDate(date)
    if (daySchedules.length > 0) {
      setSelectedDate({ date, schedules: daySchedules })
      setShowDateModal(true)
    }
  }

  const getScheduleStatusIcon = status => {
    switch (status) {
      case 'Completed':
        return <CheckCircle className='w-4 h-4 text-green-400' />
      case 'Missed':
        return <XCircle className='w-4 h-4 text-red-400' />
      case 'Scheduled':
        return <Clock className='w-4 h-4 text-blue-400' />
      case 'Cancelled':
        return <XCircle className='w-4 h-4 text-red-400' />
      default:
        return <Clock className='w-4 h-4 text-white/40' />
    }
  }

  if (loading) return <LoadingSpinner message='Loading BHW details...' />
  if (!bhw)
    return (
      <div className='text-center py-12'>
        <p className='text-white/40'>BHW not found</p>
        <GlassButton
          variant='secondary'
          className='mt-4'
          onClick={() => navigate('/bhw')}
        >
          Back to BHW Workers
        </GlassButton>
      </div>
    )

  return (
    <div className='space-y-6 animate-fade-in'>
      {/* Header */}
      <div className='flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4'>
        <button
          onClick={() => navigate('/bhw')}
          className='flex items-center space-x-2 text-white/70 hover:text-white transition-colors'
        >
          <ArrowLeft className='w-5 h-5' />
          <span>Back to BHW Workers</span>
        </button>
        <div className='flex gap-2'>
          <GlassButton
            variant='secondary'
            icon={Edit}
            onClick={() => navigate(`/bhw/${id}/edit`)}
          >
            Edit
          </GlassButton>
          <GlassButton variant='danger' icon={Trash2} onClick={handleDelete}>
            Delete
          </GlassButton>
        </div>
      </div>

      {/* Profile Card */}
      <GlassCard hover={false}>
        <div className='flex flex-col md:flex-row items-start gap-6'>
          <div className='flex-1 min-w-0'>
            <div className='flex items-start justify-between'>
              <div>
                <h1 className='text-3xl font-bold text-white'>{bhw.name}</h1>
                {bhw.hasAccount ? (
                  <div className='mt-1 pl-1 space-y-1'>
                    <p className='text-xs text-green-400 flex items-center gap-1'>
                      <span className='w-1.5 h-1.5 bg-green-400 rounded-full'></span>
                      With login account
                    </p>
                  </div>
                ) : (
                  <p className='text-xs text-white/40 mt-1 flex items-center gap-1'>
                    <User className='w-3 h-3' />
                    No login account
                  </p>
                )}
              </div>
              <span className={`badge ${getStatusColor(bhw.status)}`}>
                {bhw.status}
              </span>
            </div>
            <div className='grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4'>
              {bhw.contactNumber && (
                <div className='flex items-center space-x-2 text-white/60'>
                  <Phone className='w-4 h-4 text-blue-400 flex-shrink-0' />
                  <span className='truncate'>{bhw.contactNumber}</span>
                </div>
              )}
              {bhw.email && (
                <div className='flex items-center space-x-2 justify-start text-white/60'>
                  <Mail className='w-4 h-4 text-blue-400 flex-shrink-0' />
                  <span className='truncate'>{bhw.email}</span>
                </div>
              )}

              {bhw.position && (
                <div className='flex items-center space-x-2 justify-center text-white/60'>
                  <User className='w-4 h-4 text-blue-400 flex-shrink-0' />
                  <span className='truncate'>{bhw.position}</span>
                </div>
              )}

              {bhw.assignedPurok && (
                <div className='flex items-center space-x-2 justify-center text-white/60'>
                  <MapPin className='w-4 h-4 text-blue-400 flex-shrink-0' />
                  <span className='truncate'>{bhw.assignedPurok}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Performance Stats */}
      {bhw.stats && (
        <GlassCard hover={false}>
          <h2 className='text-lg font-semibold text-white mb-4'>
            Performance Stats
          </h2>
          <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
            <div className='bg-white/5 p-4 rounded-xl text-center'>
              <p className='text-2xl font-bold text-white'>
                {bhw.stats.totalSchedules || 0}
              </p>
              <p className='text-sm text-white/50'>Total</p>
            </div>
            <div className='bg-white/5 p-4 rounded-xl text-center'>
              <p className='text-2xl font-bold text-white'>
                {bhw.stats.completedSchedules || 0}
              </p>
              <p className='text-sm text-white/50'>Completed</p>
            </div>
            <div className='bg-white/5 p-4 rounded-xl text-center'>
              <p className='text-2xl font-bold text-white'>
                {bhw.stats.upcomingSchedules || 0}
              </p>
              <p className='text-sm text-white/50'>Upcoming</p>
            </div>
            <div className='bg-white/5 p-4 rounded-xl text-center'>
              <p className='text-2xl font-bold text-white'>
                {bhw.stats.missedSchedules || 0}
              </p>
              <p className='text-sm text-white/50'>Missed</p>
            </div>
          </div>
          {bhw.stats.completionRate !== undefined && (
            <div className='mt-4 p-4 bg-white/5 rounded-xl'>
              <div className='flex justify-between items-center mb-2'>
                <p className='text-sm text-white/50'>Completion Rate</p>
                <p className='text-sm font-bold text-white'>
                  {bhw.stats.completionRate}%
                </p>
              </div>
              <div className='w-full bg-white/10 rounded-full h-2'>
                <div
                  className='bg-gradient-to-r from-blue-400 to-blue-600 h-2 rounded-full transition-all duration-500'
                  style={{ width: `${bhw.stats.completionRate}%` }}
                />
              </div>
            </div>
          )}
        </GlassCard>
      )}

      {/* Schedules Section */}
      <GlassCard hover={false}>
        <div className='flex flex-col space-y-4'>
          <div className='flex flex-col md:flex-row items-start md:items-center justify-between gap-4'>
            <h2 className='text-lg font-semibold text-white flex items-center gap-2'>
              <Calendar className='w-5 h-5 text-blue-400' />
              Schedules
              <span className='text-sm text-white/40 font-normal'>
                ({filteredSchedules.length})
              </span>
            </h2>

            <div className='flex items-center gap-3'>
              <div className='flex bg-white/5 rounded-lg p-1'>
                <button
                  onClick={() => setScheduleView('list')}
                  className={`px-3 py-1.5 rounded-md text-sm flex items-center gap-1.5 transition-all ${
                    scheduleView === 'list'
                      ? 'bg-blue-500/30 text-blue-300'
                      : 'text-white/50 hover:text-white/70'
                  }`}
                >
                  <List className='w-4 h-4' />
                  List
                </button>
                <button
                  onClick={() => setScheduleView('calendar')}
                  className={`px-3 py-1.5 rounded-md text-sm flex items-center gap-1.5 transition-all ${
                    scheduleView === 'calendar'
                      ? 'bg-blue-500/30 text-blue-300'
                      : 'text-white/50 hover:text-white/70'
                  }`}
                >
                  <CalendarDays className='w-4 h-4' />
                  Calendar
                </button>
              </div>
              <select
                value={scheduleFilter}
                onChange={e => setScheduleFilter(e.target.value)}
                className='glass-select text-sm w-auto'
              >
                <option value='all'>All Status</option>
                <option value='Scheduled'>Scheduled</option>
                <option value='Completed'>Completed</option>
                <option value='Missed'>Missed</option>
                <option value='Cancelled'>Cancelled</option>
              </select>
            </div>
          </div>

          <GlassInput
            icon={Search}
            placeholder='Search schedules...'
            value={scheduleSearch}
            onChange={e => setScheduleSearch(e.target.value)}
          />

          {scheduleView === 'list' ? (
            <div>
              {schedulesLoading ? (
                <LoadingSpinner message='Loading schedules...' />
              ) : filteredSchedules.length > 0 ? (
                <div className='space-y-2 max-h-[600px] overflow-y-auto pr-1'>
                  {filteredSchedules.map(schedule => {
                    const date = new Date(schedule.date)
                    const scopeIcon =
                      schedule.scope === 'individual' ? (
                        <User className='w-3 h-3' />
                      ) : schedule.scope === 'purok' ? (
                        <MapPin className='w-3 h-3' />
                      ) : (
                        <Building2 className='w-3 h-3' />
                      )
                    return (
                      <div
                        key={schedule.id}
                        className='flex items-center justify-between bg-white/5 rounded-lg p-3 hover:bg-white/[0.07] transition-all border border-white/5 hover:border-white/10 cursor-pointer'
                        onClick={() =>
                          navigate(`/schedules/${schedule.id}/edit`)
                        }
                      >
                        <div className='flex items-center gap-3'>
                          <div className='text-center min-w-[40px]'>
                            <p className='text-sm font-bold text-white'>
                              {date.getDate()}
                            </p>
                            <p className='text-xs text-blue-300'>
                              {date.toLocaleString('default', {
                                month: 'short'
                              })}
                            </p>
                          </div>
                          <div>
                            <div className='flex items-center gap-1.5'>
                              <span className='text-xs text-white/40 flex items-center gap-0.5'>
                                {scopeIcon}
                                {schedule.scope}
                              </span>
                            </div>
                            <p className='text-white text-sm'>
                              {schedule.scope === 'individual'
                                ? schedule.residentName
                                : schedule.programName || schedule.type}
                            </p>
                            <div className='flex items-center gap-2 text-xs text-white/40'>
                              <span className='flex items-center gap-0.5'>
                                <Clock className='w-3 h-3' />
                                {formatTime(schedule.time)}
                              </span>
                              <span>{schedule.type}</span>
                            </div>
                          </div>
                        </div>
                        <span
                          className={`badge text-xs ${getStatusColor(
                            schedule.status
                          )}`}
                        >
                          {schedule.status}
                        </span>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className='text-center py-12'>
                  <Calendar className='w-12 h-12 text-white/20 mx-auto mb-3' />
                  <p className='text-white/40'>No schedules found</p>
                </div>
              )}
            </div>
          ) : (
            <div>
              <div className='flex items-center justify-between mb-6'>
                <button
                  onClick={handlePrevMonth}
                  className='p-2 rounded-lg hover:bg-white/10 text-white/70 hover:text-white'
                >
                  <ChevronLeft className='w-5 h-5' />
                </button>
                <h3 className='text-lg font-semibold text-white'>
                  {monthNames[currentMonth]} {currentYear}
                </h3>
                <button
                  onClick={handleNextMonth}
                  className='p-2 rounded-lg hover:bg-white/10 text-white/70 hover:text-white'
                >
                  <ChevronRight className='w-5 h-5' />
                </button>
              </div>
              <div className='grid grid-cols-7 gap-2'>
                {dayNames.map(day => (
                  <div
                    key={day}
                    className='text-center text-xs text-white/40 py-2 font-medium'
                  >
                    {day}
                  </div>
                ))}
                {Array.from({
                  length: getFirstDayOfMonth(currentMonth, currentYear)
                }).map((_, i) => (
                  <div key={`empty-${i}`} className='aspect-square' />
                ))}
                {Array.from({
                  length: getDaysInMonth(currentMonth, currentYear)
                }).map((_, i) => {
                  const date = i + 1
                  const count = getScheduleCountForDate(date)
                  const colorClass = getDateStatusColor(date)
                  const today = new Date()
                  const isToday =
                    today.getDate() === date &&
                    today.getMonth() === currentMonth &&
                    today.getFullYear() === currentYear
                  return (
                    <button
                      key={date}
                      onClick={() => handleDateClick(date)}
                      disabled={count === 0}
                      className={`aspect-square rounded-xl flex flex-col items-center justify-center transition-all duration-200 border
                        ${
                          isToday
                            ? 'ring-2 ring-blue-400 border-blue-400/50'
                            : 'border-transparent'
                        }
                        ${
                          count > 0
                            ? `${colorClass} cursor-pointer hover:scale-105`
                            : 'text-white/20 hover:bg-white/5 cursor-default'
                        }`}
                    >
                      <span
                        className={`text-sm ${count > 0 ? 'font-medium' : ''}`}
                      >
                        {date}
                      </span>
                      {count > 0 && (
                        <span className='text-[10px] mt-0.5'>{count}</span>
                      )}
                    </button>
                  )
                })}
              </div>
              <div className='flex flex-wrap items-center gap-4 mt-4 pt-4 border-t border-white/10'>
                <div className='flex items-center gap-2'>
                  <div className='w-3 h-3 rounded bg-blue-500/30 border border-blue-400/30' />
                  <span className='text-xs text-white/50'>Scheduled</span>
                </div>
                <div className='flex items-center gap-2'>
                  <div className='w-3 h-3 rounded bg-green-500/30 border border-green-400/30' />
                  <span className='text-xs text-white/50'>Completed</span>
                </div>

                <div className='flex items-center gap-2'>
                  <div className='w-3 h-3 rounded bg-orange-500/30 border border-orange-400/30' />
                  <span className='text-xs text-white/50'>Missed</span>
                </div>
                <div className='flex items-center gap-2'>
                  <div className='w-3 h-3 rounded bg-red-500/30 border border-red-400/30' />
                  <span className='text-xs text-white/50'>Cancelled</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </GlassCard>

      {/* Date Schedule Modal */}
      <Modal
        isOpen={showDateModal}
        onClose={() => setShowDateModal(false)}
        title={
          selectedDate
            ? `Schedules for ${monthNames[currentMonth]} ${selectedDate.date}, ${currentYear}`
            : ''
        }
        size='md'
      >
        {selectedDate && (
          <div className='space-y-3'>
            {selectedDate.schedules.map(schedule => (
              <div
                key={schedule.id}
                className='bg-white/5 rounded-lg p-4 border border-white/5 cursor-pointer hover:bg-white/[0.07]'
                onClick={() => {
                  setShowDateModal(false)
                  navigate(`/schedules/${schedule.id}/edit`)
                }}
              >
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-3'>
                    <div>
                      <h3 className='text-white font-medium'>
                        {schedule.scope === 'individual'
                          ? schedule.residentName
                          : schedule.programName || schedule.type}
                      </h3>
                      <div className='flex items-center gap-2 mt-1'>
                        <span className='text-xs text-white/50 flex items-center gap-1'>
                          <Clock className='w-3 h-3' />
                          {formatTime(schedule.time)}
                        </span>
                        <span className='text-xs text-white/50'>
                          {schedule.type}
                        </span>
                        <span className='text-xs text-white/50 capitalize'>
                          {schedule.scope === 'individual'
                            ? '|'
                            : schedule.scope}
                        </span>
                        {schedule.purok && (
                          <span className='text-xs text-white/50 flex items-center gap-1'>
                            <MapPin className='w-3 h-3' />
                            {schedule.purok}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <span
                    className={`badge text-xs ${getStatusColor(
                      schedule.status
                    )}`}
                  >
                    {schedule.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  )
}

export default BHWDetail
