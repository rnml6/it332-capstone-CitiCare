// pages/Residents.jsx
import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search,
  Plus,
  Filter,
  ChevronRight,
  Users as UsersIcon,
  Pencil,
  Trash2,
  X
} from 'lucide-react'
import { residentApi } from '../api/residentApi'
import { purokApi } from '../api/purokApi'
import GlassCard from '../components/GlassCard'
import GlassButton from '../components/GlassButton'
import GlassInput from '../components/GlassInput'
import LoadingSpinner from '../components/LoadingSpinner'
import { getRiskColor, getInitials, formatDate } from '../utils/helpers'

const Residents = () => {
  const [residents, setResidents] = useState([])
  const [puroks, setPuroks] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [deletingId, setDeletingId] = useState(null)
  const [showFilters, setShowFilters] = useState(false)

  const [filterPurok, setFilterPurok] = useState('all')
  const [filterRisk, setFilterRisk] = useState('all')
  const [filterFocusGroup, setFilterFocusGroup] = useState('all')

  const navigate = useNavigate()

  const fetchResidents = useCallback(async () => {
    try {
      setLoading(true)
      const response = await residentApi.getAll()
      if (response.data.success) {
        setResidents(response.data.data)
      }
    } catch (error) {
      console.error('Error fetching residents:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchPuroks = useCallback(async () => {
    try {
      const response = await purokApi.getAll()
      if (response.data.success) {
        setPuroks(response.data.data)
      }
    } catch (error) {
      console.error('Error fetching puroks:', error)
    }
  }, [])

  useEffect(() => {
    fetchResidents()
    fetchPuroks()
  }, [fetchResidents, fetchPuroks])

  const handleDelete = async (id, e) => {
    e.stopPropagation()
    if (!confirm('Are you sure you want to delete this resident?')) return
    try {
      setDeletingId(id)
      await residentApi.delete(id)
      setResidents(prev => prev.filter(r => r.id !== id))
    } catch (error) {
      console.error('Error deleting resident:', error)
      alert(error.response?.data?.message || 'Failed to delete resident')
    } finally {
      setDeletingId(null)
    }
  }

  const filteredResidents = residents.filter(resident => {
    const matchesSearch =
      !searchTerm ||
      resident.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resident.purok?.toLowerCase().includes(searchTerm.toLowerCase())

    if (!matchesSearch) return false
    if (filterPurok !== 'all' && resident.purok !== filterPurok) return false
    if (filterRisk !== 'all' && resident.riskLevel !== filterRisk) return false
    if (filterFocusGroup !== 'all') {
      const focusGroups = resident.focusGroups || []
      if (filterFocusGroup === 'none') {
        if (focusGroups.length > 0) return false
      } else {
        if (!focusGroups.includes(filterFocusGroup)) return false
      }
    }
    return true
  })

  const clearFilters = () => {
    setFilterPurok('all')
    setFilterRisk('all')
    setFilterFocusGroup('all')
    setSearchTerm('')
  }

  const hasActiveFilters =
    filterPurok !== 'all' || filterRisk !== 'all' || filterFocusGroup !== 'all'

  if (loading) return <LoadingSpinner message='Loading residents...' />

  return (
    <div className='space-y-6 animate-fade-in' style={{ fontFamily: "'Sora', sans-serif" }}>
      <div className='flex items-center justify-between'>
        <div className='pl-1 flex items-center gap-2'>
          <h1 className='text-2xl font-bold text-white' style={{ fontFamily: "'Sora', sans-serif" }}>Residents</h1>
          <p className='text-sm text-white/50 mt-1'>
            {filteredResidents.length} of {residents.length} residents
            {hasActiveFilters && ' (filtered)'}
          </p>
        </div>
        <GlassButton icon={Plus} onClick={() => navigate('/residents/new')}>
          Add Resident
        </GlassButton>
      </div>

      {/* Search and Filter Toggle */}
      <div className='flex gap-4'>
        <div className='flex-1'>
          <GlassInput
            icon={Search}
            placeholder='Search residents by name or purok...'
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <GlassButton
          variant={showFilters ? 'primary' : 'secondary'}
          icon={Filter}
          onClick={() => setShowFilters(!showFilters)}
        >
          Filters
          {hasActiveFilters && (
            <span className='ml-1 w-2 h-2 bg-blue-400 rounded-full inline-block' />
          )}
        </GlassButton>
      </div>

      {/* Filter Panel */}
      {showFilters && (
        <GlassCard hover={false} className='animate-slide-down'>
          <div className='flex items-center justify-between mb-4'>
            <h3 className='text-sm font-medium text-white'>Filter Residents</h3>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className='text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1'
              >
                <X className='w-3 h-3' />
                Clear all
              </button>
            )}
          </div>
          <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
            <div className='space-y-1.5'>
              <label className='block text-xs font-medium text-blue-200'>
                Purok
              </label>
              <select
                value={filterPurok}
                onChange={e => setFilterPurok(e.target.value)}
                className='glass-select text-sm'
              >
                <option value='all'>All Puroks</option>
                {puroks.map(purok => (
                  <option key={purok.id} value={purok.name}>
                    {purok.name}
                  </option>
                ))}
              </select>
            </div>
            <div className='space-y-1.5'>
              <label className='block text-xs font-medium text-blue-200'>
                Risk Level
              </label>
              <select
                value={filterRisk}
                onChange={e => setFilterRisk(e.target.value)}
                className='glass-select text-sm'
              >
                <option value='all'>All Risk Levels</option>
                <option value='Critical Health Risk'>Critical</option>
                <option value='High Health Risk'>High</option>
                <option value='Moderate Health Risk'>Moderate</option>
                <option value='Low Health Risk'>Low</option>
              </select>
            </div>
            <div className='space-y-1.5'>
              <label className='block text-xs font-medium text-blue-200'>
                Focus Group
              </label>
              <select
                value={filterFocusGroup}
                onChange={e => setFilterFocusGroup(e.target.value)}
                className='glass-select text-sm'
              >
                <option value='all'>All Residents</option>
                <option value='pregnant'>Pregnant</option>
                <option value='infant'>Infant (0-5 yrs)</option>
                <option value='senior'>Senior Citizen (60+)</option>
                <option value='withCondition'>With Chronic Condition</option>
                <option value='pwd'>PWD</option>
                <option value='none'>No Focus Group</option>
              </select>
            </div>
          </div>
        </GlassCard>
      )}

      {/* Residents Grid */}
      {filteredResidents.length > 0 ? (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' style={{ fontFamily: "'Sora', sans-serif" }}>
          {filteredResidents.map(resident => (
            <GlassCard
              key={resident.id}
              onClick={() => navigate(`/residents/${resident.id}`)}
            >
              <div className='flex items-start justify-between mb-3'>
                <div className='flex items-center space-x-3'>
                  <div className='w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center'>
                    <span className='text-lg font-bold text-white'>
                      {getInitials(resident.name)}
                    </span>
                  </div>
                  <div>
                    <h3 className='text-white text-xl font-semibold' style={{ fontFamily: "'Sora', sans-serif" }}>{resident.name}</h3>
                    <p className='text-sm text-white/50'>
                      {resident.age || 'N/A'}y • {resident.gender || 'N/A'}
                    </p>
                  </div>
                </div>
                <ChevronRight className='w-5 h-5 text-white/30' />
              </div>

              {resident.focusGroups?.length > 0 && (
                <div className='flex flex-wrap gap-1 mb-3'>
                  {resident.focusGroups.map(group => (
                    <span
                      key={group}
                      className='px-2 py-0.5 bg-blue-500/20 text-blue-300 border border-blue-400/30 rounded-full text-[10px] font-medium'
                    >
                      {group === 'pregnant' && 'Pregnant'}
                      {group === 'infant' && 'Infant'}
                      {group === 'senior' && 'Senior'}
                      {group === 'withCondition' && 'w/ Condition'}
                      {group === 'pwd' && 'PWD'}
                    </span>
                  ))}
                </div>
              )}

              <div className='flex items-center justify-between mt-3 pt-3 border-t border-white/10'>
                <div>
                  <span className='text-sm text-white/50'>
                    {resident.purok || 'No Purok'}
                  </span>
                  {resident.lastCheckup && (
                    <p className='text-xs text-white/40 mt-1'>
                      Last: {formatDate(resident.lastCheckup)}
                    </p>
                  )}
                </div>
                <div className='flex items-center space-x-2'>
                  <span className={`badge ${getRiskColor(resident.riskLevel)}`}>
                    {resident.riskLevel}
                  </span>
                  <div
                    className='flex space-x-1'
                    onClick={e => e.stopPropagation()}
                  >
                    <button
                      onClick={() => navigate(`/residents/${resident.id}/edit`)}
                      className='p-1 rounded-lg hover:bg-white/10 text-white/50 hover:text-blue-400'
                    >
                      <Pencil className='w-4 h-4' />
                    </button>
                    <button
                      onClick={e => handleDelete(resident.id, e)}
                      className='p-1 rounded-lg hover:bg-white/10 text-white/50 hover:text-red-400'
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
          <UsersIcon className='w-16 h-16 text-white/20 mx-auto mb-4' />
          <p className='text-white/40 text-sm mb-2'>No residents found</p>
        </GlassCard>
      )}
    </div>
  )
}

export default Residents
