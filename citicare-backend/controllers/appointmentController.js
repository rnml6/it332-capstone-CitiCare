const { supabaseAdmin } = require('../config/supabase');

class AppointmentController {
    // Create appointment (Admin only)
    async createAppointment(req, res) {
        try {
            const appointmentData = req.body;

            // Validate required fields
            const requiredFields = ['resident_id', 'assigned_to_bhw_id', 'purpose', 'scheduled_date'];
            for (const field of requiredFields) {
                if (!appointmentData[field]) {
                    return res.status(400).json({ error: `${field} is required` });
                }
            }

            // Validate dates
            if (new Date(appointmentData.scheduled_date) < new Date()) {
                return res.status(400).json({ error: 'Scheduled date cannot be in the past' });
            }

            const { data, error } = await supabaseAdmin
                .from('checkups_and_appointments')
                .insert({
                    resident_id: appointmentData.resident_id,
                    assigned_to_bhw_id: appointmentData.assigned_to_bhw_id,
                    purpose: appointmentData.purpose,
                    scheduled_date: appointmentData.scheduled_date,
                    remarks: appointmentData.remarks,
                    status: appointmentData.status || 'Pending'
                })
                .select()
                .single();

            if (error) throw error;

            // Add to medical history
            await supabaseAdmin
                .from('medical_histories')
                .insert({
                    resident_id: appointmentData.resident_id,
                    event_date: new Date().toISOString().split('T')[0],
                    event_type: 'Appointment Scheduled',
                    description: `Appointment scheduled: ${appointmentData.purpose}`,
                    reference_table: 'checkups_and_appointments',
                    reference_id: data.id,
                    created_by: req.user?.id || null
                });

            res.status(201).json({
                message: 'Appointment created successfully',
                appointment: data
            });
        } catch (error) {
            console.error('Create appointment error:', error);
            res.status(500).json({ error: 'Failed to create appointment', details: error.message });
        }
    }

    // Get all appointments with filters
    async getAllAppointments(req, res) {
        try {
            const { status, startDate, endDate, bhwId, residentId } = req.query;

            let query = supabaseAdmin
                .from('checkups_and_appointments')
                .select(`
                    *,
                    residents(first_name, last_name, contact_number),
                    bhws(first_name, last_name, contact_number)
                `);

            if (status) {
                query = query.eq('status', status);
            }

            if (bhwId) {
                query = query.eq('assigned_to_bhw_id', bhwId);
            }

            if (residentId) {
                query = query.eq('resident_id', residentId);
            }

            if (startDate) {
                query = query.gte('scheduled_date', startDate);
            }

            if (endDate) {
                query = query.lte('scheduled_date', endDate);
            }

            const { data, error } = await query.order('scheduled_date', { ascending: true });

            if (error) throw error;

            res.json(data);
        } catch (error) {
            console.error('Get appointments error:', error);
            res.status(500).json({ error: 'Failed to fetch appointments', details: error.message });
        }
    }

    // Get appointment by ID
    async getAppointmentById(req, res) {
        try {
            const { id } = req.params;

            const { data, error } = await supabaseAdmin
                .from('checkups_and_appointments')
                .select(`
                    *,
                    residents(*),
                    bhws(first_name, last_name, contact_number, purok_id)
                `)
                .eq('id', id)
                .single();

            if (error) throw error;
            if (!data) {
                return res.status(404).json({ error: 'Appointment not found' });
            }

            res.json(data);
        } catch (error) {
            console.error('Get appointment error:', error);
            res.status(500).json({ error: 'Failed to fetch appointment details', details: error.message });
        }
    }

    // Update appointment (Admin only)
    async updateAppointment(req, res) {
        try {
            const { id } = req.params;
            const appointmentData = req.body;

            const { data, error } = await supabaseAdmin
                .from('checkups_and_appointments')
                .update({
                    resident_id: appointmentData.resident_id,
                    assigned_to_bhw_id: appointmentData.assigned_to_bhw_id,
                    purpose: appointmentData.purpose,
                    scheduled_date: appointmentData.scheduled_date,
                    remarks: appointmentData.remarks,
                    status: appointmentData.status,
                    date_executed: appointmentData.status === 'Completed' ? new Date().toISOString() : null
                })
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            if (!data) {
                return res.status(404).json({ error: 'Appointment not found' });
            }

            res.json({
                message: 'Appointment updated successfully',
                appointment: data
            });
        } catch (error) {
            console.error('Update appointment error:', error);
            res.status(500).json({ error: 'Failed to update appointment', details: error.message });
        }
    }

    // Update appointment status (BHW can mark as completed)
    async updateAppointmentStatus(req, res) {
        try {
            const { id } = req.params;
            const { status, remarks } = req.body;

            if (!status) {
                return res.status(400).json({ error: 'Status is required' });
            }

            if (!['Pending', 'Completed', 'Cancelled'].includes(status)) {
                return res.status(400).json({ error: 'Invalid status' });
            }

            const updateData = { status };
            if (status === 'Completed') {
                updateData.date_executed = new Date().toISOString();
            }
            if (remarks) {
                updateData.remarks = remarks;
            }

            const { data, error } = await supabaseAdmin
                .from('checkups_and_appointments')
                .update(updateData)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            if (!data) {
                return res.status(404).json({ error: 'Appointment not found' });
            }

            // Add to medical history if completed
            if (status === 'Completed') {
                await supabaseAdmin
                    .from('medical_histories')
                    .insert({
                        resident_id: data.resident_id,
                        event_date: new Date().toISOString().split('T')[0],
                        event_type: 'Appointment Completed',
                        description: `Appointment completed: ${data.purpose}`,
                        reference_table: 'checkups_and_appointments',
                        reference_id: data.id,
                        created_by: req.user?.id || null
                    });
            }

            res.json({
                message: 'Appointment status updated successfully',
                appointment: data
            });
        } catch (error) {
            console.error('Update appointment status error:', error);
            res.status(500).json({ error: 'Failed to update appointment status', details: error.message });
        }
    }

    // Delete appointment (Admin only)
    async deleteAppointment(req, res) {
        try {
            const { id } = req.params;

            const { error } = await supabaseAdmin
                .from('checkups_and_appointments')
                .delete()
                .eq('id', id);

            if (error) throw error;

            res.json({ message: 'Appointment deleted successfully' });
        } catch (error) {
            console.error('Delete appointment error:', error);
            res.status(500).json({ error: 'Failed to delete appointment', details: error.message });
        }
    }

    // Get appointments by BHW (for BHW view)
    async getBHWAppointments(req, res) {
        try {
            const bhwId = req.user?.bhwId || req.query.bhwId;
            const { status, upcoming } = req.query;

            if (!bhwId) {
                return res.status(400).json({ error: 'BHW ID is required' });
            }

            let query = supabaseAdmin
                .from('checkups_and_appointments')
                .select(`
                    *,
                    residents(first_name, last_name, contact_number, birth_date, sex)
                `)
                .eq('assigned_to_bhw_id', bhwId);

            if (status) {
                query = query.eq('status', status);
            }

            if (upcoming === 'true') {
                query = query.gte('scheduled_date', new Date().toISOString().split('T')[0]);
            }

            const { data, error } = await query.order('scheduled_date', { ascending: true });

            if (error) throw error;

            res.json(data);
        } catch (error) {
            console.error('Get BHW appointments error:', error);
            res.status(500).json({ error: 'Failed to fetch BHW appointments', details: error.message });
        }
    }
}

module.exports = new AppointmentController();