const { supabaseAdmin } = require('../config/supabase');
const bcrypt = require('bcryptjs');

class BHWController {
    // Get all BHWs
    async getAllBHWs(req, res) {
        try {
            const { data, error } = await supabaseAdmin
                .from('bhws')
                .select(`
                    *,
                    users(email, role),
                    puroks(purok_name, current_risk_score, risk_level),
                    checkups_and_appointments(status, scheduled_date)
                `)
                .order('last_name');

            if (error) throw error;

            // Calculate statistics for each BHW
            const bhwsWithStats = data.map(bhw => ({
                ...bhw,
                stats: {
                    totalAppointments: bhw.checkups_and_appointments?.length || 0,
                    pending: bhw.checkups_and_appointments?.filter(a => a.status === 'Pending')?.length || 0,
                    completed: bhw.checkups_and_appointments?.filter(a => a.status === 'Completed')?.length || 0,
                    overdue: bhw.checkups_and_appointments?.filter(a => 
                        a.status === 'Pending' && new Date(a.scheduled_date) < new Date()
                    )?.length || 0
                },
                checkups_and_appointments: undefined
            }));

            res.json(bhwsWithStats);
        } catch (error) {
            console.error('Get all BHWs error:', error);
            res.status(500).json({ error: 'Failed to fetch BHWs', details: error.message });
        }
    }

    // Get BHW by ID
    async getBHWById(req, res) {
        try {
            const { id } = req.params;

            const { data: bhw, error } = await supabaseAdmin
                .from('bhws')
                .select(`
                    *,
                    users(email, role, created_at),
                    puroks(*)
                `)
                .eq('id', id)
                .single();

            if (error) throw error;
            if (!bhw) {
                return res.status(404).json({ error: 'BHW not found' });
            }

            // Get appointments
            const { data: appointments, error: appError } = await supabaseAdmin
                .from('checkups_and_appointments')
                .select(`
                    *,
                    residents(first_name, last_name, contact_number)
                `)
                .eq('assigned_to_bhw_id', id)
                .order('scheduled_date', { ascending: false });

            if (appError) throw appError;

            // Get residents under this BHW's purok
            let residents = [];
            if (bhw.purok_id) {
                const { data: residentData, error: residentError } = await supabaseAdmin
                    .from('resident_details')
                    .select('*')
                    .eq('purok_id', bhw.purok_id)
                    .eq('is_archived', false);

                if (!residentError) {
                    residents = residentData || [];
                }
            }

            res.json({
                ...bhw,
                appointments: appointments || [],
                residents: residents || []
            });
        } catch (error) {
            console.error('Get BHW error:', error);
            res.status(500).json({ error: 'Failed to fetch BHW details', details: error.message });
        }
    }

    // Create BHW (Admin only)
    async createBHW(req, res) {
        try {
            const bhwData = req.body;

            // Validate required fields
            if (!bhwData.email || !bhwData.password || !bhwData.first_name || 
                !bhwData.last_name || !bhwData.purok_id) {
                return res.status(400).json({ 
                    error: 'Email, password, first name, last name, and purok are required' 
                });
            }

            // Check if email exists
            const { data: existingUser, error: checkError } = await supabaseAdmin
                .from('users')
                .select('email')
                .eq('email', bhwData.email)
                .single();

            if (existingUser) {
                return res.status(400).json({ error: 'Email already exists' });
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(bhwData.password, 10);

            // Create user
            const { data: user, error: userError } = await supabaseAdmin
                .from('users')
                .insert({
                    email: bhwData.email,
                    password: hashedPassword,
                    role: 'bhw'
                })
                .select()
                .single();

            if (userError) throw userError;

            // Create BHW
            const { data: bhw, error: bhwError } = await supabaseAdmin
                .from('bhws')
                .insert({
                    user_id: user.id,
                    first_name: bhwData.first_name,
                    last_name: bhwData.last_name,
                    purok_id: bhwData.purok_id,
                    contact_number: bhwData.contact_number,
                    account_status: bhwData.account_status || 'Active'
                })
                .select()
                .single();

            if (bhwError) {
                // Rollback user creation
                await supabaseAdmin.from('users').delete().eq('id', user.id);
                throw bhwError;
            }

            res.status(201).json({
                message: 'BHW created successfully',
                bhw
            });
        } catch (error) {
            console.error('Create BHW error:', error);
            res.status(500).json({ error: 'Failed to create BHW', details: error.message });
        }
    }

    // Update BHW
    async updateBHW(req, res) {
        try {
            const { id } = req.params;
            const bhwData = req.body;

            // Update BHW
            const { data: bhw, error: bhwError } = await supabaseAdmin
                .from('bhws')
                .update({
                    first_name: bhwData.first_name,
                    last_name: bhwData.last_name,
                    purok_id: bhwData.purok_id,
                    contact_number: bhwData.contact_number,
                    account_status: bhwData.account_status
                })
                .eq('id', id)
                .select()
                .single();

            if (bhwError) throw bhwError;
            if (!bhw) {
                return res.status(404).json({ error: 'BHW not found' });
            }

            // Update user email if changed
            if (bhwData.email) {
                const { error: emailError } = await supabaseAdmin
                    .from('users')
                    .update({ email: bhwData.email })
                    .eq('id', bhw.user_id);

                if (emailError) throw emailError;
            }

            // Update password if provided
            if (bhwData.password) {
                const hashedPassword = await bcrypt.hash(bhwData.password, 10);
                const { error: passError } = await supabaseAdmin
                    .from('users')
                    .update({ password: hashedPassword })
                    .eq('id', bhw.user_id);

                if (passError) throw passError;
            }

            res.json({
                message: 'BHW updated successfully',
                bhw
            });
        } catch (error) {
            console.error('Update BHW error:', error);
            res.status(500).json({ error: 'Failed to update BHW', details: error.message });
        }
    }

    // Delete BHW - FIXED VERSION
    async deleteBHW(req, res) {
        try {
            const { id } = req.params;

            console.log('Deleting BHW with ID:', id);

            // 1. Check if BHW exists and get user_id
            const { data: bhw, error: checkError } = await supabaseAdmin
                .from('bhws')
                .select('id, user_id')
                .eq('id', id)
                .single();

            if (checkError) {
                console.error('BHW check error:', checkError);
                return res.status(404).json({ error: 'BHW not found' });
            }

            if (!bhw) {
                return res.status(404).json({ error: 'BHW not found' });
            }

            console.log('Found BHW to delete:', bhw);

            // 2. First, update any appointments assigned to this BHW
            const { error: appError } = await supabaseAdmin
                .from('checkups_and_appointments')
                .update({ assigned_to_bhw_id: null })
                .eq('assigned_to_bhw_id', id);

            if (appError) {
                console.error('Error updating appointments:', appError);
                // Continue with deletion even if appointment update fails
            }

            // 3. Delete the BHW record first (this removes the foreign key reference)
            const { error: bhwDeleteError } = await supabaseAdmin
                .from('bhws')
                .delete()
                .eq('id', id);

            if (bhwDeleteError) {
                console.error('BHW delete error:', bhwDeleteError);
                return res.status(500).json({ 
                    error: 'Failed to delete BHW record', 
                    details: bhwDeleteError.message 
                });
            }

            console.log('BHW record deleted successfully');

            // 4. Now delete the associated user
            const { error: userDeleteError } = await supabaseAdmin
                .from('users')
                .delete()
                .eq('id', bhw.user_id);

            if (userDeleteError) {
                console.error('User delete error:', userDeleteError);
                // The BHW is already deleted but user remains
                // You might want to handle this case differently
                return res.status(500).json({ 
                    error: 'BHW deleted but failed to delete user account. Please delete the user manually.', 
                    details: userDeleteError.message 
                });
            }

            console.log('User deleted successfully');
            res.json({ message: 'BHW and associated user deleted successfully' });

        } catch (error) {
            console.error('Delete BHW error:', error);
            res.status(500).json({ 
                error: 'Failed to delete BHW', 
                details: error.message 
            });
        }
    }

    // Get BHW schedules
    async getBHWSchedules(req, res) {
        try {
            const { id } = req.params;
            const { status, startDate, endDate } = req.query;

            let query = supabaseAdmin
                .from('checkups_and_appointments')
                .select(`
                    *,
                    residents(first_name, last_name, contact_number)
                `)
                .eq('assigned_to_bhw_id', id);

            if (status) {
                query = query.eq('status', status);
            }

            if (startDate) {
                query = query.gte('scheduled_date', startDate);
            }

            if (endDate) {
                query = query.lte('scheduled_date', endDate);
            }

            const { data, error } = await query.order('scheduled_date', { ascending: true });

            if (error) throw error;

            res.json(data || []);
        } catch (error) {
            console.error('Get BHW schedules error:', error);
            res.status(500).json({ error: 'Failed to fetch schedules', details: error.message });
        }
    }

    // Assign BHW to purok
    async assignBHWToPurok(req, res) {
        try {
            const { id } = req.params;
            const { purok_id } = req.body;

            if (!purok_id) {
                return res.status(400).json({ error: 'Purok ID is required' });
            }

            // Check if purok exists
            const { data: purok, error: purokError } = await supabaseAdmin
                .from('puroks')
                .select('id')
                .eq('id', purok_id)
                .single();

            if (purokError || !purok) {
                return res.status(400).json({ error: 'Purok not found' });
            }

            const { data: bhw, error } = await supabaseAdmin
                .from('bhws')
                .update({ purok_id })
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            if (!bhw) {
                return res.status(404).json({ error: 'BHW not found' });
            }

            res.json({
                message: 'BHW assigned to purok successfully',
                bhw
            });
        } catch (error) {
            console.error('Assign BHW error:', error);
            res.status(500).json({ error: 'Failed to assign BHW to purok', details: error.message });
        }
    }
}

module.exports = new BHWController();