const { supabase, supabaseAdmin } = require('../config/supabase');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

class AuthController {
    // ============= REGISTER =============
    async register(req, res) {
        try {
            const { email, password, role, firstName, lastName, purokId, contactNumber } = req.body;

            console.log('Registration attempt:', { email, role, firstName, lastName, purokId });

            if (!email || !password || !role) {
                return res.status(400).json({ 
                    error: 'Email, password, and role are required' 
                });
            }

            // Check if user already exists
            const { data: existingUser, error: checkError } = await supabaseAdmin
                .from('users')
                .select('email')
                .eq('email', email)
                .single();

            if (existingUser) {
                return res.status(400).json({ error: 'User already exists' });
            }

            // Hash password
            const hashedPassword = await bcrypt.hash(password, 10);

            // Create user
            const { data: user, error: userError } = await supabaseAdmin
                .from('users')
                .insert({
                    email: email,
                    password: hashedPassword,
                    role: role
                })
                .select()
                .single();

            if (userError) {
                console.error('User creation error:', userError);
                return res.status(500).json({ 
                    error: 'Failed to create user', 
                    details: userError.message 
                });
            }

            console.log('User created:', user);

            let bhwId = null;

            // If role is BHW, create BHW profile
            if (role === 'bhw') {
                // Validate BHW required fields
                if (!firstName || !lastName) {
                    // Rollback user creation
                    await supabaseAdmin.from('users').delete().eq('id', user.id);
                    return res.status(400).json({ 
                        error: 'First name and last name are required for BHW' 
                    });
                }

                // Check if purok exists
                if (purokId) {
                    const { data: purok, error: purokError } = await supabaseAdmin
                        .from('puroks')
                        .select('id')
                        .eq('id', purokId)
                        .single();

                    if (purokError || !purok) {
                        // Rollback user creation
                        await supabaseAdmin.from('users').delete().eq('id', user.id);
                        return res.status(400).json({ 
                            error: 'Invalid purok ID. Purok does not exist.' 
                        });
                    }
                }

                // Create BHW profile
                const bhwData = {
                    user_id: user.id,
                    first_name: firstName,
                    last_name: lastName,
                    contact_number: contactNumber || null
                };

                // Only add purok_id if it exists
                if (purokId) {
                    bhwData.purok_id = purokId;
                }

                console.log('Creating BHW with data:', bhwData);

                const { data: bhw, error: bhwError } = await supabaseAdmin
                    .from('bhws')
                    .insert(bhwData)
                    .select()
                    .single();

                if (bhwError) {
                    console.error('BHW creation error:', bhwError);
                    // Rollback user creation
                    await supabaseAdmin.from('users').delete().eq('id', user.id);
                    return res.status(500).json({ 
                        error: 'Failed to create BHW profile', 
                        details: bhwError.message 
                    });
                }

                bhwId = bhw.id;
                console.log('BHW created:', bhw);
            }

            // Generate token
            const token = jwt.sign(
                { userId: user.id, email: user.email, role: user.role },
                process.env.JWT_SECRET || 'your-secret-key',
                { expiresIn: '7d' }
            );

            res.status(201).json({
                message: 'User registered successfully',
                token,
                user: {
                    id: user.id,
                    email: user.email,
                    role: user.role,
                    bhwId: bhwId
                }
            });
        } catch (error) {
            console.error('Registration error:', error);
            res.status(500).json({ 
                error: 'Registration failed', 
                details: error.message 
            });
        }
    }

    // ============= LOGIN =============
    async login(req, res) {
        try {
            const { email, password } = req.body;

            if (!email || !password) {
                return res.status(400).json({ error: 'Email and password are required' });
            }

            // Find user
            const { data: user, error } = await supabaseAdmin
                .from('users')
                .select('*')
                .eq('email', email)
                .single();

            if (error || !user) {
                console.log('User not found:', email);
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            // Check password
            const isValidPassword = await bcrypt.compare(password, user.password);
            if (!isValidPassword) {
                return res.status(401).json({ error: 'Invalid credentials' });
            }

            // Get BHW info if role is BHW
            let bhwId = null;
            let bhwInfo = null;
            if (user.role === 'bhw') {
                const { data: bhw, error: bhwError } = await supabaseAdmin
                    .from('bhws')
                    .select('*')
                    .eq('user_id', user.id)
                    .single();

                if (!bhwError && bhw) {
                    bhwId = bhw.id;
                    bhwInfo = bhw;
                }
            }

            // Generate token
            const token = jwt.sign(
                { userId: user.id, email: user.email, role: user.role },
                process.env.JWT_SECRET || 'your-secret-key',
                { expiresIn: '7d' }
            );

            res.json({
                message: 'Login successful',
                token,
                user: {
                    id: user.id,
                    email: user.email,
                    role: user.role,
                    bhwId: bhwId,
                    bhw: bhwInfo
                }
            });
        } catch (error) {
            console.error('Login error:', error);
            res.status(500).json({ error: 'Login failed', details: error.message });
        }
    }

    // ============= GET CURRENT USER =============
    async getCurrentUser(req, res) {
        try {
            const userId = req.user.id;

            const { data: user, error } = await supabaseAdmin
                .from('users')
                .select('*')
                .eq('id', userId)
                .single();

            if (error || !user) {
                return res.status(404).json({ error: 'User not found' });
            }

            let bhwId = null;
            let bhwInfo = null;
            if (user.role === 'bhw') {
                const { data: bhw, error: bhwError } = await supabaseAdmin
                    .from('bhws')
                    .select('*, puroks(*)')
                    .eq('user_id', user.id)
                    .single();

                if (!bhwError && bhw) {
                    bhwId = bhw.id;
                    bhwInfo = bhw;
                }
            }

            res.json({
                user: {
                    id: user.id,
                    email: user.email,
                    role: user.role,
                    bhwId: bhwId,
                    bhw: bhwInfo
                }
            });
        } catch (error) {
            console.error('Get current user error:', error);
            res.status(500).json({ error: 'Failed to get user info', details: error.message });
        }
    }

    // ============= CHANGE PASSWORD =============
    async changePassword(req, res) {
        try {
            const { oldPassword, newPassword } = req.body;
            const userId = req.user.id;

            if (!oldPassword || !newPassword) {
                return res.status(400).json({ error: 'Old and new passwords are required' });
            }

            if (newPassword.length < 6) {
                return res.status(400).json({ error: 'New password must be at least 6 characters' });
            }

            const { data: user, error: userError } = await supabaseAdmin
                .from('users')
                .select('password')
                .eq('id', userId)
                .single();

            if (userError) {
                return res.status(404).json({ error: 'User not found' });
            }

            const isValid = await bcrypt.compare(oldPassword, user.password);
            if (!isValid) {
                return res.status(401).json({ error: 'Invalid old password' });
            }

            const hashedPassword = await bcrypt.hash(newPassword, 10);

            const { error: updateError } = await supabaseAdmin
                .from('users')
                .update({ password: hashedPassword })
                .eq('id', userId);

            if (updateError) {
                throw updateError;
            }

            res.json({ message: 'Password changed successfully' });
        } catch (error) {
            console.error('Change password error:', error);
            res.status(500).json({ error: 'Failed to change password', details: error.message });
        }
    }
}

module.exports = new AuthController();