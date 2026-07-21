import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft,
  Edit,
  Trash2,
  Plus,
  X,
  ChevronDown,
  ChevronUp
} from 'lucide-react'
import { residentApi } from '../api/residentApi'
import { medicineApi } from '../api/medicineApi'
import { bhwApi } from '../api/bhwApi'
import GlassCard from '../components/GlassCard'
import GlassButton from '../components/GlassButton'
import Modal from '../components/Modal'
import GlassInput from '../components/GlassInput'
import LoadingSpinner from '../components/LoadingSpinner'
import { formatDate, getInitials, getRiskColor } from '../utils/helpers'

// Calculate detailed age from date of birth
const calculateDetailedAge = dateOfBirth => {
  if (!dateOfBirth)
    return { years: 0, months: 0, weeks: 0, days: 0, display: '' }

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

  // Total months including years
  const totalMonths = years * 12 + months

  // Total weeks
  const totalWeeks = Math.floor(diffDays / 7)
  const remainingDays = diffDays - totalWeeks * 7

  let display = ''
  let ageValue = 0

  if (years >= 1) {
    display = `${years} year${years > 1 ? 's' : ''} old`
    ageValue = years
  } else if (totalMonths >= 1) {
    display = `${totalMonths} month${totalMonths > 1 ? 's' : ''} old`
    ageValue = 0
  } else if (totalWeeks >= 1) {
    display = `${totalWeeks} week${totalWeeks > 1 ? 's' : ''} old`
    ageValue = 0
  } else {
    display = `${diffDays} day${diffDays !== 1 ? 's' : ''} old`
    ageValue = 0
  }

  return { years: ageValue, display }
}

const ResidentDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [resident, setResident] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showMedicalModal, setShowMedicalModal] = useState(false)
  const [saving, setSaving] = useState(false)
  const [bhws, setBhws] = useState([])

  const [medicalForm, setMedicalForm] = useState({
    type: 'Checkup',
    facility: 'Barangay Health Center',
    notes: '',
    vitalSigns: {
      bloodPressure: '',
      heartRate: '',
      temperature: '',
      weight: '',
      height: '',
      bloodSugar: '',
      bmi: ''
    },
    medicine_master_id: '',
    dose_number: 1,
    total_doses: 1,
    batch_number: '',
    administration_site: '',
    administered_by: '',
    newConditions: [],
    newMedications: [],
    newAllergies: { drugs: [], food: [], environmental: [] }
  })

  const [tempCondition, setTempCondition] = useState({
    name: '',
    severity: 'Mild'
  })
  const [tempMedication, setTempMedication] = useState({
    name: '',
    dosage: '',
    frequency: ''
  })
  const [tempAllergy, setTempAllergy] = useState({
    type: 'drugs',
    allergen: ''
  })
  const [medicineSchedules, setMedicineSchedules] = useState([])

  const [editingConditions, setEditingConditions] = useState(false)
  const [editingMedications, setEditingMedications] = useState(false)
  const [editingAllergies, setEditingAllergies] = useState(false)
  const [allergyForm, setAllergyForm] = useState({
    type: 'drugs',
    allergen: ''
  })
  const [savingConditions, setSavingConditions] = useState(false)
  const [savingMedications, setSavingMedications] = useState(false)
  const [savingAllergies, setSavingAllergies] = useState(false)
  const [newCondition, setNewCondition] = useState('')
  const [newMedication, setNewMedication] = useState({
    name: '',
    dosage: '',
    frequency: ''
  })
  const [medicineStatus, setMedicineStatus] = useState({
    vaccines: [],
    deworming: []
  })

  const [historyFilter, setHistoryFilter] = useState('all')
  const [historyMonth, setHistoryMonth] = useState('all')
  const [historyYear, setHistoryYear] = useState('all')
  const [historyPage, setHistoryPage] = useState(1)
  const [selectedRecord, setSelectedRecord] = useState(null)
  const [showRecordModal, setShowRecordModal] = useState(false)
  const rowsPerPage = 6

  const [showVaccinationModal, setShowVaccinationModal] = useState(false)
  const [vaccinationData, setVaccinationData] = useState([])
  const [showAdministeredByDropdown, setShowAdministeredByDropdown] =
    useState(false)
  const [administeredByFilter, setAdministeredByFilter] = useState('')

  const fetchAllData = useCallback(async () => {
    try {
      setLoading(true)

      // Fetch all residents first to get riskLevel and other complete data
      const allResidentsResponse = await residentApi.getAll()

      // Then fetch the specific resident details, medicines, and BHWs
      const [residentResponse, medicineResponse, bhwResponse] =
        await Promise.all([
          residentApi.getById(id),
          medicineApi.getResidentMedicines(id),
          bhwApi.getAll()
        ])

      if (residentResponse.data.success) {
        const residentData = residentResponse.data.data

        // If getAll returned data, find the matching resident and merge riskLevel
        if (allResidentsResponse.data.success) {
          const allResidents = allResidentsResponse.data.data
          const matchingResident = allResidents.find(
            res => res.id === parseInt(id)
          )

          if (matchingResident) {
            // Merge riskLevel from getAll response
            if (matchingResident.riskLevel) {
              residentData.riskLevel = matchingResident.riskLevel
            }
          }
        }

        setResident(residentData)
      }

      if (medicineResponse.data.success) {
        setMedicineStatus({
          vaccines: medicineResponse.data.data.vaccines || [],
          deworming: medicineResponse.data.data.deworming || []
        })
        setMedicineSchedules([
          ...(medicineResponse.data.data.vaccines || []),
          ...(medicineResponse.data.data.deworming || [])
        ])
      }

      if (bhwResponse.data.success) setBhws(bhwResponse.data.data)
    } catch (e) {
      console.error('Error fetching data:', e)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchAllData()
  }, [fetchAllData])

  const getAvailableYears = () => {
    const y = new Set()
    resident?.medicalHistory?.forEach(r => {
      if (r.date) y.add(new Date(r.date).getFullYear())
    })
    medicineStatus.vaccines?.forEach(v => {
      v.takenDoses?.forEach(d => {
        if (d.dateAdministered)
          y.add(new Date(d.dateAdministered).getFullYear())
      })
    })
    medicineStatus.deworming?.forEach(d => {
      d.takenDoses?.forEach(dose => {
        if (dose.dateAdministered)
          y.add(new Date(dose.dateAdministered).getFullYear())
      })
    })
    const a = [...y].sort((a, b) => b - a)
    if (a.length === 0) a.push(new Date().getFullYear())
    return a
  }

  const handleDelete = async () => {
    if (!confirm('Delete this resident?')) return
    try {
      await residentApi.delete(id)
      navigate('/residents')
    } catch (e) {
      alert(e.response?.data?.message || 'Failed to delete resident')
    }
  }

  const handleMedicalFormChange = e => {
    const { name, value } = e.target
    setMedicalForm(p => ({ ...p, [name]: value }))
  }

  const handleMedicalTypeChange = e => {
    const t = e.target.value
    setMedicalForm(p => ({
      ...p,
      type: t,
      medicine_master_id: '',
      dose_number: 1,
      total_doses: 1,
      batch_number: '',
      administration_site: '',
      administered_by: ''
    }))
    if (t === 'Vaccination' || t === 'Deworming') fetchAllData()
  }

  const handleVitalChange = e => {
    const { name, value } = e.target
    setMedicalForm(p => ({
      ...p,
      vitalSigns: { ...p.vitalSigns, [name]: value }
    }))
  }

  const handleMedicineMasterChange = e => {
    const mid = e.target.value
    const s = medicineSchedules.find(m => m.id === parseInt(mid))
    if (s)
      setMedicalForm(p => ({
        ...p,
        medicine_master_id: mid,
        dose_number: Math.min(s.completedDoses + 1, s.total_doses),
        total_doses: s.total_doses
      }))
  }

  const addConditionToForm = () => {
    if (tempCondition.name?.trim()) {
      setMedicalForm(p => ({
        ...p,
        newConditions: [
          ...p.newConditions,
          {
            name: tempCondition.name.trim(),
            severity: tempCondition.severity || 'Mild'
          }
        ]
      }))
      setTempCondition({ name: '', severity: 'Mild' })
    }
  }

  const removeConditionFromForm = i =>
    setMedicalForm(p => ({
      ...p,
      newConditions: p.newConditions.filter((_, idx) => idx !== i)
    }))

  const addMedicationToForm = () => {
    if (tempMedication.name.trim()) {
      setMedicalForm(p => ({
        ...p,
        newMedications: [
          ...p.newMedications,
          {
            name: tempMedication.name,
            dosage: tempMedication.dosage,
            frequency: tempMedication.frequency
          }
        ]
      }))
      setTempMedication({ name: '', dosage: '', frequency: '' })
    }
  }

  const removeMedicationFromForm = i =>
    setMedicalForm(p => ({
      ...p,
      newMedications: p.newMedications.filter((_, idx) => idx !== i)
    }))

  const addAllergyToForm = () => {
    if (tempAllergy.allergen.trim()) {
      setMedicalForm(p => ({
        ...p,
        newAllergies: {
          ...p.newAllergies,
          [tempAllergy.type]: [
            ...(p.newAllergies?.[tempAllergy.type] || []),
            tempAllergy.allergen.trim()
          ]
        }
      }))
      setTempAllergy({ type: 'drugs', allergen: '' })
    }
  }

  const removeAllergyFromForm = (t, i) =>
    setMedicalForm(p => ({
      ...p,
      newAllergies: {
        ...p.newAllergies,
        [t]: p.newAllergies[t].filter((_, idx) => idx !== i)
      }
    }))

  const handleAddMedicalHistory = async e => {
    e.preventDefault()
    setSaving(true)
    try {
      const today = new Date().toISOString().split('T')[0]
      if (
        medicalForm.type === 'Vaccination' ||
        medicalForm.type === 'Deworming'
      ) {
        if (!medicalForm.medicine_master_id) {
          alert('Select a medicine')
          setSaving(false)
          return
        }
        const s = medicineSchedules.find(
          m => m.id === parseInt(medicalForm.medicine_master_id)
        )
        await medicineApi.recordMedicine(id, {
          medicine_master_id: medicalForm.medicine_master_id,
          medicine_name: s?.medicine_name || '',
          category:
            s?.category ||
            (medicalForm.type === 'Vaccination' ? 'vaccine' : 'deworming'),
          dose_number: (s?.completedDoses || 0) + 1,
          total_doses: s?.total_doses || 1,
          date_administered: today,
          batch_number: medicalForm.batch_number,
          administration_site: medicalForm.administration_site,
          administered_by: medicalForm.administered_by,
          remarks: medicalForm.notes
        })
      } else {
        await residentApi.addMedicalHistory(id, {
          date: today,
          type: medicalForm.type,
          facility: medicalForm.facility,
          notes: medicalForm.notes,
          vitalSigns: Object.values(medicalForm.vitalSigns).some(v => v !== '')
            ? medicalForm.vitalSigns
            : undefined,
          administered_by: medicalForm.administered_by,
          chronicConditions: medicalForm.newConditions,
          currentMedications: medicalForm.newMedications,
          allergies: medicalForm.newAllergies
        })
        await residentApi.update(id, {
          chronicConditions: medicalForm.newConditions,
          currentMedications: medicalForm.newMedications,
          allergies: {
            drugs: medicalForm.newAllergies?.drugs || [],
            food: medicalForm.newAllergies?.food || [],
            environmental: medicalForm.newAllergies?.environmental || []
          }
        })
      }
      setShowMedicalModal(false)
      await fetchAllData()
    } catch (e) {
      alert(e.response?.data?.message || 'Failed')
    } finally {
      setSaving(false)
    }
  }

  const openMedicalModal = () => {
    const pc = (resident?.chronicConditions || []).map(c =>
      typeof c === 'string'
        ? (() => {
            try {
              const p = JSON.parse(c)
              return { name: p.name || c, severity: p.severity || 'Mild' }
            } catch {
              return { name: c, severity: 'Mild' }
            }
          })()
        : { name: c.name || 'Unknown', severity: c.severity || 'Mild' }
    )
    const pm = (resident?.currentMedications || []).map(m =>
      typeof m === 'string'
        ? (() => {
            try {
              const p = JSON.parse(m)
              return {
                name: p.name || m,
                dosage: p.dosage || '',
                frequency: p.frequency || ''
              }
            } catch {
              return { name: m, dosage: '', frequency: '' }
            }
          })()
        : {
            name: m.name || m,
            dosage: m.dosage || '',
            frequency: m.frequency || ''
          }
    )
    setMedicalForm({
      type: 'Checkup',
      facility: 'Barangay Health Center',
      notes: '',
      vitalSigns: {
        bloodPressure: '',
        heartRate: '',
        temperature: '',
        weight: '',
        height: '',
        bloodSugar: '',
        bmi: ''
      },
      medicine_master_id: '',
      dose_number: 1,
      total_doses: 1,
      batch_number: '',
      administration_site: '',
      administered_by: '',
      newConditions: pc,
      newMedications: pm,
      newAllergies: {
        drugs: [...(resident?.allergies?.drugs || [])],
        food: [...(resident?.allergies?.food || [])],
        environmental: [...(resident?.allergies?.environmental || [])]
      }
    })
    setTempCondition({ name: '', severity: 'Mild' })
    setTempMedication({ name: '', dosage: '', frequency: '' })
    setTempAllergy({ type: 'drugs', allergen: '' })
    setShowMedicalModal(true)
  }

  const addCondition = async () => {
    if (!newCondition.trim()) return
    setSavingConditions(true)
    try {
      await residentApi.update(id, {
        chronicConditions: [
          ...(resident.chronicConditions || []),
          { name: newCondition.trim(), severity: 'Mild' }
        ]
      })
      setNewCondition('')
      await fetchAllData()
    } catch (e) {
      alert(e.response?.data?.message || 'Failed')
    } finally {
      setSavingConditions(false)
    }
  }
  const removeCondition = async i => {
    if (!confirm('Remove?')) return
    try {
      await residentApi.update(id, {
        chronicConditions: resident.chronicConditions.filter(
          (_, idx) => idx !== i
        )
      })
      await fetchAllData()
    } catch (e) {
      alert(e.response?.data?.message || 'Failed')
    }
  }
  const addMedication = async () => {
    if (!newMedication.name.trim()) return
    setSavingMedications(true)
    try {
      await residentApi.update(id, {
        currentMedications: [
          ...(resident.currentMedications || []),
          {
            name: newMedication.name,
            dosage: newMedication.dosage,
            frequency: newMedication.frequency
          }
        ]
      })
      setNewMedication({ name: '', dosage: '', frequency: '' })
      await fetchAllData()
    } catch (e) {
      alert(e.response?.data?.message || 'Failed')
    } finally {
      setSavingMedications(false)
    }
  }
  const removeMedication = async i => {
    if (!confirm('Remove?')) return
    try {
      await residentApi.update(id, {
        currentMedications: resident.currentMedications.filter(
          (_, idx) => idx !== i
        )
      })
      await fetchAllData()
    } catch (e) {
      alert(e.response?.data?.message || 'Failed')
    }
  }
  const addAllergy = async () => {
    if (!allergyForm.allergen.trim()) return
    setSavingAllergies(true)
    try {
      const ua = {
        drugs: [...(resident.allergies?.drugs || [])],
        food: [...(resident.allergies?.food || [])],
        environmental: [...(resident.allergies?.environmental || [])]
      }
      ua[allergyForm.type] = [
        ...ua[allergyForm.type],
        allergyForm.allergen.trim()
      ]
      await residentApi.update(id, { allergies: ua })
      setAllergyForm({ type: 'drugs', allergen: '' })
      await fetchAllData()
    } catch (e) {
      alert(e.response?.data?.message || 'Failed')
    } finally {
      setSavingAllergies(false)
    }
  }
  const removeAllergy = async (t, i) => {
    if (!confirm('Remove?')) return
    try {
      const ua = {
        drugs: [...(resident.allergies?.drugs || [])],
        food: [...(resident.allergies?.food || [])],
        environmental: [...(resident.allergies?.environmental || [])]
      }
      ua[t] = ua[t].filter((_, idx) => idx !== i)
      await residentApi.update(id, { allergies: ua })
      await fetchAllData()
    } catch (e) {
      alert(e.response?.data?.message || 'Failed')
    }
  }

  const openRecordDetail = record => {
    setSelectedRecord(record)
    setShowRecordModal(true)
  }

  const fetchVaccinationData = async () => {
    try {
      const medResponse = await medicineApi.getAll('vaccine')
      const vaccines = medResponse.data?.success
        ? medResponse.data.data || []
        : []

      const recordsResponse = await medicineApi.getResidentMedicines(id)
      const records = recordsResponse.data?.success
        ? recordsResponse.data.data
        : {}
      const takenVaccines = records.vaccines || []

      const vaxData = vaccines.map(vaccine => {
        const matchingRecord = takenVaccines.find(v => {
          if (v.medicine_master_id === vaccine.id) return true
          if (v.medicine_name === vaccine.medicine_name) return true
          return false
        })

        const takenDoses = matchingRecord?.takenDoses || []
        const completedDoses =
          matchingRecord?.completedDoses || takenDoses.length || 0

        return {
          id: vaccine.id,
          name: vaccine.medicine_name,
          requiredDoses: vaccine.total_doses,
          completedDoses: completedDoses,
          doses: Array.from({ length: vaccine.total_doses }, (_, i) => {
            const taken = takenDoses.find(d => d.doseNumber === i + 1)
            return {
              doseNumber: i + 1,
              dateAdministered:
                taken?.dateAdministered || taken?.date_administered || null,
              batchNumber: taken?.batchNumber || taken?.batch_number || '',
              administrationSite:
                taken?.administrationSite || taken?.administration_site || '',
              administeredBy:
                taken?.administeredBy || taken?.administered_by || '',
              remarks: taken?.remarks || '',
              status: taken ? 'Taken' : 'Pending'
            }
          }),
          status:
            completedDoses >= vaccine.total_doses
              ? 'Completed'
              : completedDoses > 0
              ? 'In Progress'
              : 'Not Started',
          targetGroup: vaccine.target_group,
          description: vaccine.description
        }
      })

      setVaccinationData(vaxData)
      setShowVaccinationModal(true)
    } catch (error) {
      console.error('Error fetching vaccination data:', error)
    }
  }

  if (loading) return <LoadingSpinner message='Loading...' />
  if (!resident)
    return (
      <div className='text-center py-12'>
        <p className='text-white/40'>Resident not found</p>
      </div>
    )

  // Calculate age display
  const ageData = calculateDetailedAge(resident.dateOfBirth)
  const ageDisplay = ageData.display || `${resident.age || 0} years old`

  return (
    <div className='space-y-6 animate-fade-in'>
      <div className='flex items-center justify-between'>
        <button
          onClick={() => navigate('/residents')}
          className='flex items-center space-x-2 text-white/70 hover:text-white'
        >
          <ArrowLeft className='w-5 h-5' />
          <span>Back to Residents</span>
        </button>
        <div className='flex space-x-2'>
          <GlassButton
            variant='secondary'
            icon={Edit}
            onClick={() => navigate(`/residents/${id}/edit`)}
          >
            Edit Profile
          </GlassButton>
          <GlassButton variant='danger' icon={Trash2} onClick={handleDelete}>
            Delete
          </GlassButton>
        </div>
      </div>

      {/* CARD 1: Resident Profile Information */}
      <GlassCard hover={false}>
        <h1 className='text-4xl font-bold mt-2 text-white mb-3 pl-0.5'>
          {resident.name}
        </h1>

        <div className='flex flex-wrap items-center gap-2 mb-4 pl-0.5'>
          {/* Risk Level Badge */}
          {resident.riskLevel && (
            <span
              className={`badge px-3 py-1 rounded-full text-xs font-medium border ${getRiskColor(
                resident.riskLevel
              )}`}
            >
              {resident.riskLevel}
            </span>
          )}

          {/* Focus Groups */}
          {resident.focusGroups?.length > 0 && (
            <div className='flex flex-wrap gap-2'>
              {resident.focusGroups.map(g => (
                <span
                  key={g}
                  className='px-2.5 py-0.5 bg-blue-500/20 text-blue-300 border border-blue-400/30 rounded-full text-xs font-medium'
                >
                  {g === 'pregnant'
                    ? 'Pregnant'
                    : g === 'infant'
                    ? 'Infant (0-5)'
                    : g === 'senior'
                    ? 'Senior (60+)'
                    : g === 'withCondition'
                    ? 'With Condition'
                    : g === 'pwd'
                    ? 'PWD'
                    : g}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className='border-t border-white/10 pt-4 mb-4 pl-1'>
          <h2 className='text-sm font-semibold text-blue-300 mb-3 uppercase tracking-wider'>
            Personal Information
          </h2>
          <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4'>
            <div>
              <p className='text-xs text-white/40 mb-1'>Age</p>
              <p className='text-sm text-white'>{ageDisplay}</p>
            </div>
            <div>
              <p className='text-xs text-white/40 mb-1'>Gender</p>
              <p className='text-sm text-white'>{resident.gender}</p>
            </div>
            <div>
              <p className='text-xs text-white/40 mb-1'>Status</p>
              <p className='text-sm text-white'>{resident.civilStatus}</p>
            </div>
            {resident.lastCheckup && (
              <div>
                <p className='text-xs text-white/40 mb-1'>Last Checkup</p>
                <p className='text-sm text-white'>
                  {formatDate(resident.lastCheckup)}
                </p>
              </div>
            )}
            {resident.contactNumber && (
              <div>
                <p className='text-xs text-white/40 mb-1'>Contact Number</p>
                <p className='text-sm text-white'>{resident.contactNumber}</p>
              </div>
            )}
            {resident.purok && (
              <div>
                <p className='text-xs text-white/40 mb-1'>Purok</p>
                <p className='text-sm text-white'>{resident.purok}</p>
              </div>
            )}
            {resident.dateOfBirth && (
              <div>
                <p className='text-xs text-white/40 mb-1'>Birthday</p>
                <p className='text-sm text-white'>
                  {formatDate(resident.dateOfBirth)}
                </p>
              </div>
            )}
          </div>
        </div>

        {(resident.contactPerson ||
          resident.contactPersonNumber ||
          resident.contactPersonAddress) && (
          <div className='border-t border-white/10 pt-4 pl-1'>
            <h2 className='text-sm font-semibold text-blue-300 mb-3 uppercase tracking-wider'>
              Emergency Contact
            </h2>
            <div className='grid grid-cols-2 sm:grid-cols-4 gap-4'>
              {resident.contactPerson && (
                <div>
                  <p className='text-xs text-white/40 mb-1'>Contact Person</p>
                  <p className='text-sm text-white'>{resident.contactPerson}</p>
                </div>
              )}
              {resident.contactPersonNumber && (
                <div>
                  <p className='text-xs text-white/40 mb-1'>Contact Number</p>
                  <p className='text-sm text-white'>
                    {resident.contactPersonNumber}
                  </p>
                </div>
              )}
              {resident.contactPersonAddress && (
                <div>
                  <p className='text-xs text-white/40 mb-1'>Address</p>
                  <p className='text-sm text-white'>
                    {resident.contactPersonAddress}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </GlassCard>

      {/* CARD 2: Vital Signs & Medical Profile */}
      <GlassCard hover={false}>
        <div className='flex items-center justify-between mb-5'>
          <h2 className='text-lg font-bold text-white'>
            Current Medical Profile
          </h2>
          <button
            onClick={openMedicalModal}
            className='px-3 py-1.5 text-sm bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-400/30 rounded-lg transition-colors flex items-center gap-1.5'
          >
            <Plus className='w-4 h-4' />
            Add Medical Record
          </button>
        </div>

        <div className='border-t border-white/10 pt-4 pb-4'>
          <h3 className='text-sm font-semibold text-blue-300 mb-3 uppercase tracking-wider'>
            Latest Vital Signs
          </h3>
          {resident.vitalSigns &&
          Object.values(resident.vitalSigns).some(v => v) ? (
            <div className='grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4'>
              {resident.vitalSigns.bloodPressure && (
                <div>
                  <p className='text-xs text-white/40 mb-1'>Blood Pressure</p>
                  <p className='text-sm text-white'>
                    {resident.vitalSigns.bloodPressure}
                  </p>
                </div>
              )}
              {resident.vitalSigns.heartRate && (
                <div>
                  <p className='text-xs text-white/40 mb-1'>Heart Rate</p>
                  <p className='text-sm text-white'>
                    {resident.vitalSigns.heartRate} bpm
                  </p>
                </div>
              )}
              {resident.vitalSigns.bloodSugar && (
                <div>
                  <p className='text-xs text-white/40 mb-1'>Blood Sugar</p>
                  <p className='text-sm text-white'>
                    {resident.vitalSigns.bloodSugar} mg/dL
                  </p>
                </div>
              )}
              {resident.vitalSigns.bmi && (
                <div>
                  <p className='text-xs text-white/40 mb-1'>BMI</p>
                  <p className='text-sm text-white'>
                    {resident.vitalSigns.bmi}
                  </p>
                </div>
              )}
              {resident.vitalSigns.temperature && (
                <div>
                  <p className='text-xs text-white/40 mb-1'>Temperature</p>
                  <p className='text-sm text-white'>
                    {resident.vitalSigns.temperature}°C
                  </p>
                </div>
              )}
              {resident.vitalSigns.weight && (
                <div>
                  <p className='text-xs text-white/40 mb-1'>Weight</p>
                  <p className='text-sm text-white'>
                    {resident.vitalSigns.weight} kg
                  </p>
                </div>
              )}
              {resident.vitalSigns.height && (
                <div>
                  <p className='text-xs text-white/40 mb-1'>Height</p>
                  <p className='text-sm text-white'>
                    {resident.vitalSigns.height} cm
                  </p>
                </div>
              )}
            </div>
          ) : (
            <p className='text-white/40 text-sm'>No vital signs recorded yet</p>
          )}
        </div>

        <div className='border-t border-white/10 pt-4 pb-4'>
          <div className='flex items-center justify-between mb-3'>
            <h3 className='text-sm font-semibold text-blue-300 uppercase tracking-wider'>
              Chronic Conditions
            </h3>
            <button
              onClick={() => setEditingConditions(!editingConditions)}
              className='text-xs text-blue-400 hover:text-blue-300'
            >
              {editingConditions ? 'Done' : 'Edit'}
            </button>
          </div>
          {resident.chronicConditions?.length > 0 ? (
            <>
              <div className='flex flex-wrap gap-2 mb-3'>
                {[...resident.chronicConditions].reverse().map((c, i) => {
                  let n, s
                  if (typeof c === 'string') {
                    try {
                      const p = JSON.parse(c)
                      n = p.name || c
                      s = p.severity || 'Mild'
                    } catch {
                      n = c
                      s = 'Mild'
                    }
                  } else {
                    n = c.name || 'Unknown'
                    s = c.severity || 'Mild'
                  }
                  const cols = {
                    Critical: 'bg-red-500/20 text-red-200 border-red-400/40',
                    Severe:
                      'bg-orange-500/20 text-orange-200 border-orange-400/40',
                    Moderate:
                      'bg-yellow-500/20 text-yellow-200 border-yellow-400/40',
                    Mild: 'bg-green-500/20 text-green-200 border-green-400/40'
                  }
                  return (
                    <span
                      key={i}
                      className={`px-3 py-1.5 border rounded-full text-xs font-medium flex items-center gap-1 ${
                        cols[s] || cols['Mild']
                      }`}
                    >
                      {n}
                      <span className='text-[10px] opacity-70'>({s})</span>
                      {editingConditions && (
                        <button
                          onClick={() =>
                            removeCondition(
                              resident.chronicConditions.length - 1 - i
                            )
                          }
                          className='hover:text-red-400 ml-1'
                        >
                          <X className='w-3 h-3' />
                        </button>
                      )}
                    </span>
                  )
                })}
              </div>
              <p className='text-xs text-white/30'>
                {resident.chronicConditions.length} condition
                {resident.chronicConditions.length > 1 ? 's' : ''} recorded
                {resident.lastCheckup &&
                  ` · Last updated: ${formatDate(resident.lastCheckup)}`}
              </p>
            </>
          ) : (
            <p className='text-white/40 text-sm'>
              No chronic conditions recorded
            </p>
          )}
          {editingConditions && (
            <div className='flex gap-2 mt-3'>
              <div className='flex-1'>
                <GlassInput
                  placeholder='Add new condition...'
                  value={newCondition}
                  onChange={e => setNewCondition(e.target.value)}
                  onKeyDown={e =>
                    e.key === 'Enter' && (e.preventDefault(), addCondition())
                  }
                />
              </div>
              <GlassButton
                type='button'
                variant='secondary'
                onClick={addCondition}
                loading={savingConditions}
                disabled={!newCondition.trim()}
              >
                Add
              </GlassButton>
            </div>
          )}
        </div>

        <div className='border-t border-white/10 pt-4 pb-4'>
          <div className='flex items-center justify-between mb-3'>
            <h3 className='text-sm font-semibold text-blue-300 uppercase tracking-wider'>
              Current Medications
            </h3>
            <button
              onClick={() => setEditingMedications(!editingMedications)}
              className='text-xs text-blue-400 hover:text-blue-300'
            >
              {editingMedications ? 'Done' : 'Edit'}
            </button>
          </div>
          {resident.currentMedications?.length > 0 ? (
            <>
              <div className='flex flex-wrap gap-2 mb-3'>
                {[...resident.currentMedications].reverse().map((med, i) => {
                  const n = typeof med === 'string' ? med : med.name
                  const d = typeof med === 'string' ? '' : med.dosage || ''
                  const f = typeof med === 'string' ? '' : med.frequency || ''
                  return (
                    <div
                      key={i}
                      className='px-3 py-1.5 bg-blue-500/20 text-blue-200 border border-blue-400/40 rounded-full text-xs font-medium flex items-center gap-1'
                    >
                      <span className='text-white'>{n}</span>
                      {(d || f) && (
                        <>
                          <span className='text-white/20'>|</span>
                          <span className='text-white/50 text-xs'>
                            {[d, f].filter(Boolean).join(' · ')}
                          </span>
                        </>
                      )}
                      {editingMedications && (
                        <button
                          onClick={() =>
                            removeMedication(
                              resident.currentMedications.length - 1 - i
                            )
                          }
                          className='text-white/50 hover:text-red-400 ml-2'
                        >
                          <X className='w-3 h-3' />
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
              <p className='text-xs text-white/30'>
                {resident.currentMedications.length} medication
                {resident.currentMedications.length > 1 ? 's' : ''} recorded
                {resident.lastCheckup &&
                  ` · Last updated: ${formatDate(resident.lastCheckup)}`}
              </p>
            </>
          ) : (
            <p className='text-white/40 text-sm'>No medications recorded</p>
          )}
          {editingMedications && (
            <div className='mt-3'>
              <div className='flex gap-2 items-end'>
                <div className='flex-1'>
                  <GlassInput
                    placeholder='Medication name'
                    value={newMedication.name}
                    onChange={e =>
                      setNewMedication(p => ({ ...p, name: e.target.value }))
                    }
                  />
                </div>
                <div className='flex-1'>
                  <GlassInput
                    placeholder='Dosage (e.g., 500mg)'
                    value={newMedication.dosage}
                    onChange={e =>
                      setNewMedication(p => ({ ...p, dosage: e.target.value }))
                    }
                  />
                </div>
                <div className='flex-1'>
                  <GlassInput
                    placeholder='Frequency (e.g., Twice daily)'
                    value={newMedication.frequency}
                    onChange={e =>
                      setNewMedication(p => ({
                        ...p,
                        frequency: e.target.value
                      }))
                    }
                  />
                </div>
                <button
                  type='button'
                  onClick={addMedication}
                  disabled={!newMedication.name.trim()}
                  className='p-2.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-white disabled:opacity-50 flex-shrink-0'
                >
                  <Plus className='w-4 h-4' />
                </button>
              </div>
            </div>
          )}
        </div>

        <div className='border-t border-white/10 pt-4'>
          <div className='flex items-center justify-between mb-3'>
            <h3 className='text-sm font-semibold text-blue-300 uppercase tracking-wider'>
              Allergies
            </h3>
            <button
              onClick={() => setEditingAllergies(!editingAllergies)}
              className='text-xs text-blue-400 hover:text-blue-300'
            >
              {editingAllergies ? 'Done' : 'Edit'}
            </button>
          </div>
          {resident.allergies?.drugs?.length > 0 ||
          resident.allergies?.food?.length > 0 ||
          resident.allergies?.environmental?.length > 0 ? (
            <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
              {['drugs', 'food', 'environmental'].map(
                t =>
                  resident.allergies[t]?.length > 0 && (
                    <div key={t}>
                      <h4 className='text-xs text-white/40 mb-2 capitalize'>
                        {t}
                      </h4>
                      <div className='flex flex-wrap gap-1'>
                        {[...resident.allergies[t]].reverse().map((a, i) => (
                          <span
                            key={i}
                            className='px-3 py-1.5 bg-blue-500/20 text-blue-200 border border-blue-400/40 rounded-full text-xs font-medium flex items-center gap-1'
                          >
                            <span>{typeof a === 'string' ? a : a}</span>
                            {editingAllergies && (
                              <button
                                onClick={() =>
                                  removeAllergy(
                                    t,
                                    resident.allergies[t].length - 1 - i
                                  )
                                }
                                className='hover:text-red-400'
                              >
                                <X className='w-3 h-3' />
                              </button>
                            )}
                          </span>
                        ))}
                      </div>
                    </div>
                  )
              )}
            </div>
          ) : (
            <p className='text-white/40 text-sm'>No allergies recorded</p>
          )}
          {editingAllergies && (
            <div className='flex gap-2 mt-3'>
              <select
                value={allergyForm.type}
                onChange={e =>
                  setAllergyForm(p => ({ ...p, type: e.target.value }))
                }
                className='glass-select w-32'
              >
                <option value='drugs'>Drug</option>
                <option value='food'>Food</option>
                <option value='environmental'>Environmental</option>
              </select>
              <div className='flex-1'>
                <GlassInput
                  placeholder='Enter allergen (e.g., Penicillin)'
                  value={allergyForm.allergen}
                  onChange={e =>
                    setAllergyForm(p => ({ ...p, allergen: e.target.value }))
                  }
                  onKeyDown={e =>
                    e.key === 'Enter' && (e.preventDefault(), addAllergy())
                  }
                />
              </div>
              <GlassButton
                type='button'
                variant='secondary'
                onClick={addAllergy}
                loading={savingAllergies}
                disabled={!allergyForm.allergen.trim()}
              >
                Add
              </GlassButton>
            </div>
          )}
        </div>
      </GlassCard>

      {/* MEDICAL HISTORY */}
      <GlassCard hover={false}>
        <div className='flex items-center justify-between mb-4'>
          <h2 className='text-lg font-semibold text-white'>Medical History</h2>
          {historyFilter === 'Vaccination' && (
            <button
              onClick={fetchVaccinationData}
              className='text-sm text-blue-400 hover:text-blue-300 transition-colors'
            >
              View Vaccination Record →
            </button>
          )}
        </div>
        <div className='flex flex-wrap gap-2 mb-4'>
          {['all', 'Checkup', 'Vaccination', 'Deworming'].map(f => (
            <button
              key={f}
              onClick={() => {
                setHistoryFilter(f)
                setHistoryPage(1)
              }}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                historyFilter === f
                  ? 'bg-blue-500/30 text-blue-300 border border-blue-400/30'
                  : 'bg-white/5 text-white/60 border border-white/10'
              }`}
            >
              {f === 'all' ? 'All' : f}
            </button>
          ))}
          <span className='text-white/20 mx-1'>|</span>
          <select
            value={historyMonth}
            onChange={e => {
              setHistoryMonth(e.target.value)
              setHistoryPage(1)
            }}
            className='bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white/60'
          >
            <option value='all'>All Months</option>
            {[
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
            ].map((m, i) => (
              <option key={m} value={i}>
                {m}
              </option>
            ))}
          </select>
          <select
            value={historyYear}
            onChange={e => {
              setHistoryYear(e.target.value)
              setHistoryPage(1)
            }}
            className='bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white/60'
          >
            <option value='all'>All Years</option>
            {getAvailableYears().map(y => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
        {(() => {
          let all = []
          ;(resident.medicalHistory || []).forEach(r => {
            if (r.date)
              all.push({
                id: `ch-${r.id}`,
                type: r.type || 'Checkup',
                category: 'Checkup',
                date: r.date,
                createdAt: r.createdAt || r.date,
                facility: r.facility || r.location || '',
                vitalSigns: r.vitalSigns || null,
                conditions: r.chronicConditions || [],
                medications: r.currentMedications || [],
                allergies: r.allergies || {
                  drugs: [],
                  food: [],
                  environmental: []
                },
                notes: r.notes || '',
                administeredBy: r.administeredBy || ''
              })
          })
          ;(medicineStatus.vaccines || []).forEach(v => {
            ;(v.takenDoses || []).forEach(d => {
              all.push({
                id: `vax-${d.id}`,
                type: 'Vaccination',
                category: 'Vaccination',
                date: d.dateAdministered || '',
                createdAt: d.createdAt || d.dateAdministered || '',
                vaccineName: v.medicine_name || '',
                doseNumber: d.doseNumber || 1,
                totalDoses: v.total_doses || 1,
                completedDoses: v.completedDoses || 0,
                dosesLeft: v.dosesLeft || 0,
                batchNumber: d.batchNumber || '',
                administrationSite: d.administrationSite || '',
                notes: d.remarks || '',
                administeredBy: d.administeredBy || '',
                facility: d.facility || v.facility || ''
              })
            })
          })
          ;(medicineStatus.deworming || []).forEach(d => {
            ;(d.takenDoses || []).forEach(dose => {
              all.push({
                id: `dw-${dose.id}`,
                type: 'Deworming',
                category: 'Deworming',
                date: dose.dateAdministered || '',
                createdAt: dose.createdAt || dose.dateAdministered || '',
                medicineName: d.medicine_name || '',
                doseNumber: dose.doseNumber || 1,
                notes: dose.remarks || '',
                administeredBy: dose.administeredBy || '',
                facility: dose.facility || d.facility || ''
              })
            })
          })
          all.sort((a, b) => {
            const tA = new Date(a.createdAt || a.date).getTime()
            const tB = new Date(b.createdAt || b.date).getTime()
            if (isNaN(tA) && isNaN(tB)) return 0
            if (isNaN(tA)) return 1
            if (isNaN(tB)) return -1
            return tB - tA
          })
          if (historyFilter !== 'all')
            all = all.filter(r => r.category === historyFilter)
          if (historyMonth !== 'all')
            all = all.filter(r => {
              const d = new Date(r.date)
              return !isNaN(d) && d.getMonth() === parseInt(historyMonth)
            })
          if (historyYear !== 'all')
            all = all.filter(r => {
              const d = new Date(r.date)
              return !isNaN(d) && d.getFullYear() === parseInt(historyYear)
            })
          const total = all.length
          const pages = Math.ceil(total / rowsPerPage)
          const start = (historyPage - 1) * rowsPerPage
          const paged = all.slice(start, start + rowsPerPage)

          if (total === 0)
            return (
              <div className='text-center py-8'>
                <p className='text-white/40 text-sm'>
                  {historyFilter !== 'all'
                    ? `No ${historyFilter.toLowerCase()} records found.`
                    : 'No medical records found.'}
                </p>
              </div>
            )

          return (
            <>
              <div className='text-sm text-white/40 mb-3'>
                {total} record{total !== 1 ? 's' : ''} found · Click to view
                details
              </div>
              <div className='space-y-3'>
                {paged.map(r => {
                  let displayContent = []

                  if (r.category === 'Deworming') {
                    displayContent.push(
                      <div key='deworming' className='text-sm'>
                        <span className='text-white/70'>
                          Administration #{r.doseNumber}
                        </span>
                        {r.administeredBy && (
                          <span className='text-white/50'>
                            {' '}
                            by: {r.administeredBy}
                          </span>
                        )}
                      </div>
                    )
                  } else if (r.category === 'Vaccination') {
                    displayContent.push(
                      <div
                        key='vaccination'
                        className='flex items-center gap-3 text-sm'
                      >
                        <span className='text-white/70'>
                          Dose {r.doseNumber} of {r.totalDoses}
                        </span>
                        {r.administeredBy && (
                          <span className='text-white/50'>
                            by: {r.administeredBy}
                          </span>
                        )}
                        {r.dosesLeft > 0 ? (
                          <span className='text-yellow-400'>
                            {r.dosesLeft} dose{r.dosesLeft > 1 ? 's' : ''}{' '}
                            remaining
                          </span>
                        ) : (
                          <span className='text-green-400'>✓ Complete</span>
                        )}
                      </div>
                    )
                  } else if (r.category === 'Checkup') {
                    displayContent.push(
                      <div key='checkup' className='text-sm'>
                        {r.vitalSigns &&
                          Object.values(r.vitalSigns).some(v => v) && (
                            <div className='text-white/50 mt-1'>
                              {(() => {
                                const vitalParts = []
                                const vs = r.vitalSigns
                                if (vs?.bloodPressure)
                                  vitalParts.push(`BP: ${vs.bloodPressure}`)
                                if (vs?.heartRate)
                                  vitalParts.push(`HR: ${vs.heartRate}`)
                                if (vs?.temperature)
                                  vitalParts.push(`Temp: ${vs.temperature}°`)
                                if (vs?.weight)
                                  vitalParts.push(`Weight: ${vs.weight}kg`)
                                if (vs?.height)
                                  vitalParts.push(`Height: ${vs.height}cm`)
                                if (vs?.bloodSugar)
                                  vitalParts.push(
                                    `Blood Sugar: ${vs.bloodSugar}mg/dL`
                                  )
                                if (vs?.bmi) vitalParts.push(`BMI: ${vs.bmi}`)
                                return vitalParts.join(' · ')
                              })()}
                            </div>
                          )}
                        {r.administeredBy && (
                          <div className='text-white/40 text-xs mt-1'>
                            administered by: {r.administeredBy}
                          </div>
                        )}
                      </div>
                    )
                  }

                  return (
                    <div
                      key={r.id}
                      className='bg-white/5 rounded-lg p-4 transition-all duration-200 cursor-pointer hover:bg-white/[0.07]'
                      onClick={() => openRecordDetail(r)}
                    >
                      <div className='flex items-center justify-between'>
                        <div className='flex items-center gap-2'>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              r.category === 'Checkup'
                                ? 'bg-blue-500/20 text-blue-300'
                                : r.category === 'Vaccination'
                                ? 'bg-green-500/20 text-green-300'
                                : 'bg-yellow-500/20 text-yellow-300'
                            }`}
                          >
                            {r.type}
                          </span>
                          {r.facility && (
                            <span className='text-white text-sm font-medium'>
                              {r.facility}
                            </span>
                          )}
                          {r.vaccineName && (
                            <span className='text-white text-sm font-medium'>
                              {r.vaccineName}
                            </span>
                          )}
                          {r.medicineName && (
                            <span className='text-white text-sm font-medium'>
                              {r.medicineName}
                            </span>
                          )}
                        </div>
                        <div className='flex items-center gap-2'>
                          <span className='text-sm text-white/60'>
                            {r.date
                              ? new Date(r.date).toLocaleDateString('en-US', {
                                  month: 'short',
                                  day: 'numeric',
                                  year: 'numeric'
                                })
                              : 'No date'}
                          </span>
                        </div>
                      </div>
                      <div className='mt-2'>{displayContent}</div>
                    </div>
                  )
                })}
              </div>
              {pages > 1 && (
                <div className='flex items-center justify-center gap-2 mt-4 pt-3 border-t border-white/10'>
                  <button
                    onClick={() => setHistoryPage(p => Math.max(1, p - 1))}
                    disabled={historyPage === 1}
                    className='px-3 py-1 rounded-lg text-sm bg-white/5 text-white/60 hover:bg-white/10 disabled:opacity-30'
                  >
                    Prev
                  </button>
                  {[...Array(pages)].map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setHistoryPage(i + 1)}
                      className={`w-8 h-8 rounded-lg text-sm font-medium ${
                        historyPage === i + 1
                          ? 'bg-blue-500/30 text-blue-300 border border-blue-400/30'
                          : 'bg-white/5 text-white/60 hover:bg-white/10'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                  <button
                    onClick={() => setHistoryPage(p => Math.min(pages, p + 1))}
                    disabled={historyPage === pages}
                    className='px-3 py-1 rounded-lg text-sm bg-white/5 text-white/60 hover:bg-white/10 disabled:opacity-30'
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )
        })()}
      </GlassCard>

      {/* Record Detail Modal */}
      <Modal
        isOpen={showRecordModal}
        onClose={() => setShowRecordModal(false)}
        title={
          selectedRecord
            ? `${selectedRecord.type} Record Details`
            : 'Record Details'
        }
        size='lg'
      >
        {selectedRecord && (
          <div className='space-y-4'>
            <div className='flex items-center justify-between pb-3 border-b border-white/10'>
              <div className='flex items-center gap-3'>
                <span
                  className={`px-3 py-1 rounded-full text-sm font-medium ${
                    selectedRecord.category === 'Checkup'
                      ? 'bg-blue-500/20 text-blue-300'
                      : selectedRecord.category === 'Vaccination'
                      ? 'bg-green-500/20 text-green-300'
                      : 'bg-yellow-500/20 text-yellow-300'
                  }`}
                >
                  {selectedRecord.type}
                </span>
                {selectedRecord.vaccineName && (
                  <span className='text-white text-lg font-semibold'>
                    {selectedRecord.vaccineName}
                  </span>
                )}
                {selectedRecord.medicineName && (
                  <span className='text-white text-lg font-semibold'>
                    {selectedRecord.medicineName}
                  </span>
                )}
              </div>
              <span className='text-sm text-white/60'>
                {selectedRecord.date
                  ? new Date(selectedRecord.date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric'
                    })
                  : 'No date'}
              </span>
            </div>
            {selectedRecord.facility && (
              <div className='flex gap-2'>
                <span className='text-sm text-white/50'>
                  Location/Facility:
                </span>
                <span className='text-sm text-white'>
                  {selectedRecord.facility}
                </span>
              </div>
            )}
            {selectedRecord.category === 'Vaccination' && (
              <div className='space-y-3 bg-white/[0.03] rounded-lg p-4'>
                <h3 className='text-sm font-semibold text-blue-300'>
                  Vaccination Details
                </h3>
                <div className='grid grid-cols-2 gap-4'>
                  <div className='flex gap-2'>
                    <span className='text-sm text-white/50'>Progress:</span>
                    <span className='text-sm text-white'>
                      Dose {selectedRecord.doseNumber} of{' '}
                      {selectedRecord.totalDoses}
                    </span>
                  </div>
                  <div className='flex gap-2'>
                    <span className='text-sm text-white/50'>Status:</span>
                    {selectedRecord.dosesLeft > 0 ? (
                      <span className='text-sm text-yellow-400'>
                        {selectedRecord.dosesLeft} dose
                        {selectedRecord.dosesLeft > 1 ? 's' : ''} remaining
                      </span>
                    ) : (
                      <span className='text-sm text-green-400'>✓ Complete</span>
                    )}
                  </div>
                  {selectedRecord.batchNumber && (
                    <div className='flex gap-2'>
                      <span className='text-sm text-white/50'>
                        Batch Number:
                      </span>
                      <span className='text-sm text-white'>
                        {selectedRecord.batchNumber}
                      </span>
                    </div>
                  )}
                  {selectedRecord.administrationSite && (
                    <div className='flex gap-2'>
                      <span className='text-sm text-white/50'>Site:</span>
                      <span className='text-sm text-white'>
                        {selectedRecord.administrationSite}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
            {selectedRecord.category === 'Deworming' && (
              <div className='space-y-3 bg-white/[0.03] rounded-lg p-4'>
                <h3 className='text-sm font-semibold text-blue-300'>
                  Deworming Details
                </h3>
                <div className='flex gap-2'>
                  <span className='text-sm text-white/50'>Administration:</span>
                  <span className='text-sm text-white'>
                    #{selectedRecord.doseNumber}
                  </span>
                </div>
              </div>
            )}
            {selectedRecord.vitalSigns &&
              Object.values(selectedRecord.vitalSigns).some(v => v) && (
                <div className='bg-white/[0.03] rounded-lg p-4'>
                  <h3 className='text-sm font-semibold text-blue-300 mb-3'>
                    Vital Signs
                  </h3>
                  <div className='grid grid-cols-2 md:grid-cols-3 gap-3'>
                    {selectedRecord.vitalSigns.bloodPressure && (
                      <div className='bg-white/[0.05] rounded p-3'>
                        <p className='text-xs text-white/50 mb-1'>
                          Blood Pressure
                        </p>
                        <p className='text-sm text-white font-medium'>
                          {selectedRecord.vitalSigns.bloodPressure}
                        </p>
                      </div>
                    )}
                    {selectedRecord.vitalSigns.heartRate && (
                      <div className='bg-white/[0.05] rounded p-3'>
                        <p className='text-xs text-white/50 mb-1'>Heart Rate</p>
                        <p className='text-sm text-white font-medium'>
                          {selectedRecord.vitalSigns.heartRate} bpm
                        </p>
                      </div>
                    )}
                    {selectedRecord.vitalSigns.temperature && (
                      <div className='bg-white/[0.05] rounded p-3'>
                        <p className='text-xs text-white/50 mb-1'>
                          Temperature
                        </p>
                        <p className='text-sm text-white font-medium'>
                          {selectedRecord.vitalSigns.temperature}°C
                        </p>
                      </div>
                    )}
                    {selectedRecord.vitalSigns.bloodSugar && (
                      <div className='bg-white/[0.05] rounded p-3'>
                        <p className='text-xs text-white/50 mb-1'>
                          Blood Sugar
                        </p>
                        <p className='text-sm text-white font-medium'>
                          {selectedRecord.vitalSigns.bloodSugar} mg/dL
                        </p>
                      </div>
                    )}
                    {selectedRecord.vitalSigns.weight && (
                      <div className='bg-white/[0.05] rounded p-3'>
                        <p className='text-xs text-white/50 mb-1'>Weight</p>
                        <p className='text-sm text-white font-medium'>
                          {selectedRecord.vitalSigns.weight} kg
                        </p>
                      </div>
                    )}
                    {selectedRecord.vitalSigns.height && (
                      <div className='bg-white/[0.05] rounded p-3'>
                        <p className='text-xs text-white/50 mb-1'>Height</p>
                        <p className='text-sm text-white font-medium'>
                          {selectedRecord.vitalSigns.height} cm
                        </p>
                      </div>
                    )}
                    {selectedRecord.vitalSigns.bmi && (
                      <div className='bg-white/[0.05] rounded p-3'>
                        <p className='text-xs text-white/50 mb-1'>BMI</p>
                        <p className='text-sm text-white font-medium'>
                          {selectedRecord.vitalSigns.bmi}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            {selectedRecord.category === 'Checkup' &&
              selectedRecord.conditions &&
              selectedRecord.conditions.length > 0 && (
                <div className='bg-white/[0.03] rounded-lg p-4'>
                  <h3 className='text-sm font-semibold text-blue-300 mb-3'>
                    Chronic Conditions
                  </h3>
                  <div className='flex flex-wrap gap-2'>
                    {selectedRecord.conditions.map((c, i) => {
                      let n,
                        s = 'Mild'
                      if (typeof c === 'string') {
                        try {
                          const p = JSON.parse(c)
                          n = p.name || c
                          s = p.severity || 'Mild'
                        } catch {
                          n = c
                        }
                      } else {
                        n = c.name || ''
                        s = c.severity || 'Mild'
                      }
                      const cols = {
                        Critical:
                          'bg-red-500/20 text-red-200 border-red-400/40',
                        Severe:
                          'bg-orange-500/20 text-orange-200 border-orange-400/40',
                        Moderate:
                          'bg-yellow-500/20 text-yellow-200 border-yellow-400/40',
                        Mild: 'bg-green-500/20 text-green-200 border-green-400/40'
                      }
                      return (
                        <span
                          key={i}
                          className={`px-3 py-1.5 border rounded-full text-sm font-medium ${
                            cols[s] || cols['Mild']
                          }`}
                        >
                          {n} <span className='text-xs opacity-70'>({s})</span>
                        </span>
                      )
                    })}
                  </div>
                </div>
              )}
            {selectedRecord.category === 'Checkup' &&
              selectedRecord.medications &&
              selectedRecord.medications.length > 0 && (
                <div className='bg-white/[0.03] rounded-lg p-4'>
                  <h3 className='text-sm font-semibold text-blue-300 mb-3'>
                    Current Medications
                  </h3>
                  <div className='flex flex-wrap gap-2'>
                    {selectedRecord.medications.map((m, i) => {
                      const n =
                        typeof m === 'string'
                          ? (() => {
                              try {
                                return JSON.parse(m).name || m
                              } catch {
                                return m
                              }
                            })()
                          : m.name || ''
                      const d = typeof m === 'string' ? '' : m.dosage || ''
                      const f = typeof m === 'string' ? '' : m.frequency || ''
                      return (
                        <div
                          key={i}
                          className='px-3 py-1.5 bg-blue-500/20 text-blue-200 border border-blue-400/40 rounded-full text-sm font-medium flex items-center gap-1'
                        >
                          <span className='text-white'>{n}</span>
                          {(d || f) && (
                            <>
                              <span className='text-white/20'>|</span>
                              <span className='text-white/70 text-sm'>
                                {[d, f].filter(Boolean).join(' · ')}
                              </span>
                            </>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            {selectedRecord.category === 'Checkup' &&
              selectedRecord.allergies &&
              (selectedRecord.allergies.drugs?.length > 0 ||
                selectedRecord.allergies.food?.length > 0 ||
                selectedRecord.allergies.environmental?.length > 0) && (
                <div className='bg-white/[0.03] rounded-lg p-4'>
                  <h3 className='text-sm font-semibold text-blue-300 mb-3'>
                    Allergies
                  </h3>
                  <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                    {['drugs', 'food', 'environmental'].map(
                      t =>
                        selectedRecord.allergies[t]?.length > 0 && (
                          <div key={t}>
                            <h4 className='text-sm text-white/50 mb-2 capitalize'>
                              {t}
                            </h4>
                            <div className='flex flex-wrap gap-1'>
                              {selectedRecord.allergies[t].map((a, i) => (
                                <span
                                  key={i}
                                  className='px-3 py-1.5 bg-blue-500/20 text-blue-200 border border-blue-400/40 rounded-full text-sm font-medium'
                                >
                                  {typeof a === 'string' ? a : a}
                                </span>
                              ))}
                            </div>
                          </div>
                        )
                    )}
                  </div>
                </div>
              )}
            {selectedRecord.notes && (
              <div className='bg-white/[0.03] rounded-lg p-4'>
                <h3 className='text-sm font-semibold text-blue-300 mb-2'>
                  Notes / Remarks
                </h3>
                <p className='text-sm text-white/80'>{selectedRecord.notes}</p>
              </div>
            )}
            {selectedRecord.administeredBy && (
              <div className='flex gap-2 pt-3 border-t border-white/10'>
                <span className='text-sm text-white/50'>Administered by:</span>
                <span className='text-sm text-white font-medium'>
                  {selectedRecord.administeredBy}
                </span>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Add Medical Record Modal */}
      <Modal
        isOpen={showMedicalModal}
        onClose={() => setShowMedicalModal(false)}
        title='Add Medical Record'
        size='lg'
      >
        <form onSubmit={handleAddMedicalHistory} className='space-y-4'>
          <div className='grid grid-cols-1 gap-4'>
            <div className='space-y-1.5'>
              <label className='block text-sm font-medium text-blue-200'>
                Type
              </label>
              <select
                name='type'
                value={medicalForm.type}
                onChange={handleMedicalTypeChange}
                className='glass-select'
                required
              >
                <option value='Checkup'>Checkup</option>
                <option value='Vaccination'>Vaccination</option>
                <option value='Deworming'>Deworming</option>
              </select>
            </div>
            <GlassInput
              label='Location / Facility'
              name='facility'
              value={medicalForm.facility}
              onChange={handleMedicalFormChange}
              placeholder='Enter location or facility name'
            />
          </div>
          <div className='space-y-1.5'>
            <label className='block text-sm font-medium text-blue-200'>
              Administered By
            </label>
            <div className='relative'>
              <input
                type='text'
                name='administered_by'
                value={medicalForm.administered_by}
                onChange={e => {
                  const value = e.target.value
                  setMedicalForm(p => ({ ...p, administered_by: value }))
                  setAdministeredByFilter(value)
                  setShowAdministeredByDropdown(true)
                }}
                onFocus={() => {
                  setAdministeredByFilter(medicalForm.administered_by)
                  setShowAdministeredByDropdown(true)
                }}
                onBlur={() =>
                  setTimeout(() => setShowAdministeredByDropdown(false), 200)
                }
                placeholder='Type name or select from dropdown'
                className='glass-input w-full pr-10'
              />
              <button
                type='button'
                onClick={() =>
                  setShowAdministeredByDropdown(!showAdministeredByDropdown)
                }
                className='absolute right-2 top-1/2 -translate-y-1/2 text-white/50 hover:text-white/70'
              >
                <ChevronDown className='w-4 h-4' />
              </button>
              {showAdministeredByDropdown && (
                <div className='absolute z-50 w-full mt-1 bg-[#1a1a2e] border border-white/10 rounded-lg shadow-lg max-h-48 overflow-y-auto'>
                  {bhws
                    .filter(b => {
                      const isActive = b.status === 'Active'
                      const isBHW =
                        b.role === 'Barangay Health Worker' ||
                        b.role === 'BHW' ||
                        b.position === 'Barangay Health Worker' ||
                        b.position === 'BHW'
                      const matchesSearch = b.name
                        .toLowerCase()
                        .includes(administeredByFilter.toLowerCase())
                      return isActive && isBHW && matchesSearch
                    })
                    .map(b => (
                      <button
                        key={b.id}
                        type='button'
                        className='w-full text-left px-3 py-2 text-sm text-white/80 hover:bg-white/10 transition-colors'
                        onClick={() => {
                          setMedicalForm(p => ({
                            ...p,
                            administered_by: b.name
                          }))
                          setAdministeredByFilter(b.name)
                          setShowAdministeredByDropdown(false)
                        }}
                      >
                        {b.name}
                      </button>
                    ))}
                </div>
              )}
            </div>
          </div>
          {(medicalForm.type === 'Vaccination' ||
            medicalForm.type === 'Deworming') && (
            <div className='border-t border-white/10 pt-4'>
              <h3 className='text-sm font-medium text-blue-300 mb-3'>
                {medicalForm.type === 'Vaccination'
                  ? 'Vaccination Details'
                  : 'Deworming Details'}
              </h3>
              <div className='space-y-4'>
                <div className='space-y-1.5'>
                  <label className='block text-sm font-medium text-blue-200'>
                    Select{' '}
                    {medicalForm.type === 'Vaccination'
                      ? 'Vaccine'
                      : 'Deworming Medicine'}
                  </label>
                  {medicalForm.type === 'Vaccination' ? (
                    <select
                      value={medicalForm.medicine_master_id}
                      onChange={handleMedicineMasterChange}
                      className='glass-select'
                      required
                    >
                      <option value=''>Choose a vaccine...</option>
                      {medicineSchedules
                        .filter(m => m.category === 'vaccine')
                        .map(m => (
                          <option
                            key={m.id}
                            value={m.id}
                            disabled={m.status === 'completed'}
                          >
                            {m.medicine_name} ({m.completedDoses}/
                            {m.total_doses})
                          </option>
                        ))}
                    </select>
                  ) : (
                    <select
                      value={medicalForm.medicine_master_id}
                      onChange={handleMedicineMasterChange}
                      className='glass-select'
                      required
                    >
                      <option value=''>Choose a deworming medicine...</option>
                      {medicineSchedules
                        .filter(m => m.category === 'deworming')
                        .map(m => (
                          <option key={m.id} value={m.id}>
                            {m.medicine_name}
                          </option>
                        ))}
                    </select>
                  )}
                </div>
                {medicalForm.medicine_master_id &&
                  (() => {
                    const s = medicineSchedules.find(
                      m => m.id === parseInt(medicalForm.medicine_master_id)
                    )
                    return (
                      s && (
                        <div className='bg-white/5 rounded-lg p-3 text-sm text-white/70'>
                          {medicalForm.type === 'Vaccination' ? (
                            <>
                              This will record{' '}
                              <span className='text-white font-medium'>
                                Dose {s.completedDoses + 1}
                              </span>{' '}
                              of{' '}
                              <span className='text-white font-medium'>
                                {s.total_doses}
                              </span>{' '}
                              total doses.
                            </>
                          ) : (
                            <>
                              This will record{' '}
                              <span className='text-white font-medium'>
                                administration #{s.completedDoses + 1}
                              </span>{' '}
                              of{' '}
                              <span className='text-white font-medium'>
                                {s.medicine_name}
                              </span>
                              .
                            </>
                          )}
                        </div>
                      )
                    )
                  })()}
                {medicalForm.type === 'Vaccination' && (
                  <div className='grid grid-cols-2 gap-3'>
                    <GlassInput
                      label='Batch/Lot Number'
                      name='batch_number'
                      value={medicalForm.batch_number}
                      onChange={handleMedicalFormChange}
                      placeholder='Optional'
                    />
                    <div className='space-y-1.5'>
                      <label className='block text-sm font-medium text-blue-200'>
                        Site
                      </label>
                      <select
                        name='administration_site'
                        value={medicalForm.administration_site}
                        onChange={handleMedicalFormChange}
                        className='glass-select'
                      >
                        <option value=''>Select</option>
                        <option value='Left Arm'>Left Arm</option>
                        <option value='Right Arm'>Right Arm</option>
                        <option value='Left Thigh'>Left Thigh</option>
                        <option value='Right Thigh'>Right Thigh</option>
                        <option value='Oral'>Oral</option>
                      </select>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
          {medicalForm.type === 'Checkup' && (
            <>
              <div className='border-t border-white/10 pt-4'>
                <h3 className='text-sm font-medium text-blue-300 mb-3'>
                  Vital Signs
                </h3>
                <div className='grid grid-cols-1 md:grid-cols-3 gap-3'>
                  <GlassInput
                    label='Blood Pressure'
                    name='bloodPressure'
                    value={medicalForm.vitalSigns.bloodPressure}
                    onChange={handleVitalChange}
                    placeholder='120/80'
                  />
                  <GlassInput
                    label='Heart Rate'
                    name='heartRate'
                    type='number'
                    value={medicalForm.vitalSigns.heartRate}
                    onChange={handleVitalChange}
                    placeholder='bpm'
                  />
                  <GlassInput
                    label='Temperature'
                    name='temperature'
                    type='number'
                    value={medicalForm.vitalSigns.temperature}
                    onChange={handleVitalChange}
                    placeholder='°C'
                    step='0.1'
                  />
                  <GlassInput
                    label='Weight'
                    name='weight'
                    type='number'
                    value={medicalForm.vitalSigns.weight}
                    onChange={handleVitalChange}
                    placeholder='kg'
                    step='0.1'
                  />
                  <GlassInput
                    label='Height'
                    name='height'
                    type='number'
                    value={medicalForm.vitalSigns.height}
                    onChange={handleVitalChange}
                    placeholder='cm'
                    step='0.1'
                  />
                  <GlassInput
                    label='Blood Sugar'
                    name='bloodSugar'
                    type='number'
                    value={medicalForm.vitalSigns.bloodSugar}
                    onChange={handleVitalChange}
                    placeholder='mg/dL'
                  />
                </div>
              </div>
              <div className='border-t border-white/10 pt-4'>
                <h3 className='text-sm font-medium text-blue-300 mb-3'>
                  Chronic Conditions
                </h3>
                {medicalForm.newConditions.length > 0 ? (
                  <div className='flex flex-wrap gap-2 mb-3'>
                    {medicalForm.newConditions.map((c, i) => (
                      <span
                        key={i}
                        className={`px-3 py-1.5 border rounded-full text-sm font-medium flex items-center gap-1 ${
                          c.severity === 'Critical'
                            ? 'bg-red-500/30 text-red-200 border-red-400/40'
                            : c.severity === 'Severe'
                            ? 'bg-orange-500/30 text-orange-200 border-orange-400/40'
                            : c.severity === 'Moderate'
                            ? 'bg-yellow-500/30 text-yellow-200 border-yellow-400/40'
                            : 'bg-green-500/30 text-green-200 border-green-400/40'
                        }`}
                      >
                        {c.name}
                        <span className='text-[10px] opacity-70'>
                          ({c.severity || 'Mild'})
                        </span>
                        <button
                          type='button'
                          onClick={() => removeConditionFromForm(i)}
                          className='hover:text-red-400 ml-1'
                        >
                          <X className='w-3 h-3' />
                        </button>
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className='text-white/40 text-xs mb-3'>No conditions</p>
                )}
                <div className='flex gap-2 items-end'>
                  <div className='flex-1'>
                    <GlassInput
                      placeholder='Condition name'
                      value={tempCondition.name || ''}
                      onChange={e =>
                        setTempCondition(p => ({ ...p, name: e.target.value }))
                      }
                    />
                  </div>
                  <div className='w-36'>
                    <select
                      value={tempCondition.severity || 'Mild'}
                      onChange={e =>
                        setTempCondition(p => ({
                          ...p,
                          severity: e.target.value
                        }))
                      }
                      className='glass-select'
                    >
                      <option value='Mild'>Mild</option>
                      <option value='Moderate'>Moderate</option>
                      <option value='Severe'>Severe</option>
                      <option value='Critical'>Critical</option>
                    </select>
                  </div>
                  <button
                    type='button'
                    onClick={addConditionToForm}
                    disabled={!tempCondition.name || !tempCondition.name.trim()}
                    className='p-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white disabled:opacity-50 flex-shrink-0'
                  >
                    <Plus className='w-5 h-5' />
                  </button>
                </div>
              </div>
              <div className='border-t border-white/10 pt-4'>
                <h3 className='text-sm font-medium text-blue-300 mb-3'>
                  Medications
                </h3>
                {medicalForm.newMedications.length > 0 ? (
                  <div className='flex flex-wrap gap-3 mb-3'>
                    {medicalForm.newMedications.map((m, i) => (
                      <div
                        key={i}
                        className='px-3 py-1.5 bg-blue-500/30 text-blue-200 border border-blue-400/40 rounded-full text-sm font-medium flex items-center gap-1'
                      >
                        <span className='text-white'>{m.name}</span>
                        {(m.dosage || m.frequency) && (
                          <>
                            <span className='text-white/20'>|</span>
                            <span className='text-white/50 text-sm'>
                              {[m.dosage, m.frequency]
                                .filter(Boolean)
                                .join(' · ')}
                            </span>
                          </>
                        )}
                        <button
                          type='button'
                          onClick={() => removeMedicationFromForm(i)}
                          className='hover:text-red-400 ml-1'
                        >
                          <X className='w-3 h-3' />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className='text-white/40 text-xs mb-3'>No medications</p>
                )}
                <div className='flex gap-2 items-end'>
                  <div className='flex-1'>
                    <GlassInput
                      placeholder='Medication name'
                      value={tempMedication.name}
                      onChange={e =>
                        setTempMedication(p => ({ ...p, name: e.target.value }))
                      }
                    />
                  </div>
                  <div className='flex-1'>
                    <GlassInput
                      placeholder='Dosage'
                      value={tempMedication.dosage}
                      onChange={e =>
                        setTempMedication(p => ({
                          ...p,
                          dosage: e.target.value
                        }))
                      }
                    />
                  </div>
                  <div className='flex-1'>
                    <GlassInput
                      placeholder='Frequency'
                      value={tempMedication.frequency}
                      onChange={e =>
                        setTempMedication(p => ({
                          ...p,
                          frequency: e.target.value
                        }))
                      }
                    />
                  </div>
                  <button
                    type='button'
                    onClick={addMedicationToForm}
                    disabled={!tempMedication.name.trim()}
                    className='p-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white disabled:opacity-50 flex-shrink-0'
                  >
                    <Plus className='w-5 h-5' />
                  </button>
                </div>
              </div>
              <div className='border-t border-white/10 pt-4'>
                <h3 className='text-sm font-medium text-blue-300 mb-3'>
                  Allergies
                </h3>
                {medicalForm.newAllergies?.drugs?.length > 0 ||
                medicalForm.newAllergies?.food?.length > 0 ||
                medicalForm.newAllergies?.environmental?.length > 0 ? (
                  <div className='grid grid-cols-1 md:grid-cols-3 gap-4 mb-3'>
                    {['drugs', 'food', 'environmental'].map(
                      t =>
                        medicalForm.newAllergies[t]?.length > 0 && (
                          <div key={t}>
                            <h4 className='text-xs font-medium text-blue-200 mb-2 capitalize'>
                              {t}
                            </h4>
                            <div className='flex flex-wrap gap-1'>
                              {medicalForm.newAllergies[t].map((a, i) => (
                                <span
                                  key={i}
                                  className='px-3 py-1.5 bg-blue-500/30 text-blue-200 border border-blue-400/40 rounded-full text-sm font-medium flex items-center gap-1'
                                >
                                  {a}
                                  <button
                                    type='button'
                                    onClick={() => removeAllergyFromForm(t, i)}
                                    className='hover:text-red-400'
                                  >
                                    <X className='w-3 h-3' />
                                  </button>
                                </span>
                              ))}
                            </div>
                          </div>
                        )
                    )}
                  </div>
                ) : (
                  <p className='text-white/40 text-xs mb-3'>No allergies</p>
                )}
                <div className='flex gap-2'>
                  <select
                    value={tempAllergy.type}
                    onChange={e =>
                      setTempAllergy(p => ({ ...p, type: e.target.value }))
                    }
                    className='glass-select w-36'
                  >
                    <option value='drugs'>Drug</option>
                    <option value='food'>Food</option>
                    <option value='environmental'>Environmental</option>
                  </select>
                  <div className='flex-1'>
                    <GlassInput
                      placeholder='Enter allergen'
                      value={tempAllergy.allergen}
                      onChange={e =>
                        setTempAllergy(p => ({
                          ...p,
                          allergen: e.target.value
                        }))
                      }
                      onKeyDown={e =>
                        e.key === 'Enter' &&
                        (e.preventDefault(), addAllergyToForm())
                      }
                    />
                  </div>
                  <button
                    type='button'
                    onClick={addAllergyToForm}
                    disabled={!tempAllergy.allergen.trim()}
                    className='p-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white disabled:opacity-50 flex-shrink-0'
                  >
                    <Plus className='w-5 h-5' />
                  </button>
                </div>
              </div>
            </>
          )}
          <div className='border-t border-white/10 pt-4'>
            <GlassInput
              label='Notes / Remarks'
              name='notes'
              type='textarea'
              value={medicalForm.notes}
              onChange={handleMedicalFormChange}
              placeholder='Additional notes...'
            />
          </div>
          <div className='flex justify-end space-x-3 pt-4 border-t border-white/10'>
            <GlassButton
              variant='secondary'
              type='button'
              onClick={() => setShowMedicalModal(false)}
            >
              Cancel
            </GlassButton>
            <GlassButton type='submit' icon={Plus} loading={saving}>
              Add Medical Record
            </GlassButton>
          </div>
        </form>
      </Modal>

      {/* Vaccination View Modal */}
      <Modal
        isOpen={showVaccinationModal}
        onClose={() => setShowVaccinationModal(false)}
        title={`Vaccination Record - ${resident?.name}`}
        size='xl'
      >
        <div className='space-y-4'>
          {vaccinationData.length === 0 ? (
            <p className='text-sm text-white/30 text-center py-8'>
              No vaccination data available
            </p>
          ) : (
            vaccinationData.map(vaccine => (
              <div
                key={vaccine.id}
                className='bg-white/[0.03] rounded-lg p-4 border border-white/5'
              >
                <div className='flex items-center justify-between mb-3'>
                  <div>
                    <h4 className='text-white font-medium'>{vaccine.name}</h4>
                    <div className='flex items-center gap-2 mt-1'>
                      <span className='text-xs text-white/50'>
                        {vaccine.requiredDoses} dose
                        {vaccine.requiredDoses > 1 ? 's' : ''} required
                      </span>
                      <span className='text-xs text-white/30'>·</span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          vaccine.status === 'Completed'
                            ? 'bg-green-500/20 text-green-300 border border-green-400/30'
                            : vaccine.status === 'In Progress'
                            ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-400/30'
                            : 'bg-gray-500/20 text-gray-300 border border-gray-400/30'
                        }`}
                      >
                        {vaccine.completedDoses}/{vaccine.requiredDoses} ·{' '}
                        {vaccine.status}
                      </span>
                    </div>
                  </div>
                  <div className='w-32'>
                    <div className='w-full bg-white/10 rounded-full h-2'>
                      <div
                        className={`h-2 rounded-full transition-all ${
                          vaccine.status === 'Completed'
                            ? 'bg-green-500'
                            : vaccine.status === 'In Progress'
                            ? 'bg-yellow-500'
                            : 'bg-gray-500'
                        }`}
                        style={{
                          width: `${
                            (vaccine.completedDoses / vaccine.requiredDoses) *
                            100
                          }%`
                        }}
                      />
                    </div>
                  </div>
                </div>
                {(vaccine.targetGroup || vaccine.description) && (
                  <div className='mb-3 text-xs text-white/40'>
                    {vaccine.targetGroup && vaccine.targetGroup !== 'all' && (
                      <span>Target: {vaccine.targetGroup} · </span>
                    )}
                    {vaccine.description && <span>{vaccine.description}</span>}
                  </div>
                )}
                <div className='overflow-x-auto'>
                  <table className='w-full text-sm'>
                    <thead>
                      <tr className='border-b border-white/10'>
                        <th className='text-left py-2 px-2 text-xs text-white/40 font-medium'>
                          Dose
                        </th>
                        <th className='text-left py-2 px-2 text-xs text-white/40 font-medium'>
                          Date Administered
                        </th>
                        <th className='text-left py-2 px-2 text-xs text-white/40 font-medium'>
                          Batch No.
                        </th>
                        <th className='text-left py-2 px-2 text-xs text-white/40 font-medium'>
                          Site
                        </th>
                        <th className='text-left py-2 px-2 text-xs text-white/40 font-medium'>
                          Administered By
                        </th>
                        <th className='text-left py-2 px-2 text-xs text-white/40 font-medium'>
                          Status
                        </th>
                        <th className='text-left py-2 px-2 text-xs text-white/40 font-medium'>
                          Remarks
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {vaccine.doses.map((dose, i) => (
                        <tr
                          key={i}
                          className='border-b border-white/5 hover:bg-white/[0.02]'
                        >
                          <td className='py-2 px-2 text-white'>
                            Dose {dose.doseNumber}
                          </td>
                          <td className='py-2 px-2 text-white/70'>
                            {dose.dateAdministered ? (
                              formatDate(dose.dateAdministered)
                            ) : (
                              <span className='text-white/30'>—</span>
                            )}
                          </td>
                          <td className='py-2 px-2 text-white/70'>
                            {dose.batchNumber || (
                              <span className='text-white/30'>—</span>
                            )}
                          </td>
                          <td className='py-2 px-2 text-white/70'>
                            {dose.administrationSite || (
                              <span className='text-white/30'>—</span>
                            )}
                          </td>
                          <td className='py-2 px-2 text-white/70'>
                            {dose.administeredBy || (
                              <span className='text-white/30'>—</span>
                            )}
                          </td>
                          <td className='py-2 px-2'>
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                dose.status === 'Taken'
                                  ? 'bg-green-500/20 text-green-300'
                                  : 'bg-gray-500/20 text-gray-300'
                              }`}
                            >
                              {dose.status}
                            </span>
                          </td>
                          <td className='py-2 px-2 text-white/50 text-xs'>
                            {dose.remarks || (
                              <span className='text-white/30'>—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))
          )}
        </div>
      </Modal>
    </div>
  )
}

export default ResidentDetail
