// pages/Schedules.jsx
import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Calendar,
  Clock,
  MapPin,
  User,
  Plus,
  Pencil,
  Trash2,
  Users,
  AlertTriangle,
  Star,
  Building2,
  Search,
  ChevronLeft,
  ChevronRight,
  List,
  CalendarDays,
  Phone,
  FileText,
  Stethoscope,
  Heart
} from 'lucide-react'
import { scheduleApi } from '../api/scheduleApi'
import GlassCard from '../components/GlassCard'
import GlassButton from '../components/GlassButton'
import GlassInput from '../components/GlassInput'
import LoadingSpinner from '../components/LoadingSpinner'
import Modal from '../components/Modal'
import { formatTime, getStatusColor } from '../utils/helpers'

const Schedules = () => {
  const [schedules, setSchedules] = useState([])
  const [loading, setLoading] = useState(true)
  const [scopeFilter, setScopeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedSchedule, setSelectedSchedule] = useState(null)
  const [showDetailModal, setShowDetailModal] = useState(false)
  const [selectedDate, setSelectedDate] = useState(null)
  const [showDayModal, setShowDayModal] = useState(false)
  const [viewMode, setViewMode] = useState('list') // 'list' or 'calendar'
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const navigate = useNavigate()

  const fetchSchedules = useCallback(async () => {
    try {
      setLoading(true)
      const response = await scheduleApi.getAll()
      if (response.data.success) {
        setSchedules(response.data.data)
      }
    } catch (error) {
      console.error('Error fetching schedules:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSchedules()
  }, [fetchSchedules])

  const handleDelete = async (id, e) => {
    e.stopPropagation()
    if (!confirm('Are you sure you want to delete this schedule?')) return
    try {
      await scheduleApi.delete(id)
      setSchedules(prev => prev.filter(s => s.id !== id))
    } catch (error) {
      console.error('Error deleting schedule:', error)
      alert(error.response?.data?.message || 'Failed to delete schedule')
    }
  }

  const filteredSchedules = useMemo(() => {
    let filtered = schedules

    if (scopeFilter !== 'all') {
      filtered = filtered.filter(s => s.scope === scopeFilter)
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(s => s.status === statusFilter)
    }

    if (searchTerm) {
      const search = searchTerm.toLowerCase()
      filtered = filtered.filter(
        s =>
          s.residentName?.toLowerCase().includes(search) ||
          s.type?.toLowerCase().includes(search) ||
          s.programName?.toLowerCase().includes(search) ||
          s.purokName?.toLowerCase().includes(search) ||
          s.purpose?.toLowerCase().includes(search) ||
          s.leadBhwName?.toLowerCase().includes(search)
      )
    }

    return filtered.sort((a, b) => {
      if (a.isEmergency && !b.isEmergency) return -1
      if (!a.isEmergency && b.isEmergency) return 1
      return new Date(a.date) - new Date(b.date)
    })
  }, [schedules, scopeFilter, statusFilter, searchTerm])

  // Calendar helpers
  const getDaysInMonth = date => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDay = firstDay.getDay()
    return { daysInMonth, startingDay }
  }

  const { daysInMonth, startingDay } = getDaysInMonth(currentMonth)

  const monthYear = currentMonth.toLocaleString('default', {
    month: 'long',
    year: 'numeric'
  })
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  const goToPreviousMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1)
    )
  }

  const goToNextMonth = () => {
    setCurrentMonth(
      new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1)
    )
  }

  const goToToday = () => {
    setCurrentMonth(new Date())
  }

  const getSchedulesForDate = day => {
    const year = currentMonth.getFullYear()
    const month = String(currentMonth.getMonth() + 1).padStart(2, '0')
    const dayStr = String(day).padStart(2, '0')
    const dateStr = `${year}-${month}-${dayStr}`
    return filteredSchedules.filter(s => s.date && s.date.startsWith(dateStr))
  }

  const getSchedulesForSelectedDate = () => {
    if (!selectedDate) return []
    const year = selectedDate.getFullYear()
    const month = String(selectedDate.getMonth() + 1).padStart(2, '0')
    const day = String(selectedDate.getDate()).padStart(2, '0')
    const dateStr = `${year}-${month}-${day}`
    return filteredSchedules.filter(s => s.date && s.date.startsWith(dateStr))
  }

  const isToday = day => {
    const today = new Date()
    const date = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      day
    )
    return date.toDateString() === today.toDateString()
  }

  const getScopeIcon = scope => {
    switch (scope) {
      case 'individual':
        return <User className='w-4 h-4' />
      case 'purok':
        return <MapPin className='w-4 h-4' />
      case 'barangay':
        return <Building2 className='w-4 h-4' />
      default:
        return <User className='w-4 h-4' />
    }
  }

  const getScopeColor = scope => {
    switch (scope) {
      case 'individual':
        return 'bg-blue-500/20 text-blue-300 border-blue-400/30'
      case 'purok':
        return 'bg-green-500/20 text-green-300 border-green-400/30'
      case 'barangay':
        return 'bg-purple-500/20 text-purple-300 border-purple-400/30'
      default:
        return 'bg-blue-500/20 text-blue-300 border-blue-400/30'
    }
  }

  const getScopeLabel = scope => {
    switch (scope) {
      case 'individual':
        return 'Individual'
      case 'purok':
        return 'Purok'
      case 'barangay':
        return 'Barangay'
      default:
        return 'Individual'
    }
  }

  const getPriorityColor = priority => {
    switch (priority) {
      case 'Urgent':
        return 'bg-red-500/20 text-red-300 border-red-400/30'
      case 'High':
        return 'bg-orange-500/20 text-orange-300 border-orange-400/30'
      case 'Normal':
        return 'bg-blue-500/20 text-blue-300 border-blue-400/30'
      case 'Low':
        return 'bg-gray-500/20 text-gray-300 border-gray-400/30'
      default:
        return 'bg-blue-500/20 text-blue-300 border-blue-400/30'
    }
  }

  const formatDuration = minutes => {
    if (!minutes) return ''
    if (minutes < 60) return `${minutes} min`
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    if (remainingMinutes === 0) return `${hours} hr${hours > 1 ? 's' : ''}`
    return `${hours} hr${hours > 1 ? 's' : ''} ${remainingMinutes} min`
  }

  const hasActiveFilters =
    scopeFilter !== 'all' || statusFilter !== 'all' || searchTerm !== ''

  const clearFilters = () => {
    setScopeFilter('all')
    setStatusFilter('all')
    setSearchTerm('')
  }

  if (loading) return <LoadingSpinner message='Loading schedules...' />

  return (
    <div className='space-y-6 animate-fade-in'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div className='pl-1 flex items-center gap-2'>
          <h1
            className='text-2xl font-bold text-white'
            style={{ fontFamily: "'Sora', sans-serif" }}
          >
            Schedules
          </h1>
          <p className='text-sm text-white/50 mt-1'>
            {filteredSchedules.length} schedule
            {filteredSchedules.length !== 1 ? 's' : ''}
            {hasActiveFilters && ' (filtered)'}
          </p>
        </div>
        <GlassButton icon={Plus} onClick={() => navigate('/schedules/new')}>
          New Schedule
        </GlassButton>
      </div>

      {/* Search & Filters */}
      <div className='space-y-3'>
        <GlassInput
          icon={Search}
          placeholder='Search by resident, program, type, purok, or BHW...'
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />

        <div className='flex flex-wrap gap-2'>
          <span className='text-xs text-white/40 py-2 mr-1'>Scope:</span>
          {['all', 'individual', 'purok', 'barangay'].map(f => (
            <button
              key={f}
              onClick={() => setScopeFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-1.5 ${
                scopeFilter === f
                  ? 'bg-blue-500/30 text-blue-300 border border-blue-400/30'
                  : 'bg-white/5 text-white/60 hover:bg-white/10 border border-white/10'
              }`}
            >
              {f !== 'all' && getScopeIcon(f)}
              {f === 'all' ? 'All Scopes' : getScopeLabel(f)}
            </button>
          ))}

          <span className='text-xs text-white/40 py-2 mr-1 ml-3'>Status:</span>
          {['all', 'Scheduled', 'Completed', 'Missed', 'Cancelled'].map(f => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                statusFilter === f
                  ? 'bg-blue-500/30 text-blue-300 border border-blue-400/30'
                  : 'bg-white/5 text-white/60 hover:bg-white/10 border border-white/10'
              }`}
            >
              {f === 'all' ? 'All' : f}
            </button>
          ))}

          <div className='flex bg-white/5 rounded-lg p-0.5'>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-all flex items-center gap-1.5 ${
                viewMode === 'list'
                  ? 'bg-blue-500/30 text-blue-300'
                  : 'text-white/60 hover:text-white/70'
              }`}
            >
              <List className='w-4 h-4' />
              List
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-all flex items-center gap-1.5 ${
                viewMode === 'calendar'
                  ? 'bg-blue-500/30 text-blue-300'
                  : 'text-white/60 hover:text-white/70'
              }`}
            >
              <CalendarDays className='w-4 h-4' />
              Calendar
            </button>
          </div>
        </div>
      </div>

      {/* Calendar View */}
      {viewMode === 'calendar' && (
        <GlassCard hover={false}>
          {/* Calendar Header */}
          <div className='flex items-center justify-between mb-6'>
            <div className='flex items-center gap-3'>
              <button
                onClick={goToPreviousMonth}
                className='p-2 hover:bg-white/10 rounded-lg transition-colors'
              >
                <ChevronLeft className='w-5 h-5 text-white/70' />
              </button>
              <h2 className='text-lg font-semibold text-white'>{monthYear}</h2>
              <button
                onClick={goToNextMonth}
                className='p-2 hover:bg-white/10 rounded-lg transition-colors'
              >
                <ChevronRight className='w-5 h-5 text-white/70' />
              </button>
            </div>
            <button
              onClick={goToToday}
              className='px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-sm text-white/70 transition-colors'
            >
              Today
            </button>
          </div>

          {/* Week Days */}
          <div className='grid grid-cols-7 gap-2 mb-2'>
            {weekDays.map(day => (
              <div
                key={day}
                className='text-center text-xs font-medium text-white/40 py-2'
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className='grid grid-cols-7 gap-2'>
            {/* Empty cells for days before month start */}
            {Array.from({ length: startingDay }).map((_, i) => (
              <div key={`empty-${i}`} className='aspect-square' />
            ))}

            {/* Days of the month */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1
              const schedulesForDay = getSchedulesForDate(day)
              const today = isToday(day)

              return (
                <div
                  key={day}
                  className={`aspect-square rounded-lg p-1.5 cursor-pointer transition-all hover:bg-white/10 ${
                    today
                      ? 'bg-blue-500/20 border border-blue-400/30'
                      : 'bg-white/5 border border-white/10'
                  }`}
                  onClick={() => {
                    if (schedulesForDay.length === 1) {
                      setSelectedSchedule(schedulesForDay[0])
                      setShowDetailModal(true)
                    } else if (schedulesForDay.length > 1) {
                      const date = new Date(
                        currentMonth.getFullYear(),
                        currentMonth.getMonth(),
                        day
                      )
                      setSelectedDate(date)
                      setShowDayModal(true)
                    }
                  }}
                >
                  <div className='flex items-center justify-between mb-1'>
                    <span
                      className={`text-xs font-medium ${
                        today ? 'text-blue-300' : 'text-white/70'
                      }`}
                    >
                      {day}
                    </span>
                    {schedulesForDay.length > 1 && (
                      <span className='text-[10px] bg-blue-500/30 text-blue-300 px-1 rounded'>
                        {schedulesForDay.length}
                      </span>
                    )}
                  </div>

                  <div className='space-y-0.5'>
                    {schedulesForDay.slice(0, 2).map(schedule => (
                      <div
                        key={schedule.id}
                        className={`text-[10px] px-1 py-0.5 rounded truncate flex items-center gap-0.5 ${
                          schedule.isEmergency
                            ? 'bg-red-500/20 text-red-300'
                            : 'bg-white/10 text-white/70'
                        }`}
                        onClick={e => {
                          e.stopPropagation()
                          setSelectedSchedule(schedule)
                          setShowDetailModal(true)
                        }}
                      >
                        {getScopeIcon(schedule.scope)}
                        <span className='truncate'>
                          {schedule.scope === 'individual'
                            ? schedule.residentName
                            : schedule.type}
                        </span>
                      </div>
                    ))}
                    {schedulesForDay.length > 2 && (
                      <div className='text-[10px] text-white/40 px-1'>
                        +{schedulesForDay.length - 2} more
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </GlassCard>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <>
          {filteredSchedules.length > 0 ? (
            <div className='space-y-4'>
              {filteredSchedules.map(schedule => (
                <GlassCard
                  key={schedule.id}
                  onClick={() => {
                    setSelectedSchedule(schedule)
                    setShowDetailModal(true)
                  }}
                >
                  <div className='flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4'>
                    {/* Left Section - Date & Main Info */}
                    <div className='flex items-center space-x-4'>
                      {/* Date Block */}
                      <div className='text-center min-w-[65px]'>
                        <p className='text-2xl font-bold text-white'>
                          {new Date(schedule.date).getDate()}
                        </p>
                        <p className='text-sm text-blue-300'>
                          {new Date(schedule.date).toLocaleString('default', {
                            month: 'short'
                          })}
                        </p>
                        <p className='text-xs text-white/40'>
                          {new Date(schedule.date).getFullYear()}
                        </p>
                      </div>

                      <div className='h-16 w-px bg-white/10 hidden lg:block' />

                      {/* Main Content */}
                      <div>
                        {/* Badges Row */}
                        <div className='flex items-center gap-2 flex-wrap mb-2'>
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-medium border flex items-center gap-1 ${getScopeColor(
                              schedule.scope
                            )}`}
                          >
                            {getScopeIcon(schedule.scope)}
                            {getScopeLabel(schedule.scope)}
                          </span>

                          {schedule.isEmergency && (
                            <span className='px-2 py-0.5 bg-red-500/20 text-red-300 border border-red-400/30 rounded-full text-xs font-medium flex items-center gap-1'>
                              <AlertTriangle className='w-3 h-3' />
                              Emergency
                            </span>
                          )}

                          {schedule.priority !== 'Normal' && (
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getPriorityColor(
                                schedule.priority
                              )}`}
                            >
                              {schedule.priority}
                            </span>
                          )}

                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(
                              schedule.status
                            )}`}
                          >
                            {schedule.status}
                          </span>
                        </div>

                        {/* Title */}
                        <h3
                          className='text-white font-medium text-lg mb-1.5'
                          style={{ fontFamily: "'Sora', sans-serif" }}
                        >
                          {schedule.scope === 'individual'
                            ? schedule.residentName || 'Unknown Resident'
                            : schedule.programName ||
                              `${schedule.type} Program`}
                        </h3>

                        {/* Details Row */}
                        <div className='flex flex-wrap items-center gap-3 text-sm text-white/50'>
                          <span className='flex items-center space-x-1'>
                            <Clock className='w-4 h-4' />
                            <span>{formatTime(schedule.time)}</span>
                            <span className='text-white/30'>
                              ({formatDuration(schedule.duration)})
                            </span>
                          </span>

                          <span className='px-2 py-0.5 rounded bg-white/5 text-xs'>
                            {schedule.type}
                          </span>

                          {schedule.serviceCategory && (
                            <span className='px-2 py-0.5 rounded bg-white/5 text-xs'>
                              {schedule.serviceCategory}
                            </span>
                          )}

                          {schedule.scope === 'individual' &&
                            schedule.residentAge && (
                              <span>
                                {schedule.residentAge}y,{' '}
                                {schedule.residentGender}
                              </span>
                            )}

                          {schedule.scope === 'purok' && schedule.purokName && (
                            <span className='flex items-center space-x-1'>
                              <MapPin className='w-3.5 h-3.5' />
                              <span>{schedule.purokName}</span>
                            </span>
                          )}

                          {schedule.scope === 'barangay' && (
                            <span className='flex items-center space-x-1'>
                              <Building2 className='w-3.5 h-3.5' />
                              <span>Whole Barangay</span>
                            </span>
                          )}

                          {(schedule.scope === 'purok' ||
                            schedule.scope === 'barangay') &&
                            schedule.participantCount > 0 && (
                              <span className='flex items-center space-x-1'>
                                <Users className='w-3.5 h-3.5' />
                                <span>
                                  {schedule.participantCount} participants
                                </span>
                              </span>
                            )}
                        </div>
                      </div>
                    </div>

                    {/* Right Section - Actions */}
                    <div className='flex items-center space-x-2 ml-[81px] lg:ml-0'>
                      <div
                        className='flex space-x-1'
                        onClick={e => e.stopPropagation()}
                      >
                        <button
                          onClick={() =>
                            navigate(`/schedules/${schedule.id}/edit`)
                          }
                          className='p-2 rounded-lg hover:bg-white/10 text-white/50 hover:text-blue-400 transition-colors'
                          title='Edit Schedule'
                        >
                          <Pencil className='w-4 h-4' />
                        </button>
                        <button
                          onClick={e => handleDelete(schedule.id, e)}
                          className='p-2 rounded-lg hover:bg-white/10 text-white/50 hover:text-red-400 transition-colors'
                          title='Delete Schedule'
                        >
                          <Trash2 className='w-4 h-4' />
                        </button>
                      </div>
                    </div>
                  </div>
                </GlassCard>
              ))}
            </div>
          ) : (
            <GlassCard hover={false} className='text-center py-12'>
              <Calendar className='w-16 h-16 text-white/20 mx-auto mb-4' />
              <p className='text-white/40 text-sm mb-2'>No schedules found</p>
            </GlassCard>
          )}
        </>
      )}

      {/* Day Schedules Modal */}
      <Modal
        isOpen={showDayModal}
        onClose={() => setShowDayModal(false)}
        title={
          <div className='flex items-center gap-2'>
            <Calendar className='w-5 h-5' />
            {selectedDate &&
              selectedDate.toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric'
              })}
          </div>
        }
        size='md'
      >
        {selectedDate && (
          <div className='space-y-4'>
            <div className='space-y-3'>
              {getSchedulesForSelectedDate().map(schedule => (
                <div
                  key={schedule.id}
                  className='bg-white/5 rounded-lg p-4 hover:bg-white/10 transition-colors cursor-pointer'
                  onClick={() => {
                    setShowDayModal(false)
                    setSelectedSchedule(schedule)
                    setTimeout(() => setShowDetailModal(true), 100)
                  }}
                >
                  <div className='flex items-start justify-between'>
                    <div className='flex items-start space-x-3'>
                      <div>
                        {/* Badges */}
                        <div className='flex items-center gap-2 flex-wrap mb-1'>
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getScopeColor(
                              schedule.scope
                            )}`}
                          >
                            {getScopeLabel(schedule.scope)}
                          </span>

                          {schedule.isEmergency && (
                            <span className='px-2 py-0.5 bg-red-500/20 text-red-300 border border-red-400/30 rounded-full text-xs font-medium flex items-center gap-1'>
                              <AlertTriangle className='w-3 h-3' />
                              Emergency
                            </span>
                          )}

                          {schedule.priority !== 'Normal' && (
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getPriorityColor(
                                schedule.priority
                              )}`}
                            >
                              {schedule.priority}
                            </span>
                          )}

                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(
                              schedule.status
                            )}`}
                          >
                            {schedule.status}
                          </span>
                        </div>

                        {/* Title */}
                        <h4
                          className='text-white text-lg font-semibold mb-1'
                          style={{ fontFamily: "'Sora', sans-serif" }}
                        >
                          {schedule.scope === 'individual'
                            ? schedule.residentName || 'Unknown Resident'
                            : schedule.programName ||
                              `${schedule.type} Program`}
                        </h4>

                        {/* Details */}
                        <div className='flex flex-wrap items-center gap-3 text-sm text-white/50'>
                          <span className='flex items-center gap-1'>
                            <Clock className='w-3.5 h-3.5' />
                            {formatTime(schedule.time)}
                            <span className='text-white/30'>
                              ({formatDuration(schedule.duration)})
                            </span>
                          </span>

                          <span className='px-2 py-0.5 rounded bg-white/5 text-xs'>
                            {schedule.type}
                          </span>

                          {schedule.scope === 'purok' && schedule.purokName && (
                            <span className='flex items-center gap-1'>
                              <MapPin className='w-3 h-3' />
                              {schedule.purokName}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <ChevronRight className='w-5 h-5 text-white/30 flex-shrink-0' />
                  </div>
                </div>
              ))}
            </div>

            {getSchedulesForSelectedDate().length === 0 && (
              <div className='text-center py-8'>
                <Calendar className='w-12 h-12 text-white/20 mx-auto mb-3' />
                <p className='text-white/40 text-sm'>
                  No schedules for this date
                </p>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Detail Modal */}
      <Modal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title={
          <div className='flex items-center gap-2'>
            {selectedSchedule?.scope === 'individual'
              ? 'Appointment Details'
              : selectedSchedule?.scope === 'purok'
              ? 'Purok Program Details'
              : 'Barangay Program Details'}
          </div>
        }
        size='lg'
      >
        {selectedSchedule && (
          <div className='space-y-6'>
            {/* Emergency Alert */}
            {selectedSchedule.isEmergency && (
              <div className='bg-red-500/20 border border-red-400/30 rounded-lg p-4 flex items-center gap-3'>
                <AlertTriangle className='w-5 h-5 text-red-400 flex-shrink-0' />
                <div>
                  <p className='text-red-300 font-medium'>Emergency Schedule</p>
                  <p className='text-red-200/70 text-sm'>
                    This schedule requires immediate attention
                  </p>
                </div>
              </div>
            )}

            {/* Scope Banner */}
            <div
              className={`rounded-lg p-4 border ${getScopeColor(
                selectedSchedule.scope
              )}`}
            >
              <div className='flex items-center gap-2'>
                {getScopeIcon(selectedSchedule.scope)}
                <span className='font-medium'>
                  {selectedSchedule.scope === 'individual'
                    ? 'Individual Appointment'
                    : selectedSchedule.scope === 'purok'
                    ? 'Purok-Level Program'
                    : 'Barangay-Wide Program'}
                </span>
              </div>
            </div>

            {/* Resident/Target Information */}
            <div className='bg-white/5 rounded-lg p-4 space-y-4'>
              <h3 className='text-sm font-semibold text-blue-300 flex items-center gap-2'>
                {selectedSchedule.scope === 'individual' ? (
                  <>Resident Information</>
                ) : selectedSchedule.scope === 'purok' ? (
                  <>Purok Information</>
                ) : (
                  <>Barangay Information</>
                )}
              </h3>

              <div className='grid grid-cols-2 gap-4'>
                {selectedSchedule.scope === 'individual' && (
                  <>
                    <div>
                      <p className='text-xs text-white/40 mb-1'>
                        Resident Name
                      </p>
                      <p className='text-white font-medium'>
                        {selectedSchedule.residentName || 'N/A'}
                      </p>
                    </div>
                    {selectedSchedule.residentAge && (
                      <div>
                        <p className='text-xs text-white/40 mb-1'>
                          Age & Gender
                        </p>
                        <p className='text-white font-medium'>
                          {selectedSchedule.residentAge} years old,{' '}
                          {selectedSchedule.residentGender}
                        </p>
                      </div>
                    )}
                    {selectedSchedule.address && (
                      <div className='col-span-2'>
                        <p className='text-xs text-white/40 mb-1'>Address</p>
                        <p className='text-white font-medium'>
                          {selectedSchedule.address}
                        </p>
                      </div>
                    )}
                    {selectedSchedule.contactPerson && (
                      <div>
                        <p className='text-xs text-white/40 mb-1'>
                          Contact Person
                        </p>
                        <p className='text-white font-medium'>
                          {selectedSchedule.contactPerson}
                        </p>
                      </div>
                    )}
                    {selectedSchedule.contactNumber && (
                      <div>
                        <p className='text-xs text-white/40 mb-1'>
                          Contact Number
                        </p>
                        <p className='text-white font-medium flex items-center gap-1'>
                          <Phone className='w-3 h-3' />
                          {selectedSchedule.contactNumber}
                        </p>
                      </div>
                    )}
                  </>
                )}

                {selectedSchedule.scope === 'purok' && (
                  <>
                    <div>
                      <p className='text-xs text-white/40 mb-1'>Purok Name</p>
                      <p className='text-white font-medium'>
                        {selectedSchedule.purokName || 'N/A'}
                      </p>
                    </div>
                    {selectedSchedule.participantCount > 0 && (
                      <div>
                        <p className='text-xs text-white/40 mb-1'>
                          Expected Participants
                        </p>
                        <p className='text-white font-medium flex items-center gap-1'>
                          <Users className='w-4 h-4' />
                          {selectedSchedule.participantCount}
                        </p>
                      </div>
                    )}
                    {selectedSchedule.contactPerson && (
                      <div>
                        <p className='text-xs text-white/40 mb-1'>
                          Contact Person
                        </p>
                        <p className='text-white font-medium'>
                          {selectedSchedule.contactPerson}
                        </p>
                      </div>
                    )}
                    {selectedSchedule.contactNumber && (
                      <div>
                        <p className='text-xs text-white/40 mb-1'>
                          Contact Number
                        </p>
                        <p className='text-white font-medium flex items-center gap-1'>
                          <Phone className='w-3 h-3' />
                          {selectedSchedule.contactNumber}
                        </p>
                      </div>
                    )}
                  </>
                )}

                {selectedSchedule.scope === 'barangay' && (
                  <>
                    <div>
                      <p className='text-xs text-white/40 mb-1'>Coverage</p>
                      <p className='text-white font-medium'>All Puroks</p>
                    </div>
                    {selectedSchedule.participantCount > 0 && (
                      <div>
                        <p className='text-xs text-white/40 mb-1'>
                          Expected Participants
                        </p>
                        <p className='text-white font-medium flex items-center gap-1'>
                          <Users className='w-4 h-4' />
                          {selectedSchedule.participantCount}
                        </p>
                      </div>
                    )}
                    {selectedSchedule.contactPerson && (
                      <div>
                        <p className='text-xs text-white/40 mb-1'>
                          Contact Person
                        </p>
                        <p className='text-white font-medium'>
                          {selectedSchedule.contactPerson}
                        </p>
                      </div>
                    )}
                    {selectedSchedule.contactNumber && (
                      <div>
                        <p className='text-xs text-white/40 mb-1'>
                          Contact Number
                        </p>
                        <p className='text-white font-medium flex items-center gap-1'>
                          <Phone className='w-3 h-3' />
                          {selectedSchedule.contactNumber}
                        </p>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Schedule Information */}
            <div className='bg-white/5 rounded-lg p-4 space-y-4'>
              <h3 className='text-sm font-semibold text-blue-300 flex items-center gap-2'>
                Schedule Information
              </h3>

              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <p className='text-xs text-white/40 mb-1'>Date</p>
                  <p className='text-white font-medium'>
                    {new Date(selectedSchedule.date).toLocaleDateString(
                      'en-US',
                      {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      }
                    )}
                  </p>
                </div>
                <div>
                  <p className='text-xs text-white/40 mb-1'>Time & Duration</p>
                  <p className='text-white font-medium'>
                    {formatTime(selectedSchedule.time)}
                    <span className='text-white/50 text-sm ml-1'>
                      ({formatDuration(selectedSchedule.duration)})
                    </span>
                  </p>
                </div>
                <div>
                  <p className='text-xs text-white/40 mb-1'>Status</p>
                  <span
                    className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(
                      selectedSchedule.status
                    )}`}
                  >
                    {selectedSchedule.status}
                  </span>
                </div>
                <div></div>
              </div>
            </div>

            {/* Service Details */}
            <div className='bg-white/5 rounded-lg p-4 space-y-4'>
              <h3 className='text-sm font-semibold text-blue-300 flex items-center gap-2'>
                Service Details
              </h3>

              <div className='grid grid-cols-2 gap-4'>
                <div>
                  <p className='text-xs text-white/40 mb-1'>Service Type</p>
                  <p className='text-white font-medium'>
                    {selectedSchedule.scope === 'individual'
                      ? selectedSchedule.type
                      : selectedSchedule.programName || selectedSchedule.type}
                  </p>
                </div>
                {selectedSchedule.serviceCategory && (
                  <div>
                    <p className='text-xs text-white/40 mb-1'>Category</p>
                    <p className='text-white font-medium'>
                      {selectedSchedule.serviceCategory}
                    </p>
                  </div>
                )}
              </div>

              {selectedSchedule.purpose && (
                <div>
                  <p className='text-xs text-white/40 mb-1'>
                    Purpose/Objective
                  </p>
                  <p className='text-white text-sm leading-relaxed'>
                    {selectedSchedule.purpose}
                  </p>
                </div>
              )}
            </div>

            {/* Location & Contact */}
            <div className='bg-white/5 rounded-lg p-4 space-y-4'>
              <h3 className='text-sm font-semibold text-blue-300 flex items-center gap-2'>
                Location & Contact
              </h3>

              <div className='grid grid-cols-2 gap-4'>
                {selectedSchedule.venue && (
                  <div className='col-span-2'>
                    <p className='text-xs text-white/40 mb-1'>
                      Location Description
                    </p>
                    <p className='text-white font-medium'>
                      {selectedSchedule.venue}
                    </p>
                  </div>
                )}
                {selectedSchedule.purokName && (
                  <div>
                    <p className='text-xs text-white/40 mb-1'>Purok</p>
                    <p className='text-white font-medium flex items-center gap-1'>
                      <MapPin className='w-3 h-3' />
                      {selectedSchedule.purokName}
                    </p>
                  </div>
                )}
                {selectedSchedule.contactPerson && (
                  <div>
                    <p className='text-xs text-white/40 mb-1'>Contact Person</p>
                    <p className='text-white font-medium'>
                      {selectedSchedule.contactPerson}
                    </p>
                  </div>
                )}
                {selectedSchedule.contactNumber && (
                  <div>
                    <p className='text-xs text-white/40 mb-1'>Contact Number</p>
                    <p className='text-white font-medium flex items-center gap-1'>
                      <Phone className='w-3 h-3' />
                      {selectedSchedule.contactNumber}
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Healthcare Professionals & Assigned BHWs */}
            <div className='bg-white/5 rounded-lg p-4 space-y-4'>
              <h3 className='text-sm font-semibold text-blue-300 flex items-center gap-2'>
                Healthcare Team
              </h3>

              <div className='space-y-3'>
                {/* Healthcare Professionals */}
                {selectedSchedule.healthcareProfessionals &&
                  selectedSchedule.healthcareProfessionals.length > 0 && (
                    <div>
                      <p className='text-xs text-white/40 mb-2'>
                        Healthcare Professionals
                      </p>
                      <div className='space-y-2'>
                        {selectedSchedule.healthcareProfessionals.map(
                          (prof, index) => (
                            <div
                              key={index}
                              className='bg-white/5 rounded-lg p-3 flex items-center justify-between'
                            >
                              <p className='text-white font-medium'>
                                {prof.name}
                              </p>
                              {prof.position && (
                                <p className='text-white/50 text-sm'>
                                  {prof.position}
                                </p>
                              )}
                              {prof.contactNumber && (
                                <p className='text-white/50 text-sm flex items-center gap-1'>
                                  <Phone className='w-3 h-3' />
                                  {prof.contactNumber}
                                </p>
                              )}
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}

                {/* Assigned BHWs */}
                {selectedSchedule.assignedBhws &&
                  selectedSchedule.assignedBhws.length > 0 && (
                    <div>
                      <p className='text-xs text-white/40 mb-2'>
                        Assigned BHWs
                      </p>
                      <div className='space-y-2'>
                        {selectedSchedule.assignedBhws.map((bhw, index) => (
                          <div
                            key={index}
                            className='bg-white/5 rounded-lg p-3 flex items-center justify-between'
                          >
                            <p className='text-white font-medium'>{bhw.name}</p>

                            {bhw.contactNumber && (
                              <p className='text-white/50 text-sm flex items-center gap-1'>
                                Barangay Health Worker
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                {/* Show message if no team assigned */}
                {!selectedSchedule.leadBhwName &&
                  (!selectedSchedule.healthcareProfessionals ||
                    selectedSchedule.healthcareProfessionals.length === 0) &&
                  (!selectedSchedule.assignedBhws ||
                    selectedSchedule.assignedBhws.length === 0) && (
                    <p className='text-white/40 text-sm'>
                      No healthcare team assigned
                    </p>
                  )}
              </div>
            </div>

            {/* Additional Information */}
            {(selectedSchedule.purpose || selectedSchedule.notes) && (
              <div className='bg-white/5 rounded-lg p-4 space-y-4'>
                <h3 className='text-sm font-semibold text-blue-300 flex items-center gap-2'>
                  Additional Information
                </h3>

                {selectedSchedule.purpose && (
                  <div>
                    <p className='text-xs text-white/40 mb-1'>
                      Purpose/Objective
                    </p>
                    <p className='text-white text-sm leading-relaxed'>
                      {selectedSchedule.purpose}
                    </p>
                  </div>
                )}

                {selectedSchedule.notes && (
                  <div>
                    <p className='text-xs text-white/40 mb-1'>
                      Notes & Remarks
                    </p>
                    <p className='text-white text-sm leading-relaxed'>
                      {selectedSchedule.notes}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}

export default Schedules
