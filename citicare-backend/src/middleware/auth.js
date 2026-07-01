import { supabase } from '../config/supabase.js';

export const authorize = (allowedRoles) => {
  return async (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Access token missing or invalid' });
      }

      const token = authHeader.split(' ')[1];
      
      // Verify token session with Supabase Auth
      const { data: { user }, error } = await supabase.auth.getUser(token);
      if (error || !user) return res.status(401).json({ error: 'Invalid or expired session.' });

      // Cross-reference internal user records
      const { data: appUser, error: dbError } = await supabase
        .from('users')
        .select('id, username, role')
        .eq('username', user.email)
        .single();

      if (dbError || !appUser) return res.status(403).json({ error: 'User profile not found in system.' });
      if (!allowedRoles.includes(appUser.role)) {
        return res.status(403).json({ error: 'Unauthorized role permissions context.' });
      }

      // Attach context to request object
      req.user = {
        id: appUser.id,
        username: appUser.username,
        role: appUser.role
      };

      if (appUser.role === 'BHW') {
        const { data: bhwData } = await supabase
          .from('bhws')
          .select('id')
          .eq('user_id', appUser.id)
          .single();
        if (bhwData) req.user.bhw_id = bhwData.id;
      }

      next();
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  };
};