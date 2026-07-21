// pages/Purok.jsx
import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  MapPin,
  Users,
  AlertTriangle,
  Calendar,
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  ChevronRight,
  Clock,
  User,
  Building2,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  UserPlus,
  Check,
  ChevronLeft,
  List,
  CalendarDays
} from 'lucide-react'
import { purokApi } from '../api/purokApi'
import { residentApi } from '../api/residentApi'
import { bhwApi } from '../api/bhwApi'
import { scheduleApi } from '../api/scheduleApi'
import GlassCard from '../components/GlassCard'
import GlassButton from '../components/GlassButton'
import GlassInput from '../components/GlassInput'
import Modal from '../components/Modal'
import LoadingSpinner from '../components/LoadingSpinner'
import {
  formatDate,
  formatTime,
  getStatusColor,
  getRiskColor
} from '../utils/helpers'

const Purok = () => {
  const [puroks, setPuroks] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [newPurokName, setNewPurokName] = useState('')
  const [saving, setSaving] = useState(false)

  const [selectedPurok, setSelectedPurok] = useState(null)
  const [purokResidents, setPurokResidents] = useState([])
  const [purokSchedules, setPurokSchedules] = useState([])
  const [assignedBHWs, setAssignedBHWs] = useState([])
  const [availableBHWs, setAvailableBHWs] = useState([])
  const [detailLoading, setDetailLoading] = useState(false)

  const [showEditModal, setShowEditModal] = useState(false)
  const [editPurokName, setEditPurokName] = useState('')
  const [showAssignBHWModal, setShowAssignBHWModal] = useState(false)
  const [bhwSearch, setBhwSearch] = useState('')

  const [filterFocusGroup, setFilterFocusGroup] = useState('all')
  const [filterRiskLevel, setFilterRiskLevel] = useState('all')
  const [residentSearch, setResidentSearch] = useState('')
  const [residentPage, setResidentPage] = useState(1)
  const residentsPerPage = 10

  const [scheduleSearch, setScheduleSearch] = useState('')
  const [scheduleStatusFilter, setScheduleStatusFilter] = useState('all')
  const [scheduleScopeFilter, setScheduleScopeFilter] = useState('all')
  const [scheduleView, setScheduleView] = useState('list')

  const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth())
  const [calendarYear, setCalendarYear] = useState(new Date().getFullYear())
  const [selectedDate, setSelectedDate] = useState(null)
  const [showDateModal, setShowDateModal] = useState(false)

  const [expandedResident, setExpandedResident] = useState(null)

  const navigate = useNavigate()

  const fetchPuroks = useCallback(async () => {
    try {
      setLoading(true)
      const response = await purokApi.getAll()
      if (response.data.success) setPuroks(response.data.data || [])
    } catch (error) {
      console.error('Error fetching puroks:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchPuroks()
  }, [fetchPuroks])

  const fetchPurokDetails = async purok => {
    try {
      setDetailLoading(true)
      const [residentsRes, bhwsRes, schedulesRes] = await Promise.all([
        residentApi.getAll(),
        bhwApi.getAll(),
        scheduleApi.getAll()
      ])

      const allResidents = residentsRes.data?.success
        ? residentsRes.data.data || []
        : []
      const allBhws = bhwsRes.data?.success ? bhwsRes.data.data || [] : []
      const allSchedules = schedulesRes.data?.success
        ? schedulesRes.data.data || []
        : []

      const purokResidentsList = allResidents.filter(
        r => r.purokId === purok.id || r.purok === purok.name
      )

      // Only Active BHW Workers assigned to this purok
      const purokBhws = allBhws.filter(b => {
        const isAssigned =
          b.assignedPurokId === purok.id || b.assignedPurok === purok.name
        const isActive = b.status === 'Active'
        const isBHW =
          b.position === 'Barangay Health Worker' || b.workerType === 'BHW'
        return isAssigned && isActive && isBHW
      })

      // Available BHWs - Active BHW Workers only, not assigned to any purok
      const available = allBhws.filter(b => {
        if (b.status !== 'Active') return false
        const isBHW =
          b.position === 'Barangay Health Worker' || b.workerType === 'BHW'
        if (!isBHW) return false
        const hasNoPurok = !b.assignedPurokId && !b.assignedPurok
        const assignedToThisPurok =
          b.assignedPurokId === purok.id || b.assignedPurok === purok.name
        return hasNoPurok || assignedToThisPurok
      })

      const purokSchedulesList = allSchedules.filter(s => {
        if (
          s.scope === 'purok' &&
          (s.purokId === purok.id || s.purokName === purok.name)
        )
          return true
        if (s.scope === 'barangay') return true
        if (s.scope === 'individual')
          return purokResidentsList.some(r => r.id === s.residentId)
        return false
      })

      setPurokResidents(purokResidentsList)
      setPurokSchedules(purokSchedulesList)
      setAssignedBHWs(purokBhws)
      setAvailableBHWs(available)
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setDetailLoading(false)
    }
  }

  const handlePurokClick = purok => {
    setSelectedPurok(purok)
    setResidentPage(1)
    setResidentSearch('')
    setScheduleSearch('')
    setScheduleStatusFilter('all')
    setScheduleScopeFilter('all')
    setScheduleView('list')
    const now = new Date()
    setCalendarMonth(now.getMonth())
    setCalendarYear(now.getFullYear())
    fetchPurokDetails(purok)
  }

  const handleBack = () => {
    setSelectedPurok(null)
    setPurokResidents([])
    setPurokSchedules([])
    setAssignedBHWs([])
    setAvailableBHWs([])
    setFilterFocusGroup('all')
    setFilterRiskLevel('all')
    setExpandedResident(null)
    setResidentPage(1)
    setResidentSearch('')
    setScheduleSearch('')
    setScheduleStatusFilter('all')
    setScheduleScopeFilter('all')
  }

  const handleAddPurok = async e => {
    e.preventDefault()
    if (!newPurokName.trim()) return
    setSaving(true)
    try {
      await purokApi.create({ name: newPurokName.trim() })
      setShowAddModal(false)
      setNewPurokName('')
      fetchPuroks()
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to add purok')
    } finally {
      setSaving(false)
    }
  }

  const handleEditPurok = async e => {
    e.preventDefault()
    if (!editPurokName.trim()) return
    setSaving(true)
    try {
      await purokApi.update(selectedPurok.id, { name: editPurokName.trim() })
      setShowEditModal(false)
      setSelectedPurok(prev => ({ ...prev, name: editPurokName.trim() }))
      fetchPuroks()
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to update purok')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id, e) => {
    if (e) e.stopPropagation()
    if (!confirm('Delete this purok?')) return
    try {
      await purokApi.delete(id)
      setPuroks(prev => prev.filter(p => p.id !== id))
      if (selectedPurok?.id === id) handleBack()
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to delete purok')
    }
  }

  const handleAssignBHW = async bhwId => {
    try {
      await bhwApi.update(bhwId, { assignedPurokId: selectedPurok.id })
      fetchPurokDetails(selectedPurok)
      setShowAssignBHWModal(false)
      setBhwSearch('')
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to assign BHW')
    }
  }

  const handleRemoveBHW = async bhwId => {
    try {
      await bhwApi.update(bhwId, { assignedPurokId: null })
      fetchPurokDetails(selectedPurok)
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to remove BHW')
    }
  }

  const openEditModal = () => {
    setEditPurokName(selectedPurok?.name || '')
    setShowEditModal(true)
  }

  const filteredResidents = purokResidents.filter(r => {
    if (
      residentSearch &&
      !r.name?.toLowerCase().includes(residentSearch.toLowerCase())
    )
      return false
    if (filterFocusGroup !== 'all') {
      const groups = r.focusGroups || []
      if (filterFocusGroup === 'none') {
        if (groups.length > 0) return false
      } else {
        if (!groups.includes(filterFocusGroup)) return false
      }
    }
    if (filterRiskLevel !== 'all' && r.riskLevel !== filterRiskLevel)
      return false
    return true
  })
  const totalResidentPages = Math.ceil(
    filteredResidents.length / residentsPerPage
  )
  const paginatedResidents = filteredResidents.slice(
    (residentPage - 1) * residentsPerPage,
    residentPage * residentsPerPage
  )

  const filteredSchedules = purokSchedules
    .filter(s => {
      if (scheduleSearch) {
        const search = scheduleSearch.toLowerCase()
        const name =
          s.scope === 'individual' ? s.residentName : s.programName || ''
        if (
          !name?.toLowerCase().includes(search) &&
          !s.type?.toLowerCase().includes(search)
        )
          return false
      }
      if (scheduleStatusFilter !== 'all' && s.status !== scheduleStatusFilter)
        return false
      if (scheduleScopeFilter !== 'all' && s.scope !== scheduleScopeFilter)
        return false
      return true
    })
    .sort((a, b) => new Date(a.date) - new Date(b.date))

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
  const getDaysInMonth = (m, y) => new Date(y, m + 1, 0).getDate()
  const getFirstDayOfMonth = (m, y) => new Date(y, m, 1).getDay()
  const getSchedulesForDate = date =>
    filteredSchedules.filter(s => {
      const sDate = new Date(s.date)
      return (
        sDate.getDate() === date &&
        sDate.getMonth() === calendarMonth &&
        sDate.getFullYear() === calendarYear
      )
    })
  const getScheduleCountForDate = date => getSchedulesForDate(date).length
  const getDateColor = date => {
    const day = getSchedulesForDate(date)
    if (day.length === 0) return ''
    if (day.some(s => s.status === 'Missed'))
      return 'bg-orange-500/30 text-orange-200 border-orange-400/30'
    if (day.some(s => s.status === 'Cancelled'))
      return 'bg-red-500/30 text-red-200 border-red-400/30'
    if (day.every(s => s.status === 'Completed'))
      return 'bg-green-500/30 text-green-200 border-green-400/30'
    return 'bg-blue-500/30 text-blue-200 border-blue-400/30'
  }
  const handlePrevMonth = () => {
    if (calendarMonth === 0) {
      setCalendarMonth(11)
      setCalendarYear(y => y - 1)
    } else setCalendarMonth(m => m - 1)
  }
  const handleNextMonth = () => {
    if (calendarMonth === 11) {
      setCalendarMonth(0)
      setCalendarYear(y => y + 1)
    } else setCalendarMonth(m => m + 1)
  }
  const handleDateClick = date => {
    const daySchedules = getSchedulesForDate(date)
    if (daySchedules.length > 0) {
      setSelectedDate({ date, schedules: daySchedules })
      setShowDateModal(true)
    }
  }

  const riskCounts = {
    total: purokResidents.length,
    critical: purokResidents.filter(r => r.riskLevel === 'Critical Health Risk')
      .length,
    high: purokResidents.filter(r => r.riskLevel === 'High Health Risk').length,
    moderate: purokResidents.filter(r => r.riskLevel === 'Moderate Health Risk')
      .length,
    low: purokResidents.filter(r => r.riskLevel === 'Low Health Risk').length
  }
  const filteredPuroks = puroks.filter(p =>
    p.name?.toLowerCase().includes(searchTerm.toLowerCase())
  )
  const focusGroupOptions = [
    { value: 'pregnant', label: 'Pregnant' },
    { value: 'infant', label: 'Infant (0-5)' },
    { value: 'senior', label: 'Senior (60+)' },
    { value: 'withCondition', label: 'With Condition' },
    { value: 'pwd', label: 'PWD' },
    { value: 'none', label: 'No Focus Group' }
  ]

  if (loading) return <LoadingSpinner message='Loading puroks...' />

  if (selectedPurok) {
    return (
      <div className='space-y-6 animate-fade-in'>
        <div className='flex items-center justify-between'>
          <button
            onClick={handleBack}
            className='flex items-center space-x-2 text-white/50 hover:text-white text-sm'
          >
            <ArrowLeft className='w-4 h-4' />
            <span>Back to Puroks</span>
          </button>
          <div className='flex gap-2'>
            <GlassButton
              variant='secondary'
              icon={Pencil}
              onClick={openEditModal}
            >
              Edit
            </GlassButton>
            <GlassButton
              variant='danger'
              icon={Trash2}
              onClick={e => handleDelete(selectedPurok.id, e)}
            >
              Delete
            </GlassButton>
          </div>
        </div>
        <div>
          <h1 className='text-2xl font-bold text-white flex items-center gap-2'>
            <MapPin className='w-6 h-6 text-blue-400' />
            {selectedPurok.name}
          </h1>
        </div>

        <div className='grid grid-cols-2 md:grid-cols-5 gap-3'>
          <GlassCard hover={false} className='text-center py-3'>
            <p className='text-2xl font-bold text-white'>{riskCounts.total}</p>
            <p className='text-xs text-white/50 mt-1'>Total</p>
          </GlassCard>
          <GlassCard hover={false} className='text-center py-3'>
            <p className='text-2xl font-bold text-red-400'>
              {riskCounts.critical}
            </p>
            <p className='text-xs text-red-400/70 mt-1'>Critical</p>
          </GlassCard>
          <GlassCard hover={false} className='text-center py-3'>
            <p className='text-2xl font-bold text-orange-400'>
              {riskCounts.high}
            </p>
            <p className='text-xs text-orange-400/70 mt-1'>High</p>
          </GlassCard>
          <GlassCard hover={false} className='text-center py-3'>
            <p className='text-2xl font-bold text-yellow-400'>
              {riskCounts.moderate}
            </p>
            <p className='text-xs text-yellow-400/70 mt-1'>Moderate</p>
          </GlassCard>
          <GlassCard hover={false} className='text-center py-3'>
            <p className='text-2xl font-bold text-green-400'>
              {riskCounts.low}
            </p>
            <p className='text-xs text-green-400/70 mt-1'>Low</p>
          </GlassCard>
        </div>

        <GlassCard hover={false}>
          <div className='flex items-center justify-between mb-3'>
            <h3 className='text-base font-medium text-white/80'>
              Assigned BHW Workers
            </h3>
            <button
              onClick={() => setShowAssignBHWModal(true)}
              className='text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1'
            >
              <UserPlus className='w-3.5 h-3.5' />
              Assign BHW
            </button>
          </div>
          {assignedBHWs.length === 0 ? (
            <GlassCard
              hover={false}
              className='text-center py-8 bg-white/[0.02]'
            >
              <div className='w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-3'>
                <User className='w-6 h-6 text-white/20' />
              </div>
              <p className='text-sm text-white/30 mb-1'>
                No BHW workers assigned to this purok
              </p>
            </GlassCard>
          ) : (
            <div className='space-y-2 max-h-64 overflow-y-auto'>
              {assignedBHWs.map(bhw => (
                <div
                  key={bhw.id}
                  className='flex items-center justify-between bg-white/5 rounded-lg p-3'
                >
                  <div className='flex items-center gap-3'>
                    <div className='w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center'>
                      <span className='text-sm font-bold text-white'>
                        {bhw.name?.charAt(0) || '?'}
                      </span>
                    </div>
                    <div>
                      <p className='text-white text-sm font-medium'>
                        {bhw.name}
                      </p>
                      <p className='text-xs text-white/40'>{bhw.position}</p>
                    </div>
                  </div>
                  <div className='flex items-center gap-2'>
                    {bhw.contactNumber && (
                      <span className='text-xs text-white/50'>
                        {bhw.contactNumber}
                      </span>
                    )}
                    <button
                      onClick={() => handleRemoveBHW(bhw.id)}
                      className='text-white/30 hover:text-red-400 transition-colors'
                      title='Remove from purok'
                    >
                      <X className='w-3.5 h-3.5' />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </GlassCard>

        <GlassCard hover={false}>
          <div className='flex items-center justify-between mb-4'>
            <h3 className='text-base font-medium text-white/80'>
              Residents · {filteredResidents.length}
            </h3>
            <div className='flex items-center gap-2'>
              <div className='relative w-48'>
                <Search className='absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/40' />
                <input
                  type='text'
                  placeholder='Search...'
                  value={residentSearch}
                  onChange={e => {
                    setResidentSearch(e.target.value)
                    setResidentPage(1)
                  }}
                  className='glass-input pl-8 pr-3 py-1.5 text-xs w-full'
                />
              </div>
              <select
                value={filterFocusGroup}
                onChange={e => {
                  setFilterFocusGroup(e.target.value)
                  setResidentPage(1)
                }}
                className='glass-select text-xs py-1.5 w-auto'
              >
                <option value='all'>All Groups</option>
                {focusGroupOptions.map(g => (
                  <option key={g.value} value={g.value}>
                    {g.label}
                  </option>
                ))}
              </select>
              <select
                value={filterRiskLevel}
                onChange={e => {
                  setFilterRiskLevel(e.target.value)
                  setResidentPage(1)
                }}
                className='glass-select text-xs py-1.5 w-auto'
              >
                <option value='all'>All Risks</option>
                <option value='Critical Health Risk'>Critical</option>
                <option value='High Health Risk'>High</option>
                <option value='Moderate Health Risk'>Moderate</option>
                <option value='Low Health Risk'>Low</option>
              </select>
            </div>
          </div>
          {detailLoading ? (
            <LoadingSpinner message='Loading...' />
          ) : paginatedResidents.length === 0 ? (
            <GlassCard
              hover={false}
              className='text-center py-8 bg-white/[0.02]'
            >
              <Users className='w-10 h-10 text-white/20 mx-auto mb-3' />
              <p className='text-sm text-white/30'>No residents found</p>
              {residentSearch && (
                <button
                  onClick={() => setResidentSearch('')}
                  className='mt-2 text-xs text-blue-400 hover:text-blue-300'
                >
                  Clear search
                </button>
              )}
            </GlassCard>
          ) : (
            <>
              <div className='space-y-1 max-h-[400px] overflow-y-auto'>
                {paginatedResidents.map(r => (
                  <div key={r.id}>
                    <div
                      className='flex items-center justify-between py-2 px-3 rounded-lg hover:bg-white/5 cursor-pointer'
                      onClick={() =>
                        setExpandedResident(
                          expandedResident === r.id ? null : r.id
                        )
                      }
                    >
                      <div className='flex items-center gap-3'>
                        <span
                          className={`badge text-xs ${getRiskColor(
                            r.riskLevel
                          )}`}
                        >
                          {r.riskLevel?.replace(' Health Risk', '') || '?'}
                        </span>
                        <span className='text-sm text-white'>{r.name}</span>
                        <span className='text-xs text-white/40'>
                          {r.age}y, {r.gender}
                        </span>
                      </div>
                      <div className='flex items-center gap-2'>
                        {r.focusGroups?.length > 0 && (
                          <div className='flex gap-1'>
                            {r.focusGroups.slice(0, 3).map(g => (
                              <span
                                key={g}
                                className='px-1.5 py-0.5 bg-blue-500/20 text-blue-300 rounded text-xs'
                              >
                                {g === 'pregnant'
                                  ? 'P'
                                  : g === 'infant'
                                  ? 'I'
                                  : g === 'senior'
                                  ? 'S'
                                  : g === 'withCondition'
                                  ? 'C'
                                  : g === 'pwd'
                                  ? 'PWD'
                                  : g}
                              </span>
                            ))}
                          </div>
                        )}
                        {expandedResident === r.id ? (
                          <ChevronUp className='w-4 h-4 text-white/40' />
                        ) : (
                          <ChevronDown className='w-4 h-4 text-white/40' />
                        )}
                      </div>
                    </div>
                    {expandedResident === r.id && (
                      <div className='px-6 py-2 bg-white/[0.02] rounded-lg mb-1 text-xs'>
                        <div className='grid grid-cols-2 gap-2'>
                          {r.contactNumber && (
                            <div>
                              <span className='text-white/40'>Contact:</span>{' '}
                              <span className='text-white/70'>
                                {r.contactNumber}
                              </span>
                            </div>
                          )}
                          {r.lastCheckup && (
                            <div>
                              <span className='text-white/40'>
                                Last Checkup:
                              </span>{' '}
                              <span className='text-white/70'>
                                {formatDate(r.lastCheckup)}
                              </span>
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => navigate(`/residents/${r.id}`)}
                          className='text-blue-400 hover:text-blue-300 mt-2'
                        >
                          View Full Profile →
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {totalResidentPages > 1 && (
                <div className='flex items-center justify-center gap-2 mt-3 pt-3 border-t border-white/10'>
                  <button
                    onClick={() => setResidentPage(p => Math.max(1, p - 1))}
                    disabled={residentPage === 1}
                    className='px-3 py-1 rounded-lg text-xs bg-white/5 text-white/60 hover:bg-white/10 disabled:opacity-30'
                  >
                    Prev
                  </button>
                  {[...Array(totalResidentPages)].map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setResidentPage(i + 1)}
                      className={`w-7 h-7 rounded-lg text-xs font-medium ${
                        residentPage === i + 1
                          ? 'bg-blue-500/30 text-blue-300'
                          : 'bg-white/5 text-white/60 hover:bg-white/10'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button
                    onClick={() =>
                      setResidentPage(p => Math.min(totalResidentPages, p + 1))
                    }
                    disabled={residentPage === totalResidentPages}
                    className='px-3 py-1 rounded-lg text-xs bg-white/5 text-white/60 hover:bg-white/10 disabled:opacity-30'
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </GlassCard>

        <GlassCard hover={false}>
          <div className='flex items-center justify-between mb-4'>
            <h3 className='text-base font-medium text-white/80'>
              Schedules · {filteredSchedules.length}
            </h3>
            <div className='flex items-center gap-2'>
              <div className='relative w-40'>
                <Search className='absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/40' />
                <input
                  type='text'
                  placeholder='Search...'
                  value={scheduleSearch}
                  onChange={e => setScheduleSearch(e.target.value)}
                  className='glass-input pl-8 pr-3 py-1.5 text-xs w-full'
                />
              </div>
              <select
                value={scheduleStatusFilter}
                onChange={e => setScheduleStatusFilter(e.target.value)}
                className='glass-select text-xs py-1.5 w-auto'
              >
                <option value='all'>All Status</option>
                <option value='Scheduled'>Scheduled</option>
                <option value='Completed'>Completed</option>
                <option value='Missed'>Missed</option>
                <option value='Cancelled'>Cancelled</option>
              </select>
              <select
                value={scheduleScopeFilter}
                onChange={e => setScheduleScopeFilter(e.target.value)}
                className='glass-select text-xs py-1.5 w-auto'
              >
                <option value='all'>All Scopes</option>
                <option value='individual'>Individual</option>
                <option value='purok'>Per Purok</option>
                <option value='barangay'>Barangay-wide</option>
              </select>
              <div className='flex bg-white/5 rounded-lg p-0.5'>
                <button
                  onClick={() => setScheduleView('list')}
                  className={`px-2.5 py-1.5 rounded-md text-xs flex items-center gap-1 transition-all ${
                    scheduleView === 'list'
                      ? 'bg-blue-500/30 text-blue-300'
                      : 'text-white/40 hover:text-white/70'
                  }`}
                >
                  <List className='w-3.5 h-3.5' />
                  List
                </button>
                <button
                  onClick={() => setScheduleView('calendar')}
                  className={`px-2.5 py-1.5 rounded-md text-xs flex items-center gap-1 transition-all ${
                    scheduleView === 'calendar'
                      ? 'bg-blue-500/30 text-blue-300'
                      : 'text-white/40 hover:text-white/70'
                  }`}
                >
                  <CalendarDays className='w-3.5 h-3.5' />
                  Calendar
                </button>
              </div>
            </div>
          </div>
          {scheduleView === 'list' ? (
            filteredSchedules.length === 0 ? (
              <GlassCard
                hover={false}
                className='text-center py-8 bg-white/[0.02]'
              >
                <Calendar className='w-10 h-10 text-white/20 mx-auto mb-3' />
                <p className='text-sm text-white/30'>No schedules found</p>
              </GlassCard>
            ) : (
              <div className='space-y-2 max-h-80 overflow-y-auto'>
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
                      className='flex items-center justify-between bg-white/5 rounded-lg p-3 hover:bg-white/[0.07] cursor-pointer'
                      onClick={() => navigate(`/schedules/${schedule.id}/edit`)}
                    >
                      <div className='flex items-center gap-3'>
                        <div className='text-center min-w-[40px]'>
                          <p className='text-sm font-bold text-white'>
                            {date.getDate()}
                          </p>
                          <p className='text-xs text-blue-300'>
                            {date.toLocaleString('default', { month: 'short' })}
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
            )
          ) : (
            <div>
              <div className='flex items-center justify-between mb-4'>
                <button
                  onClick={handlePrevMonth}
                  className='p-1.5 rounded-lg hover:bg-white/10 text-white/60 hover:text-white'
                >
                  <ChevronLeft className='w-5 h-5' />
                </button>
                <h4 className='text-sm font-medium text-white'>
                  {monthNames[calendarMonth]} {calendarYear}
                </h4>
                <button
                  onClick={handleNextMonth}
                  className='p-1.5 rounded-lg hover:bg-white/10 text-white/60 hover:text-white'
                >
                  <ChevronRight className='w-5 h-5' />
                </button>
              </div>
              <div className='grid grid-cols-7 gap-1.5'>
                {dayNames.map(d => (
                  <div
                    key={d}
                    className='text-center text-xs text-white/40 py-1.5 font-medium'
                  >
                    {d}
                  </div>
                ))}
                {Array.from({
                  length: getFirstDayOfMonth(calendarMonth, calendarYear)
                }).map((_, i) => (
                  <div key={`e-${i}`} className='aspect-square' />
                ))}
                {Array.from({
                  length: getDaysInMonth(calendarMonth, calendarYear)
                }).map((_, i) => {
                  const date = i + 1
                  const count = getScheduleCountForDate(date)
                  const colorClass = getDateColor(date)
                  const today = new Date()
                  const isToday =
                    today.getDate() === date &&
                    today.getMonth() === calendarMonth &&
                    today.getFullYear() === calendarYear
                  return (
                    <button
                      key={date}
                      onClick={() => handleDateClick(date)}
                      disabled={count === 0}
                      className={`aspect-square rounded-lg flex flex-col items-center justify-center text-xs transition-all border ${
                        isToday
                          ? 'ring-1 ring-blue-400 border-blue-400/50'
                          : 'border-transparent'
                      } ${
                        count > 0
                          ? `${colorClass} cursor-pointer hover:scale-105`
                          : 'text-white/20 hover:bg-white/5 cursor-default'
                      }`}
                    >
                      <span className={count > 0 ? 'font-medium' : ''}>
                        {date}
                      </span>
                      {count > 0 && (
                        <span className='text-[10px] leading-none'>
                          {count}
                        </span>
                      )}
                    </button>
                  )
                })}
              </div>
              <div className='flex flex-wrap items-center gap-4 mt-4 pt-3 border-t border-white/10'>
                <div className='flex items-center gap-1.5'>
                  <div className='w-3 h-3 rounded bg-blue-500/30 border border-blue-400/30' />
                  <span className='text-xs text-white/50'>Scheduled</span>
                </div>
                <div className='flex items-center gap-1.5'>
                  <div className='w-3 h-3 rounded bg-green-500/30 border border-green-400/30' />
                  <span className='text-xs text-white/50'>Completed</span>
                </div>
                <div className='flex items-center gap-1.5'>
                  <div className='w-3 h-3 rounded bg-orange-500/30 border border-orange-400/30' />
                  <span className='text-xs text-white/50'>Missed</span>
                </div>
                <div className='flex items-center gap-1.5'>
                  <div className='w-3 h-3 rounded bg-red-500/30 border border-red-400/30' />
                  <span className='text-xs text-white/50'>Cancelled</span>
                </div>
              </div>
            </div>
          )}
        </GlassCard>

        <Modal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          title='Edit Purok'
        >
          <form onSubmit={handleEditPurok} className='space-y-4'>
            <GlassInput
              label='Purok Name'
              value={editPurokName}
              onChange={e => setEditPurokName(e.target.value)}
              required
              placeholder='Enter purok name'
            />
            <div className='flex justify-end gap-3'>
              <GlassButton
                variant='secondary'
                type='button'
                onClick={() => setShowEditModal(false)}
              >
                Cancel
              </GlassButton>
              <GlassButton type='submit' loading={saving}>
                Update Purok
              </GlassButton>
            </div>
          </form>
        </Modal>

        <Modal
          isOpen={showAssignBHWModal}
          onClose={() => {
            setShowAssignBHWModal(false)
            setBhwSearch('')
          }}
          title='Assign BHW Worker'
        >
          <div className='space-y-3'>
            <div className='relative'>
              <Search className='absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40' />
              <input
                type='text'
                placeholder='Search BHW workers...'
                value={bhwSearch}
                onChange={e => setBhwSearch(e.target.value)}
                className='glass-input pl-9 pr-3 py-2 text-sm w-full'
              />
            </div>
            <div className='space-y-2 max-h-64 overflow-y-auto'>
              {availableBHWs
                .filter(b => !assignedBHWs.some(a => a.id === b.id))
                .filter(
                  b =>
                    !bhwSearch ||
                    b.name?.toLowerCase().includes(bhwSearch.toLowerCase())
                ).length === 0 ? (
                <p className='text-sm text-white/30 text-center py-4'>
                  {bhwSearch
                    ? 'No BHW workers match your search'
                    : 'No available BHW workers'}
                </p>
              ) : (
                availableBHWs
                  .filter(b => !assignedBHWs.some(a => a.id === b.id))
                  .filter(
                    b =>
                      !bhwSearch ||
                      b.name?.toLowerCase().includes(bhwSearch.toLowerCase())
                  )
                  .map(bhw => (
                    <div
                      key={bhw.id}
                      className='flex items-center justify-between bg-white/5 rounded-lg p-3 hover:bg-white/10'
                    >
                      <div className='flex items-center gap-3'>
                        <div className='w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center'>
                          <span className='text-sm font-bold text-white'>
                            {bhw.name?.charAt(0) || '?'}
                          </span>
                        </div>
                        <div>
                          <p className='text-white text-sm font-medium'>
                            {bhw.name}
                          </p>
                          <p className='text-xs text-white/40'>
                            {bhw.position}
                          </p>
                          {bhw.contactNumber && (
                            <p className='text-xs text-white/30'>
                              {bhw.contactNumber}
                            </p>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleAssignBHW(bhw.id)}
                        className='text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1'
                      >
                        <Check className='w-3.5 h-3.5' />
                        Assign
                      </button>
                    </div>
                  ))
              )}
            </div>
          </div>
        </Modal>

        <Modal
          isOpen={showDateModal}
          onClose={() => setShowDateModal(false)}
          title={
            selectedDate
              ? `${monthNames[calendarMonth]} ${selectedDate.date}, ${calendarYear}`
              : ''
          }
          size='md'
        >
          {selectedDate && (
            <div className='space-y-2'>
              {selectedDate.schedules.map(schedule => (
                <div
                  key={schedule.id}
                  className='bg-white/5 rounded-lg p-3 cursor-pointer'
                  onClick={() => {
                    setShowDateModal(false)
                    navigate(`/schedules/${schedule.id}/edit`)
                  }}
                >
                  <div className='flex items-center justify-between'>
                    <div>
                      <p className='text-white text-sm font-medium'>
                        {schedule.scope === 'individual'
                          ? schedule.residentName
                          : schedule.programName || schedule.type}
                      </p>
                      <div className='flex items-center gap-2 text-xs text-white/40 mt-0.5'>
                        <span className='flex items-center gap-0.5'>
                          <Clock className='w-3 h-3' />
                          {formatTime(schedule.time)}
                        </span>
                        <span>{schedule.type}</span>
                        <span className='capitalize'>{schedule.scope}</span>

                        {schedule.purok && (
                          <span className='text-xs text-white/50 flex items-center gap-1'>
                            <MapPin className='w-3 h-3' />
                            {schedule.purok}
                          </span>
                        )}
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

  return (
    <div className='space-y-6 animate-fade-in'>
      <div className='flex items-center justify-between'>
        <div className='pl-1 flex items-center gap-2'>
          <h1
            className='text-2xl font-bold text-white'
            style={{ fontFamily: "'Sora', sans-serif" }}
          >
            Puroks
          </h1>
          <p className='text-sm text-white/50 mt-1'>
            {filteredPuroks.length} purok
            {filteredPuroks.length !== 1 ? 's' : ''}
          </p>
        </div>
        <GlassButton icon={Plus} onClick={() => setShowAddModal(true)}>
          Add Purok
        </GlassButton>
      </div>
      <GlassInput
        icon={Search}
        placeholder='Search puroks...'
        value={searchTerm}
        onChange={e => setSearchTerm(e.target.value)}
      />
      {filteredPuroks.length > 0 ? (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
          {filteredPuroks.map(purok => (
            <GlassCard key={purok.id} onClick={() => handlePurokClick(purok)}>
              <div className='flex items-center justify-between mb-1'>
                <div className='flex items-center'>
                  <h3
                    className='text-2xl font-bold text-white'
                    style={{ fontFamily: "'Sora', sans-serif" }}
                  >
                    {purok.name}
                  </h3>
                </div>
                <button
                  onClick={e => handleDelete(purok.id, e)}
                  className='p-2 rounded-lg hover:bg-white/10 text-white/50 hover:text-red-400'
                >
                  <Trash2 className='w-4 h-4' />
                </button>
              </div>
              <div className='flex items-center justify-between'>
                <div className='flex items-center space-x-1 pl-0.5'>
                  <Users className='w-5 h-5 text-blue-400' />
                  <p className='pl-1 text-2xl font-bold text-white'>
                    {purok.totalResidents || 0}
                  </p>
                </div>

                <div className='flex justify-between text-xs text-white/30'>
                  <span>Click to view details</span>
                  <ChevronRight className='w-4 h-4' />
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      ) : (
        <GlassCard hover={false} className='text-center py-12'>
          <MapPin className='w-16 h-16 text-white/20 mx-auto mb-4' />
          <p className='text-white/40 text-sm mb-2'>
            {searchTerm ? 'No puroks match your search' : 'No puroks added yet'}
          </p>
        </GlassCard>
      )}
      <Modal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        title='Add New Purok'
      >
        <form onSubmit={handleAddPurok} className='space-y-4'>
          <GlassInput
            label='Purok Name'
            value={newPurokName}
            onChange={e => setNewPurokName(e.target.value)}
            required
            placeholder='Enter purok name'
          />
          <div className='flex justify-end gap-3'>
            <GlassButton
              variant='secondary'
              type='button'
              onClick={() => setShowAddModal(false)}
            >
              Cancel
            </GlassButton>
            <GlassButton type='submit' loading={saving}>
              Add Purok
            </GlassButton>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default Purok
