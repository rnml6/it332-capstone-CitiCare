const { supabaseAdmin } = require('../config/supabase')
const riskScoreService = require('../services/riskScoreService')

// Helper function to convert various formats to boolean (moved outside class)
const toBoolean = value => {
  if (typeof value === 'boolean') return value
  if (typeof value === 'string') {
    const lower = value.trim().toLowerCase()
    if (['true', '1', 'yes', 'y', 'on', 'enabled'].includes(lower)) return true
    if (['false', '0', 'no', 'n', 'off', 'disabled'].includes(lower))
      return false
    return null // Invalid
  }
  if (typeof value === 'number') {
    return value !== 0
  }
  return null
}

// Helper function to get focus group UUIDs from names
const getFocusGroupIds = async focusGroupNames => {
  if (!focusGroupNames || focusGroupNames.length === 0) {
    return []
  }

  const { data, error } = await supabaseAdmin
    .from('focus_groups')
    .select('id, group_name')
    .in('group_name', focusGroupNames)

  if (error) {
    console.error('Error fetching focus groups:', error)
    return []
  }

  return data.map(item => item.id)
}

// Helper function to get focus group names from UUIDs
const getFocusGroupNames = async focusGroupIds => {
  if (!focusGroupIds || focusGroupIds.length === 0) {
    return []
  }

  const { data, error } = await supabaseAdmin
    .from('focus_groups')
    .select('id, group_name')
    .in('id', focusGroupIds)

  if (error) {
    console.error('Error fetching focus groups:', error)
    return []
  }

  return data.map(item => item.group_name)
}

class ResidentController {
  // Get all residents with pagination
  async getAllResidents (req, res) {
    try {
      const page = parseInt(req.query.page) || 1
      const limit = parseInt(req.query.limit) || 20
      const offset = (page - 1) * limit
      const search = req.query.search || ''
      const purokId = req.query.purokId
      const riskLevel = req.query.riskLevel

      let query = supabaseAdmin.from('residents').select(
        `
                    *,
                    households(
                        household_number,
                        puroks(id, purok_name)
                    ),
                    health_profiles(current_risk_score, risk_level)
                `,
        { count: 'exact' }
      )

      // Apply filters
      if (search) {
        query = query.or(
          `first_name.ilike.%${search}%,last_name.ilike.%${search}%,households.household_number.ilike.%${search}%`
        )
      }

      if (riskLevel) {
        query = query.eq('health_profiles.risk_level', riskLevel)
      }

      // Apply pagination
      query = query.range(offset, offset + limit - 1)

      const { data, error, count } = await query

      if (error) throw error

      // Transform data to match expected format
      const transformedData = (data || []).map(resident => ({
        ...resident,
        purok_id: resident.households?.puroks?.id || null,
        purok_name: resident.households?.puroks?.purok_name || null,
        household_number: resident.households?.household_number || null,
        risk_score: resident.health_profiles?.current_risk_score || null,
        risk_level: resident.health_profiles?.risk_level || null,
        households: undefined,
        health_profiles: undefined
      }))

      res.json({
        data: transformedData,
        pagination: {
          page,
          limit,
          total: count || 0,
          totalPages: Math.ceil((count || 0) / limit)
        }
      })
    } catch (error) {
      console.error('Get all residents error:', error)
      res
        .status(500)
        .json({ error: 'Failed to fetch residents', details: error.message })
    }
  }

  // Get resident by ID
  async getResidentById (req, res) {
    try {
      const { id } = req.params

      // Get resident details
      const { data: resident, error: residentError } = await supabaseAdmin
        .from('residents')
        .select(
          `
                    *,
                    households(
                        id,
                        household_number,
                        puroks(id, purok_name)
                    ),
                    health_profiles(*)
                `
        )
        .eq('id', id)
        .single()

      if (residentError) throw residentError
      if (!resident) {
        return res.status(404).json({ error: 'Resident not found' })
      }

      // Get chronic conditions
      const { data: conditions, error: conditionError } = await supabaseAdmin
        .from('chronic_conditions')
        .select('*')
        .eq('resident_id', id)
        .order('created_at', { ascending: false })

      if (conditionError) throw conditionError

      // Get medications
      const { data: medications, error: medError } = await supabaseAdmin
        .from('resident_medications')
        .select('*')
        .eq('resident_id', id)
        .order('created_at', { ascending: false })

      if (medError) throw medError

      // Get allergens
      const { data: allergens, error: allergenError } = await supabaseAdmin
        .from('resident_allergens')
        .select('*')
        .eq('resident_id', id)
        .order('created_at', { ascending: false })

      if (allergenError) throw allergenError

      // Get vital signs history
      const { data: vitals, error: vitalError } = await supabaseAdmin
        .from('vital_signs')
        .select('*, bhws(first_name, last_name)')
        .eq('resident_id', id)
        .order('recorded_at', { ascending: false })
        .limit(10)

      if (vitalError) throw vitalError

      // Get appointments
      const { data: appointments, error: appError } = await supabaseAdmin
        .from('checkups_and_appointments')
        .select('*, bhws(first_name, last_name)')
        .eq('resident_id', id)
        .order('scheduled_date', { ascending: false })

      if (appError) throw appError

      // Get medical history
      const { data: medicalHistory, error: historyError } = await supabaseAdmin
        .from('medical_histories')
        .select('*')
        .eq('resident_id', id)
        .order('event_date', { ascending: false })

      if (historyError) throw historyError

      // Get focus groups
      const { data: focusGroups, error: focusError } = await supabaseAdmin
        .from('resident_focus_groups')
        .select(
          `
                    focus_group_id,
                    assigned_date,
                    focus_groups(id, group_name, description)
                `
        )
        .eq('resident_id', id)

      if (focusError) throw focusError

      // Get AI recommendations
      const { data: recommendations, error: recError } = await supabaseAdmin
        .from('ai_recommendations')
        .select('*')
        .eq('resident_id', id)
        .order('generated_at', { ascending: false })
        .limit(5)

      if (recError) throw recError

      // Get focus group IDs (convert to array of strings for frontend)
      const focusGroupIds = focusGroups
        ? focusGroups.map(fg => fg.focus_group_id)
        : []

      // Get focus group names for the response
      const focusGroupNames = await getFocusGroupNames(focusGroupIds)

      // Structure the response
      const response = {
        ...resident,
        purok_id: resident.households?.puroks?.id || null,
        purok_name: resident.households?.puroks?.purok_name || null,
        household_number: resident.households?.household_number || null,
        health_profile: resident.health_profiles || null,
        chronic_conditions: conditions || [],
        medications: medications || [],
        allergens: allergens || [],
        vital_signs: vitals || [],
        appointments: appointments || [],
        medical_history: medicalHistory || [],
        focus_groups: focusGroups
          ? focusGroups.map(fg => ({
              ...fg.focus_groups,
              assigned_date: fg.assigned_date
            }))
          : [],
        focus_group_ids: focusGroupNames, // Send names to frontend
        ai_recommendations: recommendations || []
      }

      // Remove nested objects that were already processed
      delete response.households
      delete response.health_profiles

      res.json(response)
    } catch (error) {
      console.error('Get resident error:', error)
      res
        .status(500)
        .json({
          error: 'Failed to fetch resident details',
          details: error.message
        })
    }
  }

  // Create resident
  async createResident (req, res) {
    try {
      const residentData = req.body

      // Validate required fields
      const requiredFields = [
        'first_name',
        'last_name',
        'birth_date',
        'sex',
        'civil_status'
      ]
      for (const field of requiredFields) {
        if (!residentData[field]) {
          return res.status(400).json({ error: `${field} is required` })
        }
      }

      // Handle household_id - if provided as number or string, validate it exists
      let householdId = null
      if (residentData.household_id) {
        // Check if it's a valid UUID format or a number
        const isUUID =
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
            residentData.household_id
          )
        const isNumber = /^\d+$/.test(residentData.household_id)

        if (!isUUID && !isNumber) {
          return res.status(400).json({
            error:
              'Invalid household ID format. Must be a valid UUID or numeric ID.'
          })
        }

        // Try to find the household
        let query = supabaseAdmin
          .from('households')
          .select('id')
          .eq('id', residentData.household_id)

        // If it's a number, also try to find by household_number
        if (isNumber) {
          query = supabaseAdmin
            .from('households')
            .select('id')
            .eq('household_number', residentData.household_id)
        }

        const { data: household, error: householdError } = await query.single()

        if (householdError || !household) {
          return res.status(400).json({
            error: 'Invalid household ID. Household not found.',
            details: `No household found with ID: ${residentData.household_id}`
          })
        }
        householdId = household.id
      }

      // Validate sex
      if (!['Male', 'Female'].includes(residentData.sex)) {
        return res.status(400).json({ error: 'Sex must be Male or Female' })
      }

      // Validate civil_status
      if (
        !['Single', 'Married', 'Divorced', 'Widowed'].includes(
          residentData.civil_status
        )
      ) {
        return res.status(400).json({ error: 'Invalid civil status' })
      }

      // Check if resident already exists (by name, birth_date, and household)
      if (householdId) {
        const { data: existingResident, error: checkError } =
          await supabaseAdmin
            .from('residents')
            .select('id, first_name, last_name')
            .eq('first_name', residentData.first_name)
            .eq('last_name', residentData.last_name)
            .eq('birth_date', residentData.birth_date)
            .eq('household_id', householdId)
            .maybeSingle()

        if (existingResident) {
          return res.status(409).json({
            error: 'Duplicate resident',
            message:
              'A resident with this name, birth date, and household already exists',
            resident_id: existingResident.id
          })
        }
      }

      // Convert boolean fields
      const booleanFields = [
        'is_household_head',
        'is_infant',
        'is_senior',
        'is_pwd',
        'is_pregnant'
      ]
      const booleanData = {}
      booleanFields.forEach(field => {
        if (residentData[field] !== undefined) {
          const converted = toBoolean(residentData[field])
          if (converted !== null) {
            booleanData[field] = converted
          } else {
            booleanData[field] = false
          }
        } else {
          booleanData[field] = false
        }
      })

      // Create resident
      const { data: resident, error: residentError } = await supabaseAdmin
        .from('residents')
        .insert({
          household_id: householdId,
          first_name: residentData.first_name,
          middle_name: residentData.middle_name || null,
          last_name: residentData.last_name,
          suffix: residentData.suffix || null,
          birth_date: residentData.birth_date,
          sex: residentData.sex,
          civil_status: residentData.civil_status,
          contact_number: residentData.contact_number || null,
          is_household_head: booleanData.is_household_head,
          is_infant: booleanData.is_infant,
          is_senior: booleanData.is_senior,
          is_pwd: booleanData.is_pwd,
          is_pregnant: booleanData.is_pregnant,
          is_sick: residentData.is_sick || null,
          is_archived: false
        })
        .select()
        .single()

      if (residentError) {
        console.error('Resident creation error:', residentError)
        throw residentError
      }

      // Create health profile with upsert to handle duplicates
      let healthProfile = null
      try {
        // Check if health profile already exists
        const { data: existingProfile, error: checkProfileError } =
          await supabaseAdmin
            .from('health_profiles')
            .select('*')
            .eq('resident_id', resident.id)
            .maybeSingle()

        if (existingProfile) {
          // Update existing profile
          const { data: updatedProfile, error: updateProfileError } =
            await supabaseAdmin
              .from('health_profiles')
              .update({
                blood_type: residentData.blood_type || null,
                has_chronic_condition:
                  residentData.chronic_conditions &&
                  residentData.chronic_conditions.length > 0,
                current_risk_score: existingProfile.current_risk_score || 0,
                risk_level: existingProfile.risk_level || 'Low',
                last_calculated_at: new Date().toISOString()
              })
              .eq('resident_id', resident.id)
              .select()
              .single()

          if (updateProfileError) throw updateProfileError
          healthProfile = updatedProfile
        } else {
          // Create new profile
          const { data: newProfile, error: createProfileError } =
            await supabaseAdmin
              .from('health_profiles')
              .insert({
                resident_id: resident.id,
                blood_type: residentData.blood_type || null,
                has_chronic_condition:
                  residentData.chronic_conditions &&
                  residentData.chronic_conditions.length > 0,
                current_risk_score: 0,
                risk_level: 'Low',
                last_calculated_at: new Date().toISOString()
              })
              .select()
              .single()

          if (createProfileError) {
            // If error is duplicate, try to fetch the existing one
            if (createProfileError.code === '23505') {
              const { data: fetchedProfile, error: fetchError } =
                await supabaseAdmin
                  .from('health_profiles')
                  .select('*')
                  .eq('resident_id', resident.id)
                  .single()

              if (fetchError) throw fetchError
              healthProfile = fetchedProfile
            } else {
              throw createProfileError
            }
          } else {
            healthProfile = newProfile
          }
        }
      } catch (profileError) {
        console.error('Health profile error:', profileError)
      }

      // Add chronic conditions
      if (
        residentData.chronic_conditions &&
        residentData.chronic_conditions.length > 0
      ) {
        const conditions = residentData.chronic_conditions.map(condition => ({
          resident_id: resident.id,
          disease_name: condition.disease_name,
          date_diagnosed:
            condition.date_diagnosed || new Date().toISOString().split('T')[0],
          severity: condition.severity || 'Moderate',
          status: condition.status || 'Active'
        }))

        const { error: conditionError } = await supabaseAdmin
          .from('chronic_conditions')
          .insert(conditions)

        if (conditionError) {
          console.error('Chronic conditions error:', conditionError)
        }
      }

      // Add medications
      if (residentData.medications && residentData.medications.length > 0) {
        const medications = residentData.medications.map(med => ({
          resident_id: resident.id,
          medication_name: med.medication_name,
          dosage: med.dosage || null,
          dosage_frequency: med.dosage_frequency,
          start_date: med.start_date || new Date().toISOString().split('T')[0],
          end_date: med.end_date || null,
          status: med.status || 'Active'
        }))

        const { error: medError } = await supabaseAdmin
          .from('resident_medications')
          .insert(medications)

        if (medError) {
          console.error('Medications error:', medError)
        }
      }

      // Add allergens
      if (residentData.allergens && residentData.allergens.length > 0) {
        const allergens = residentData.allergens.map(allergen => ({
          resident_id: resident.id,
          allergen: allergen.allergen,
          severity_level: allergen.severity_level || 'Moderate',
          reaction: allergen.reaction || null
        }))

        const { error: allergenError } = await supabaseAdmin
          .from('resident_allergens')
          .insert(allergens)

        if (allergenError) {
          console.error('Allergens error:', allergenError)
        }
      }

      // Add focus groups - convert names to UUIDs
      if (
        residentData.focus_group_ids &&
        residentData.focus_group_ids.length > 0
      ) {
        // Get UUIDs for the focus group names
        const focusGroupUUIDs = await getFocusGroupIds(
          residentData.focus_group_ids
        )

        if (focusGroupUUIDs.length > 0) {
          const focusGroups = focusGroupUUIDs.map(groupId => ({
            resident_id: resident.id,
            focus_group_id: groupId,
            assigned_date: new Date().toISOString()
          }))

          const { error: focusError } = await supabaseAdmin
            .from('resident_focus_groups')
            .insert(focusGroups)

          if (focusError) {
            console.error('Focus groups error:', focusError)
          }
        }
      }

      // Calculate risk score
      try {
        await riskScoreService.calculateResidentRisk(resident.id)
      } catch (riskError) {
        console.error('Risk score calculation error:', riskError)
      }

      // Fetch complete resident data
      const { data: completeResident, error: fetchError } = await supabaseAdmin
        .from('residents')
        .select(
          `
                    *,
                    households(
                        id,
                        household_number,
                        puroks(id, purok_name)
                    ),
                    health_profiles(*)
                `
        )
        .eq('id', resident.id)
        .single()

      if (fetchError) {
        console.error('Fetch complete resident error:', fetchError)
        return res.status(201).json({
          message: 'Resident created successfully (partial data)',
          resident: resident,
          health_profile: healthProfile
        })
      }

      res.status(201).json({
        message: 'Resident created successfully',
        resident: completeResident
      })
    } catch (error) {
      console.error('Create resident error:', error)
      res.status(500).json({
        error: 'Failed to create resident',
        details: error.message,
        code: error.code
      })
    }
  }

  // Update resident
  async updateResident (req, res) {
    try {
      const { id } = req.params
      const residentData = req.body

      // Check if resident exists
      const { data: existingResident, error: checkError } = await supabaseAdmin
        .from('residents')
        .select('id')
        .eq('id', id)
        .single()

      if (checkError || !existingResident) {
        return res.status(404).json({ error: 'Resident not found' })
      }

      // Build update object with proper type conversion
      const updateData = {
        household_id: residentData.household_id || null,
        first_name: residentData.first_name,
        middle_name: residentData.middle_name || null,
        last_name: residentData.last_name,
        suffix: residentData.suffix || null,
        birth_date: residentData.birth_date,
        sex: residentData.sex,
        civil_status: residentData.civil_status,
        contact_number: residentData.contact_number || null
      }

      // Handle boolean fields with validation
      const booleanFields = [
        'is_household_head',
        'is_infant',
        'is_senior',
        'is_pwd',
        'is_pregnant'
      ]
      let hasInvalidBoolean = false
      let invalidField = ''

      booleanFields.forEach(field => {
        if (residentData[field] !== undefined) {
          const converted = toBoolean(residentData[field])
          if (converted === null) {
            hasInvalidBoolean = true
            invalidField = field
          } else {
            updateData[field] = converted
          }
        }
      })

      if (hasInvalidBoolean) {
        return res.status(400).json({
          error: `Invalid value for ${invalidField}. Must be true/false, yes/no, 1/0, or on/off.`
        })
      }

      // Handle is_sick
      if (residentData.is_sick !== undefined) {
        updateData.is_sick = residentData.is_sick || null
      }

      // Update resident basic info
      const { data: resident, error: residentError } = await supabaseAdmin
        .from('residents')
        .update(updateData)
        .eq('id', id)
        .select()
        .single()

      if (residentError) {
        console.error('Resident update error:', residentError)
        throw residentError
      }

      // Update health profile with upsert
      if (
        residentData.blood_type !== undefined ||
        residentData.has_chronic_condition !== undefined
      ) {
        try {
          const { data: existingProfile, error: checkProfileError } =
            await supabaseAdmin
              .from('health_profiles')
              .select('*')
              .eq('resident_id', id)
              .maybeSingle()

          if (existingProfile) {
            const { error: updateProfileError } = await supabaseAdmin
              .from('health_profiles')
              .update({
                blood_type: residentData.blood_type || null,
                has_chronic_condition:
                  residentData.has_chronic_condition || false,
                last_calculated_at: new Date().toISOString()
              })
              .eq('resident_id', id)

            if (updateProfileError) throw updateProfileError
          } else {
            const { error: createProfileError } = await supabaseAdmin
              .from('health_profiles')
              .insert({
                resident_id: id,
                blood_type: residentData.blood_type || null,
                has_chronic_condition:
                  residentData.has_chronic_condition || false,
                current_risk_score: 0,
                risk_level: 'Low',
                last_calculated_at: new Date().toISOString()
              })

            if (createProfileError) throw createProfileError
          }
        } catch (profileError) {
          console.error('Health profile update error:', profileError)
        }
      }

      // Update chronic conditions
      if (residentData.chronic_conditions !== undefined) {
        await supabaseAdmin
          .from('chronic_conditions')
          .delete()
          .eq('resident_id', id)

        if (
          residentData.chronic_conditions &&
          residentData.chronic_conditions.length > 0
        ) {
          const conditions = residentData.chronic_conditions.map(condition => ({
            resident_id: id,
            disease_name: condition.disease_name,
            date_diagnosed:
              condition.date_diagnosed ||
              new Date().toISOString().split('T')[0],
            severity: condition.severity || 'Moderate',
            status: condition.status || 'Active'
          }))

          const { error: conditionError } = await supabaseAdmin
            .from('chronic_conditions')
            .insert(conditions)

          if (conditionError) throw conditionError
        }
      }

      // Update medications
      if (residentData.medications !== undefined) {
        await supabaseAdmin
          .from('resident_medications')
          .delete()
          .eq('resident_id', id)

        if (residentData.medications && residentData.medications.length > 0) {
          const medications = residentData.medications.map(med => ({
            resident_id: id,
            medication_name: med.medication_name,
            dosage: med.dosage || null,
            dosage_frequency: med.dosage_frequency,
            start_date:
              med.start_date || new Date().toISOString().split('T')[0],
            end_date: med.end_date || null,
            status: med.status || 'Active'
          }))

          const { error: medError } = await supabaseAdmin
            .from('resident_medications')
            .insert(medications)

          if (medError) throw medError
        }
      }

      // Update allergens
      if (residentData.allergens !== undefined) {
        await supabaseAdmin
          .from('resident_allergens')
          .delete()
          .eq('resident_id', id)

        if (residentData.allergens && residentData.allergens.length > 0) {
          const allergens = residentData.allergens.map(allergen => ({
            resident_id: id,
            allergen: allergen.allergen,
            severity_level: allergen.severity_level || 'Moderate',
            reaction: allergen.reaction || null
          }))

          const { error: allergenError } = await supabaseAdmin
            .from('resident_allergens')
            .insert(allergens)

          if (allergenError) throw allergenError
        }
      }

      // Update focus groups - convert names to UUIDs
      if (residentData.focus_group_ids !== undefined) {
        // Delete existing focus group associations
        await supabaseAdmin
          .from('resident_focus_groups')
          .delete()
          .eq('resident_id', id)

        if (
          residentData.focus_group_ids &&
          residentData.focus_group_ids.length > 0
        ) {
          // Get UUIDs for the focus group names
          const focusGroupUUIDs = await getFocusGroupIds(
            residentData.focus_group_ids
          )

          if (focusGroupUUIDs.length > 0) {
            const focusGroups = focusGroupUUIDs.map(groupId => ({
              resident_id: id,
              focus_group_id: groupId,
              assigned_date: new Date().toISOString()
            }))

            const { error: focusError } = await supabaseAdmin
              .from('resident_focus_groups')
              .insert(focusGroups)

            if (focusError) throw focusError
          }
        }
      }

      // Recalculate risk score
      try {
        await riskScoreService.calculateResidentRisk(id)
      } catch (riskError) {
        console.error('Risk score calculation error:', riskError)
      }

      // Fetch updated resident
      const { data: updatedResident, error: fetchError } = await supabaseAdmin
        .from('residents')
        .select(
          `
                    *,
                    households(
                        id,
                        household_number,
                        puroks(id, purok_name)
                    ),
                    health_profiles(*)
                `
        )
        .eq('id', id)
        .single()

      if (fetchError) {
        console.error('Fetch updated resident error:', fetchError)
        return res.json({
          message: 'Resident updated successfully (partial data)',
          resident: resident
        })
      }

      res.json({
        message: 'Resident updated successfully',
        resident: updatedResident
      })
    } catch (error) {
      console.error('Update resident error:', error)
      res.status(500).json({
        error: 'Failed to update resident',
        details: error.message,
        code: error.code
      })
    }
  }

  // Delete resident (soft delete - set archived)
  async deleteResident (req, res) {
    try {
      const { id } = req.params

      // Check if resident exists
      const { data: resident, error: checkError } = await supabaseAdmin
        .from('residents')
        .select('id')
        .eq('id', id)
        .single()

      if (checkError || !resident) {
        return res.status(404).json({ error: 'Resident not found' })
      }

      // Soft delete - archive the resident
      const { error: updateError } = await supabaseAdmin
        .from('residents')
        .update({ is_archived: true })
        .eq('id', id)

      if (updateError) throw updateError

      res.json({ message: 'Resident archived successfully' })
    } catch (error) {
      console.error('Delete resident error:', error)
      res
        .status(500)
        .json({ error: 'Failed to delete resident', details: error.message })
    }
  }

  // Add vital signs (legacy method - use healthController instead)
  async addVitalSigns (req, res) {
    try {
      const { id } = req.params
      const vitalData = req.body
      const userId = req.user.id

      // Get BHW ID
      let bhwId = vitalData.recorded_by_bhw_id
      if (!bhwId) {
        const { data: bhw, error: bhwError } = await supabaseAdmin
          .from('bhws')
          .select('id')
          .eq('user_id', userId)
          .single()

        if (bhwError || !bhw) {
          return res.status(400).json({ error: 'BHW not found' })
        }
        bhwId = bhw.id
      }

      const { data: vital, error } = await supabaseAdmin
        .from('vital_signs')
        .insert({
          resident_id: id,
          recorded_by_bhw_id: bhwId,
          systolic_bp: vitalData.systolic_bp || null,
          diastolic_bp: vitalData.diastolic_bp || null,
          heart_rate: vitalData.heart_rate || null,
          temperature: vitalData.temperature || null,
          weight_kg: vitalData.weight_kg || null,
          height_cm: vitalData.height_cm || null,
          recorded_at: vitalData.recorded_at || new Date().toISOString()
        })
        .select()
        .single()

      if (error) throw error

      // Calculate risk score
      await riskScoreService.calculateResidentRisk(id)

      res.status(201).json({
        message: 'Vital signs recorded successfully',
        vital
      })
    } catch (error) {
      console.error('Add vital signs error:', error)
      res
        .status(500)
        .json({ error: 'Failed to record vital signs', details: error.message })
    }
  }

  // Get resident medical history
  async getMedicalHistory (req, res) {
    try {
      const { id } = req.params

      const { data, error } = await supabaseAdmin
        .from('medical_histories')
        .select('*')
        .eq('resident_id', id)
        .order('event_date', { ascending: false })

      if (error) throw error

      res.json(data || [])
    } catch (error) {
      console.error('Get medical history error:', error)
      res
        .status(500)
        .json({
          error: 'Failed to fetch medical history',
          details: error.message
        })
    }
  }

  // Add medical history entry
  async addMedicalHistory (req, res) {
    try {
      const { id } = req.params
      const historyData = req.body

      if (!historyData.event_type || !historyData.description) {
        return res
          .status(400)
          .json({ error: 'Event type and description are required' })
      }

      const { data, error } = await supabaseAdmin
        .from('medical_histories')
        .insert({
          resident_id: id,
          event_date:
            historyData.event_date || new Date().toISOString().split('T')[0],
          event_type: historyData.event_type,
          description: historyData.description,
          reference_table: historyData.reference_table || null,
          reference_id: historyData.reference_id || null,
          created_by: req.user.id
        })
        .select()
        .single()

      if (error) throw error

      res.status(201).json({
        message: 'Medical history added successfully',
        history: data
      })
    } catch (error) {
      console.error('Add medical history error:', error)
      res
        .status(500)
        .json({
          error: 'Failed to add medical history',
          details: error.message
        })
    }
  }
}

module.exports = new ResidentController()
