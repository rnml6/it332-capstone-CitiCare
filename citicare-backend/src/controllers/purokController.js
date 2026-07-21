import { supabase } from '../config/supabase.js';

export const getAllPuroks = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('puroks')
      .select('*')
      .order('name');

    if (error) throw error;

    // Get resident counts per purok
    const puroksWithStats = await Promise.all(
      data.map(async (purok) => {
        const { data: residents, error: residentError } = await supabase
          .from('residents')
          .select('resident_id')
          .eq('purok_id', purok.purok_id);

        if (residentError) throw residentError;

        return {
          id: purok.purok_id,
          name: purok.name,
          totalResidents: residents?.length || 0
        };
      })
    );

    res.json({ success: true, data: puroksWithStats });
  } catch (error) {
    console.error('Error fetching puroks:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch puroks' });
  }
};

export const getPurokById = async (req, res) => {
  try {
    const { id } = req.params;

    const { data: purok, error: purokError } = await supabase
      .from('puroks')
      .select('*')
      .eq('purok_id', id)
      .single();

    if (purokError || !purok) {
      return res.status(404).json({ success: false, message: 'Purok not found' });
    }

    // Get residents with risk levels
    const { data: residents, error: residentError } = await supabase
      .from('residents')
      .select(`
        resident_id,
        name,
        age,
        gender,
        contact_number,
        last_checkup
      `)
      .eq('purok_id', id);

    if (residentError) throw residentError;

    // Get BHW assigned to this purok
    const { data: bhw, error: bhwError } = await supabase
      .from('bhws')
      .select('bhw_id, name, contact_number, email')
      .eq('assigned_purok_id', id)
      .eq('status', 'Active')
      .maybeSingle();

    // Calculate risk levels for residents
    const residentsWithRisk = await Promise.all(
      residents.map(async (resident) => {
        const { data: conditions } = await supabase
          .from('resident_chronic_conditions')
          .select('condition_id')
          .eq('resident_id', resident.resident_id);

        const { data: vitals } = await supabase
          .from('resident_vital_signs')
          .select('blood_pressure, blood_sugar')
          .eq('resident_id', resident.resident_id)
          .single();

        let riskScore = 0;
        const age = resident.age || 0;
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

        const hasMissedCheckup = !resident.last_checkup ||
          new Date(resident.last_checkup) < new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);

        return {
          id: resident.resident_id,
          name: resident.name,
          age: resident.age,
          gender: resident.gender,
          contactNumber: resident.contact_number,
          lastCheckup: resident.last_checkup,
          riskLevel,
          missedCheckup: hasMissedCheckup
        };
      })
    );

    const critical = residentsWithRisk.filter(r => r.riskLevel === 'Critical Health Risk').length;
    const high = residentsWithRisk.filter(r => r.riskLevel === 'High Health Risk').length;
    const moderate = residentsWithRisk.filter(r => r.riskLevel === 'Moderate Health Risk').length;
    const low = residentsWithRisk.filter(r => r.riskLevel === 'Low Health Risk').length;

    res.json({
      success: true,
      data: {
        id: purok.purok_id,
        name: purok.name,
        totalResidents: residents.length,
        critical,
        high,
        moderate,
        low,
        assignedBHW: bhw ? {
          id: bhw.bhw_id,
          name: bhw.name,
          contactNumber: bhw.contact_number,
          email: bhw.email
        } : null,
        residents: residentsWithRisk
      }
    });
  } catch (error) {
    console.error('Error fetching purok:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch purok' });
  }
};

export const createPurok = async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ success: false, message: 'Purok name is required' });
    }

    const { data, error } = await supabase
      .from('puroks')
      .insert({ name })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        return res.status(400).json({ success: false, message: 'Purok name already exists' });
      }
      throw error;
    }

    res.status(201).json({
      success: true,
      data: {
        id: data.purok_id,
        name: data.name
      }
    });
  } catch (error) {
    console.error('Error creating purok:', error);
    res.status(500).json({ success: false, message: 'Failed to create purok' });
  }
};

export const deletePurok = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if purok has associated records
    const { data: residents } = await supabase
      .from('residents')
      .select('resident_id')
      .eq('purok_id', id)
      .limit(1);

    if (residents && residents.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete purok with associated residents'
      });
    }

    const { data: bhws } = await supabase
      .from('bhws')
      .select('bhw_id')
      .eq('assigned_purok_id', id)
      .limit(1);

    if (bhws && bhws.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete purok with associated BHWs'
      });
    }

    const { error } = await supabase
      .from('puroks')
      .delete()
      .eq('purok_id', id);

    if (error) throw error;

    res.json({ success: true, message: 'Purok deleted successfully' });
  } catch (error) {
    console.error('Error deleting purok:', error);
    res.status(500).json({ success: false, message: 'Failed to delete purok' });
  }
};