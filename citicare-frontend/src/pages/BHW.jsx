// pages/BHW.jsx
import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search,
  Plus,
  Phone,
  Mail,
  MapPin,
  ChevronRight,
  Pencil,
  Trash2,
  User,
  Filter,
  X
} from 'lucide-react'
import { bhwApi } from '../api/bhwApi'
import GlassCard from '../components/GlassCard'
import GlassButton from '../components/GlassButton'
import GlassInput from '../components/GlassInput'
import LoadingSpinner from '../components/LoadingSpinner'
import { getStatusColor, getInitials } from '../utils/helpers'

const BHW = () => {
  const [bhws, setBhws] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [filterPosition, setFilterPosition] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const navigate = useNavigate()

  const fetchBHWs = useCallback(async () => {
    try {
      setLoading(true)
      const response = await bhwApi.getAll()
      if (response.data.success) {
        setBhws(response.data.data)
      }
    } catch (error) {
      console.error('Error fetching BHWs:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchBHWs()
  }, [fetchBHWs])

  const handleDelete = async (id, e) => {
    e.stopPropagation()
    if (!confirm('Are you sure you want to delete this BHW?')) return
    try {
      await bhwApi.delete(id)
      setBhws(prev => prev.filter(b => b.id !== id))
    } catch (error) {
      console.error('Error deleting BHW:', error)
      alert(error.response?.data?.message || 'Failed to delete BHW')
    }
  }

  // Get unique positions for filter dropdown
  const positions = [
    ...new Set(bhws.map(b => b.position).filter(Boolean))
  ].sort()

  const filteredBHWs = bhws.filter(bhw => {
    const matchesSearch =
      !searchTerm ||
      bhw.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bhw.position?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bhw.assignedPurok?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bhw.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bhw.email?.toLowerCase().includes(searchTerm.toLowerCase())

    if (!matchesSearch) return false
    if (filterPosition !== 'all' && bhw.position !== filterPosition)
      return false
    if (filterStatus !== 'all' && bhw.status !== filterStatus) return false

    return true
  })

  const clearFilters = () => {
    setFilterPosition('all')
    setFilterStatus('all')
    setSearchTerm('')
  }

  const hasActiveFilters = filterPosition !== 'all' || filterStatus !== 'all'

  if (loading) return <LoadingSpinner message='Loading BHW workers...' />

  return (
    <div className='space-y-6 animate-fade-in'>
      <div className='flex items-center justify-between'>
        <div className='pl-1 flex items-center gap-2'>
          <h1
            className='text-2xl font-bold text-white'
            style={{ fontFamily: "'Sora', sans-serif" }}
          >
            Health Workers
          </h1>
          <p className='text-sm text-white/50 mt-1'>
            {filteredBHWs.length} of {bhws.length} health worker
            {bhws.length !== 1 ? 's' : ''}
            {hasActiveFilters && ' (filtered)'}
          </p>
        </div>
        <GlassButton icon={Plus} onClick={() => navigate('/bhw/new')}>
          Add BHW
        </GlassButton>
      </div>

      {/* Search and Filter Toggle */}
      <div className='flex gap-4'>
        <div className='flex-1'>
          <GlassInput
            icon={Search}
            placeholder='Search by name, position, username, email, or purok...'
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
            <h3 className='text-sm font-medium text-white'>Filter Workers</h3>
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
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <div className='space-y-1.5'>
              <label className='block text-xs font-medium text-blue-200'>
                Position
              </label>
              <select
                value={filterPosition}
                onChange={e => setFilterPosition(e.target.value)}
                className='glass-select text-sm'
              >
                <option value='all'>All Positions</option>
                {positions.map(pos => (
                  <option key={pos} value={pos}>
                    {pos}
                  </option>
                ))}
              </select>
            </div>
            <div className='space-y-1.5'>
              <label className='block text-xs font-medium text-blue-200'>
                Status
              </label>
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value)}
                className='glass-select text-sm'
              >
                <option value='all'>All Status</option>
                <option value='Active'>Active</option>
                <option value='Inactive'>Inactive</option>
              </select>
            </div>
          </div>
        </GlassCard>
      )}

      {/* BHW Grid */}
      {filteredBHWs.length > 0 ? (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
          {filteredBHWs.map(bhw => (
            <GlassCard key={bhw.id} onClick={() => navigate(`/bhw/${bhw.id}`)}>
              <div className='flex items-start justify-between mb-4'>
                <div className='flex items-center space-x-4'>
                  <div className='w-14 h-14 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center flex-shrink-0'>
                    <span className='text-xl font-bold text-white'>
                      {getInitials(bhw.name)}
                    </span>
                  </div>
                  <div className='min-w-0'>
                    <h3
                      className='text-white font-medium text-lg truncate'
                      style={{ fontFamily: "'Sora', sans-serif" }}
                    >
                      {bhw.name}
                    </h3>
                    <p
                      className='text-sm text-blue-300'
                      style={{ fontFamily: "'Sora', sans-serif" }}
                    >
                      {bhw.position}
                    </p>
                  </div>
                </div>
                <ChevronRight className='w-5 h-5 text-white/30 flex-shrink-0' />
              </div>
              <div className='flex items-center justify-between mt-3 pt-3 border-t border-white/10'>
                <span className={`badge ${getStatusColor(bhw.status)}`}>
                  {bhw.status}
                </span>
                <div
                  className='flex space-x-1'
                  onClick={e => e.stopPropagation()}
                >
                  <button
                    onClick={() => navigate(`/bhw/${bhw.id}/edit`)}
                    className='p-1.5 rounded-lg hover:bg-white/10 text-white/50 hover:text-blue-400 transition-colors'
                  >
                    <Pencil className='w-4 h-4' />
                  </button>
                  <button
                    onClick={e => handleDelete(bhw.id, e)}
                    className='p-1.5 rounded-lg hover:bg-white/10 text-white/50 hover:text-red-400 transition-colors'
                  >
                    <Trash2 className='w-4 h-4' />
                  </button>
                </div>
              </div>
              <div className='mt-3 grid grid-cols-2 gap-2'>
                {bhw.contactNumber && (
                  <div className='flex items-center space-x-2 text-sm text-white/60'>
                    <Phone className='w-4 h-4 flex-shrink-0' />
                    <span
                      className='truncate'
                      style={{ fontFamily: "'Sora', sans-serif" }}
                    >
                      {bhw.contactNumber}
                    </span>
                  </div>
                )}
                {bhw.assignedPurok && (
                  <div className='flex items-center space-x-2 text-sm text-white/60'>
                    <MapPin className='w-4 h-4 flex-shrink-0' />
                    <span className='truncate'>{bhw.assignedPurok}</span>
                  </div>
                )}
              </div>
            </GlassCard>
          ))}
        </div>
      ) : (
        <GlassCard hover={false} className='text-center py-12'>
          <div className='w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4'>
            <User className='w-8 h-8 text-white/20' />
          </div>
          <p className='text-white/40 text-sm mb-2'>
            {hasActiveFilters || searchTerm
              ? 'No healthcare professional found'
              : 'No Healthcare workers added yet'}
          </p>
        </GlassCard>
      )}
    </div>
  )
}

export default BHW
