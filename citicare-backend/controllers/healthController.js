const { supabaseAdmin } = require('../config/supabase');
const riskScoreService = require('../services/riskScoreService');
const aiRecommendationService = require('../services/aiRecommendationService');

class HealthController {
    // Get health profile by resident ID
    async getHealthProfile(req, res) {
        try {
            const { residentId } = req.params;

            const { data, error } = await supabaseAdmin
                .from('health_profiles')
                .select(`
                    *,
                    residents(
                        id,
                        first_name,
                        last_name,
                        birth_date,
                        sex,
                        household_id,
                        households(
                            household_number,
                            puroks(
                                id,
                                purok_name
                            )
                        )
                    )
                `)
                .eq('resident_id', residentId)
                .single();

            if (error) throw error;
            if (!data) {
                return res.status(404).json({ error: 'Health profile not found' });
            }

            res.json(data);
        } catch (error) {
            console.error('Get health profile error:', error);
            res.status(500).json({ error: 'Failed to fetch health profile', details: error.message });
        }
    }

    // Update health profile
    async updateHealthProfile(req, res) {
        try {
            const { residentId } = req.params;
            const { blood_type, has_chronic_condition } = req.body;

            const { data, error } = await supabaseAdmin
                .from('health_profiles')
                .update({
                    blood_type,
                    has_chronic_condition: has_chronic_condition || false,
                    last_calculated_at: new Date().toISOString()
                })
                .eq('resident_id', residentId)
                .select()
                .single();

            if (error) throw error;
            if (!data) {
                return res.status(404).json({ error: 'Health profile not found' });
            }

            // Recalculate risk score
            await riskScoreService.calculateResidentRisk(residentId);

            res.json({
                message: 'Health profile updated successfully',
                profile: data
            });
        } catch (error) {
            console.error('Update health profile error:', error);
            res.status(500).json({ error: 'Failed to update health profile', details: error.message });
        }
    }

    // Get vital signs by resident ID
    async getVitalSigns(req, res) {
        try {
            const { residentId } = req.params;
            const { limit = 10 } = req.query;

            const { data, error } = await supabaseAdmin
                .from('vital_signs')
                .select(`
                    *,
                    bhws(
                        id,
                        first_name,
                        last_name
                    )
                `)
                .eq('resident_id', residentId)
                .order('recorded_at', { ascending: false })
                .limit(parseInt(limit));

            if (error) throw error;

            res.json(data || []);
        } catch (error) {
            console.error('Get vital signs error:', error);
            res.status(500).json({ error: 'Failed to fetch vital signs', details: error.message });
        }
    }

    // Get latest vital signs
    async getLatestVitalSigns(req, res) {
        try {
            const { residentId } = req.params;

            const { data, error } = await supabaseAdmin
                .from('vital_signs')
                .select(`
                    *,
                    bhws(
                        id,
                        first_name,
                        last_name
                    )
                `)
                .eq('resident_id', residentId)
                .order('recorded_at', { ascending: false })
                .limit(1);

            if (error) throw error;

            if (!data || data.length === 0) {
                return res.status(404).json({ error: 'No vital signs found' });
            }

            res.json(data[0]);
        } catch (error) {
            console.error('Get latest vital signs error:', error);
            res.status(500).json({ error: 'Failed to fetch latest vital signs', details: error.message });
        }
    }

    // Record vital signs
    async recordVitalSigns(req, res) {
        try {
            const { residentId } = req.params;
            const vitalData = req.body;
            const userId = req.user.id;

            // Get BHW ID from user
            let bhwId = vitalData.recorded_by_bhw_id;
            if (!bhwId) {
                const { data: bhw, error: bhwError } = await supabaseAdmin
                    .from('bhws')
                    .select('id')
                    .eq('user_id', userId)
                    .single();

                if (bhwError) {
                    return res.status(400).json({ error: 'BHW not found or not specified' });
                }
                bhwId = bhw.id;
            }

            const { data, error } = await supabaseAdmin
                .from('vital_signs')
                .insert({
                    resident_id: residentId,
                    recorded_by_bhw_id: bhwId,
                    systolic_bp: vitalData.systolic_bp,
                    diastolic_bp: vitalData.diastolic_bp,
                    heart_rate: vitalData.heart_rate,
                    temperature: vitalData.temperature,
                    weight_kg: vitalData.weight_kg,
                    height_cm: vitalData.height_cm,
                    recorded_at: vitalData.recorded_at || new Date().toISOString()
                })
                .select()
                .single();

            if (error) throw error;

            // Add to medical history
            await supabaseAdmin
                .from('medical_histories')
                .insert({
                    resident_id: residentId,
                    event_date: new Date().toISOString().split('T')[0],
                    event_type: 'Vital Signs Recorded',
                    description: `Vital signs recorded: BP ${vitalData.systolic_bp || 'N/A'}/${vitalData.diastolic_bp || 'N/A'}, HR ${vitalData.heart_rate || 'N/A'}, Temp ${vitalData.temperature || 'N/A'}°C`,
                    reference_table: 'vital_signs',
                    reference_id: data.id,
                    created_by: userId
                });

            // Recalculate risk score
            await riskScoreService.calculateResidentRisk(residentId);

            res.status(201).json({
                message: 'Vital signs recorded successfully',
                vital_signs: data
            });
        } catch (error) {
            console.error('Record vital signs error:', error);
            res.status(500).json({ error: 'Failed to record vital signs', details: error.message });
        }
    }

    // Get chronic conditions by resident ID
    async getChronicConditions(req, res) {
        try {
            const { residentId } = req.params;

            const { data, error } = await supabaseAdmin
                .from('chronic_conditions')
                .select('*')
                .eq('resident_id', residentId)
                .order('created_at', { ascending: false });

            if (error) throw error;

            res.json(data || []);
        } catch (error) {
            console.error('Get chronic conditions error:', error);
            res.status(500).json({ error: 'Failed to fetch chronic conditions', details: error.message });
        }
    }

    // Add chronic condition
    async addChronicCondition(req, res) {
        try {
            const { residentId } = req.params;
            const conditionData = req.body;

            const { data, error } = await supabaseAdmin
                .from('chronic_conditions')
                .insert({
                    resident_id: residentId,
                    disease_name: conditionData.disease_name,
                    date_diagnosed: conditionData.date_diagnosed || new Date().toISOString().split('T')[0],
                    severity: conditionData.severity || 'Moderate',
                    status: conditionData.status || 'Active'
                })
                .select()
                .single();

            if (error) throw error;

            // Add to medical history
            await supabaseAdmin
                .from('medical_histories')
                .insert({
                    resident_id: residentId,
                    event_date: conditionData.date_diagnosed || new Date().toISOString().split('T')[0],
                    event_type: 'Chronic Condition Added',
                    description: `Diagnosed with ${conditionData.disease_name}`,
                    reference_table: 'chronic_conditions',
                    reference_id: data.id,
                    created_by: req.user.id
                });

            // Update health profile
            await supabaseAdmin
                .from('health_profiles')
                .update({ has_chronic_condition: true })
                .eq('resident_id', residentId);

            // Recalculate risk score
            await riskScoreService.calculateResidentRisk(residentId);

            res.status(201).json({
                message: 'Chronic condition added successfully',
                condition: data
            });
        } catch (error) {
            console.error('Add chronic condition error:', error);
            res.status(500).json({ error: 'Failed to add chronic condition', details: error.message });
        }
    }

    // Update chronic condition
    async updateChronicCondition(req, res) {
        try {
            const { residentId, conditionId } = req.params;
            const conditionData = req.body;

            const { data, error } = await supabaseAdmin
                .from('chronic_conditions')
                .update({
                    disease_name: conditionData.disease_name,
                    date_diagnosed: conditionData.date_diagnosed,
                    severity: conditionData.severity,
                    status: conditionData.status
                })
                .eq('id', conditionId)
                .eq('resident_id', residentId)
                .select()
                .single();

            if (error) throw error;
            if (!data) {
                return res.status(404).json({ error: 'Chronic condition not found' });
            }

            // Recalculate risk score
            await riskScoreService.calculateResidentRisk(residentId);

            res.json({
                message: 'Chronic condition updated successfully',
                condition: data
            });
        } catch (error) {
            console.error('Update chronic condition error:', error);
            res.status(500).json({ error: 'Failed to update chronic condition', details: error.message });
        }
    }

    // Delete chronic condition
    async deleteChronicCondition(req, res) {
        try {
            const { residentId, conditionId } = req.params;

            const { error } = await supabaseAdmin
                .from('chronic_conditions')
                .delete()
                .eq('id', conditionId)
                .eq('resident_id', residentId);

            if (error) throw error;

            // Check if there are any remaining chronic conditions
            const { count, error: countError } = await supabaseAdmin
                .from('chronic_conditions')
                .select('*', { count: 'exact', head: true })
                .eq('resident_id', residentId);

            if (countError) throw countError;

            // Update health profile if no chronic conditions
            if (count === 0) {
                await supabaseAdmin
                    .from('health_profiles')
                    .update({ has_chronic_condition: false })
                    .eq('resident_id', residentId);
            }

            // Recalculate risk score
            await riskScoreService.calculateResidentRisk(residentId);

            res.json({ message: 'Chronic condition deleted successfully' });
        } catch (error) {
            console.error('Delete chronic condition error:', error);
            res.status(500).json({ error: 'Failed to delete chronic condition', details: error.message });
        }
    }

    // Get medications by resident ID
    async getMedications(req, res) {
        try {
            const { residentId } = req.params;

            const { data, error } = await supabaseAdmin
                .from('resident_medications')
                .select('*')
                .eq('resident_id', residentId)
                .order('created_at', { ascending: false });

            if (error) throw error;

            res.json(data || []);
        } catch (error) {
            console.error('Get medications error:', error);
            res.status(500).json({ error: 'Failed to fetch medications', details: error.message });
        }
    }

    // Add medication
    async addMedication(req, res) {
        try {
            const { residentId } = req.params;
            const medData = req.body;

            const { data, error } = await supabaseAdmin
                .from('resident_medications')
                .insert({
                    resident_id: residentId,
                    medication_name: medData.medication_name,
                    dosage: medData.dosage,
                    dosage_frequency: medData.dosage_frequency,
                    start_date: medData.start_date || new Date().toISOString().split('T')[0],
                    end_date: medData.end_date,
                    status: medData.status || 'Active'
                })
                .select()
                .single();

            if (error) throw error;

            // Add to medical history
            await supabaseAdmin
                .from('medical_histories')
                .insert({
                    resident_id: residentId,
                    event_date: new Date().toISOString().split('T')[0],
                    event_type: 'Medication Added',
                    description: `Prescribed ${medData.medication_name} ${medData.dosage || ''} ${medData.dosage_frequency || ''}`,
                    reference_table: 'resident_medications',
                    reference_id: data.id,
                    created_by: req.user.id
                });

            res.status(201).json({
                message: 'Medication added successfully',
                medication: data
            });
        } catch (error) {
            console.error('Add medication error:', error);
            res.status(500).json({ error: 'Failed to add medication', details: error.message });
        }
    }

    // Update medication
    async updateMedication(req, res) {
        try {
            const { residentId, medicationId } = req.params;
            const medData = req.body;

            const { data, error } = await supabaseAdmin
                .from('resident_medications')
                .update({
                    medication_name: medData.medication_name,
                    dosage: medData.dosage,
                    dosage_frequency: medData.dosage_frequency,
                    start_date: medData.start_date,
                    end_date: medData.end_date,
                    status: medData.status
                })
                .eq('id', medicationId)
                .eq('resident_id', residentId)
                .select()
                .single();

            if (error) throw error;
            if (!data) {
                return res.status(404).json({ error: 'Medication not found' });
            }

            res.json({
                message: 'Medication updated successfully',
                medication: data
            });
        } catch (error) {
            console.error('Update medication error:', error);
            res.status(500).json({ error: 'Failed to update medication', details: error.message });
        }
    }

    // Delete medication
    async deleteMedication(req, res) {
        try {
            const { residentId, medicationId } = req.params;

            const { error } = await supabaseAdmin
                .from('resident_medications')
                .delete()
                .eq('id', medicationId)
                .eq('resident_id', residentId);

            if (error) throw error;

            res.json({ message: 'Medication deleted successfully' });
        } catch (error) {
            console.error('Delete medication error:', error);
            res.status(500).json({ error: 'Failed to delete medication', details: error.message });
        }
    }

    // Get allergens by resident ID
    async getAllergens(req, res) {
        try {
            const { residentId } = req.params;

            const { data, error } = await supabaseAdmin
                .from('resident_allergens')
                .select('*')
                .eq('resident_id', residentId)
                .order('created_at', { ascending: false });

            if (error) throw error;

            res.json(data || []);
        } catch (error) {
            console.error('Get allergens error:', error);
            res.status(500).json({ error: 'Failed to fetch allergens', details: error.message });
        }
    }

    // Add allergen
    async addAllergen(req, res) {
        try {
            const { residentId } = req.params;
            const allergenData = req.body;

            const { data, error } = await supabaseAdmin
                .from('resident_allergens')
                .insert({
                    resident_id: residentId,
                    allergen: allergenData.allergen,
                    severity_level: allergenData.severity_level || 'Moderate',
                    reaction: allergenData.reaction
                })
                .select()
                .single();

            if (error) throw error;

            // Add to medical history
            await supabaseAdmin
                .from('medical_histories')
                .insert({
                    resident_id: residentId,
                    event_date: new Date().toISOString().split('T')[0],
                    event_type: 'Allergen Added',
                    description: `Allergen: ${allergenData.allergen} (Severity: ${allergenData.severity_level || 'Not specified'})`,
                    reference_table: 'resident_allergens',
                    reference_id: data.id,
                    created_by: req.user.id
                });

            res.status(201).json({
                message: 'Allergen added successfully',
                allergen: data
            });
        } catch (error) {
            console.error('Add allergen error:', error);
            res.status(500).json({ error: 'Failed to add allergen', details: error.message });
        }
    }

    // Delete allergen
    async deleteAllergen(req, res) {
        try {
            const { residentId, allergenId } = req.params;

            const { error } = await supabaseAdmin
                .from('resident_allergens')
                .delete()
                .eq('id', allergenId)
                .eq('resident_id', residentId);

            if (error) throw error;

            res.json({ message: 'Allergen deleted successfully' });
        } catch (error) {
            console.error('Delete allergen error:', error);
            res.status(500).json({ error: 'Failed to delete allergen', details: error.message });
        }
    }

    // Get focus groups
    async getFocusGroups(req, res) {
        try {
            const { data, error } = await supabaseAdmin
                .from('focus_groups')
                .select('*')
                .order('group_name');

            if (error) throw error;

            res.json(data || []);
        } catch (error) {
            console.error('Get focus groups error:', error);
            res.status(500).json({ error: 'Failed to fetch focus groups', details: error.message });
        }
    }

    // Get resident focus groups
    async getResidentFocusGroups(req, res) {
        try {
            const { residentId } = req.params;

            const { data, error } = await supabaseAdmin
                .from('resident_focus_groups')
                .select(`
                    focus_group_id,
                    assigned_date,
                    focus_groups(
                        id,
                        group_name,
                        description
                    )
                `)
                .eq('resident_id', residentId);

            if (error) throw error;

            res.json(data.map(item => ({
                ...item,
                focus_group: item.focus_groups
            })));
        } catch (error) {
            console.error('Get resident focus groups error:', error);
            res.status(500).json({ error: 'Failed to fetch resident focus groups', details: error.message });
        }
    }

    // Update resident focus groups
    async updateResidentFocusGroups(req, res) {
        try {
            const { residentId } = req.params;
            const { focus_group_ids } = req.body;

            if (!focus_group_ids || !Array.isArray(focus_group_ids)) {
                return res.status(400).json({ error: 'Focus group IDs array is required' });
            }

            // Delete existing focus groups
            await supabaseAdmin
                .from('resident_focus_groups')
                .delete()
                .eq('resident_id', residentId);

            // Insert new focus groups
            if (focus_group_ids.length > 0) {
                const focusGroups = focus_group_ids.map(groupId => ({
                    resident_id: residentId,
                    focus_group_id: groupId,
                    assigned_date: new Date().toISOString()
                }));

                const { error } = await supabaseAdmin
                    .from('resident_focus_groups')
                    .insert(focusGroups);

                if (error) throw error;
            }

            res.json({
                message: 'Focus groups updated successfully'
            });
        } catch (error) {
            console.error('Update resident focus groups error:', error);
            res.status(500).json({ error: 'Failed to update focus groups', details: error.message });
        }
    }

    // Calculate risk score manually
    async calculateRiskScore(req, res) {
        try {
            const { residentId } = req.params;

            const result = await riskScoreService.calculateResidentRisk(residentId);

            res.json({
                message: 'Risk score calculated successfully',
                ...result
            });
        } catch (error) {
            console.error('Calculate risk score error:', error);
            res.status(500).json({ error: 'Failed to calculate risk score', details: error.message });
        }
    }

    // Get health statistics
    async getHealthStatistics(req, res) {
        try {
            const { purokId } = req.query;

            let query = supabaseAdmin
                .from('health_profiles')
                .select(`
                    risk_level,
                    current_risk_score,
                    residents(
                        household_id,
                        households(
                            purok_id
                        )
                    )
                `);

            if (purokId) {
                // Get households in the purok first (nested relations can't
                // be filtered with a plain .eq(), so resolve in two steps)
                const { data: households, error: householdError } = await supabaseAdmin
                    .from('households')
                    .select('id')
                    .eq('purok_id', purokId);

                if (householdError) throw householdError;

                if (!households || households.length === 0) {
                    return res.json(this.calculateHealthStats([]));
                }

                const householdIds = households.map(h => h.id);

                const { data: residents, error: residentError } = await supabaseAdmin
                    .from('residents')
                    .select('id')
                    .in('household_id', householdIds)
                    .eq('is_archived', false);

                if (residentError) throw residentError;
                
                if (residents && residents.length > 0) {
                    const residentIds = residents.map(r => r.id);
                    const { data, error } = await supabaseAdmin
                        .from('health_profiles')
                        .select('risk_level, current_risk_score')
                        .in('resident_id', residentIds);

                    if (error) throw error;
                    return res.json(this.calculateHealthStats(data));
                }
                return res.json(this.calculateHealthStats([]));
            }

            const { data, error } = await query;
            if (error) throw error;

            res.json(this.calculateHealthStats(data));
        } catch (error) {
            console.error('Get health statistics error:', error);
            res.status(500).json({ error: 'Failed to fetch health statistics', details: error.message });
        }
    }

    // Helper method to calculate health stats
    calculateHealthStats(data) {
        const stats = {
            total: data.length,
            riskDistribution: {
                Critical: 0,
                High: 0,
                Moderate: 0,
                Low: 0
            },
            averageRiskScore: 0,
            totalRiskScore: 0
        };

        data.forEach(profile => {
            if (profile.risk_level && stats.riskDistribution[profile.risk_level] !== undefined) {
                stats.riskDistribution[profile.risk_level]++;
            }
            if (profile.current_risk_score) {
                stats.totalRiskScore += profile.current_risk_score;
            }
        });

        stats.averageRiskScore = stats.total > 0 ? stats.totalRiskScore / stats.total : 0;

        return stats;
    }

    // Get vaccines
    async getVaccines(req, res) {
        try {
            const { data, error } = await supabaseAdmin
                .from('vaccines')
                .select('*')
                .order('vaccine_name');

            if (error) throw error;

            res.json(data || []);
        } catch (error) {
            console.error('Get vaccines error:', error);
            res.status(500).json({ error: 'Failed to fetch vaccines', details: error.message });
        }
    }

    // Get child immunizations
    async getChildImmunizations(req, res) {
        try {
            const { residentId } = req.params;

            const { data, error } = await supabaseAdmin
                .from('child_immunizations')
                .select(`
                    *,
                    vaccines(
                        id,
                        vaccine_name,
                        total_doses_required,
                        description
                    ),
                    vital_signs(
                        id,
                        temperature,
                        weight_kg,
                        recorded_at
                    ),
                    residents(first_name, last_name)
                `)
                .eq('resident_id', residentId)
                .order('date_administered', { ascending: false });

            if (error) throw error;

            res.json(data || []);
        } catch (error) {
            console.error('Get child immunizations error:', error);
            res.status(500).json({ error: 'Failed to fetch immunizations', details: error.message });
        }
    }

    // Add child immunization
    async addChildImmunization(req, res) {
        try {
            const { residentId } = req.params;
            const immunizationData = req.body;

            const { data, error } = await supabaseAdmin
                .from('child_immunizations')
                .insert({
                    resident_id: residentId,
                    vaccine_id: immunizationData.vaccine_id,
                    vital_signs_id: immunizationData.vital_signs_id,
                    dose_number: immunizationData.dose_number,
                    date_administered: immunizationData.date_administered || new Date().toISOString().split('T')[0],
                    remarks: immunizationData.remarks
                })
                .select()
                .single();

            if (error) throw error;

            // Add to medical history
            const { data: vaccine } = await supabaseAdmin
                .from('vaccines')
                .select('vaccine_name')
                .eq('id', immunizationData.vaccine_id)
                .single();

            await supabaseAdmin
                .from('medical_histories')
                .insert({
                    resident_id: residentId,
                    event_date: immunizationData.date_administered || new Date().toISOString().split('T')[0],
                    event_type: 'Immunization',
                    description: `Received ${vaccine?.vaccine_name || 'vaccine'} (Dose ${immunizationData.dose_number})`,
                    reference_table: 'child_immunizations',
                    reference_id: data.id,
                    created_by: req.user.id
                });

            res.status(201).json({
                message: 'Immunization recorded successfully',
                immunization: data
            });
        } catch (error) {
            console.error('Add child immunization error:', error);
            res.status(500).json({ error: 'Failed to record immunization', details: error.message });
        }
    }
}

const healthControllerInstance = new HealthController();

// Express calls route handlers as plain function references, which loses
// the `this` binding. Bind every method to the instance so methods that
// call `this.someHelper()` (e.g. getHealthStatistics -> calculateHealthStats)
// keep working.
Object.getOwnPropertyNames(HealthController.prototype)
    .filter(name => name !== 'constructor')
    .forEach(name => {
        healthControllerInstance[name] = healthControllerInstance[name].bind(healthControllerInstance);
    });

module.exports = healthControllerInstance;