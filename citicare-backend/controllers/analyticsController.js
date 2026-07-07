const analyticsService = require('../services/analyticsService');
const { supabaseAdmin } = require('../config/supabase');

class AnalyticsController {
    // Get overall statistics
    async getOverallStatistics(req, res) {
        try {
            const stats = await analyticsService.getOverallStatistics();
            res.json(stats);
        } catch (error) {
            console.error('Get overall statistics error:', error);
            res.status(500).json({ error: 'Failed to fetch statistics', details: error.message });
        }
    }

    // Get monthly risk distribution
    async getMonthlyRiskDistribution(req, res) {
        try {
            const { year } = req.query;
            const data = await analyticsService.getMonthlyRiskDistribution(year);
            res.json(data);
        } catch (error) {
            console.error('Get monthly risk distribution error:', error);
            res.status(500).json({ error: 'Failed to fetch risk distribution', details: error.message });
        }
    }

    // Get purok risk distribution
    async getPurokRiskDistribution(req, res) {
        try {
            const data = await analyticsService.getPurokRiskDistribution();
            res.json(data);
        } catch (error) {
            console.error('Get purok risk distribution error:', error);
            res.status(500).json({ error: 'Failed to fetch purok risk distribution', details: error.message });
        }
    }

    // Get common diseases by purok
    async getCommonDiseasesByPurok(req, res) {
        try {
            const data = await analyticsService.getCommonDiseasesByPurok();
            res.json(data);
        } catch (error) {
            console.error('Get common diseases error:', error);
            res.status(500).json({ error: 'Failed to fetch common diseases', details: error.message });
        }
    }

    // Get BHW workload
    async getBHWWorkload(req, res) {
        try {
            const data = await analyticsService.getBHWWorkload();
            res.json(data);
        } catch (error) {
            console.error('Get BHW workload error:', error);
            res.status(500).json({ error: 'Failed to fetch BHW workload', details: error.message });
        }
    }

    // Get resident risk distribution
    async getResidentRiskDistribution(req, res) {
        try {
            const { purokId } = req.query;

            if (purokId) {
                // Get households in the purok first (nested relations can't
                // be filtered with a plain .eq(), so resolve in two steps)
                const { data: households, error: householdError } = await supabaseAdmin
                    .from('households')
                    .select('id')
                    .eq('purok_id', purokId);

                if (householdError) throw householdError;

                if (!households || households.length === 0) {
                    return res.json({ Critical: 0, High: 0, Moderate: 0, Low: 0 });
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
                        .select('risk_level')
                        .in('resident_id', residentIds);

                    if (error) throw error;
                    return res.json(this.calculateRiskCounts(data));
                }
                return res.json({ Critical: 0, High: 0, Moderate: 0, Low: 0 });
            }

            const { data, error } = await supabaseAdmin
                .from('health_profiles')
                .select('risk_level, residents(household_id, households(purok_id))');
            if (error) throw error;

            res.json(this.calculateRiskCounts(data));
        } catch (error) {
            console.error('Get resident risk distribution error:', error);
            res.status(500).json({ error: 'Failed to fetch risk distribution', details: error.message });
        }
    }

    // Helper method to calculate risk counts
    calculateRiskCounts(data) {
        const riskCounts = {
            Critical: 0,
            High: 0,
            Moderate: 0,
            Low: 0
        };

        data.forEach(profile => {
            if (profile.risk_level && riskCounts[profile.risk_level] !== undefined) {
                riskCounts[profile.risk_level]++;
            }
        });

        return riskCounts;
    }

    // Get focus group statistics
    async getFocusGroupStats(req, res) {
        try {
            const { data, error } = await supabaseAdmin
                .from('resident_focus_groups')
                .select(`
                    focus_group_id,
                    focus_groups(group_name),
                    resident_id
                `);

            if (error) throw error;

            const groupStats = {};
            data.forEach(item => {
                const name = item.focus_groups?.group_name || 'Unknown';
                if (!groupStats[name]) {
                    groupStats[name] = 0;
                }
                groupStats[name]++;
            });

            res.json(groupStats);
        } catch (error) {
            console.error('Get focus group stats error:', error);
            res.status(500).json({ error: 'Failed to fetch focus group statistics', details: error.message });
        }
    }
}

const analyticsControllerInstance = new AnalyticsController();

// Express calls route handlers as plain function references (e.g.
// `router.get('/x', analyticsController.getResidentRiskDistribution)`),
// which loses the `this` binding. Bind every method to the instance so
// methods that call `this.someHelper()` keep working.
Object.getOwnPropertyNames(AnalyticsController.prototype)
    .filter(name => name !== 'constructor')
    .forEach(name => {
        analyticsControllerInstance[name] = analyticsControllerInstance[name].bind(analyticsControllerInstance);
    });

module.exports = analyticsControllerInstance;