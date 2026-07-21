import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Save } from 'lucide-react'
import { residentApi } from '../api/residentApi'
import { purokApi } from '../api/purokApi'
import GlassCard from '../components/GlassCard'
import GlassButton from '../components/GlassButton'
import GlassInput from '../components/GlassInput'
import LoadingSpinner from '../components/LoadingSpinner'
import { getRiskColor } from '../utils/helpers'

const ResidentForm = () => {
  const { id } = useParams()
  const isEditing = !!id
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(isEditing)
  const [puroks, setPuroks] = useState([])

  const [formData, setFormData] = useState({
    name: '',
    dateOfBirth: '',
    age: '',
    gender: '',
    civilStatus: 'Single',
    purokId: '',
    contactNumber: '',
    contactPerson: '',
    contactPersonNumber: '',
    contactPersonAddress: '',
    lastCheckup: '',
    focusGroups: [],
    chronicConditions: []
  })

  const [riskLevel, setRiskLevel] = useState(null)
  const [ageDisplay, setAgeDisplay] = useState('')

  const manualFocusGroupOptions = [{ value: 'pwd', label: 'PWD' }]

  // Calculate detailed age from date of birth
  const calculateDetailedAge = dateOfBirth => {
    if (!dateOfBirth) return { years: 0, months: 0, weeks: 0, days: 0, display: '' }
    
    const today = new Date()
    const birthDate = new Date(dateOfBirth)
    
    // Calculate difference in milliseconds
    const diffTime = today.getTime() - birthDate.getTime()
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    
    // Calculate years
    let years = today.getFullYear() - birthDate.getFullYear()
    let months = today.getMonth() - birthDate.getMonth()
    
    if (months < 0 || (months === 0 && today.getDate() < birthDate.getDate())) {
      years--
      months += 12
    }
    
    // Calculate remaining days in current month
    const lastBirthMonth = new Date(today.getFullYear(), today.getMonth() - 1, birthDate.getDate())
    const daysSinceLastMonth = Math.floor((today - lastBirthMonth) / (1000 * 60 * 60 * 24))
    
    // Total months including years
    const totalMonths = years * 12 + months
    
    // Total weeks
    const totalWeeks = Math.floor(diffDays / 7)
    const remainingDays = diffDays - (totalWeeks * 7)
    
    let display = ''
    let ageValue = 0
    
    if (years >= 1) {
      display = `${years} year${years > 1 ? 's' : ''} old`
      ageValue = years
    } else if (totalMonths >= 1) {
      display = `${totalMonths} month${totalMonths > 1 ? 's' : ''} old`
      ageValue = 0 // Still 0 years for the age field
    } else if (totalWeeks >= 1) {
      display = `${totalWeeks} week${totalWeeks > 1 ? 's' : ''} old`
      ageValue = 0
    } else {
      display = `${diffDays} day${diffDays !== 1 ? 's' : ''} old`
      ageValue = 0
    }
    
    return { years: ageValue, display }
  }

  useEffect(() => {
    fetchPuroks()
    if (isEditing) fetchResident()
  }, [id])

  useEffect(() => {
    if (formData.dateOfBirth) {
      const ageData = calculateDetailedAge(formData.dateOfBirth)
      setFormData(prev => ({ ...prev, age: ageData.years.toString() }))
      setAgeDisplay(ageData.display)
    } else {
      setAgeDisplay('Enter date of birth')
    }
  }, [formData.dateOfBirth])

  const fetchPuroks = async () => {
    try {
      const response = await purokApi.getAll()
      if (response.data.success) setPuroks(response.data.data)
    } catch (error) {
      console.error('Error fetching puroks:', error)
    }
  }

  const fetchResident = async () => {
    try {
      const response = await residentApi.getById(id)
      if (response.data.success) {
        const resident = response.data.data
        setFormData({
          name: resident.name || '',
          dateOfBirth: resident.dateOfBirth || '',
          age: resident.age || '',
          gender: resident.gender || '',
          civilStatus: resident.civilStatus || 'Single',
          purokId: resident.purokId || '',
          contactNumber: resident.contactNumber || '',
          contactPerson: resident.contactPerson || '',
          contactPersonNumber: resident.contactPersonNumber || '',
          contactPersonAddress: resident.contactPersonAddress || '',
          lastCheckup: resident.lastCheckup || '',
          focusGroups: resident.focusGroups || [],
          chronicConditions: resident.chronicConditions || []
        })
        setRiskLevel(resident.riskLevel || null)
        
        // Calculate age display for editing
        if (resident.dateOfBirth) {
          const ageData = calculateDetailedAge(resident.dateOfBirth)
          setAgeDisplay(ageData.display)
        }
      }
    } catch (error) {
      console.error('Error fetching resident:', error)
    } finally {
      setFetching(false)
    }
  }

  const handleChange = e => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleFocusGroupToggle = groupValue => {
    setFormData(prev => {
      const current = prev.focusGroups || []
      if (current.includes(groupValue)) {
        return { ...prev, focusGroups: current.filter(g => g !== groupValue) }
      } else {
        return { ...prev, focusGroups: [...current, groupValue] }
      }
    })
  }

  const handleSubmit = async e => {
    e.preventDefault()

    if (
      !formData.name ||
      !formData.age === '' ||
      !formData.gender ||
      !formData.dateOfBirth
    ) {
      alert('Please fill in all required fields: Name, Date of Birth, Gender')
      return
    }

    setLoading(true)
    try {
      const age = parseInt(formData.age) || 0
      let focusGroups = [...(formData.focusGroups || [])]
      const chronicConditions = formData.chronicConditions || []

      // Auto-add infant if age 0-5
      if (age >= 0 && age <= 5) {
        if (!focusGroups.includes('infant')) focusGroups.push('infant')
      } else {
        focusGroups = focusGroups.filter(g => g !== 'infant')
      }

      // Auto-add senior if age 60+
      if (age >= 60) {
        if (!focusGroups.includes('senior')) focusGroups.push('senior')
      } else {
        focusGroups = focusGroups.filter(g => g !== 'senior')
      }

      // Auto-add withCondition if resident has chronic conditions
      if (chronicConditions.length > 0) {
        if (!focusGroups.includes('withCondition'))
          focusGroups.push('withCondition')
      } else {
        focusGroups = focusGroups.filter(g => g !== 'withCondition')
      }

      // Auto-add pregnant for females (only if selected)
      // Remove pregnant if male
      if (formData.gender === 'Male') {
        focusGroups = focusGroups.filter(g => g !== 'pregnant')
      }

      const dataToSend = {
        ...formData,
        age: age,
        focusGroups: focusGroups
      }

      if (isEditing) {
        await residentApi.update(id, dataToSend)
      } else {
        await residentApi.create(dataToSend)
      }
      navigate('/residents')
    } catch (error) {
      console.error('Error saving resident:', error)
      alert(error.response?.data?.message || 'Failed to save resident')
    } finally {
      setLoading(false)
    }
  }

  if (fetching) return <LoadingSpinner message='Loading resident data...' />

  const age = parseInt(formData.age) || 0
  const isInfant = age >= 0 && age <= 5
  const isSenior = age >= 60
  const isMale = formData.gender === 'Male'
  const hasChronicCondition = (formData.chronicConditions || []).length > 0

  // Build display focus groups
  const displayFocusGroups = [...(formData.focusGroups || [])]
  if (isInfant && !displayFocusGroups.includes('infant'))
    displayFocusGroups.push('infant')
  if (isSenior && !displayFocusGroups.includes('senior'))
    displayFocusGroups.push('senior')
  if (hasChronicCondition && !displayFocusGroups.includes('withCondition'))
    displayFocusGroups.push('withCondition')

  return (
    <div className='space-y-6 animate-fade-in'>
      <button
        onClick={() => navigate('/residents')}
        className='flex items-center space-x-2 text-white/70 hover:text-white transition-colors'
      >
        <ArrowLeft className='w-5 h-5' />
        <span>Back to Residents</span>
      </button>
      <h1 className='text-2xl font-bold text-white'>
        {isEditing ? 'Edit Resident Profile' : 'Add New Resident'}
      </h1>

      <form onSubmit={handleSubmit} className='space-y-6'>
        {/* Personal Information */}
        <GlassCard hover={false}>
          <h2 className='text-lg font-semibold text-white mb-4'>
            Personal Information
          </h2>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <GlassInput
              label='Full Name *'
              name='name'
              value={formData.name}
              onChange={handleChange}
              required
              placeholder='Enter full name'
            />
            <GlassInput
              label='Date of Birth *'
              name='dateOfBirth'
              type='date'
              value={formData.dateOfBirth}
              onChange={handleChange}
              required
            />

            {/* Age - read-only with detailed display */}
            <div className='space-y-1.5'>
              <label className='block text-sm font-medium text-blue-200'>
                Age (auto-calculated)
              </label>
              <input
                type='text'
                value={ageDisplay}
                readOnly
                className='glass-input text-white/60 cursor-not-allowed'
              />
              {/* Show years for infants */}
              {age > 0 && age <= 5 && (
                <p className='text-xs text-blue-300/70 mt-1'>
                  ({age} year{age > 1 ? 's' : ''})
                </p>
              )}
            </div>

            <div className='space-y-1.5'>
              <label className='block text-sm font-medium text-blue-200'>
                Gender *
              </label>
              <select
                name='gender'
                value={formData.gender}
                onChange={handleChange}
                className='glass-select'
                required
              >
                <option value=''>Select gender</option>
                <option value='Male'>Male</option>
                <option value='Female'>Female</option>
                <option value='Other'>Other</option>
              </select>
            </div>
            <div className='space-y-1.5'>
              <label className='block text-sm font-medium text-blue-200'>
                Civil Status
              </label>
              <select
                name='civilStatus'
                value={formData.civilStatus}
                onChange={handleChange}
                className='glass-select'
              >
                <option value='Single'>Single</option>
                <option value='Married'>Married</option>
                <option value='Widowed'>Widowed</option>
                <option value='Separated'>Separated</option>
              </select>
            </div>
            <GlassInput
              label='Contact Number'
              name='contactNumber'
              value={formData.contactNumber}
              onChange={handleChange}
              placeholder='Enter contact number'
            />
            <div className='space-y-1.5'>
              <label className='block text-sm font-medium text-blue-200'>
                Purok
              </label>
              <select
                name='purokId'
                value={formData.purokId}
                onChange={handleChange}
                className='glass-select'
              >
                <option value=''>Select purok</option>
                {puroks.map(purok => (
                  <option key={purok.id} value={purok.id}>
                    {purok.name}
                  </option>
                ))}
              </select>
            </div>
            <GlassInput
              label='Last Checkup'
              name='lastCheckup'
              type='date'
              value={formData.lastCheckup}
              onChange={handleChange}
            />
          </div>
        </GlassCard>

        {/* Risk Level */}
        {isEditing && riskLevel && (
          <GlassCard hover={false}>
            <h2 className='text-lg font-semibold text-white mb-4'>
              Risk Assessment
            </h2>
            <div className='flex items-center gap-3'>
              <span
                className={`badge text-sm px-4 py-2 ${getRiskColor(riskLevel)}`}
              >
                {riskLevel}
              </span>
              {riskLevel === 'Critical Health Risk' && (
                <p className='text-sm text-red-400/70'>
                  Requires immediate attention and regular monitoring
                </p>
              )}
              {riskLevel === 'High Health Risk' && (
                <p className='text-sm text-orange-400/70'>
                  Needs frequent checkups and close monitoring
                </p>
              )}
              {riskLevel === 'Moderate Health Risk' && (
                <p className='text-sm text-yellow-400/70'>
                  Regular monitoring recommended
                </p>
              )}
              {riskLevel === 'Low Health Risk' && (
                <p className='text-sm text-green-400/70'>
                  Routine checkups sufficient
                </p>
              )}
            </div>
          </GlassCard>
        )}

        {/* Focus Groups */}
        <GlassCard hover={false}>
          <h2 className='text-lg font-semibold text-white mb-2'>
            Focus Groups
          </h2>

          {/* Automatic groups */}
          <div>
            <div className='flex flex-wrap gap-2'>
              {isInfant && (
                <span className='px-3 py-1.5 mb-3 bg-green-500/20 text-green-300 border border-green-400/30 rounded-full text-sm font-medium'>
                  Infant (0-5 years)
                </span>
              )}
              {isSenior && (
                <span className='px-3 py-1.5 mb-3 bg-purple-500/20 text-purple-300 border border-purple-400/30 rounded-full text-sm font-medium'>
                  Senior Citizen (60+)
                </span>
              )}
              {hasChronicCondition && (
                <span className='px-3 py-1.5 mb-3 bg-orange-500/20 text-orange-300 border border-orange-400/30 rounded-full text-sm font-medium'>
                  With Chronic Condition
                </span>
              )}
            </div>
          </div>

          {/* Manual groups */}
          <div>
            <div className='flex flex-wrap gap-3'>
              {/* Pregnant - only for females */}
              {!isMale && (
                <label
                  className={`flex items-center space-x-2 p-3 rounded-xl border cursor-pointer transition-all duration-200 ${
                    displayFocusGroups.includes('pregnant')
                      ? 'bg-pink-500/20 border-pink-400/50 text-pink-200'
                      : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                  }`}
                >
                  <input
                    type='checkbox'
                    checked={displayFocusGroups.includes('pregnant')}
                    onChange={() => handleFocusGroupToggle('pregnant')}
                    className='w-4 h-4 rounded border-white/20 bg-white/5 text-pink-500 focus:ring-pink-400/50'
                  />
                  <span className='text-sm'>Pregnant</span>
                </label>
              )}

              {/* PWD */}
              <label
                className={`flex items-center space-x-2 p-3 rounded-xl border cursor-pointer transition-all duration-200 ${
                  displayFocusGroups.includes('pwd')
                    ? 'bg-cyan-500/20 border-cyan-400/50 text-cyan-200'
                    : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
                }`}
              >
                <input
                  type='checkbox'
                  checked={displayFocusGroups.includes('pwd')}
                  onChange={() => handleFocusGroupToggle('pwd')}
                  className='w-4 h-4 rounded border-white/20 bg-white/5 text-cyan-500 focus:ring-cyan-400/50'
                />
                <span className='text-sm'>PWD</span>
              </label>
            </div>
          </div>
        </GlassCard>

        {/* Emergency Contact */}
        <GlassCard hover={false}>
          <h2 className='text-lg font-semibold text-white mb-4'>
            Emergency Contact
          </h2>
          <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
            <GlassInput
              label='Contact Person'
              name='contactPerson'
              value={formData.contactPerson}
              onChange={handleChange}
              placeholder='Enter contact person name'
            />
            <GlassInput
              label='Contact Person Number'
              name='contactPersonNumber'
              value={formData.contactPersonNumber}
              onChange={handleChange}
              placeholder='Enter contact person number'
            />
            <div className='md:col-span-2'>
              <GlassInput
                label='Contact Person Address'
                name='contactPersonAddress'
                value={formData.contactPersonAddress}
                onChange={handleChange}
                placeholder='Enter contact person address'
              />
            </div>
          </div>
        </GlassCard>

        <div className='flex justify-end space-x-3'>
          <GlassButton
            variant='secondary'
            type='button'
            onClick={() => navigate('/residents')}
          >
            Cancel
          </GlassButton>
          <GlassButton type='submit' icon={Save} loading={loading}>
            {isEditing ? 'Update Profile' : 'Add Resident'}
          </GlassButton>
        </div>
      </form>
    </div>
  )
}

export default ResidentForm