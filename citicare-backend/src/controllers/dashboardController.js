// controllers/dashboardController.js
import { supabase } from '../config/supabase.js';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Helper: Calculate risk score
const calculateRiskScore = (age, conditions, vitals) => {
  let riskScore = 0;
  if (age >= 60) riskScore += 2;
  else if (age >= 40) riskScore += 1;
  if (conditions?.length > 0) riskScore += Math.min(conditions.length, 3);
  if (vitals?.blood_pressure) {
    const sys = parseInt(vitals.blood_pressure.split('/')[0]);
    if (!isNaN(sys)) {
      if (sys >= 140) riskScore += 2;
      else if (sys >= 130) riskScore += 1;
    }
  }
  if (vitals?.blood_sugar && vitals.blood_sugar > 140) riskScore += 2;
  return riskScore;
};

// ============================================
// 1. DASHBOARD STATS
// ============================================
export const getDashboardStats = async (req, res) => {
  try {
    const { count: totalResidents } = await supabase.from('residents').select('*', { count: 'exact', head: true });
    const { count: totalBHWs } = await supabase.from('bhws').select('*', { count: 'exact', head: true }).eq('status', 'Active');
    const today = new Date().toISOString().split('T')[0];
    const { count: todaySchedules } = await supabase.from('schedules').select('*', { count: 'exact', head: true }).eq('date', today);

    const { data: residents } = await supabase.from('residents').select('resident_id, name, age, purok_id, puroks:purok_id (name)');

    let criticalCount = 0, highCount = 0;
    const criticalResidents = [], highRiskResidents = [];

    for (const resident of (residents || [])) {
      const { data: conditions } = await supabase.from('resident_chronic_conditions').select('*').eq('resident_id', resident.resident_id);
      const { data: vitals } = await supabase.from('resident_vital_signs').select('blood_pressure, blood_sugar').eq('resident_id', resident.resident_id).single();

      const riskScore = calculateRiskScore(resident.age, conditions, vitals);
      const info = {
        id: resident.resident_id,
        name: resident.name,
        age: resident.age,
        purok: resident.puroks?.name || 'Unknown',
        conditions: conditions?.map(c => {
          try { return JSON.parse(c.condition_name).name || c.condition_name; }
          catch { return c.condition_name; }
        }) || [],
        riskScore
      };

      if (riskScore >= 5) { criticalCount++; criticalResidents.push(info); }
      else if (riskScore >= 3) { highCount++; highRiskResidents.push(info); }
    }

    return res.json({
      success: true,
      data: {
        totalResidents: totalResidents || 0,
        activeBHW: totalBHWs || 0,
        todaySchedules: todaySchedules || 0,
        highCriticalRisk: criticalCount + highCount,
        criticalCount,
        highCount,
        criticalResidents,
        highRiskResidents
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch dashboard stats' });
  }
};

// ============================================
// 2. RISK DISTRIBUTION (OVERALL)
// ============================================
export const getRiskDistribution = async (req, res) => {
  try {
    const { data: residents } = await supabase.from('residents').select('resident_id, age');
    let critical = 0, high = 0, moderate = 0, low = 0;

    for (const resident of (residents || [])) {
      const { data: conditions } = await supabase.from('resident_chronic_conditions').select('condition_id').eq('resident_id', resident.resident_id);
      const { data: vitals } = await supabase.from('resident_vital_signs').select('blood_pressure, blood_sugar').eq('resident_id', resident.resident_id).single();
      const score = calculateRiskScore(resident.age, conditions, vitals);
      if (score >= 5) critical++;
      else if (score >= 3) high++;
      else if (score >= 1) moderate++;
      else low++;
    }

    return res.json({ success: true, data: { critical, high, moderate, low } });
  } catch (error) {
    console.error('Error fetching risk distribution:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch risk distribution' });
  }
};

// ============================================
// 3. RISK DISTRIBUTION BY PUROK
// ============================================
export const getRiskDistributionByPurok = async (req, res) => {
  try {
    const { data: puroks } = await supabase.from('puroks').select('*');
    const purokRiskData = [];

    for (const purok of (puroks || [])) {
      const { data: residents } = await supabase.from('residents').select('resident_id, age').eq('purok_id', purok.purok_id);
      let critical = 0, high = 0, moderate = 0, low = 0;

      for (const resident of (residents || [])) {
        const { data: conditions } = await supabase.from('resident_chronic_conditions').select('condition_id').eq('resident_id', resident.resident_id);
        const { data: vitals } = await supabase.from('resident_vital_signs').select('blood_pressure, blood_sugar').eq('resident_id', resident.resident_id).single();
        const score = calculateRiskScore(resident.age, conditions, vitals);
        if (score >= 5) critical++;
        else if (score >= 3) high++;
        else if (score >= 1) moderate++;
        else low++;
      }

      purokRiskData.push({
        purokId: purok.purok_id,
        purokName: purok.name,
        totalResidents: residents?.length || 0,
        critical, high, moderate, low
      });
    }

    return res.json({ success: true, data: purokRiskData });
  } catch (error) {
    console.error('Error fetching risk distribution by purok:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch risk distribution by purok' });
  }
};

// ============================================
// 4. COMMON DISEASES
// ============================================
export const getCommonDiseases = async (req, res) => {
  try {
    const { purokId } = req.query;
    let query = supabase.from('resident_chronic_conditions').select('condition_name, resident_id, residents:resident_id (purok_id, puroks:purok_id (name))');

    if (purokId) {
      const { data: purokResidents } = await supabase.from('residents').select('resident_id').eq('purok_id', purokId);
      if (purokResidents?.length > 0) {
        query = query.in('resident_id', purokResidents.map(r => r.resident_id));
      }
    }

    const { data: conditions } = await query;
    const diseaseCount = {};
    const diseaseByPurok = {};

    (conditions || []).forEach(c => {
      let name;
      try { name = JSON.parse(c.condition_name).name || c.condition_name; }
      catch { name = c.condition_name; }
      diseaseCount[name] = (diseaseCount[name] || 0) + 1;
      const pName = c.residents?.puroks?.name || 'Unknown';
      if (!diseaseByPurok[pName]) diseaseByPurok[pName] = {};
      diseaseByPurok[pName][name] = (diseaseByPurok[pName][name] || 0) + 1;
    });

    const sorted = Object.entries(diseaseCount).sort(([, a], [, b]) => b - a).map(([name, count]) => ({ name, count }));

    return res.json({ success: true, data: { overall: sorted, byPurok: diseaseByPurok } });
  } catch (error) {
    console.error('Error fetching common diseases:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch common diseases' });
  }
};

// ============================================
// 5. MONTHLY TRENDS
// ============================================
export const getMonthlyTrends = async (req, res) => {
  try {
    const { year } = req.query;
    const targetYear = parseInt(year) || new Date().getFullYear();

    const { data: histories } = await supabase
      .from('medical_histories')
      .select('date, resident_id, medical_history_vitals (blood_pressure, blood_sugar)')
      .gte('date', `${targetYear}-01-01`)
      .lte('date', `${targetYear}-12-31`);

    const residentIds = [...new Set((histories || []).map(h => h.resident_id))];
    const { data: residents } = await supabase.from('residents').select('resident_id, age').in('resident_id', residentIds.length > 0 ? residentIds : [0]);
    const ageMap = {};
    residents?.forEach(r => { ageMap[r.resident_id] = r.age; });

    let conditionMap = {};
    if (residentIds.length > 0) {
      const { data: conds } = await supabase.from('resident_chronic_conditions').select('resident_id, condition_id').in('resident_id', residentIds);
      conds?.forEach(c => {
        if (!conditionMap[c.resident_id]) conditionMap[c.resident_id] = [];
        conditionMap[c.resident_id].push(c.condition_id);
      });
    }

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyData = months.map(m => ({
      month: m, year: targetYear,
      criticalHealthRisk: 0, highHealthRisk: 0,
      moderateHealthRisk: 0, lowHealthRisk: 0
    }));

    (histories || []).forEach(h => {
      if (!h.date) return;
      const idx = new Date(h.date).getMonth();
      const score = calculateRiskScore(ageMap[h.resident_id] || 0, conditionMap[h.resident_id] || [], h.medical_history_vitals);
      if (score >= 5) monthlyData[idx].criticalHealthRisk++;
      else if (score >= 3) monthlyData[idx].highHealthRisk++;
      else if (score >= 1) monthlyData[idx].moderateHealthRisk++;
      else monthlyData[idx].lowHealthRisk++;
    });

    return res.json({ success: true, data: monthlyData });
  } catch (error) {
    console.error('Error fetching monthly trends:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch monthly trends' });
  }
};

// ============================================
// 6. TODAY'S ACTIVITIES
// ============================================
export const getTodayActivities = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('schedules')
      .select('schedule_id, date, time, type, status, resident_id, residents:resident_id (name, purok_id, puroks:purok_id (name)), bhw_id, bhws:bhw_id (name)')
      .eq('date', today).order('time');

    if (error) throw error;

    const activities = (data || []).map(s => ({
      id: s.schedule_id,
      residentName: s.residents?.name || 'Unknown',
      time: s.time,
      location: s.residents?.puroks?.name || 'Not specified',
      serviceType: s.type,
      status: s.status,
      assignedBhw: s.bhws?.name || 'Unassigned'
    }));

    return res.json({ success: true, data: activities });
  } catch (error) {
    console.error('Error fetching activities:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch activities' });
  }
};

// ============================================
// 7. AI RECOMMENDATION
// ============================================
export const getAIRecommendation = async (req, res) => {
  console.log('AI Recommendation request started');
  
  try {
    const { period = 'monthly' } = req.query;
    const apiKey = process.env.GEMINI_API_KEY;
    
    const now = new Date();
    let startDate;
    switch (period) {
      case 'monthly': startDate = new Date(now.getFullYear(), now.getMonth(), 1); break;
      case 'quarterly': startDate = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1); break;
      case 'annual': startDate = new Date(now.getFullYear(), 0, 1); break;
      default: startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = now.toISOString().split('T')[0];

    console.log('Fetching data...');
    
    // Fetch data
    const [
      { data: puroks },
      { data: residents },
      { data: allConditions },
      { data: allVitals },
      { data: bhws },
      { data: allSchedules },
      { data: medicineMaster }
    ] = await Promise.all([
      supabase.from('puroks').select('*'),
      supabase.from('residents').select('resident_id, name, age, gender, last_checkup, focus_groups, is_pwd, purok_id, puroks:purok_id (name)'),
      supabase.from('resident_chronic_conditions').select('*'),
      supabase.from('resident_vital_signs').select('*'),
      supabase.from('bhws').select('*'),
      supabase.from('schedules').select('schedule_id, resident_id, date, time, type, status, is_emergency, residents:resident_id (name), bhws:bhw_id (name)').gte('date', startDateStr).lte('date', endDateStr),
      supabase.from('medicine_master').select('*').eq('is_active', true)
    ]);

    console.log(`Data: ${residents?.length || 0} residents, ${puroks?.length || 0} puroks`);

    // Build simple data
    const criticalResidents = [];
    const highRiskResidents = [];
    const diseaseStats = {};

    (residents || []).forEach(r => {
      const conditions = (allConditions || []).filter(c => c.resident_id === r.resident_id);
      const vitals = (allVitals || []).find(v => v.resident_id === r.resident_id);
      const score = calculateRiskScore(r.age, conditions, vitals);
      
      const info = {
        name: r.name, age: r.age, purok: r.puroks?.name || 'Unknown',
        riskScore: score,
        conditions: conditions.map(c => {
          try { return JSON.parse(c.condition_name).name || c.condition_name; }
          catch { return c.condition_name; }
        }),
        bp: vitals?.blood_pressure || 'N/A',
        sugar: vitals?.blood_sugar || 'N/A'
      };
      
      if (score >= 5) criticalResidents.push(info);
      else if (score >= 3) highRiskResidents.push(info);
      
      conditions.forEach(c => {
        let name;
        try { name = JSON.parse(c.condition_name).name || c.condition_name; }
        catch { name = c.condition_name; }
        diseaseStats[name] = (diseaseStats[name] || 0) + 1;
      });
    });

    // Build prompt data
    const promptData = {
      period,
      totalResidents: residents?.length || 0,
      totalPuroks: puroks?.length || 0,
      activeBHWs: (bhws || []).filter(b => b.status === 'Active').length,
      criticalCount: criticalResidents.length,
      highRiskCount: highRiskResidents.length,
      criticalResidents: criticalResidents.slice(0, 5),
      highRiskResidents: highRiskResidents.slice(0, 5),
      topDiseases: Object.entries(diseaseStats).sort(([,a],[,b]) => b - a).slice(0, 10).map(([name, count]) => ({ name, count })),
      totalSchedules: allSchedules?.length || 0,
      medicines: (medicineMaster || []).map(m => ({ name: m.medicine_name, category: m.category }))
    };

    const prompt = `As a Barangay Health AI, analyze this data and return a JSON with health recommendations.

DATA: ${JSON.stringify(promptData)}

Return ONLY this JSON (no markdown):
{
  "summary": "Brief summary",
  "priorityResidents": {"title": "Priority Residents", "recommendations": [{"resident": "name", "riskLevel": "Critical", "action": "action", "urgency": "immediate", "reason": "reason"}]},
  "followUpResidents": {"title": "Follow-up", "details": []},
  "purokPriority": {"title": "Purok Priorities", "rankings": []},
  "diseaseTrend": {"title": "Disease Trends", "trends": []},
  "healthProgramRecommendation": {"title": "Programs", "programs": []},
  "medicineDemandForecast": {"title": "Medicine Forecast", "forecasts": []},
  "referralRecommendation": {"title": "Referrals", "referrals": []},
  "homeVisitRecommendation": {"title": "Home Visits", "visits": []},
  "scheduleRecommendation": {"title": "Scheduling", "schedules": []},
  "communityHealthAlert": {"title": "Alerts", "alerts": []}
}`;

    console.log('Calling Gemini API...');
    
    // Use fetch directly instead of SDK to avoid hanging
    const modelsToTry = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-1.5-flash'];
    let aiResponse = null;
    let usedModel = null;

    for (const modelName of modelsToTry) {
      try {
        console.log(`Trying model: ${modelName}`);
        
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 25000); // 25 second timeout
        
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: { temperature: 0.7, maxOutputTokens: 2048 }
            }),
            signal: controller.signal
          }
        );
        
        clearTimeout(timeout);
        
        if (!response.ok) {
          console.log(`Model ${modelName} failed with status: ${response.status}`);
          continue;
        }
        
        aiResponse = await response.json();
        usedModel = modelName;
        console.log(`Success with model: ${modelName}`);
        break;
      } catch (e) {
        console.log(`Model ${modelName} error: ${e.message}`);
      }
    }

    if (!aiResponse) {
      console.log('All models failed, returning fallback');
      return res.json({
        success: true,
        data: {
          summary: `${promptData.totalResidents} residents. ${promptData.criticalCount} critical, ${promptData.highRiskCount} high risk.`,
          priorityResidents: {
            title: "Priority Residents",
            recommendations: promptData.criticalResidents.map(r => ({
              resident: r.name,
              riskLevel: "Critical",
              action: "Schedule immediate checkup",
              urgency: "immediate",
              reason: `Risk score ${r.riskScore}. BP: ${r.bp}, Sugar: ${r.sugar}`
            }))
          },
          followUpResidents: { title: "Follow-up", details: [] },
          purokPriority: { title: "Purok Priorities", rankings: [] },
          diseaseTrend: { title: "Disease Trends", trends: promptData.topDiseases.map(d => ({ disease: d.name, count: d.count, observation: `${d.count} cases`, recommendation: "Monitor" })) },
          healthProgramRecommendation: { title: "Programs", programs: [] },
          medicineDemandForecast: { title: "Medicine Forecast", forecasts: [] },
          referralRecommendation: { title: "Referrals", referrals: [] },
          homeVisitRecommendation: { title: "Home Visits", visits: [] },
          scheduleRecommendation: { title: "Scheduling", schedules: [] },
          communityHealthAlert: { title: "Alerts", alerts: [] },
          generatedAt: new Date().toISOString(),
          period,
          modelUsed: 'fallback'
        }
      });
    }

    // Parse AI response
    const text = aiResponse.candidates?.[0]?.content?.parts?.[0]?.text || '';
    console.log('AI response length:', text.length);
    
    const cleanText = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    let analysis;
    try {
      analysis = JSON.parse(cleanText);
      console.log('JSON parsed successfully');
    } catch (e) {
      console.log('JSON parse failed, using text as summary');
      analysis = {
        summary: cleanText.substring(0, 500) || "AI recommendations generated",
        priorityResidents: { title: "Priority Residents", recommendations: [] },
        followUpResidents: { title: "Follow-up", details: [] },
        purokPriority: { title: "Purok Priorities", rankings: [] },
        diseaseTrend: { title: "Disease Trends", trends: [] },
        healthProgramRecommendation: { title: "Programs", programs: [] },
        medicineDemandForecast: { title: "Medicine Forecast", forecasts: [] },
        referralRecommendation: { title: "Referrals", referrals: [] },
        homeVisitRecommendation: { title: "Home Visits", visits: [] },
        scheduleRecommendation: { title: "Scheduling", schedules: [] },
        communityHealthAlert: { title: "Alerts", alerts: [] }
      };
    }

    console.log('Returning response');
    return res.json({
      success: true,
      data: {
        ...analysis,
        generatedAt: new Date().toISOString(),
        period,
        modelUsed: usedModel
      }
    });

  } catch (error) {
    console.error('AI Error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate AI recommendation',
      error: error.message
    });
  }
};