import { supabase } from '../config/supabase.js';

export const residentController = {
  // Create Resident utilizing transactional RPC
  createResident: async (req, res) => {
    try {
      const { 
        household_id, first_name, middle_name, last_name, suffix, 
        birth_date, sex, civil_status, contact_number, is_household_head, classifications 
      } = req.body;

      const { data: residentId, error } = await supabase.rpc('api_create_resident', {
        p_household_id: household_id,
        p_first_name: first_name,
        p_middle_name: middle_name,
        p_last_name: last_name,
        p_suffix: suffix,
        p_birth_date: birth_date,
        p_sex: sex,
        p_civil_status: civil_status,
        p_contact_number: contact_number,
        p_is_head: is_household_head,
        p_classifications: classifications || ['None']
      });

      if (error) return res.status(400).json({ error: error.message });
      return res.status(201).json({ message: 'Resident cataloged successfully', residentId });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  },

  // Read comprehensive nested client medical profile
  getResidentProfile: async (req, res) => {
    try {
      const { id } = req.params;
      const { data, error } = await supabase
        .from('residents')
        .select(`
          *,
          health_profiles(*),
          chronic_conditions(*),
          resident_medications(*),
          resident_allergens(*),
          resident_classifications(classification)
        `)
        .eq('id', id)
        .single();

      if (error) return res.status(404).json({ error: 'Resident profile not found' });
      return res.status(200).json(data);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  },

  // Dynamic Array Entries handler (Meds, Allergies, Chronic Conditions)
  addMedicalMetadata: async (req, res) => {
    try {
      const { target_table } = req.params;
      const allowedTables = ['chronic_conditions', 'resident_medications', 'resident_allergens'];
      
      if (!allowedTables.includes(target_table)) {
        return res.status(400).json({ error: 'Invalid health parameter target field' });
      }

      const { data, error } = await supabase.from(target_table).insert(req.body).select();
      if (error) return res.status(400).json({ error: error.message });
      
      return res.status(201).json(data);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  },

  // Dynamic Medical History Tracker timeline stream
  getTimeline: async (req, res) => {
    try {
      const { id } = req.params;
      const { data, error } = await supabase
        .from('medical_histories')
        .select('*')
        .eq('resident_id', id)
        .order('event_date', { ascending: false });

      if (error) return res.status(400).json({ error: error.message });
      return res.status(200).json(data);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }
};