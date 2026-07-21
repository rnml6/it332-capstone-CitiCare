// pages/Medicines.jsx
import { useState, useEffect, useCallback } from 'react'
import { Plus, Pencil, Trash2, Save, Search, X } from 'lucide-react'
import { medicineApi } from '../api/medicineApi'
import GlassCard from '../components/GlassCard'
import GlassButton from '../components/GlassButton'
import GlassInput from '../components/GlassInput'
import Modal from '../components/Modal'
import LoadingSpinner from '../components/LoadingSpinner'

const Medicines = () => {
  const [medicines, setMedicines] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [saving, setSaving] = useState(false)
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterTargetGroup, setFilterTargetGroup] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')

  const [formData, setFormData] = useState({
    medicine_name: '',
    category: 'vaccine',
    total_doses: 1,
    target_group: 'all',
    description: ''
  })

  const fetchMedicines = useCallback(async () => {
    try {
      setLoading(true)
      const response = await medicineApi.getAll(
        filterCategory !== 'all' ? filterCategory : undefined
      )
      if (response.data.success) {
        setMedicines(response.data.data)
      }
    } catch (error) {
      console.error('Error fetching medicines:', error)
    } finally {
      setLoading(false)
    }
  }, [filterCategory])

  useEffect(() => {
    fetchMedicines()
  }, [fetchMedicines])

  const handleChange = e => {
    const { name, value } = e.target
    setFormData(prev => {
      const updated = { ...prev, [name]: value }
      if (name === 'category' && value === 'deworming') {
        updated.total_doses = 1
      }
      return updated
    })
  }

  const openAddModal = () => {
    setEditingId(null)
    setFormData({
      medicine_name: '',
      category: 'vaccine',
      total_doses: 1,
      target_group: 'all',
      description: ''
    })
    setShowModal(true)
  }

  const openEditModal = medicine => {
    setEditingId(medicine.id)
    setFormData({
      medicine_name: medicine.medicine_name,
      category: medicine.category,
      total_doses: medicine.total_doses || 1,
      target_group: medicine.target_group,
      description: medicine.description || ''
    })
    setShowModal(true)
  }

  const handleSubmit = async e => {
    e.preventDefault()
    if (!formData.medicine_name || !formData.category) {
      alert('Medicine name and category are required')
      return
    }
    setSaving(true)
    try {
      const dataToSend = {
        ...formData,
        total_doses:
          formData.category === 'vaccine' ? parseInt(formData.total_doses) : 1
      }
      if (editingId) {
        await medicineApi.update(editingId, dataToSend)
      } else {
        await medicineApi.create(dataToSend)
      }
      setShowModal(false)
      fetchMedicines()
    } catch (error) {
      console.error('Error saving medicine:', error)
      alert(error.response?.data?.message || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async id => {
    if (!confirm('Are you sure you want to delete this medicine?')) return
    try {
      await medicineApi.delete(id)
      fetchMedicines()
    } catch (error) {
      console.error('Error deleting:', error)
      alert(error.response?.data?.message || 'Failed to delete')
    }
  }

  const getCategoryLabel = cat =>
    cat === 'vaccine' ? 'Vaccine' : cat === 'deworming' ? 'Deworming' : cat

  const getCategoryColor = cat =>
    cat === 'vaccine'
      ? 'bg-blue-500/20 text-blue-300 border-blue-400/30'
      : cat === 'deworming'
      ? 'bg-green-500/20 text-green-300 border-green-400/30'
      : 'bg-gray-500/20 text-gray-300 border-gray-400/30'

  const getTargetGroupLabel = group => {
    const labels = {
      all: 'All',
      infant: 'Infant (0-5)',
      pregnant: 'Pregnant',
      senior: 'Senior (60+)',
      pwd: 'PWD',
      withCondition: 'With Condition'
    }
    return labels[group] || group
  }

  const getTargetGroupColor = group => {
    const colors = {
      all: 'bg-gray-500/20 text-gray-300 border-gray-400/30',
      infant: 'bg-pink-500/20 text-pink-300 border-pink-400/30',
      pregnant: 'bg-purple-500/20 text-purple-300 border-purple-400/30',
      senior: 'bg-amber-500/20 text-amber-300 border-amber-400/30',
      pwd: 'bg-cyan-500/20 text-cyan-300 border-cyan-400/30',
      withCondition: 'bg-orange-500/20 text-orange-300 border-orange-400/30'
    }
    return colors[group] || 'bg-gray-500/20 text-gray-300 border-gray-400/30'
  }

  const targetGroupOptions = [
    { value: 'all', label: 'All' },
    { value: 'infant', label: 'Infant' },
    { value: 'pregnant', label: 'Pregnant' },
    { value: 'senior', label: 'Senior' },
    { value: 'pwd', label: 'PWD' },
    { value: 'withCondition', label: 'w/ Condition' }
  ]

  // Filter medicines
  const filteredMedicines = medicines.filter(medicine => {
    if (
      searchTerm &&
      !medicine.medicine_name?.toLowerCase().includes(searchTerm.toLowerCase())
    ) {
      return false
    }
    if (
      filterTargetGroup !== 'all' &&
      medicine.target_group !== filterTargetGroup
    ) {
      return false
    }
    return true
  })

  const hasActiveFilters = filterTargetGroup !== 'all' || searchTerm !== ''

  const clearFilters = () => {
    setFilterTargetGroup('all')
    setSearchTerm('')
  }

  if (loading) return <LoadingSpinner message='Loading medicines...' />

  return (
    <div className='space-y-6 animate-fade-in'>
      <div className='flex items-center justify-between'>
        <div className='pl-1 flex items-center gap-2'>
          <h1
            className='text-2xl font-bold text-white'
            style={{ fontFamily: "'Sora', sans-serif" }}
          >
            Medicine Management
          </h1>
          <p className='text-sm text-white/50 mt-1'>
            {filteredMedicines.length} of {medicines.length} medicine
            {medicines.length !== 1 ? 's' : ''}
            {hasActiveFilters && ' (filtered)'}
          </p>
        </div>
        <GlassButton icon={Plus} onClick={openAddModal}>
          Add Medicine
        </GlassButton>
      </div>

      {/* Search */}
      <GlassInput
        icon={Search}
        placeholder='Search medicines by name...'
        value={searchTerm}
        onChange={e => setSearchTerm(e.target.value)}
      />

      {/* Filters */}
      <div className='flex flex-wrap items-center gap-2'>
        <span className='text-xs text-white/40 mr-1'>Category:</span>
        {['all', 'vaccine', 'deworming'].map(cat => (
          <button
            key={cat}
            onClick={() => setFilterCategory(cat)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              filterCategory === cat
                ? 'bg-blue-500/30 text-blue-300 border border-blue-400/30'
                : 'bg-white/5 text-white/60 hover:bg-white/10 border border-white/10'
            }`}
          >
            {cat === 'all'
              ? 'All'
              : cat === 'vaccine'
              ? 'Vaccines'
              : 'Deworming'}
          </button>
        ))}

        <span className='text-xs text-white/40 mr-1 ml-4'>Target Group:</span>
        {targetGroupOptions.map(opt => (
          <button
            key={opt.value}
            onClick={() => setFilterTargetGroup(opt.value)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              filterTargetGroup === opt.value
                ? 'bg-blue-500/30 text-blue-300 border border-blue-400/30'
                : 'bg-white/5 text-white/60 hover:bg-white/10 border border-white/10'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Medicine Grid */}
      {filteredMedicines.length > 0 ? (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
          {filteredMedicines.map(medicine => (
            <GlassCard key={medicine.id}>
              <div className='flex items-start justify-between mb-3'>
                <div className='flex-1'>
                  <h3
                    className='text-white font-semibold text-xl'
                    style={{ fontFamily: "'Sora', sans-serif" }}
                  >
                    {medicine.medicine_name}
                  </h3>
                  <div className='flex gap-2 mt-1.5 flex-wrap'>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getCategoryColor(
                        medicine.category
                      )}`}
                    >
                      {getCategoryLabel(medicine.category)}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getTargetGroupColor(
                        medicine.target_group
                      )}`}
                    >
                      {getTargetGroupLabel(medicine.target_group)}
                    </span>
                  </div>
                </div>
                <div className='flex space-x-1 ml-2'>
                  <button
                    onClick={() => openEditModal(medicine)}
                    className='p-1.5 rounded-lg hover:bg-white/10 text-white/50 hover:text-blue-400'
                  >
                    <Pencil className='w-4 h-4' />
                  </button>
                  <button
                    onClick={() => handleDelete(medicine.id)}
                    className='p-1.5 rounded-lg hover:bg-white/10 text-white/50 hover:text-red-400'
                  >
                    <Trash2 className='w-4 h-4' />
                  </button>
                </div>
              </div>
              <div className='space-y-2 text-sm'>
                {medicine.category === 'vaccine' ? (
                  <div className='flex items-center justify-between text-white/60'>
                    <span style={{ fontFamily: "'Sora', sans-serif" }}>
                      Doses Required:
                    </span>
                    <span
                      className='text-white font-medium'
                      style={{ fontFamily: "'Sora', sans-serif" }}
                    >
                      {medicine.total_doses} dose
                      {medicine.total_doses > 1 ? 's' : ''}
                    </span>
                  </div>
                ) : (
                  <div className='flex items-center justify-between text-white/60'>
                    <span style={{ fontFamily: "'Sora', sans-serif" }}>
                      Type:
                    </span>
                    <span
                      className='text-white font-medium'
                      style={{ fontFamily: "'Sora', sans-serif" }}
                    >
                      Single dose
                    </span>
                  </div>
                )}
                {medicine.description && (
                  <p
                    className='text-white/40 text-xs mt-2'
                    style={{ fontFamily: "'Sora', sans-serif" }}
                  >
                    {medicine.description}
                  </p>
                )}
              </div>
            </GlassCard>
          ))}
        </div>
      ) : (
        <GlassCard hover={false} className='text-center py-12'>
          <div className='w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-4'>
            <svg
              className='w-8 h-8 text-white/20'
              viewBox='0 0 24 24'
              fill='none'
              stroke='currentColor'
              strokeWidth='1.5'
            >
              <path
                d='M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2'
                strokeLinecap='round'
              />
              <rect x='9' y='3' width='6' height='4' rx='1' />
              <path
                d='M9 14l2 2 4-4'
                strokeLinecap='round'
                strokeLinejoin='round'
              />
            </svg>
          </div>
          <p className='text-white/40 text-sm mb-2'>
            {hasActiveFilters
              ? 'No medicines match your criteria'
              : 'No medicines added yet'}
          </p>
        </GlassCard>
      )}

      {/* Add/Edit Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingId ? 'Edit Medicine' : 'Add New Medicine'}
      >
        <form onSubmit={handleSubmit} className='space-y-4'>
          <GlassInput
            label='Medicine Name'
            name='medicine_name'
            value={formData.medicine_name}
            onChange={handleChange}
            required
            placeholder='e.g., BCG, Albendazole'
          />

          <div className='space-y-1.5'>
            <label className='block text-sm font-medium text-blue-200'>
              Category
            </label>
            <select
              name='category'
              value={formData.category}
              onChange={handleChange}
              className='glass-select'
              required
            >
              <option value='vaccine'>Vaccine</option>
              <option value='deworming'>Deworming</option>
            </select>
          </div>

          {formData.category === 'vaccine' && (
            <GlassInput
              label='Total Doses Required'
              name='total_doses'
              type='number'
              value={formData.total_doses}
              onChange={handleChange}
              required
              min='1'
            />
          )}

          <div className='space-y-1.5'>
            <label className='block text-sm font-medium text-blue-200'>
              Target Group
            </label>
            <select
              name='target_group'
              value={formData.target_group}
              onChange={handleChange}
              className='glass-select'
            >
              {targetGroupOptions.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <GlassInput
            label='Description'
            name='description'
            type='textarea'
            value={formData.description}
            onChange={handleChange}
            placeholder='Brief description...'
          />

          <div className='flex justify-end space-x-3 pt-4 border-t border-white/10'>
            <GlassButton
              variant='secondary'
              type='button'
              onClick={() => setShowModal(false)}
            >
              Cancel
            </GlassButton>
            <GlassButton type='submit' icon={Save} loading={saving}>
              {editingId ? 'Update' : 'Add Medicine'}
            </GlassButton>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default Medicines
