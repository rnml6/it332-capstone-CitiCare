import { supabase } from '../config/supabase.js';

export const getAllMedicines = async (req, res) => {
  try { const { category } = req.query; let query = supabase.from('medicine_master').select('*').order('medicine_name'); if (category) query = query.eq('category', category); const { data, error } = await query; if (error) throw error; res.json({ success: true, data }); }
  catch (error) { console.error('Error fetching medicines:', error); res.status(500).json({ success: false, message: 'Failed to fetch medicines' }); }
};

export const createMedicine = async (req, res) => {
  try { const { medicine_name, category, total_doses, target_group, description } = req.body; if (!medicine_name || !category) return res.status(400).json({ success: false, message: 'Medicine name and category are required' }); const { data, error } = await supabase.from('medicine_master').insert({ medicine_name, category: category || 'vaccine', total_doses: parseInt(total_doses) || 1, target_group: target_group || 'all', description: description || '' }).select().single(); if (error) throw error; res.status(201).json({ success: true, data }); }
  catch (error) { console.error('Error creating medicine:', error); res.status(500).json({ success: false, message: 'Failed to create medicine' }); }
};

export const updateMedicine = async (req, res) => {
  try { const { id } = req.params; const { medicine_name, category, total_doses, target_group, description, is_active } = req.body; const updateData = { updated_at: new Date() }; if (medicine_name !== undefined) updateData.medicine_name = medicine_name; if (category !== undefined) updateData.category = category; if (total_doses !== undefined) updateData.total_doses = parseInt(total_doses); if (target_group !== undefined) updateData.target_group = target_group; if (description !== undefined) updateData.description = description; if (is_active !== undefined) updateData.is_active = is_active; const { data, error } = await supabase.from('medicine_master').update(updateData).eq('id', id).select().single(); if (error) throw error; if (!data) return res.status(404).json({ success: false, message: 'Medicine not found' }); res.json({ success: true, data }); }
  catch (error) { console.error('Error updating medicine:', error); res.status(500).json({ success: false, message: 'Failed to update medicine' }); }
};

export const deleteMedicine = async (req, res) => {
  try { await supabase.from('medicine_master').delete().eq('id', req.params.id); res.json({ success: true, message: 'Medicine deleted successfully' }); }
  catch (error) { console.error('Error deleting medicine:', error); res.status(500).json({ success: false, message: 'Failed to delete medicine' }); }
};

export const getResidentMedicines = async (req, res) => {
  try {
    const { residentId } = req.params;
    const { data: resident, error: residentError } = await supabase.from('residents').select('focus_groups, age, gender').eq('resident_id', residentId).single();
    if (residentError || !resident) return res.status(404).json({ success: false, message: 'Resident not found' });
    const focusGroups = resident.focus_groups || []; const age = resident.age || 0; const gender = resident.gender;
    let applicableGroups = ['all'];
    if (focusGroups.includes('pregnant') || gender === 'Female') applicableGroups.push('pregnant');
    if (focusGroups.includes('infant') || age <= 5) applicableGroups.push('infant');
    if (focusGroups.includes('senior') || age >= 60) applicableGroups.push('senior');
    if (focusGroups.includes('pwd')) applicableGroups.push('pwd');
    if (focusGroups.includes('withCondition')) applicableGroups.push('withCondition');
    const { data: schedules, error: schedulesError } = await supabase.from('medicine_master').select('*').in('target_group', applicableGroups).eq('is_active', true).order('category').order('medicine_name');
    if (schedulesError) throw schedulesError;
    const { data: records, error: recordsError } = await supabase.from('resident_medicine_records').select('*').eq('resident_id', residentId).order('created_at', { ascending: false });
    if (recordsError) throw recordsError;
    const medicineStatus = (schedules || []).map(schedule => {
      const takenDoses = (records || []).filter(r => r.medicine_master_id === schedule.id || r.medicine_name === schedule.medicine_name).sort((a, b) => a.dose_number - b.dose_number);
      const completedDoses = takenDoses.length; const dosesLeft = Math.max(0, schedule.total_doses - completedDoses);
      let status = 'not_started'; if (completedDoses >= schedule.total_doses) status = 'completed'; else if (completedDoses > 0) status = 'in_progress';
      return { id: schedule.id, medicine_name: schedule.medicine_name, category: schedule.category, total_doses: schedule.total_doses, target_group: schedule.target_group, description: schedule.description, completedDoses, dosesLeft, status, takenDoses: takenDoses.map(d => ({ id: d.id, doseNumber: d.dose_number, dateAdministered: d.date_administered, createdAt: d.created_at, batchNumber: d.batch_number, administrationSite: d.administration_site, administeredBy: d.administered_by, remarks: d.remarks })) };
    });
    res.json({ success: true, data: { vaccines: medicineStatus.filter(m => m.category === 'vaccine'), deworming: medicineStatus.filter(m => m.category === 'deworming') } });
  } catch (error) { console.error('Error fetching resident medicines:', error); res.status(500).json({ success: false, message: 'Failed to fetch medicines' }); }
};

export const recordResidentMedicine = async (req, res) => {
  try {
    const { residentId } = req.params; const { medicine_master_id, medicine_name, category, dose_number, total_doses, date_administered, batch_number, administration_site, administered_by, remarks } = req.body;
    if (!medicine_master_id || !date_administered) return res.status(400).json({ success: false, message: 'Medicine and date are required' });
    const { data: masterMed } = await supabase.from('medicine_master').select('medicine_name, category, total_doses').eq('id', medicine_master_id).single();
    const { data, error } = await supabase.from('resident_medicine_records').insert({ resident_id: residentId, medicine_master_id, medicine_name: masterMed?.medicine_name || medicine_name, category: masterMed?.category || category || 'vaccine', dose_number: parseInt(dose_number) || 1, total_doses: parseInt(total_doses || masterMed?.total_doses || 1), date_administered, batch_number: batch_number || null, administration_site: administration_site || null, administered_by: administered_by || null, remarks: remarks || null }).select().single();
    if (error) throw error;
    res.status(201).json({ success: true, data });
  } catch (error) { console.error('Error recording medicine:', error); res.status(500).json({ success: false, message: 'Failed to record medicine' }); }
};

export const deleteResidentMedicine = async (req, res) => {
  try { await supabase.from('resident_medicine_records').delete().eq('id', req.params.recordId); res.json({ success: true, message: 'Medicine record deleted' }); }
  catch (error) { console.error('Error deleting medicine record:', error); res.status(500).json({ success: false, message: 'Failed to delete record' }); }
};