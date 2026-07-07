const aiRecommendationService = require('../services/aiRecommendationService');

class AIController {
    async generateRecommendations(req, res) {
        try {
            const { residentId } = req.params;
            const { period } = req.body;

            if (!period) {
                return res.status(400).json({ error: 'Period is required (monthly, quarterly, or annual)' });
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

    async getResidentRecommendations(req, res) {
        try {
            const { residentId } = req.params;
            const { period } = req.query;

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

    async generateBulkRecommendations(req, res) {
        try {
            const { period } = req.params;

            if (!['monthly', 'quarterly', 'annual'].includes(period)) {
                return res.status(400).json({ error: 'Period must be monthly, quarterly, or annual' });
            }

            const recommendations = await aiRecommendationService.generateBulkRecommendations(period);
            
            res.json({
                message: `Bulk recommendations generated successfully for ${period} period`,
                count: recommendations.length,
                recommendations
            });
        } catch (error) {
            console.error('Bulk generate recommendations error:', error);
            res.status(500).json({ error: 'Failed to generate bulk recommendations', details: error.message });
        }
    }
}

module.exports = new AIController();