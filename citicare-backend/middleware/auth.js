const jwt = require('jsonwebtoken');
const { supabaseAdmin } = require('../config/supabase');

const verifyToken = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];

        if (!token) {
            return res.status(401).json({ error: 'No token provided' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');

        // Verify user exists in database
        const { data: user, error } = await supabaseAdmin
            .from('users')
            .select('*')
            .eq('id', decoded.userId)
            .single();

        if (error || !user) {
            return res.status(401).json({ error: 'Invalid token' });
        }

        req.user = user;
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Invalid token' });
    }
};

const isAdmin = (req, res, next) => {
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
};

const isBHW = (req, res, next) => {
    if (!req.user || req.user.role !== 'bhw') {
        return res.status(403).json({ error: 'BHW access required' });
    }
    next();
};

module.exports = { verifyToken, isAdmin, isBHW };
