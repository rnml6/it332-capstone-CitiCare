// controllers/scheduleController.js
import { supabase } from '../config/supabase.js';

export const getAllSchedules = async (req, res) => {
  try {
    const { date, status, priority, scope, type, search } = req.query;
    let query = supabase.from('schedules').select(`
      *,
      residents:resident_id (name, age, gender, contact_number, puroks:purok_id (name)),
      bhws:bhw_id (name, contact_number, position),
      puroks:purok_id (name),
      schedule_bhws (id, bhw_id, is_lead, role, bhws:bhw_id (name, position, contact_number)),
      schedule_participants (count)
    `).order('date', { ascending: true }).order('time', { ascending: true });

    if (date) query = query.eq('date', date);
    if (status) query = query.eq('status', status);
    if (priority) query = query.eq('priority', priority);
    if (scope) query = query.eq('scope', scope);
    if (type) query = query.eq('type', type);
    if (search) query = query.or(`program_name.ilike.%${search}%,purpose.ilike.%${search}%,location_details.ilike.%${search}%`);

    const { data, error } = await query;
    if (error) throw error;

    const schedules = data.map(schedule => {
      const assignedBhws = [];
      const healthcareProfessionals = [];
      
      if (schedule.bhws) {
        assignedBhws.push({
          id: schedule.bhw_id, bhwId: schedule.bhw_id,
          name: schedule.bhws.name, position: schedule.bhws.position,
          contactNumber: schedule.bhws.contact_number, isLead: true, role: 'Lead BHW'
        });
      }

      (schedule.schedule_bhws || []).forEach(sb => {
        if (sb.role === 'HCP' || sb.role === 'Healthcare Professional') {
          healthcareProfessionals.push({
            id: sb.bhw_id, hcpId: sb.bhw_id,
            name: sb.bhws?.name || '', position: sb.bhws?.position || '',
            contact: sb.bhws?.contact_number || '', role: sb.role
          });
        } else if (sb.bhw_id !== schedule.bhw_id) {
          assignedBhws.push({
            id: sb.bhw_id, bhwId: sb.bhw_id,
            name: sb.bhws?.name || '', position: sb.bhws?.position || '',
            contactNumber: sb.bhws?.contact_number || '', isLead: sb.is_lead || false, role: sb.role || 'BHW'
          });
        }
      });

      return {
        id: schedule.schedule_id, scope: schedule.scope, date: schedule.date, time: schedule.time,
        type: schedule.type, status: schedule.status, notes: schedule.notes, priority: schedule.priority,
        serviceCategory: schedule.service_category, duration: schedule.duration, purpose: schedule.purpose,
        requirements: schedule.requirements, followUpDate: schedule.follow_up_date,
        isEmergency: schedule.is_emergency, locationDetails: schedule.location_details,
        contactPerson: schedule.contact_person, contactNumber: schedule.contact_number,
        barangayId: schedule.barangay_id, familyNumber: schedule.family_number,
        reminderSent: schedule.reminder_sent, completionNotes: schedule.completion_notes,
        completedAt: schedule.completed_at, residentId: schedule.resident_id,
        residentName: schedule.residents?.name || null, residentAge: schedule.residents?.age,
        residentGender: schedule.residents?.gender, residentContact: schedule.residents?.contact_number,
        purokId: schedule.purok_id, purokName: schedule.puroks?.name || null,
        isBarangayWide: schedule.is_barangay_wide, programName: schedule.program_name,
        programDescription: schedule.program_description, targetGroup: schedule.target_group,
        targetCount: schedule.target_count, venue: schedule.venue,
        isRecurring: schedule.is_recurring, recurrencePattern: schedule.recurrence_pattern,
        recurrenceEndDate: schedule.recurrence_end_date, coordinatorName: schedule.coordinator_name,
        coordinatorContact: schedule.coordinator_contact, partnerOrganization: schedule.partner_organization,
        budget: schedule.budget, materialsNeeded: schedule.materials_needed,
        maxParticipants: schedule.max_participants, leadBhwId: schedule.bhw_id,
        leadBhwName: schedule.bhws?.name || 'Unassigned', leadBhwPosition: schedule.bhws?.position,
        leadBhwContact: schedule.bhws?.contact_number, assignedBhws, healthcareProfessionals,
        participantCount: schedule.schedule_participants?.[0]?.count || 0
      };
    });

    res.json({ success: true, data: schedules });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch schedules' });
  }
};

export const getScheduleById = async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase.from('schedules').select(`
      *,
      residents:resident_id (name, age, gender, contact_number, date_of_birth, civil_status, puroks:purok_id (name)),
      bhws:bhw_id (name, contact_number, position),
      puroks:purok_id (name),
      schedule_bhws (id, bhw_id, is_lead, role, bhws:bhw_id (name, position, contact_number)),
      schedule_participants (id, resident_id, status, attendance_status, notes, registered_at, residents:resident_id (name, age, gender, contact_number, puroks:purok_id (name)))
    `).eq('schedule_id', id).single();

    if (error) throw error;
    if (!data) return res.status(404).json({ success: false, message: 'Schedule not found' });

    const assignedBhws = [];
    const healthcareProfessionals = [];
    
    if (data.bhws) {
      assignedBhws.push({
        id: data.bhw_id, bhwId: data.bhw_id,
        name: data.bhws.name, position: data.bhws.position,
        contactNumber: data.bhws.contact_number, isLead: true, role: 'Lead BHW'
      });
    }

    (data.schedule_bhws || []).forEach(sb => {
      if (sb.role === 'HCP' || sb.role === 'Healthcare Professional') {
        healthcareProfessionals.push({
          id: sb.bhw_id, hcpId: sb.bhw_id,
          name: sb.bhws?.name || '', position: sb.bhws?.position || '',
          contact: sb.bhws?.contact_number || '', role: sb.role
        });
      } else if (sb.bhw_id !== data.bhw_id) {
        assignedBhws.push({
          id: sb.bhw_id, bhwId: sb.bhw_id,
          name: sb.bhws?.name || '', position: sb.bhws?.position || '',
          contactNumber: sb.bhws?.contact_number || '', isLead: sb.is_lead || false, role: sb.role || 'BHW'
        });
      }
    });

    if (assignedBhws.length === 0 && data.bhw_id) {
      assignedBhws.push({ id: data.bhw_id, bhwId: data.bhw_id, name: data.bhws?.name || '', contactNumber: data.bhws?.contact_number || '', isLead: true });
    }

    const schedule = {
      id: data.schedule_id, scope: data.scope, date: data.date, time: data.time,
      type: data.type, status: data.status, notes: data.notes, priority: data.priority,
      duration: data.duration, purpose: data.purpose, isEmergency: data.is_emergency,
      locationDetails: data.location_details, contactPerson: data.contact_person,
      contactNumber: data.contact_number, residentId: data.resident_id,
      residentName: data.residents?.name || null,
      resident: data.residents ? { id: data.resident_id, name: data.residents.name, age: data.residents.age, gender: data.residents.gender, contactNumber: data.residents.contact_number, purok: data.residents.puroks?.name } : null,
      purokId: data.purok_id, purokName: data.puroks?.name || null,
      isBarangayWide: data.is_barangay_wide, programName: data.program_name,
      programDescription: data.program_description, targetGroup: data.target_group,
      targetCount: data.target_count, venue: data.venue,
      coordinatorName: data.coordinator_name, coordinatorContact: data.coordinator_contact,
      partnerOrganization: data.partner_organization, materialsNeeded: data.materials_needed,
      maxParticipants: data.max_participants,
      leadBhw: data.bhws ? { id: data.bhw_id, name: data.bhws.name, position: data.bhws.position, contactNumber: data.bhws.contact_number } : null,
      leadBhwId: data.bhw_id, leadBhwName: data.bhws?.name || null,
      assignedBhws, healthcareProfessionals,
      participants: data.schedule_participants?.map(sp => ({ id: sp.resident_id, name: sp.residents?.name, status: sp.status, attendanceStatus: sp.attendance_status })) || [],
      participantCount: data.schedule_participants?.length || 0
    };

    res.json({ success: true, data: schedule });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch schedule' });
  }
};

export const createSchedule = async (req, res) => {
  try {
    const { scope, date, time, type, status, priority, duration, purpose, notes, isEmergency, locationDetails, contactPerson, contactNumber, residentId, purokId, isBarangayWide, programName, programDescription, targetGroup, targetCount, venue, coordinatorName, coordinatorContact, partnerOrganization, materialsNeeded, maxParticipants, assignedBhws, healthcareProfessionals } = req.body;

    if (!scope || !date || !time || !type) {
      return res.status(400).json({ success: false, message: 'Scope, date, time, and type are required' });
    }

    const bhwId = assignedBhws?.[0]?.bhwId || assignedBhws?.[0]?.id;
    if (!bhwId) {
      return res.status(400).json({ success: false, message: 'At least one BHW must be assigned' });
    }

    const scheduleData = {
      scope, resident_id: scope === 'individual' ? residentId : null,
      purok_id: scope === 'purok' ? purokId : null, is_barangay_wide: scope === 'barangay',
      bhw_id: bhwId, date, time, type, status: status || 'Scheduled', notes,
      priority: priority || 'Normal', duration: duration || 30, purpose,
      is_emergency: isEmergency || false, location_details: locationDetails,
      contact_person: contactPerson, contact_number: contactNumber,
      program_name: programName, program_description: programDescription,
      target_group: targetGroup, target_count: targetCount, venue,
      coordinator_name: coordinatorName, coordinator_contact: coordinatorContact,
      partner_organization: partnerOrganization, materials_needed: materialsNeeded,
      max_participants: maxParticipants,
    };

    const { data, error } = await supabase.from('schedules').insert(scheduleData).select().single();
    if (error) throw error;

    if (assignedBhws && assignedBhws.length > 1) {
      const additionalBhws = assignedBhws.slice(1).filter(b => (b.bhwId || b.id) && (b.bhwId || b.id) !== bhwId);
      if (additionalBhws.length > 0) {
        await supabase.from('schedule_bhws').insert(
          additionalBhws.map(bhw => ({ schedule_id: data.schedule_id, bhw_id: bhw.bhwId || bhw.id, is_lead: false, role: 'BHW' }))
        );
      }
    }

    if (healthcareProfessionals && healthcareProfessionals.length > 0) {
      const validHcps = healthcareProfessionals.filter(h => h.hcpId || h.id);
      if (validHcps.length > 0) {
        await supabase.from('schedule_bhws').insert(
          validHcps.map(hcp => ({ schedule_id: data.schedule_id, bhw_id: hcp.hcpId || hcp.id, is_lead: false, role: 'HCP' }))
        );
      }
    }

    res.status(201).json({ success: true, data, message: 'Schedule created successfully' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, message: 'Failed to create schedule' });
  }
};

export const updateSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    const { scope, date, time, type, status, priority, duration, purpose, notes, isEmergency, locationDetails, contactPerson, contactNumber, residentId, purokId, isBarangayWide, programName, programDescription, targetGroup, targetCount, venue, coordinatorName, coordinatorContact, partnerOrganization, materialsNeeded, maxParticipants, assignedBhws, healthcareProfessionals } = req.body;

    let bhwId = assignedBhws?.[0]?.bhwId || assignedBhws?.[0]?.id;
    if (!bhwId) {
      const { data: existing } = await supabase.from('schedules').select('bhw_id').eq('schedule_id', id).single();
      bhwId = existing?.bhw_id;
    }

    const updateData = { bhw_id: bhwId };
    if (scope !== undefined) updateData.scope = scope;
    if (date !== undefined) updateData.date = date;
    if (time !== undefined) updateData.time = time;
    if (type !== undefined) updateData.type = type;
    if (status !== undefined) updateData.status = status;
    if (priority !== undefined) updateData.priority = priority;
    if (duration !== undefined) updateData.duration = duration;
    if (purpose !== undefined) updateData.purpose = purpose;
    if (notes !== undefined) updateData.notes = notes;
    if (isEmergency !== undefined) updateData.is_emergency = isEmergency;
    if (locationDetails !== undefined) updateData.location_details = locationDetails;
    if (contactPerson !== undefined) updateData.contact_person = contactPerson;
    if (contactNumber !== undefined) updateData.contact_number = contactNumber;
    if (residentId !== undefined) updateData.resident_id = residentId || null;
    if (purokId !== undefined) updateData.purok_id = purokId || null;
    if (isBarangayWide !== undefined) updateData.is_barangay_wide = isBarangayWide;
    if (programName !== undefined) updateData.program_name = programName;
    if (programDescription !== undefined) updateData.program_description = programDescription;
    if (targetGroup !== undefined) updateData.target_group = targetGroup;
    if (targetCount !== undefined) updateData.target_count = targetCount ? parseInt(targetCount) : null;
    if (venue !== undefined) updateData.venue = venue;
    if (coordinatorName !== undefined) updateData.coordinator_name = coordinatorName;
    if (coordinatorContact !== undefined) updateData.coordinator_contact = coordinatorContact;
    if (partnerOrganization !== undefined) updateData.partner_organization = partnerOrganization;
    if (materialsNeeded !== undefined) updateData.materials_needed = materialsNeeded;
    if (maxParticipants !== undefined) updateData.max_participants = maxParticipants ? parseInt(maxParticipants) : null;

    const { data, error } = await supabase.from('schedules').update(updateData).eq('schedule_id', id).select().single();
    if (error) throw error;
    if (!data) return res.status(404).json({ success: false, message: 'Schedule not found' });

    await supabase.from('schedule_bhws').delete().eq('schedule_id', id);

    if (assignedBhws && assignedBhws.length > 1) {
      const additionalBhws = assignedBhws.slice(1).filter(b => (b.bhwId || b.id) && (b.bhwId || b.id) !== bhwId);
      if (additionalBhws.length > 0) {
        await supabase.from('schedule_bhws').insert(
          additionalBhws.map(bhw => ({ schedule_id: parseInt(id), bhw_id: bhw.bhwId || bhw.id, is_lead: false, role: 'BHW' }))
        );
      }
    }

    if (healthcareProfessionals && healthcareProfessionals.length > 0) {
      const validHcps = healthcareProfessionals.filter(h => h.hcpId || h.id);
      if (validHcps.length > 0) {
        await supabase.from('schedule_bhws').insert(
          validHcps.map(hcp => ({ schedule_id: parseInt(id), bhw_id: hcp.hcpId || hcp.id, is_lead: false, role: 'HCP' }))
        );
      }
    }

    res.json({ success: true, data, message: 'Schedule updated successfully' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, message: 'Failed to update schedule' });
  }
};

export const deleteSchedule = async (req, res) => {
  try {
    const { id } = req.params;
    await supabase.from('schedule_bhws').delete().eq('schedule_id', id);
    await supabase.from('schedule_participants').delete().eq('schedule_id', id);
    const { error } = await supabase.from('schedules').delete().eq('schedule_id', id);
    if (error) throw error;
    res.json({ success: true, message: 'Schedule deleted' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete schedule' });
  }
};

export const getSchedulesByBHW = async (req, res) => {
  try {
    const { bhwId } = req.params;
    
    const { data: leadSchedules, error: leadError } = await supabase
      .from('schedules')
      .select(`schedule_id, scope, date, time, type, status, priority, duration, purpose, is_emergency, location_details, program_name, venue, resident_id, residents:resident_id (name, puroks:purok_id (name)), purok_id, puroks:purok_id (name), is_barangay_wide, bhw_id, bhws:bhw_id (name, position, contact_number), schedule_bhws (bhw_id, is_lead, role, bhws:bhw_id (name, position, contact_number)), schedule_participants (count)`)
      .eq('bhw_id', bhwId).order('date', { ascending: true });
    if (leadError) throw leadError;

    const { data: assignedSchedules, error: assignedError } = await supabase
      .from('schedule_bhws')
      .select(`schedule_id, schedules:schedule_id (schedule_id, scope, date, time, type, status, priority, duration, purpose, is_emergency, location_details, program_name, venue, resident_id, residents:resident_id (name, puroks:purok_id (name)), purok_id, puroks:purok_id (name), is_barangay_wide, bhw_id, bhws:bhw_id (name, position, contact_number), schedule_bhws (bhw_id, is_lead, role, bhws:bhw_id (name, position, contact_number)), schedule_participants (count))`)
      .eq('bhw_id', bhwId);
    if (assignedError) throw assignedError;

    const allScheduleIds = new Set();
    const allSchedules = [];

    (leadSchedules || []).forEach(s => { if (!allScheduleIds.has(s.schedule_id)) { allScheduleIds.add(s.schedule_id); allSchedules.push(s); } });
    (assignedSchedules || []).forEach(item => { if (item.schedules && !allScheduleIds.has(item.schedules.schedule_id)) { allScheduleIds.add(item.schedules.schedule_id); allSchedules.push(item.schedules); } });

    const schedules = allSchedules.map(schedule => ({
      id: schedule.schedule_id, scope: schedule.scope, date: schedule.date, time: schedule.time,
      type: schedule.type, status: schedule.status, priority: schedule.priority,
      isEmergency: schedule.is_emergency, locationDetails: schedule.location_details,
      programName: schedule.program_name, venue: schedule.venue,
      residentId: schedule.resident_id,
      residentName: schedule.residents?.name || (schedule.scope !== 'individual' ? 'Multiple Residents' : 'Unknown'),
      purokId: schedule.purok_id, purokName: schedule.puroks?.name || null,
      isBarangayWide: schedule.is_barangay_wide,
      participantCount: schedule.schedule_participants?.[0]?.count || 0,
    }));

    schedules.sort((a, b) => new Date(a.date) - new Date(b.date));
    res.json({ success: true, data: schedules });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch schedules' });
  }
};

export const addParticipant = async (req, res) => {
  try {
    const { scheduleId } = req.params;
    const { residentId, notes } = req.body;
    const { data, error } = await supabase.from('schedule_participants').insert({
      schedule_id: scheduleId, resident_id: residentId, status: 'Registered', attendance_status: 'Pending', notes: notes || null
    }).select('*, residents:resident_id (name, age, gender, puroks:purok_id (name))').single();
    if (error) {
      if (error.code === '23505') return res.status(400).json({ success: false, message: 'Resident already registered' });
      throw error;
    }
    res.status(201).json({ success: true, data });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, message: 'Failed to add participant' });
  }
};

export const removeParticipant = async (req, res) => {
  try {
    const { scheduleId, residentId } = req.params;
    await supabase.from('schedule_participants').delete().eq('schedule_id', scheduleId).eq('resident_id', residentId);
    res.json({ success: true, message: 'Participant removed' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, message: 'Failed to remove participant' });
  }
};

export const updateParticipant = async (req, res) => {
  try {
    const { scheduleId, residentId } = req.params;
    const { status, attendanceStatus, notes } = req.body;
    const updateData = {};
    if (status) updateData.status = status;
    if (attendanceStatus) updateData.attendance_status = attendanceStatus;
    if (notes !== undefined) updateData.notes = notes;
    await supabase.from('schedule_participants').update(updateData).eq('schedule_id', scheduleId).eq('resident_id', residentId);
    res.json({ success: true, message: 'Participant updated' });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, message: 'Failed to update participant' });
  }
};

export const getParticipants = async (req, res) => {
  try {
    const { scheduleId } = req.params;
    const { data, error } = await supabase.from('schedule_participants').select('*, residents:resident_id (name, age, gender, contact_number, puroks:purok_id (name))').eq('schedule_id', scheduleId);
    if (error) throw error;
    res.json({ success: true, data });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch participants' });
  }
};

export const getProgramStats = async (req, res) => {
  try {
    const { scheduleId } = req.params;
    const { data: participants, error } = await supabase.from('schedule_participants').select('status, attendance_status').eq('schedule_id', scheduleId);
    if (error) throw error;
    const stats = {
      totalRegistered: participants?.length || 0,
      attended: participants?.filter(p => p.attendance_status === 'Present').length || 0,
      absent: participants?.filter(p => p.attendance_status === 'Absent').length || 0,
      pending: participants?.filter(p => p.attendance_status === 'Pending').length || 0,
      completed: participants?.filter(p => p.status === 'Completed').length || 0,
      attendanceRate: participants?.length > 0 ? Math.round((participants.filter(p => p.attendance_status === 'Present').length / participants.length) * 100) : 0
    };
    res.json({ success: true, data: stats });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch stats' });
  }
};