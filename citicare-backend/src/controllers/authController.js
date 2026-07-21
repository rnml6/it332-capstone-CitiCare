import { supabase } from '../config/supabase.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email/username and password are required' 
      });
    }

    let user = null;
    let bhwInfo = null;

    // 1. Try users.email (admin accounts)
    const { data: userByEmail } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .maybeSingle();

    if (userByEmail) {
      user = userByEmail;
    }

    // 2. Try bhws.username
    if (!user) {
      const { data: bhwByUsername } = await supabase
        .from('bhws')
        .select('user_id, username, has_account, bhw_id, name, position, assigned_purok_id')
        .eq('username', email)
        .eq('has_account', true)
        .maybeSingle();

      if (bhwByUsername?.user_id) {
        const { data: userByBHW } = await supabase
          .from('users')
          .select('*')
          .eq('user_id', bhwByUsername.user_id)
          .maybeSingle();

        if (userByBHW) {
          user = userByBHW;
          bhwInfo = {
            id: bhwByUsername.bhw_id,
            name: bhwByUsername.name,
            position: bhwByUsername.position,
            assignedPurokId: bhwByUsername.assigned_purok_id
          };
        }
      }
    }

    // 3. Try bhws.email
    if (!user) {
      const { data: bhwByEmail } = await supabase
        .from('bhws')
        .select('user_id, email, has_account, bhw_id, name, position, assigned_purok_id')
        .eq('email', email)
        .eq('has_account', true)
        .maybeSingle();

      if (bhwByEmail?.user_id) {
        const { data: userByBHWEmail } = await supabase
          .from('users')
          .select('*')
          .eq('user_id', bhwByEmail.user_id)
          .maybeSingle();

        if (userByBHWEmail) {
          user = userByBHWEmail;
          bhwInfo = {
            id: bhwByEmail.bhw_id,
            name: bhwByEmail.name,
            position: bhwByEmail.position,
            assignedPurokId: bhwByEmail.assigned_purok_id
          };
        }
      }
    }

    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid email/username or password' 
      });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid email/username or password' 
      });
    }

    if (user.is_active === false) {
      return res.status(403).json({ 
        success: false, 
        message: 'Your account has been deactivated. Please contact the administrator.' 
      });
    }

    if (!bhwInfo && (user.role_display === 'BHW Worker' || user.role_display === 'BHW Admin')) {
      const { data: bhwData } = await supabase
        .from('bhws')
        .select('bhw_id, name, position, assigned_purok_id')
        .eq('user_id', user.user_id)
        .maybeSingle();

      if (bhwData) {
        bhwInfo = {
          id: bhwData.bhw_id,
          name: bhwData.name,
          position: bhwData.position,
          assignedPurokId: bhwData.assigned_purok_id
        };
      }
    }

    const token = jwt.sign(
      { 
        userId: user.user_id,
        email: user.email,
        role: user.role_display,
        bhwId: bhwInfo?.id || null
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    res.json({
      success: true,
      data: {
        user: {
          id: user.user_id,
          email: user.email,
          name: user.name,
          role: user.role_display,
          bhw: bhwInfo
        },
        token
      },
      message: 'Login successful'
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'An error occurred during login. Please try again.' 
    });
  }
};

export const verifyToken = async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('user_id', decoded.userId)
      .single();

    if (error || !user) {
      return res.status(401).json({ success: false, message: 'Invalid token' });
    }

    let bhwInfo = null;
    const { data: bhwData } = await supabase
      .from('bhws')
      .select('bhw_id, name, position, assigned_purok_id')
      .eq('user_id', user.user_id)
      .maybeSingle();

    if (bhwData) {
      bhwInfo = {
        id: bhwData.bhw_id,
        name: bhwData.name,
        position: bhwData.position,
        assignedPurokId: bhwData.assigned_purok_id
      };
    }

    res.json({
      success: true,
      data: {
        user: {
          id: user.user_id,
          email: user.email,
          name: user.name,
          role: user.role_display,
          bhw: bhwInfo
        }
      }
    });
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(401).json({ success: false, message: 'Invalid or expired token' });
  }
};

export const registerAdmin = async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password || !name) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email, password, and name are required' 
      });
    }

    const { data: existingUser } = await supabase
      .from('users')
      .select('user_id')
      .eq('email', email)
      .maybeSingle();

    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'A user with this email already exists' 
      });
    }

    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    const { data, error } = await supabase
      .from('users')
      .insert({
        email,
        password_hash: passwordHash,
        name,
        role_display: 'Administrator'
      })
      .select()
      .single();

    if (error) throw error;

    res.status(201).json({
      success: true,
      data: {
        id: data.user_id,
        email: data.email,
        name: data.name,
        role: data.role_display
      },
      message: 'Admin registered successfully'
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, message: 'Failed to register admin' });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('user_id, email, name, role_display, is_active, created_at')
      .order('created_at', { ascending: false });

    if (error) throw error;

    const users = data.map(user => ({
      id: user.user_id,
      email: user.email,
      name: user.name,
      role: user.role_display,
      isActive: user.is_active,
      createdAt: user.created_at
    }));

    res.json({ success: true, data: users });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch users' });
  }
};

// controllers/authController.js - Add this function

// controllers/authController.js

export const changePassword = async (req, res) => {
  try {
    const { newPassword } = req.body;
    const userId = req.user.userId;

    if (!newPassword) {
      return res.status(400).json({ 
        success: false, 
        message: 'New password is required' 
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ 
        success: false, 
        message: 'New password must be at least 6 characters' 
      });
    }

    // Hash new password
    const saltRounds = 10;
    const newHash = await bcrypt.hash(newPassword, saltRounds);

    // Update password directly
    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        password_hash: newHash, 
        updated_at: new Date() 
      })
      .eq('user_id', userId);

    if (updateError) throw updateError;

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (error) {
    console.error('Error changing password:', error);
    res.status(500).json({ success: false, message: 'Failed to change password' });
  }
};

