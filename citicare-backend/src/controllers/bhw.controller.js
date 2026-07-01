import { supabase } from '../config/supabase.js';

export const bhwController = {
  // Admin Action: Create BHW Auth Account & Data profiles simultaneously
  createBHWAccount: async (req, res) => {
    try {
      const { username, password, first_name, last_name, purok_id, contact_number } = req.body;
      
      const { data: authUser, error: authErr } = await supabase.auth.signUp({
        email: username,
        password: password
      });

      if (authErr || !authUser.user) return res.status(400).json({ error: authErr?.message });

      const { data, error } = await supabase.rpc('api_admin_create_bhw', {
        p_username: username,
        p_password: password,
        p_first_name: first_name,
        p_last_name: last_name,
        p_purok_id: purok_id,
        p_contact: contact_number
      });

      if (error) return res.status(400).json({ error: error.message });
      return res.status(201).json({ message: 'BHW account provisioned successfully', bhwId: data });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  },

  // Read schedules filtered by assignment scopes 
  getSchedules: async (req, res) => {
    try {
      let query = supabase.from('checkups_and_appointments').select('*, residents(first_name, last_name, household_id)');
      
      if (req.user.role === 'BHW') {
        query = query.eq('assigned_to_bhw_id', req.user.bhw_id);
      } else if (req.query.bhw_id) {
        query = query.eq('assigned_to_bhw_id', req.query.bhw_id);
      }

      const { data, error } = await query.order('scheduled_date', { ascending: true });
      if (error) return res.status(400).json({ error: error.message });
      return res.status(200).json(data);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  },

  // BHW Action: Execute triage logging & save intervention metrics
  completeAppointment: async (req, res) => {
    try {
      const { appointment_id, systolic_bp, diastolic_bp, temperature, weight_kg, height_cm, remarks } = req.body;
      const bhwId = req.user.bhw_id;

      if (!bhwId) return res.status(403).json({ error: 'Action restricted to active BHW user credentials.' });

      const { error } = await supabase.rpc('api_execute_appointment', {
        p_appointment_id: appointment_id,
        p_bhw_id: bhwId,
        p_systolic: systolic_bp,
        p_diastolic: diastolic_bp,
        p_temp: temperature,
        p_weight: weight_kg,
        p_height: height_cm,
        p_remarks: remarks
      });

      if (error) return res.status(400).json({ error: error.message });
      return res.status(200).json({ message: 'Intervention parameters calculated and updated successfully' });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }
};