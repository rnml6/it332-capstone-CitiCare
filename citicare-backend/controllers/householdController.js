const { supabaseAdmin } = require('../config/supabase');

class HouseholdController {
    // Get all households
    async getAllHouseholds(req, res) {
        try {
            const { data, error } = await supabaseAdmin
                .from('households')
                .select(`
                    *,
                    puroks(id, purok_name),
                    residents(
                        id,
                        first_name,
                        last_name,
                        is_household_head,
                        is_archived
                    )
                `)
                .order('household_number');

            if (error) throw error;

            // Count members per household
            const households = (data || []).map(household => ({
                ...household,
                member_count: (household.residents || []).filter(r => !r.is_archived).length,
                head_of_household: (household.residents || []).find(r => r.is_household_head && !r.is_archived)
            }));

            res.json(households);
        } catch (error) {
            console.error('Get all households error:', error);
            res.status(500).json({ error: 'Failed to fetch households', details: error.message });
        }
    }

    // Get household by ID
    async getHouseholdById(req, res) {
        try {
            const { id } = req.params;

            const { data: household, error } = await supabaseAdmin
                .from('households')
                .select(`
                    *,
                    puroks(id, purok_name),
                    residents(
                        *,
                        health_profiles(current_risk_score, risk_level),
                        chronic_conditions(disease_name, status),
                        resident_medications(medication_name, status)
                    )
                `)
                .eq('id', id)
                .single();

            if (error) throw error;
            if (!household) {
                return res.status(404).json({ error: 'Household not found' });
            }

            res.json(household);
        } catch (error) {
            console.error('Get household error:', error);
            res.status(500).json({ error: 'Failed to fetch household details', details: error.message });
        }
    }

    // Create household
    async createHousehold(req, res) {
        try {
            const { household_number, purok_id, address } = req.body;

            if (!household_number || !purok_id) {
                return res.status(400).json({ error: 'Household number and purok ID are required' });
            }

            // Check if purok exists
            const { data: purok, error: purokError } = await supabaseAdmin
                .from('puroks')
                .select('id')
                .eq('id', purok_id)
                .single();

            if (purokError || !purok) {
                return res.status(400).json({ error: 'Invalid purok ID' });
            }

            const { data, error } = await supabaseAdmin
                .from('households')
                .insert({
                    household_number,
                    purok_id,
                    address_details: address || null
                })
                .select()
                .single();

            if (error) throw error;

            res.status(201).json({
                message: 'Household created successfully',
                household: data
            });
        } catch (error) {
            console.error('Create household error:', error);
            res.status(500).json({ error: 'Failed to create household', details: error.message });
        }
    }

    // Update household
    async updateHousehold(req, res) {
        try {
            const { id } = req.params;
            const { household_number, purok_id, address } = req.body;

            const { data, error } = await supabaseAdmin
                .from('households')
                .update({
                    household_number,
                    purok_id,
                    address_details
                })
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            if (!data) {
                return res.status(404).json({ error: 'Household not found' });
            }

            res.json({
                message: 'Household updated successfully',
                household: data
            });
        } catch (error) {
            console.error('Update household error:', error);
            res.status(500).json({ error: 'Failed to update household', details: error.message });
        }
    }

    // Delete household
    async deleteHousehold(req, res) {
        try {
            const { id } = req.params;

            // Check if household has residents
            const { count: residentCount, error: residentError } = await supabaseAdmin
                .from('residents')
                .select('*', { count: 'exact', head: true })
                .eq('household_id', id)
                .eq('is_archived', false);

            if (residentError) throw residentError;

            if (residentCount > 0) {
                return res.status(400).json({ 
                    error: 'Cannot delete household with active residents. Please reassign or archive residents first.' 
                });
            }

            const { error } = await supabaseAdmin
                .from('households')
                .delete()
                .eq('id', id);

            if (error) throw error;

            res.json({ message: 'Household deleted successfully' });
        } catch (error) {
            console.error('Delete household error:', error);
            res.status(500).json({ error: 'Failed to delete household', details: error.message });
        }
    }
}

module.exports = new HouseholdController();