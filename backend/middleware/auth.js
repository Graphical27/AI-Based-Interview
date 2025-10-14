const jwt = require('jsonwebtoken');
const { getUserModel } = require('../models/RoleUser');

async function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing Authorization header' });
  }
  const token = header.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get the role from the token
    const role = decoded.role;
    if (!role || !['student', 'recruiter'].includes(role)) {
      return res.status(401).json({ error: 'Invalid role in token' });
    }

    // Get role-specific User model
    const User = getUserModel(role);
    req.user = await User.findById(decoded.id).select('-passwordHash');
    
    if (!req.user) {
      return res.status(401).json({ error: 'User not found' });
    }
    
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

module.exports = auth;
