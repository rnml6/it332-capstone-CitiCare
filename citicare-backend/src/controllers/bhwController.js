// controllers/bhwController.js
import { supabase } from '../config/supabase.js'
import bcrypt from 'bcryptjs'

export const getAllBHWs = async (req, res) => {
  try {
    const { workerType } = req.query
    let query = supabase.from('bhws').select(`
      bhw_id, name, position, contact_number, email, status,
      assigned_purok_id, username, has_account, worker_type,
      puroks:assigned_purok_id (purok_id, name)
    `)
    if (workerType) query = query.eq('worker_type', workerType)
    const { data, error } = await query.order('name')
    if (error) throw error

    const bhws = data.map(bhw => ({
      id: bhw.bhw_id,
      name: bhw.name,
      position: bhw.position,
      contactNumber: bhw.contact_number,
      email: bhw.email,
      status: bhw.status,
      assignedPurok: bhw.puroks?.name || null,
      assignedPurokId: bhw.assigned_purok_id,
      username: bhw.username,
      hasAccount: bhw.has_account,
      workerType: bhw.worker_type
    }))
    res.json({ success: true, data: bhws })
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ success: false, message: 'Failed to fetch BHWs' })
  }
}

export const getBHWById = async (req, res) => {
  try {
    const { id } = req.params
    const { data, error } = await supabase
      .from('bhws')
      .select(
        `
      bhw_id, name, position, contact_number, email, status,
      assigned_purok_id, username, has_account, user_id, worker_type,
      puroks:assigned_purok_id (purok_id, name)
    `
      )
      .eq('bhw_id', id)
      .single()

    if (error) throw error
    if (!data)
      return res.status(404).json({ success: false, message: 'BHW not found' })

    // Get ALL schedules (lead + assigned) for stats
    const { data: leadSchedules } = await supabase
      .from('schedules')
      .select('status')
      .eq('bhw_id', id)
    const { data: assignedInBhws } = await supabase
      .from('schedule_bhws')
      .select('schedule_id')
      .eq('bhw_id', id)

    let additionalStatuses = []
    if (assignedInBhws?.length > 0) {
      const ids = assignedInBhws.map(s => s.schedule_id)
      const { data: extraSchedules } = await supabase
        .from('schedules')
        .select('status')
        .in('schedule_id', ids)
      additionalStatuses = extraSchedules || []
    }

    const allStatuses = [...(leadSchedules || []), ...additionalStatuses]
    const uniqueStatuses = []
    const seen = new Set()
    allStatuses.forEach(s => {
      const key = JSON.stringify(s)
      if (!seen.has(key)) {
        seen.add(key)
        uniqueStatuses.push(s)
      }
    })

    const totalSchedules = uniqueStatuses.length
    const completedSchedules = uniqueStatuses.filter(
      s => s.status === 'Completed'
    ).length
    const missedSchedules = uniqueStatuses.filter(
      s => s.status === 'Missed'
    ).length
    const upcomingSchedules = uniqueStatuses.filter(
      s => s.status === 'Scheduled'
    ).length

    const bhw = {
      id: data.bhw_id,
      name: data.name,
      position: data.position,
      contactNumber: data.contact_number,
      email: data.email,
      status: data.status,
      assignedPurok: data.puroks?.name || null,
      assignedPurokId: data.assigned_purok_id,
      username: data.username,
      hasAccount: data.has_account,
      workerType: data.worker_type,
      stats: {
        totalSchedules,
        completedSchedules,
        missedSchedules,
        upcomingSchedules,
        completionRate:
          totalSchedules > 0
            ? Math.round((completedSchedules / totalSchedules) * 100)
            : 0
      }
    }
    res.json({ success: true, data: bhw })
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ success: false, message: 'Failed to fetch BHW' })
  }
}

export const createBHW = async (req, res) => {
  try {
    const {
      name,
      position,
      contactNumber,
      email,
      status,
      assignedPurokId,
      username,
      password,
      accountRole,
      workerType
    } = req.body
    if (!name)
      return res
        .status(400)
        .json({ success: false, message: 'Name is required' })

    const type = workerType || 'BHW'
    const isBHW = type === 'BHW'
    let userId = null

    if (isBHW && username && password) {
      const { data: existingUser } = await supabase
        .from('users')
        .select('user_id')
        .eq('email', username)
        .maybeSingle()
      if (existingUser)
        return res
          .status(400)
          .json({ success: false, message: 'This username is already taken.' })

      const passwordHash = await bcrypt.hash(password, 10)
      const allowedRoles = ['BHW Worker', 'BHW Admin']
      const role = allowedRoles.includes(accountRole)
        ? accountRole
        : 'BHW Worker'

      const { data: userData, error: userError } = await supabase
        .from('users')
        .insert({
          email: username,
          password_hash: passwordHash,
          name: name,
          role_display: role
        })
        .select()
        .single()

      if (userError)
        return res
          .status(400)
          .json({
            success: false,
            message: 'Failed to create user: ' + userError.message
          })
      userId = userData.user_id
    }

    const insertData = {
      name,
      position: position || type,
      contact_number: contactNumber || null,
      email: email || null,
      status: status || 'Active',
      assigned_purok_id: assignedPurokId || null,
      worker_type: type,
      username: isBHW ? username || null : null,
      has_account: isBHW && !!(username && password)
    }
    if (userId) insertData.user_id = userId

    const { data, error } = await supabase
      .from('bhws')
      .insert(insertData)
      .select()
      .single()
    if (error) {
      if (userId) await supabase.from('users').delete().eq('user_id', userId)
      throw error
    }

    res.status(201).json({
      success: true,
      data: {
        id: data.bhw_id,
        name: data.name,
        position: data.position,
        contactNumber: data.contact_number,
        email: data.email,
        status: data.status,
        assignedPurokId: data.assigned_purok_id,
        workerType: data.worker_type,
        username: data.username,
        hasAccount: data.has_account
      },
      message:
        isBHW && username && password
          ? 'BHW created with login account'
          : 'Healthcare professional added successfully'
    })
  } catch (error) {
    console.error('Error:', error)
    res
      .status(500)
      .json({ success: false, message: 'Failed to create: ' + error.message })
  }
}

export const updateBHW = async (req, res) => {
  try {
    const { id } = req.params
    const {
      name,
      position,
      contactNumber,
      email,
      status,
      assignedPurokId,
      username,
      password,
      accountRole,
      workerType
    } = req.body

    const updateData = {}
    if (name !== undefined) updateData.name = name
    if (position !== undefined) updateData.position = position
    if (contactNumber !== undefined) updateData.contact_number = contactNumber
    if (email !== undefined) updateData.email = email
    if (status !== undefined) updateData.status = status
    if (assignedPurokId !== undefined)
      updateData.assigned_purok_id = assignedPurokId
    if (workerType !== undefined) updateData.worker_type = workerType

    const { data: currentData } = await supabase
      .from('bhws')
      .select('user_id, username, has_account, worker_type, email, name')
      .eq('bhw_id', id)
      .single()
    const isBHW = (workerType || currentData.worker_type) === 'BHW'

    if (isBHW) {
      if (username !== undefined) updateData.username = username
      if (currentData.user_id) {
        const userUpdateData = {}
        if (username !== undefined) userUpdateData.email = username
        if (name !== undefined) userUpdateData.name = name
        if (accountRole !== undefined) {
          userUpdateData.role_display = ['BHW Worker', 'BHW Admin'].includes(
            accountRole
          )
            ? accountRole
            : 'BHW Worker'
        }
        if (password)
          userUpdateData.password_hash = await bcrypt.hash(password, 10)
        if (Object.keys(userUpdateData).length > 0) {
          await supabase
            .from('users')
            .update(userUpdateData)
            .eq('user_id', currentData.user_id)
        }
        updateData.has_account = true
      } else if (username && password) {
        const { data: existingUser } = await supabase
          .from('users')
          .select('user_id')
          .eq('email', username)
          .maybeSingle()
        if (existingUser)
          return res
            .status(400)
            .json({ success: false, message: 'Username already taken' })

        const passwordHash = await bcrypt.hash(password, 10)
        const role = ['BHW Worker', 'BHW Admin'].includes(accountRole)
          ? accountRole
          : 'BHW Worker'
        const { data: userData } = await supabase
          .from('users')
          .insert({
            email: username,
            password_hash: passwordHash,
            name: name || currentData.name,
            role_display: role
          })
          .select()
          .single()
        updateData.user_id = userData.user_id
        updateData.has_account = true
      }
    } else {
      if (currentData.user_id) {
        await supabase.from('users').delete().eq('user_id', currentData.user_id)
        updateData.user_id = null
        updateData.username = null
        updateData.has_account = false
      }
    }

    if (Object.keys(updateData).length === 0)
      return res
        .status(400)
        .json({ success: false, message: 'No fields to update' })

    const { data, error } = await supabase
      .from('bhws')
      .update(updateData)
      .eq('bhw_id', id)
      .select()
      .single()
    if (error) throw error

    res.json({
      success: true,
      data: {
        id: data.bhw_id,
        name: data.name,
        position: data.position,
        contactNumber: data.contact_number,
        email: data.email,
        status: data.status,
        assignedPurokId: data.assigned_purok_id,
        workerType: data.worker_type,
        username: data.username,
        hasAccount: data.has_account
      },
      message: 'Updated successfully'
    })
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ success: false, message: 'Failed to update' })
  }
}

export const deleteBHW = async (req, res) => {
  try {
    const { id } = req.params
    const { data: bhw } = await supabase
      .from('bhws')
      .select('user_id')
      .eq('bhw_id', id)
      .single()
    if (bhw?.user_id)
      await supabase.from('users').delete().eq('user_id', bhw.user_id)
    const { error } = await supabase.from('bhws').delete().eq('bhw_id', id)
    if (error) {
      if (error.code === '23503')
        return res
          .status(400)
          .json({
            success: false,
            message: 'Cannot delete with existing schedules.'
          })
      throw error
    }
    res.json({ success: true, message: 'Deleted successfully' })
  } catch (error) {
    console.error('Error:', error)
    res.status(500).json({ success: false, message: 'Failed to delete' })
  }
}

export const getBHWSchedules = async (req, res) => {
  try {
    const { bhwId } = req.params
    console.log('Fetching schedules for BHW ID:', bhwId)

    // Get schedules where this person is the LEAD BHW
    const { data: leadSchedules, error: leadError } = await supabase
      .from('schedules')
      .select(
        `
        schedule_id, scope, date, time, type, status, 
        program_name, purpose,
        resident_id, residents:resident_id (name, puroks:purok_id (name)),
        bhw_id, bhws:bhw_id (name)
      `
      )
      .eq('bhw_id', bhwId)
      .order('date', { ascending: true })

    if (leadError) throw leadError
    console.log('Lead schedules found:', leadSchedules?.length || 0)

    // Get schedules where this person is ASSIGNED in schedule_bhws
    const { data: assignedSchedules, error: assignedError } = await supabase
      .from('schedule_bhws')
      .select(
        `
        schedule_id,
        schedules:schedule_id (
          schedule_id, scope, date, time, type, status,
          program_name, purpose,
          resident_id, residents:resident_id (name, puroks:purok_id (name)),
          bhw_id, bhws:bhw_id (name)
        )
      `
      )
      .eq('bhw_id', bhwId)

    if (assignedError) throw assignedError
    console.log('Assigned schedules found:', assignedSchedules?.length || 0)

    // Combine and deduplicate
    const allScheduleIds = new Set()
    const allSchedules = []

    ;(leadSchedules || []).forEach(schedule => {
      if (!allScheduleIds.has(schedule.schedule_id)) {
        allScheduleIds.add(schedule.schedule_id)
        allSchedules.push(schedule)
      }
    })

    ;(assignedSchedules || []).forEach(item => {
      if (item.schedules && !allScheduleIds.has(item.schedules.schedule_id)) {
        allScheduleIds.add(item.schedules.schedule_id)
        allSchedules.push(item.schedules)
      }
    })

    console.log('Total unique schedules:', allSchedules.length)

    const schedules = allSchedules.map(schedule => ({
      id: schedule.schedule_id,
      scope: schedule.scope,
      date: schedule.date,
      time: schedule.time,
      type: schedule.type,
      status: schedule.status,
      programName: schedule.program_name || null,
      purpose: schedule.purpose || null,
      residentName:
        schedule.residents?.name ||
        (schedule.scope !== 'individual' ? 'Multiple Residents' : 'Unknown'),
      purok: schedule.residents?.puroks?.name || null,
      residentId: schedule.resident_id
    }))

    schedules.sort((a, b) => new Date(a.date) - new Date(b.date))

    res.json({ success: true, data: schedules })
  } catch (error) {
    console.error('Error fetching BHW schedules:', error)
    res
      .status(500)
      .json({ success: false, message: 'Failed to fetch schedules' })
  }
}
