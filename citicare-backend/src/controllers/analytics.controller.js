import { supabase } from '../config/supabase.js';

export const analyticsController = {
  // Objective 3.1 & 3.2: Analytics mapping metrics 
  getPurokRiskDistributions: async (req, res) => {
    try {
      const { data, error } = await supabase.from('view_purok_risk_distribution').select('*');
      if (error) return res.status(400).json({ error: error.message });
      return res.status(200).json(data);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  },

  // Objective 3.3: Disease prevalence maps
  getDiseaseMetricsPerPurok: async (req, res) => {
    try {
      const { data, error } = await supabase.from('view_purok_disease_metrics').select('*');
      if (error) return res.status(400).json({ error: error.message });
      return res.status(200).json(data);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  },

  // Objective 3.4: Strategic execution recommendation trends API
  getAIRecommendations: async (req, res) => {
    try {
      const { scope, year, period } = req.query;
      const { data, error } = await supabase
        .from('ai_health_recommendations')
        .select('*')
        .eq('scope_type', scope)
        .eq('target_year', year)
        .eq('target_period', period)
        .single();

      if (error) return res.status(404).json({ message: 'No AI insights compiled for this specified structural cycle yet.' });
      return res.status(200).json(data);
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }
};