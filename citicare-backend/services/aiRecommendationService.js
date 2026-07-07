const { supabaseAdmin } = require('../config/supabase');
const { GoogleGenerativeAI } = require('@google/generative-ai');

class AIRecommendationService {
    constructor() {
        this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        // 'gemini-pro' has been retired by Google; use a currently supported model.
        this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
    }

    async generateRecommendations(residentId, period) {
        try {
            // Gather resident data
            const residentData = await this.gatherResidentData(residentId);

            // Generate recommendations using Gemini
            const prompt = this.buildPrompt(residentData, period);
            const result = await this.model.generateContent(prompt);
            const recommendationText = result.response.text();

            // Store recommendation
            const { data, error } = await supabaseAdmin
                .from('ai_recommendations')
                .insert({
                    resident_id: residentId,
                    recommendation_type: period,
                    recommendation_text: recommendationText,
                    generated_at: new Date().toISOString()
                })
                .select()
                .single();

            if (error) throw error;

            return data;
        } catch (error) {
            console.error('Error generating AI recommendations:', error);
            throw error;
        }
    }

    async gatherResidentData(residentId) {
        // Get resident basic info
        const { data: resident, error: residentError } = await supabaseAdmin
            .from('residents')
            .select('*')
            .eq('id', residentId)
            .single();

        if (residentError) throw residentError;

        // Get chronic conditions
        const { data: conditions, error: conditionError } = await supabaseAdmin
            .from('chronic_conditions')
            .select('*')
            .eq('resident_id', residentId)
            .eq('status', 'Active');

        if (conditionError) throw conditionError;

        // Get medications
        const { data: medications, error: medError } = await supabaseAdmin
            .from('resident_medications')
            .select('*')
            .eq('resident_id', residentId)
            .eq('status', 'Active');

        if (medError) throw medError;

        // Get latest vital signs
        const { data: vitals, error: vitalError } = await supabaseAdmin
            .from('vital_signs')
            .select('*')
            .eq('resident_id', residentId)
            .order('recorded_at', { ascending: false })
            .limit(5);

        if (vitalError) throw vitalError;

        // Get appointments
        const { data: appointments, error: appError } = await supabaseAdmin
            .from('checkups_and_appointments')
            .select('*')
            .eq('resident_id', residentId)
            .order('scheduled_date', { ascending: false })
            .limit(5);

        if (appError) throw appError;

        return {
            resident,
            conditions: conditions || [],
            medications: medications || [],
            vitals: vitals || [],
            appointments: appointments || []
        };
    }

    buildPrompt(residentData, period) {
        const age = this.calculateAge(residentData.resident.birth_date);

        let prompt = `As a healthcare AI assistant for the CitiCare Barangay Gumamela Healthcare Monitoring System, provide health recommendations for a ${residentData.resident.sex} resident aged ${age} years old.

Resident Information:
- Name: ${residentData.resident.first_name} ${residentData.resident.last_name}
- Age: ${age}
- Sex: ${residentData.resident.sex}
- Civil Status: ${residentData.resident.civil_status}
- Health Risk Level: ${residentData.resident.risk_level || 'Not assessed'}

`;

        if (residentData.conditions && residentData.conditions.length > 0) {
            prompt += `Chronic Conditions:
${residentData.conditions.map(c => `- ${c.disease_name} (Diagnosed: ${c.date_diagnosed}, Severity: ${c.severity || 'Not specified'})`).join('\n')}
`;
        }

        if (residentData.medications && residentData.medications.length > 0) {
            prompt += `\nCurrent Medications:
${residentData.medications.map(m => `- ${m.medication_name}: ${m.dosage_frequency}${m.dosage ? `, ${m.dosage}` : ''}`).join('\n')}
`;
        }

        if (residentData.vitals && residentData.vitals.length > 0) {
            const latest = residentData.vitals[0];
            prompt += `\nLatest Vital Signs (${new Date(latest.recorded_at).toLocaleDateString()}):
- Blood Pressure: ${latest.systolic_bp || 'N/A'}/${latest.diastolic_bp || 'N/A'}
- Heart Rate: ${latest.heart_rate || 'N/A'} bpm
- Temperature: ${latest.temperature || 'N/A'} °C
- Weight: ${latest.weight_kg || 'N/A'} kg
- Height: ${latest.height_cm || 'N/A'} cm
`;
        }

        prompt += `\nBased on this information, provide ${period} health recommendations for this resident. Include:

1. Specific lifestyle recommendations tailored to their health condition
2. Medication management advice if applicable
3. Diet and exercise recommendations
4. Follow-up care suggestions
5. Warning signs to watch for

Make the recommendations practical, actionable, and personalized to the resident's specific health profile.

Recommendations:`;

        return prompt;
    }

    calculateAge(birthDate) {
        const today = new Date();
        const birth = new Date(birthDate);
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        return age;
    }

    async getResidentRecommendations(residentId, period = null) {
        try {
            let query = supabaseAdmin
                .from('ai_recommendations')
                .select('*')
                .eq('resident_id', residentId)
                .order('generated_at', { ascending: false });

            if (period) {
                query = query.eq('recommendation_type', period);
            }

            const { data, error } = await query;
            if (error) throw error;

            return data || [];
        } catch (error) {
            console.error('Error getting recommendations:', error);
            throw error;
        }
    }

    async generateBulkRecommendations(period) {
        try {
            // Get all residents with health profiles
            const { data: residents, error } = await supabaseAdmin
                .from('residents')
                .select('id, birth_date, sex, first_name, last_name')
                .eq('is_archived', false);

            if (error) throw error;

            const recommendations = [];
            for (const resident of residents) {
                try {
                    const rec = await this.generateRecommendations(resident.id, period);
                    recommendations.push(rec);
                } catch (err) {
                    console.error(`Failed to generate for resident ${resident.id}:`, err);
                }
            }

            return recommendations;
        } catch (error) {
            console.error('Error generating bulk recommendations:', error);
            throw error;
        }
    }
}

module.exports = new AIRecommendationService();
