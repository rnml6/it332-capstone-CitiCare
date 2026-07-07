const { supabaseAdmin } = require('../config/supabase');

class PurokController {
    // Get all puroks
    async getAllPuroks(req, res) {
        try {
            const { data, error } = await supabaseAdmin
                .from('puroks')
                .select('*')
                .order('purok_name');

            if (error) throw error;

            res.json(data || []);
        } catch (error) {
            console.error('Get all puroks error:', error);
            res.status(500).json({ 
                error: 'Failed to fetch puroks', 
                details: error.message 
            });
        }
    }

    // Get purok by ID with full details
    async getPurokById(req, res) {
        try {
            const { id } = req.params;

            // Get the purok
            const { data: purok, error: purokError } = await supabaseAdmin
                .from('puroks')
                .select('*')
                .eq('id', id)
                .single();

            if (purokError) {
                console.error('Purok fetch error:', purokError);
                return res.status(500).json({ 
                    error: 'Failed to fetch purok', 
                    details: purokError.message 
                });
            }

            if (!purok) {
                return res.status(404).json({ error: 'Purok not found' });
            }

            // Get BHWs in this purok
            const { data: bhws, error: bhwError } = await supabaseAdmin
                .from('bhws')
                .select('id, first_name, last_name, contact_number, account_status, user_id')
                .eq('purok_id', id);

            if (bhwError) {
                console.error('BHW fetch error:', bhwError);
            }

            // Get households in this purok
            const { data: households, error: householdError } = await supabaseAdmin
                .from('households')
                .select('id, household_number, address')
                .eq('purok_id', id);

            if (householdError) {
                console.error('Household fetch error:', householdError);
            }

            // Get residents in this purok (through households)
            let residents = [];
            if (households && households.length > 0) {
                const householdIds = households.map(h => h.id);
                const { data: residentData, error: residentError } = await supabaseAdmin
                    .from('residents')
                    .select(`
                        id,
                        first_name,
                        last_name,
                        middle_name,
                        suffix,
                        birth_date,
                        sex,
                        civil_status,
                        contact_number,
                        is_household_head,
                        is_archived,
                        household_id,
                        health_profiles(current_risk_score, risk_level)
                    `)
                    .in('household_id', householdIds)
                    .eq('is_archived', false);

                if (!residentError) {
                    residents = residentData || [];
                } else {
                    console.error('Resident fetch error:', residentError);
                }
            }

            // Get common diseases in this purok
            let diseases = [];
            if (residents.length > 0) {
                const residentIds = residents.map(r => r.id);
                const { data: diseaseData, error: diseaseError } = await supabaseAdmin
                    .from('chronic_conditions')
                    .select('disease_name, severity')
                    .in('resident_id', residentIds)
                    .eq('status', 'Active');

                if (!diseaseError && diseaseData) {
                    const diseaseCount = {};
                    diseaseData.forEach(d => {
                        diseaseCount[d.disease_name] = (diseaseCount[d.disease_name] || 0) + 1;
                    });
                    diseases = Object.entries(diseaseCount)
                        .map(([name, count]) => ({ 
                            disease_name: name, 
                            disease_count: count 
                        }))
                        .sort((a, b) => b.disease_count - a.disease_count)
                        .slice(0, 10);
                }
            }

            // Calculate risk distribution
            const riskDistribution = {
                Critical: 0,
                High: 0,
                Moderate: 0,
                Low: 0
            };

            residents.forEach(resident => {
                if (resident.health_profiles && resident.health_profiles.risk_level) {
                    const level = resident.health_profiles.risk_level;
                    if (riskDistribution[level] !== undefined) {
                        riskDistribution[level]++;
                    }
                }
            });

            // Calculate average risk score
            let totalRiskScore = 0;
            let residentsWithScore = 0;
            residents.forEach(resident => {
                if (resident.health_profiles && resident.health_profiles.current_risk_score !== null) {
                    totalRiskScore += resident.health_profiles.current_risk_score;
                    residentsWithScore++;
                }
            });
            const averageRiskScore = residentsWithScore > 0 ? totalRiskScore / residentsWithScore : 0;

            // Get total households count
            const totalHouseholds = households ? households.length : 0;
            const totalResidents = residents.length;
            const totalBHWs = bhws ? bhws.length : 0;

            // Return complete purok data
            res.json({
                ...purok,
                statistics: {
                    total_residents: totalResidents,
                    total_households: totalHouseholds,
                    total_bhws: totalBHWs,
                    average_risk_score: Math.round(averageRiskScore * 100) / 100,
                    risk_distribution: riskDistribution
                },
                households: households || [],
                bhws: bhws || [],
                residents: residents || [],
                common_diseases: diseases || []
            });
            
        } catch (error) {
            console.error('Get purok error:', error);
            res.status(500).json({ 
                error: 'Failed to fetch purok details', 
                details: error.message 
            });
        }
    }

    // Get purok with stats (simplified version)
    async getPurokWithStats(req, res) {
        try {
            const { id } = req.params;

            console.log('Getting purok stats for ID:', id);

            // Get purok
            const { data: purok, error: purokError } = await supabaseAdmin
                .from('puroks')
                .select('*')
                .eq('id', id)
                .single();

            if (purokError) {
                console.error('Purok fetch error:', purokError);
                return res.status(500).json({ 
                    error: 'Failed to fetch purok', 
                    details: purokError.message 
                });
            }

            if (!purok) {
                return res.status(404).json({ error: 'Purok not found' });
            }

            // Get counts
            const { count: householdCount, error: householdError } = await supabaseAdmin
                .from('households')
                .select('*', { count: 'exact', head: true })
                .eq('purok_id', id);

            if (householdError) {
                console.error('Household count error:', householdError);
            }

            const { count: bhwCount, error: bhwError } = await supabaseAdmin
                .from('bhws')
                .select('*', { count: 'exact', head: true })
                .eq('purok_id', id);

            if (bhwError) {
                console.error('BHW count error:', bhwError);
            }

            // Get residents count through households
            let residentCount = 0;
            const { data: households, error: householdsError } = await supabaseAdmin
                .from('households')
                .select('id')
                .eq('purok_id', id);

            if (!householdsError && households && households.length > 0) {
                const householdIds = households.map(h => h.id);
                const { count, error: countError } = await supabaseAdmin
                    .from('residents')
                    .select('*', { count: 'exact', head: true })
                    .in('household_id', householdIds)
                    .eq('is_archived', false);

                if (!countError) {
                    residentCount = count || 0;
                }
            }

            // Get risk distribution
            const riskDistribution = { Critical: 0, High: 0, Moderate: 0, Low: 0 };
            
            if (households && households.length > 0) {
                const householdIds = households.map(h => h.id);
                const { data: residents, error: residentError } = await supabaseAdmin
                    .from('residents')
                    .select('id')
                    .in('household_id', householdIds)
                    .eq('is_archived', false);

                if (!residentError && residents && residents.length > 0) {
                    const residentIds = residents.map(r => r.id);
                    const { data: profiles, error: profileError } = await supabaseAdmin
                        .from('health_profiles')
                        .select('risk_level')
                        .in('resident_id', residentIds);

                    if (!profileError && profiles) {
                        profiles.forEach(profile => {
                            if (profile.risk_level && riskDistribution[profile.risk_level] !== undefined) {
                                riskDistribution[profile.risk_level]++;
                            }
                        });
                    }
                }
            }

            // Return stats
            res.json({
                id: purok.id,
                purok_name: purok.purok_name,
                current_risk_score: purok.current_risk_score || 0,
                risk_level: purok.risk_level || 'Low',
                total_residents: residentCount,
                stats: {
                    total_households: householdCount || 0,
                    total_residents: residentCount,
                    total_bhws: bhwCount || 0,
                    risk_distribution: riskDistribution
                }
            });

        } catch (error) {
            console.error('Get purok with stats error:', error);
            res.status(500).json({ 
                error: 'Failed to fetch purok statistics',
                details: error.message || 'Unknown error'
            });
        }
    }

    // Create purok
    async createPurok(req, res) {
        try {
            const { purok_name } = req.body;

            if (!purok_name) {
                return res.status(400).json({ error: 'Purok name is required' });
            }

            const { data, error } = await supabaseAdmin
                .from('puroks')
                .insert({ 
                    purok_name,
                    current_risk_score: 0,
                    risk_level: 'Low',
                    total_residents: 0
                })
                .select()
                .single();

            if (error) throw error;

            res.status(201).json({
                message: 'Purok created successfully',
                purok: data
            });
        } catch (error) {
            console.error('Create purok error:', error);
            res.status(500).json({ 
                error: 'Failed to create purok',
                details: error.message 
            });
        }
    }

    // Update purok
    async updatePurok(req, res) {
        try {
            const { id } = req.params;
            const { purok_name } = req.body;

            if (!purok_name) {
                return res.status(400).json({ error: 'Purok name is required' });
            }

            const { data, error } = await supabaseAdmin
                .from('puroks')
                .update({ purok_name })
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            if (!data) {
                return res.status(404).json({ error: 'Purok not found' });
            }

            res.json({
                message: 'Purok updated successfully',
                purok: data
            });
        } catch (error) {
            console.error('Update purok error:', error);
            res.status(500).json({ 
                error: 'Failed to update purok',
                details: error.message 
            });
        }
    }

    // Delete purok
    async deletePurok(req, res) {
        try {
            const { id } = req.params;

            // Check if purok has households
            const { count: householdCount, error: householdCheckError } = await supabaseAdmin
                .from('households')
                .select('*', { count: 'exact', head: true })
                .eq('purok_id', id);

            if (householdCheckError) throw householdCheckError;

            if (householdCount > 0) {
                return res.status(400).json({ 
                    error: 'Cannot delete purok with existing households. Please reassign or delete households first.' 
                });
            }

            // Check if purok has BHWs
            const { count: bhwCount, error: bhwCheckError } = await supabaseAdmin
                .from('bhws')
                .select('*', { count: 'exact', head: true })
                .eq('purok_id', id);

            if (bhwCheckError) throw bhwCheckError;

            if (bhwCount > 0) {
                return res.status(400).json({ 
                    error: 'Cannot delete purok with assigned BHWs. Please reassign BHWs first.' 
                });
            }

            const { error } = await supabaseAdmin
                .from('puroks')
                .delete()
                .eq('id', id);

            if (error) throw error;

            res.json({ message: 'Purok deleted successfully' });
        } catch (error) {
            console.error('Delete purok error:', error);
            res.status(500).json({ 
                error: 'Failed to delete purok',
                details: error.message 
            });
        }
    }

    // Get purok risk scores
    async getPurokRiskScores(req, res) {
        try {
            const { data, error } = await supabaseAdmin
                .from('puroks')
                .select('id, purok_name, current_risk_score, risk_level, total_residents')
                .order('current_risk_score', { ascending: false });

            if (error) throw error;

            res.json(data || []);
        } catch (error) {
            console.error('Get purok risk scores error:', error);
            res.status(500).json({ 
                error: 'Failed to fetch purok risk scores',
                details: error.message 
            });
        }
    }
}

module.exports = new PurokController();