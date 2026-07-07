const { supabaseAdmin } = require('../config/supabase');

class AnalyticsService {
    async getMonthlyRiskDistribution(year = null) {
        try {
            let query = supabaseAdmin
                .from('monthly_risk_distribution')
                .select('*')
                .order('month', { ascending: false });

            if (year) {
                const startDate = `${year}-01-01`;
                const endDate = `${year}-12-31`;
                query = query.gte('month', startDate).lte('month', endDate);
            }

            const { data, error } = await query;
            if (error) throw error;

            return data || [];
        } catch (error) {
            console.error('Error getting monthly risk distribution:', error);
            throw error;
        }
    }

    async getPurokRiskDistribution() {
        try {
            const { data, error } = await supabaseAdmin
                .from('purok_summary')
                .select('*')
                .order('purok_name');

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error getting purok risk distribution:', error);
            throw error;
        }
    }

    async getCommonDiseasesByPurok() {
        try {
            const { data, error } = await supabaseAdmin
                .from('common_diseases_by_purok')
                .select('*');

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error getting common diseases by purok:', error);
            throw error;
        }
    }

    async getOverallStatistics() {
        try {
            // Total residents
            const { count: totalResidents, error: residentError } = await supabaseAdmin
                .from('residents')
                .select('*', { count: 'exact', head: true })
                .eq('is_archived', false);

            if (residentError) throw residentError;

            // Total BHWs
            const { count: totalBHWs, error: bhwError } = await supabaseAdmin
                .from('bhws')
                .select('*', { count: 'exact', head: true });

            if (bhwError) throw bhwError;

            // Total Puroks
            const { count: totalPuroks, error: purokError } = await supabaseAdmin
                .from('puroks')
                .select('*', { count: 'exact', head: true });

            if (purokError) throw purokError;

            // Risk level distribution
            const { data: riskDistribution, error: riskError } = await supabaseAdmin
                .from('health_profiles')
                .select('risk_level')
                .not('risk_level', 'is', null);

            if (riskError) throw riskError;

            const riskCounts = {
                Critical: 0,
                High: 0,
                Moderate: 0,
                Low: 0
            };

            riskDistribution.forEach(profile => {
                if (profile.risk_level in riskCounts) {
                    riskCounts[profile.risk_level]++;
                }
            });

            // Focus group distribution
            const { data: focusGroups, error: focusError } = await supabaseAdmin
                .from('resident_focus_groups')
                .select(`
                    focus_group_id,
                    focus_groups(group_name)
                `);

            if (focusError) throw focusError;

            // Process focus group data
            const focusGroupDistribution = {};
            focusGroups.forEach(item => {
                const name = item.focus_groups?.group_name || 'Unknown';
                if (!focusGroupDistribution[name]) {
                    focusGroupDistribution[name] = 0;
                }
                focusGroupDistribution[name]++;
            });

            return {
                totalResidents: totalResidents || 0,
                totalBHWs: totalBHWs || 0,
                totalPuroks: totalPuroks || 0,
                riskDistribution: riskCounts,
                focusGroupDistribution: focusGroupDistribution
            };
        } catch (error) {
            console.error('Error getting overall statistics:', error);
            throw error;
        }
    }

    async getBHWWorkload() {
        try {
            const { data, error } = await supabaseAdmin
                .from('bhws')
                .select(`
                    id,
                    first_name,
                    last_name,
                    purok_id,
                    puroks(purok_name),
                    checkups_and_appointments(status)
                `);

            if (error) throw error;

            const bhwWorkload = data.map(bhw => ({
                id: bhw.id,
                name: `${bhw.first_name} ${bhw.last_name}`,
                purok: bhw.puroks?.purok_name || 'Unassigned',
                totalAppointments: bhw.checkups_and_appointments?.length || 0,
                pending: bhw.checkups_and_appointments?.filter(a => a.status === 'Pending')?.length || 0,
                completed: bhw.checkups_and_appointments?.filter(a => a.status === 'Completed')?.length || 0,
                cancelled: bhw.checkups_and_appointments?.filter(a => a.status === 'Cancelled')?.length || 0
            }));

            return bhwWorkload;
        } catch (error) {
            console.error('Error getting BHW workload:', error);
            throw error;
        }
    }
}

module.exports = new AnalyticsService();
