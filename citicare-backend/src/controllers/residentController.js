import { supabase } from '../config/supabase.js';

const getFullResidentData = async (residentId) => {
  const { data: resident, error: residentError } = await supabase
    .from('residents')
    .select(`resident_id, name, age, gender, date_of_birth, civil_status, contact_number, contact_person, contact_person_number, contact_person_address, last_checkup, focus_groups, is_pwd, vaccinations, created_at, purok_id, puroks:purok_id (purok_id, name)`)
    .eq('resident_id', residentId).single();
  if (residentError || !resident) return null;

  const { data: vitals } = await supabase.from('resident_vital_signs').select('*').eq('resident_id', residentId).single();
  const { data: conditions } = await supabase.from('resident_chronic_conditions').select('condition_name').eq('resident_id', residentId);
  const { data: medications } = await supabase.from('resident_medications').select('*').eq('resident_id', residentId);
  const { data: allergies } = await supabase.from('resident_allergies').select('allergy_type, allergen').eq('resident_id', residentId);
  const { data: medicalHistory } = await supabase
    .from('medical_histories')
    .select(`history_id, date, type, location, facility, diagnosis, treatment, notes, created_at, administered_by, chronic_conditions, current_medications, allergies, medical_history_vitals (*)`)
    .eq('resident_id', residentId)
    .order('created_at', { ascending: false });

  return {
    id: resident.resident_id, name: resident.name, age: resident.age, gender: resident.gender,
    dateOfBirth: resident.date_of_birth, civilStatus: resident.civil_status, purok: resident.puroks?.name || null,
    purokId: resident.purok_id, contactNumber: resident.contact_number, contactPerson: resident.contact_person,
    contactPersonNumber: resident.contact_person_number, contactPersonAddress: resident.contact_person_address,
    lastCheckup: resident.last_checkup, focusGroups: resident.focus_groups || [], isPwd: resident.is_pwd || false,
    vaccinations: resident.vaccinations || [], createdAt: resident.created_at,
    vitalSigns: vitals ? { bloodPressure: vitals.blood_pressure, heartRate: vitals.heart_rate, temperature: vitals.temperature, weight: vitals.weight, height: vitals.height, bloodSugar: vitals.blood_sugar, bmi: vitals.bmi } : null,
    chronicConditions: conditions?.map(c => c.condition_name) || [],
    currentMedications: medications || [],
    allergies: { drugs: allergies?.filter(a => a.allergy_type === 'drug').map(a => a.allergen) || [], food: allergies?.filter(a => a.allergy_type === 'food').map(a => a.allergen) || [], environmental: allergies?.filter(a => a.allergy_type === 'environmental').map(a => a.allergen) || [] },
    medicalHistory: medicalHistory?.map(h => ({
      id: h.history_id, date: h.date, type: h.type, location: h.location, facility: h.facility,
      diagnosis: h.diagnosis, treatment: h.treatment, notes: h.notes, createdAt: h.created_at,
      administeredBy: h.administered_by,
      chronicConditions: h.chronic_conditions || [],
      currentMedications: h.current_medications || [],
      allergies: h.allergies || { drugs: [], food: [], environmental: [] },
      vitalSigns: h.medical_history_vitals ? { bloodPressure: h.medical_history_vitals.blood_pressure, heartRate: h.medical_history_vitals.heart_rate, temperature: h.medical_history_vitals.temperature, weight: h.medical_history_vitals.weight, height: h.medical_history_vitals.height, bloodSugar: h.medical_history_vitals.blood_sugar, bmi: h.medical_history_vitals.bmi } : null
    })) || []
  };
};

export const getAllResidents = async (req, res) => {
  try {
    const { data: residents, error } = await supabase
      .from('residents')
      .select(`resident_id, name, age, gender, purok_id, focus_groups, is_pwd, puroks:purok_id (name), contact_number, contact_person, contact_person_number, last_checkup`)
      .order('name');
      
    if (error) throw error;
    
    const residentsWithRisk = await Promise.all(residents.map(async (r) => {
      const { data: conditions } = await supabase
        .from('resident_chronic_conditions')
        .select('condition_id')
        .eq('resident_id', r.resident_id);
        
      const { data: vitals } = await supabase
        .from('resident_vital_signs')
        .select('blood_pressure, blood_sugar')
        .eq('resident_id', r.resident_id)
        .single();
        
      let riskScore = 0; 
      const age = r.age || 0;
      if (age >= 60) riskScore += 2; 
      else if (age >= 40) riskScore += 1;
      if (conditions?.length > 0) riskScore += Math.min(conditions.length, 3);
      if (vitals?.blood_pressure) { 
        const parts = vitals.blood_pressure.split('/'); 
        const sys = parseInt(parts[0]); 
        if (!isNaN(sys)) { 
          if (sys >= 140) riskScore += 2; 
          else if (sys >= 130) riskScore += 1; 
        } 
      }
      if (vitals?.blood_sugar && vitals.blood_sugar > 140) riskScore += 2;
      
      let riskLevel = 'Low Health Risk'; 
      if (riskScore >= 5) riskLevel = 'Critical Health Risk'; 
      else if (riskScore >= 3) riskLevel = 'High Health Risk'; 
      else if (riskScore >= 1) riskLevel = 'Moderate Health Risk';
      
      return { 
        id: r.resident_id, 
        name: r.name, 
        age: r.age, 
        gender: r.gender, 
        purok: r.puroks?.name || null, 
        purokId: r.purok_id, 
        contactNumber: r.contact_number, 
        contactPerson: r.contact_person,           // ADDED
        contactPersonNumber: r.contact_person_number, // ADDED
        lastCheckup: r.last_checkup, 
        focusGroups: r.focus_groups || [], 
        isPwd: r.is_pwd || false, 
        riskLevel 
      };
    }));
    
    res.json({ success: true, data: residentsWithRisk });
  } catch (error) { 
    console.error('Error fetching residents:', error); 
    res.status(500).json({ success: false, message: 'Failed to fetch residents' }); 
  }
};

export const getResidentById = async (req, res) => {
  try { const resident = await getFullResidentData(req.params.id); if (!resident) return res.status(404).json({ success: false, message: 'Resident not found' }); res.json({ success: true, data: resident }); }
  catch (error) { console.error('Error fetching resident:', error); res.status(500).json({ success: false, message: 'Failed to fetch resident' }); }
};

export const createResident = async (req, res) => {
  try {
    const { name, age, gender, dateOfBirth, civilStatus, purokId, contactNumber, contactPerson, contactPersonNumber, contactPersonAddress, lastCheckup, focusGroups, isPwd, vaccinations, vitalSigns, chronicConditions, currentMedications, allergies, medicalHistory } = req.body;
    if (!name || !age || !gender || !dateOfBirth) return res.status(400).json({ success: false, message: 'Name, age, gender, and date of birth are required' });
    const { data: resident, error } = await supabase.from('residents').insert({ name, age, gender, date_of_birth: dateOfBirth, civil_status: civilStatus || 'Single', purok_id: purokId || null, contact_number: contactNumber || null, contact_person: contactPerson || null, contact_person_number: contactPersonNumber || null, contact_person_address: contactPersonAddress || null, last_checkup: lastCheckup || null, focus_groups: focusGroups || [], is_pwd: isPwd || false, vaccinations: vaccinations || [] }).select().single();
    if (error) throw error;
    const residentId = resident.resident_id;
    if (vitalSigns && Object.values(vitalSigns).some(v => v)) await supabase.from('resident_vital_signs').insert({ resident_id: residentId, blood_pressure: vitalSigns.bloodPressure || null, heart_rate: vitalSigns.heartRate || null, temperature: vitalSigns.temperature || null, weight: vitalSigns.weight || null, height: vitalSigns.height || null, blood_sugar: vitalSigns.bloodSugar || null, bmi: vitalSigns.bmi || null });
    if (chronicConditions?.length > 0) await supabase.from('resident_chronic_conditions').insert(chronicConditions.map(c => ({ resident_id: residentId, condition_name: typeof c === 'string' ? c : JSON.stringify(c) })));
    if (currentMedications?.length > 0) await supabase.from('resident_medications').insert(currentMedications.map(m => ({ resident_id: residentId, name: m.name || m, dosage: m.dosage || null, frequency: m.frequency || null })));
    if (allergies) { const inserts = []; if (allergies.drugs) allergies.drugs.forEach(a => inserts.push({ resident_id: residentId, allergy_type: 'drug', allergen: a })); if (allergies.food) allergies.food.forEach(a => inserts.push({ resident_id: residentId, allergy_type: 'food', allergen: a })); if (allergies.environmental) allergies.environmental.forEach(a => inserts.push({ resident_id: residentId, allergy_type: 'environmental', allergen: a })); if (inserts.length > 0) await supabase.from('resident_allergies').insert(inserts); }
    if (medicalHistory?.length > 0) { for (const r of medicalHistory) { const { data: h } = await supabase.from('medical_histories').insert({ resident_id: residentId, date: r.date || new Date().toISOString().split('T')[0], type: r.type || 'Checkup', location: r.location || 'Barangay', facility: r.facility || 'Barangay Health Center', diagnosis: r.diagnosis || '', treatment: r.treatment || '', notes: r.notes || '', administered_by: r.administeredBy || null, chronic_conditions: r.chronicConditions || [], current_medications: r.currentMedications || [], allergies: r.allergies || { drugs: [], food: [], environmental: [] } }).select().single(); if (h && r.vitalSigns && Object.values(r.vitalSigns).some(v => v)) await supabase.from('medical_history_vitals').insert({ history_id: h.history_id, blood_pressure: r.vitalSigns.bloodPressure || null, heart_rate: r.vitalSigns.heartRate || null, temperature: r.vitalSigns.temperature || null, weight: r.vitalSigns.weight || null, height: r.vitalSigns.height || null, blood_sugar: r.vitalSigns.bloodSugar || null, bmi: r.vitalSigns.bmi || null }); } }
    const newResident = await getFullResidentData(residentId);
    res.status(201).json({ success: true, data: newResident });
  } catch (error) { console.error('Error creating resident:', error); res.status(500).json({ success: false, message: 'Failed to create resident: ' + error.message }); }
};

export const updateResident = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, age, gender, dateOfBirth, civilStatus, purokId, contactNumber, contactPerson, contactPersonNumber, contactPersonAddress, lastCheckup, focusGroups, isPwd, vaccinations, vitalSigns, chronicConditions, currentMedications, allergies } = req.body;
    const { data: existing } = await supabase.from('residents').select('resident_id').eq('resident_id', id).single();
    if (!existing) return res.status(404).json({ success: false, message: 'Resident not found' });
    const updateData = {};
    if (name !== undefined) updateData.name = name; if (age !== undefined) updateData.age = age; if (gender !== undefined) updateData.gender = gender;
    if (dateOfBirth !== undefined) updateData.date_of_birth = dateOfBirth; if (civilStatus !== undefined) updateData.civil_status = civilStatus;
    if (purokId !== undefined) updateData.purok_id = purokId; if (contactNumber !== undefined) updateData.contact_number = contactNumber;
    if (contactPerson !== undefined) updateData.contact_person = contactPerson; if (contactPersonNumber !== undefined) updateData.contact_person_number = contactPersonNumber;
    if (contactPersonAddress !== undefined) updateData.contact_person_address = contactPersonAddress; if (lastCheckup !== undefined) updateData.last_checkup = lastCheckup;
    if (focusGroups !== undefined) updateData.focus_groups = focusGroups; if (isPwd !== undefined) updateData.is_pwd = isPwd;
    if (vaccinations !== undefined) updateData.vaccinations = vaccinations;
    if (Object.keys(updateData).length > 0) await supabase.from('residents').update(updateData).eq('resident_id', id);
    if (vitalSigns) { const vd = { blood_pressure: vitalSigns.bloodPressure || null, heart_rate: vitalSigns.heartRate || null, temperature: vitalSigns.temperature || null, weight: vitalSigns.weight || null, height: vitalSigns.height || null, blood_sugar: vitalSigns.bloodSugar || null, bmi: vitalSigns.bmi || null }; const { data: ev } = await supabase.from('resident_vital_signs').select('resident_id').eq('resident_id', id).single(); if (ev) await supabase.from('resident_vital_signs').update(vd).eq('resident_id', id); else if (Object.values(vd).some(v => v !== null)) await supabase.from('resident_vital_signs').insert({ resident_id: id, ...vd }); }
    if (chronicConditions !== undefined) { await supabase.from('resident_chronic_conditions').delete().eq('resident_id', id); if (chronicConditions.length > 0) await supabase.from('resident_chronic_conditions').insert(chronicConditions.map(c => ({ resident_id: id, condition_name: typeof c === 'string' ? c : JSON.stringify(c) }))); }
    if (currentMedications !== undefined) { await supabase.from('resident_medications').delete().eq('resident_id', id); if (currentMedications.length > 0) await supabase.from('resident_medications').insert(currentMedications.map(m => ({ resident_id: id, name: m.name || m, dosage: m.dosage || null, frequency: m.frequency || null }))); }
    if (allergies) { await supabase.from('resident_allergies').delete().eq('resident_id', id); const inserts = []; if (allergies.drugs) allergies.drugs.forEach(a => inserts.push({ resident_id: id, allergy_type: 'drug', allergen: a })); if (allergies.food) allergies.food.forEach(a => inserts.push({ resident_id: id, allergy_type: 'food', allergen: a })); if (allergies.environmental) allergies.environmental.forEach(a => inserts.push({ resident_id: id, allergy_type: 'environmental', allergen: a })); if (inserts.length > 0) await supabase.from('resident_allergies').insert(inserts); }
    const updatedResident = await getFullResidentData(id);
    res.json({ success: true, data: updatedResident });
  } catch (error) { console.error('Error updating resident:', error); res.status(500).json({ success: false, message: 'Failed to update resident' }); }
};

export const deleteResident = async (req, res) => {
  try { await supabase.from('residents').delete().eq('resident_id', req.params.id); res.json({ success: true, message: 'Resident deleted successfully' }); }
  catch (error) { console.error('Error deleting resident:', error); res.status(500).json({ success: false, message: 'Failed to delete resident' }); }
};

export const addMedicalHistory = async (req, res) => {
  try {
    const { id } = req.params;
    const { date, type, location, facility, diagnosis, treatment, notes, vitalSigns, administered_by, chronicConditions, currentMedications, allergies } = req.body;
    
    const { data: resident } = await supabase.from('residents').select('resident_id').eq('resident_id', id).single();
    if (!resident) return res.status(404).json({ success: false, message: 'Resident not found' });
    
    const { data: history, error } = await supabase.from('medical_histories').insert({
      resident_id: id,
      date: date || new Date().toISOString().split('T')[0],
      type: type || 'Checkup',
      location: location || 'Barangay',
      facility: facility || 'Barangay Health Center',
      diagnosis: diagnosis || '',
      treatment: treatment || '',
      notes: notes || '',
      administered_by: administered_by || null,
      chronic_conditions: chronicConditions || [],
      current_medications: currentMedications || [],
      allergies: allergies || { drugs: [], food: [], environmental: [] },
    }).select().single();
    
    if (error) throw error;
    
    if (vitalSigns && Object.values(vitalSigns).some(v => v)) {
      await supabase.from('medical_history_vitals').insert({
        history_id: history.history_id,
        blood_pressure: vitalSigns.bloodPressure || null,
        heart_rate: vitalSigns.heartRate || null,
        temperature: vitalSigns.temperature || null,
        weight: vitalSigns.weight || null,
        height: vitalSigns.height || null,
        blood_sugar: vitalSigns.bloodSugar || null,
        bmi: vitalSigns.bmi || null
      });
    }
    
    await supabase.from('residents').update({ last_checkup: date || new Date().toISOString().split('T')[0] }).eq('resident_id', id);
    
    if (vitalSigns && Object.values(vitalSigns).some(v => v)) {
      const vd = { blood_pressure: vitalSigns.bloodPressure || null, heart_rate: vitalSigns.heartRate || null, temperature: vitalSigns.temperature || null, weight: vitalSigns.weight || null, height: vitalSigns.height || null, blood_sugar: vitalSigns.bloodSugar || null, bmi: vitalSigns.bmi || null };
      const { data: ev } = await supabase.from('resident_vital_signs').select('resident_id').eq('resident_id', id).single();
      if (ev) await supabase.from('resident_vital_signs').update(vd).eq('resident_id', id);
      else await supabase.from('resident_vital_signs').insert({ resident_id: id, ...vd });
    }
    
    res.status(201).json({
      success: true,
      data: {
        id: history.history_id, date: history.date, type: history.type, location: history.location,
        facility: history.facility, diagnosis: history.diagnosis, treatment: history.treatment,
        notes: history.notes, createdAt: history.created_at, administeredBy: history.administered_by,
        chronicConditions: history.chronic_conditions, currentMedications: history.current_medications,
        allergies: history.allergies,
      }
    });
  } catch (error) { console.error('Error adding medical history:', error); res.status(500).json({ success: false, message: 'Failed to add medical history' }); }
};