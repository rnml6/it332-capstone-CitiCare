const aiRecommendationService = require('../services/aiRecommendationService');
const { supabaseAdmin } = require('../config/supabase');

class AIController {
    // Generate recommendations for a specific resident
    async generateRecommendations(req, res) {
        try {
            // Get residentId from either 'id' or 'residentId' param
            const residentId = req.params.id || req.params.residentId;
            const { period } = req.body;

            console.log('Generate - Resident ID:', residentId);
            console.log('Generate - Period:', period);

            if (!residentId) {
                return res.status(400).json({ error: 'Resident ID is required' });
            }

            if (!period) {
                return res.status(400).json({ error: 'Period is required (monthly, quarterly, or annual)' });
            }

            if (!['monthly', 'quarterly', 'annual'].includes(period)) {
                return res.status(400).json({ error: 'Period must be monthly, quarterly, or annual' });
            }

            const recommendation = await aiRecommendationService.generateRecommendations(residentId, period);
            
            res.status(201).json({
                message: 'AI recommendations generated successfully',
                recommendation
            });
        } catch (error) {
            console.error('Generate AI recommendations error:', error);
            res.status(500).json({ error: 'Failed to generate AI recommendations', details: error.message });
        }
    }

    // Get existing recommendations for a resident
    async getResidentRecommendations(req, res) {
        try {
            const residentId = req.params.id || req.params.residentId;
            const { period } = req.query;

            console.log('Get - Resident ID:', residentId);
            console.log('Get - Period:', period);

            if (!residentId) {
                return res.status(400).json({ error: 'Resident ID is required' });
            }

            const recommendations = await aiRecommendationService.getResidentRecommendations(residentId, period);
            
            res.json({
                residentId,
                count: recommendations.length,
                recommendations
            });
        } catch (error) {
            console.error('Get recommendations error:', error);
            res.status(500).json({ error: 'Failed to fetch recommendations', details: error.message });
        }
    }

    // Generate bulk recommendations
    async generateBulkRecommendations(req, res) {
        try {
            let period = req.params.period || req.body.period;
            
            if (!period) {
                return res.status(400).json({ error: 'Period is required (monthly, quarterly, or annual)' });
            }

            if (!['monthly', 'quarterly', 'annual'].includes(period)) {
                return res.status(400).json({ error: 'Period must be monthly, quarterly, or annual' });
            }

            const recommendations = await aiRecommendationService.generateBulkRecommendations(period);
            
            res.json({
                message: `Bulk recommendations generated successfully for ${period} period`,
                count: recommendations.recommendations?.length || 0,
                ...recommendations
            });
        } catch (error) {
            console.error('Bulk generate recommendations error:', error);
            res.status(500).json({ error: 'Failed to generate bulk recommendations', details: error.message });
        }
    }

    // Get purok-level recommendations
    async getPurokRecommendations(req, res) {
        try {
            const purokId = req.params.id;
            const { period } = req.query;

            console.log('Get Purok - Purok ID:', purokId);
            console.log('Get Purok - Period:', period);

            if (!purokId) {
                return res.status(400).json({ error: 'Purok ID is required' });
            }

            const recommendations = await aiRecommendationService.getPurokLevelRecommendations(purokId, period);
            
            res.json({
                purokId,
                count: recommendations.recommendations?.length || 0,
                ...recommendations
            });
        } catch (error) {
            console.error('Get purok recommendations error:', error);
            res.status(500).json({ error: 'Failed to fetch purok recommendations', details: error.message });
        }
    }

    // Get trend forecasting
    async getTrendForecast(req, res) {
        try {
            const { metric, months } = req.query;

            console.log('Forecast - Metric:', metric);
            console.log('Forecast - Months:', months);

            const forecast = await aiRecommendationService.getTrendForecasting();
            
            res.json({
                metric: metric || 'all',
                months: months || 6,
                forecast
            });
        } catch (error) {
            console.error('Get trend forecast error:', error);
            res.status(500).json({ error: 'Failed to fetch trend forecast', details: error.message });
        }
    }

    // Get system-wide insights
    async getSystemInsights(req, res) {
        try {
            const { period = 'monthly' } = req.query;

            console.log('Insights - Period:', period);

            const insights = await aiRecommendationService.getSystemWideInsights(period);
            
            res.json({
                period,
                insights
            });
        } catch (error) {
            console.error('Get system insights error:', error);
            res.status(500).json({ error: 'Failed to fetch system insights', details: error.message });
        }
    }

    // Get recommendation history
    async getRecommendationHistory(req, res) {
        try {
            const { residentId, period, limit = 10 } = req.query;

            console.log('History - Resident ID:', residentId);
            console.log('History - Period:', period);
            console.log('History - Limit:', limit);

            let history;
            if (residentId) {
                history = await aiRecommendationService.getResidentRecommendations(residentId, period);
            } else {
                // Get all recommendations
                let query = supabaseAdmin
                    .from('ai_recommendations')
                    .select('*')
                    .order('generated_at', { ascending: false });

                if (period) {
                    query = query.eq('recommendation_type', period);
                }

                const { data, error } = await query;
                if (error) throw error;
                history = data || [];
            }
            
            // Apply limit
            const limitedHistory = history.slice(0, parseInt(limit));
            
            res.json({
                residentId: residentId || 'all',
                period: period || 'all',
                count: limitedHistory.length,
                history: limitedHistory
            });
        } catch (error) {
            console.error('Get recommendation history error:', error);
            res.status(500).json({ error: 'Failed to fetch recommendation history', details: error.message });
        }
    }

    // Export recommendations
    async exportRecommendations(req, res) {
        try {
            const { period, format = 'csv', residentId } = req.query;

            console.log('Export - Period:', period);
            console.log('Export - Format:', format);
            console.log('Export - Resident ID:', residentId);

            let recommendations;
            if (residentId) {
                recommendations = await aiRecommendationService.getResidentRecommendations(residentId, period);
            } else {
                // Get all recommendations for the period
                let query = supabaseAdmin
                    .from('ai_recommendations')
                    .select('*')
                    .order('generated_at', { ascending: false });

                if (period) {
                    query = query.eq('recommendation_type', period);
                }

                const { data, error } = await query;
                if (error) throw error;
                recommendations = data || [];
            }

            let exportData;
            if (format === 'csv') {
                exportData = this.convertToCSV(recommendations);
                res.setHeader('Content-Type', 'text/csv');
                res.setHeader('Content-Disposition', `attachment; filename=recommendations_${Date.now()}.csv`);
            } else {
                exportData = JSON.stringify(recommendations, null, 2);
                res.setHeader('Content-Type', 'application/json');
                res.setHeader('Content-Disposition', `attachment; filename=recommendations_${Date.now()}.json`);
            }
            
            res.send(exportData);
        } catch (error) {
            console.error('Export recommendations error:', error);
            res.status(500).json({ error: 'Failed to export recommendations', details: error.message });
        }
    }

    // Helper method for CSV conversion
    convertToCSV(recommendations) {
        if (!recommendations || recommendations.length === 0) {
            return 'No recommendations found';
        }

        const headers = Object.keys(recommendations[0]);
        const rows = recommendations.map(rec => 
            headers.map(header => {
                const value = rec[header];
                if (typeof value === 'object') {
                    return JSON.stringify(value).replace(/,/g, ';');
                }
                return value || '';
            }).join(',')
        );

        return [headers.join(','), ...rows].join('\n');
    }
}

module.exports = new AIController();