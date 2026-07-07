const { supabaseAdmin } = require('../config/supabase');

class RiskScoreService {
    async calculateResidentRisk(residentId) {
        try {
            // Get resident details
            const { data: resident, error: residentError } = await supabaseAdmin
                .from('residents')
                .select('*')
                .eq('id', residentId)
                .single();

            if (residentError) throw residentError;

            // Get chronic conditions
            const { data: chronicConditions, error: chronicError } = await supabaseAdmin
                .from('chronic_conditions')
                .select('*')
                .eq('resident_id', residentId)
                .eq('status', 'Active');

            if (chronicError) throw chronicError;

            // Get latest vital signs
            const { data: vitalSigns, error: vitalError } = await supabaseAdmin
                .from('vital_signs')
                .select('*')
                .eq('resident_id', residentId)
                .order('recorded_at', { ascending: false })
                .limit(1);

            if (vitalError) throw vitalError;

            // Get missed appointments
            const { data: appointments, error: appointmentError } = await supabaseAdmin
                .from('checkups_and_appointments')
                .select('*')
                .eq('resident_id', residentId)
                .eq('status', 'Pending')
                .lt('scheduled_date', new Date().toISOString().split('T')[0]);

            if (appointmentError) throw appointmentError;

            // Calculate risk score
            const age = this.calculateAge(resident.birth_date);
            let riskScore = 0;

            // Age factor
            if (age < 1) riskScore += 15;
            else if (age >= 60) riskScore += 20;
            else if (age >= 50) riskScore += 10;
            else if (age >= 40) riskScore += 5;

            // Chronic conditions factor
            riskScore += (chronicConditions || []).length * 10;

            // Vital signs factors
            const latestVital = vitalSigns && vitalSigns.length > 0 ? vitalSigns[0] : null;
            if (latestVital) {
                // Blood pressure
                if (latestVital.systolic_bp >= 140 || latestVital.diastolic_bp >= 90) {
                    riskScore += 15;
                } else if (latestVital.systolic_bp >= 130 || latestVital.diastolic_bp >= 85) {
                    riskScore += 10;
                } else if (latestVital.systolic_bp >= 120 || latestVital.diastolic_bp >= 80) {
                    riskScore += 5;
                }

                // Heart rate
                if (latestVital.heart_rate > 100 || latestVital.heart_rate < 60) {
                    riskScore += 8;
                } else if (latestVital.heart_rate > 90 || latestVital.heart_rate < 65) {
                    riskScore += 5;
                }

                // Temperature
                if (latestVital.temperature > 38.0 || latestVital.temperature < 36.0) {
                    riskScore += 8;
                } else if (latestVital.temperature > 37.5 || latestVital.temperature < 36.5) {
                    riskScore += 4;
                }

                // BMI
                if (latestVital.weight_kg && latestVital.height_cm) {
                    const bmi = latestVital.weight_kg / ((latestVital.height_cm / 100) ** 2);
                    if (bmi >= 30 || bmi < 18.5) riskScore += 10;
                    else if (bmi >= 25 || bmi < 20) riskScore += 5;
                }
            }

            // Missed appointments factor
            riskScore += (appointments || []).length * 3;

            // Cap at 100
            riskScore = Math.min(riskScore, 100);

            // Determine risk level
            let riskLevel = 'Low';
            if (riskScore >= 75) riskLevel = 'Critical';
            else if (riskScore >= 50) riskLevel = 'High';
            else if (riskScore >= 25) riskLevel = 'Moderate';

            // Update health profile
            const { error: updateError } = await supabaseAdmin
                .from('health_profiles')
                .update({
                    current_risk_score: riskScore,
                    risk_level: riskLevel,
                    last_calculated_at: new Date().toISOString()
                })
                .eq('resident_id', residentId);

            if (updateError) throw updateError;

            // Update resident classification
            await this.updateResidentClassification(residentId, age);

            // Update purok risk score
            await this.updatePurokRiskScore(resident.household_id);

            return { riskScore, riskLevel };
        } catch (error) {
            console.error('Error calculating risk score:', error);
            throw error;
        }
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

    async updateResidentClassification(residentId, age) {
        try {
            const updates = {
                is_infant: age < 1,
                is_senior: age >= 60
            };

            // Check if PWD
            const { data: pwdCheck } = await supabaseAdmin
                .from('resident_focus_groups')
                .select('focus_group_id')
                .eq('resident_id', residentId)
                .eq('focus_group_id', 'pwd');

            updates.is_pwd = pwdCheck && pwdCheck.length > 0;

            const { error } = await supabaseAdmin
                .from('residents')
                .update(updates)
                .eq('id', residentId);

            if (error) throw error;
        } catch (error) {
            console.error('Error updating resident classification:', error);
            // Don't throw - this is a secondary operation
        }
    }

    async updatePurokRiskScore(householdId) {
        try {
            if (!householdId) return;

            // Get purok from household
            const { data: household, error: householdError } = await supabaseAdmin
                .from('households')
                .select('purok_id')
                .eq('id', householdId)
                .single();

            if (householdError) {
                console.error('Household fetch error:', householdError);
                return;
            }

            // Get all households in this purok
            const { data: households, error: householdsError } = await supabaseAdmin
                .from('households')
                .select('id')
                .eq('purok_id', household.purok_id);

            if (householdsError) {
                console.error('Households fetch error:', householdsError);
                return;
            }

            if (!households || households.length === 0) return;

            const householdIds = households.map(h => h.id);

            // Get all residents in these households
            const { data: residents, error: residentError } = await supabaseAdmin
                .from('residents')
                .select('id')
                .in('household_id', householdIds)
                .eq('is_archived', false);

            if (residentError) {
                console.error('Residents fetch error:', residentError);
                return;
            }

            if (!residents || residents.length === 0) return;

            const residentIds = residents.map(r => r.id);

            // Get health profiles
            const { data: profiles, error: profileError } = await supabaseAdmin
                .from('health_profiles')
                .select('current_risk_score, risk_level')
                .in('resident_id', residentIds);

            if (profileError) {
                console.error('Profiles fetch error:', profileError);
                return;
            }

            if (!profiles || profiles.length === 0) return;

            // Calculate average risk score
            const totalScore = profiles.reduce((sum, p) => sum + (p.current_risk_score || 0), 0);
            const avgScore = profiles.length > 0 ? totalScore / profiles.length : 0;

            // Determine purok risk level
            let purokRiskLevel = 'Low';
            if (avgScore >= 75) purokRiskLevel = 'Critical';
            else if (avgScore >= 50) purokRiskLevel = 'High';
            else if (avgScore >= 25) purokRiskLevel = 'Moderate';

            const { error: updateError } = await supabaseAdmin
                .from('puroks')
                .update({
                    current_risk_score: Math.round(avgScore * 100) / 100,
                    risk_level: purokRiskLevel,
                    total_residents: profiles.length
                })
                .eq('id', household.purok_id);

            if (updateError) {
                console.error('Purok update error:', updateError);
            }
        } catch (error) {
            console.error('Error updating purok risk score:', error);
        }
    }
}

module.exports = new RiskScoreService();
