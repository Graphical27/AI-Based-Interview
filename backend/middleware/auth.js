const jwt = require('jsonwebtoken');
const { getUserModel } = require('../models/RoleUser');

async function extractUserFromRequest(req) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return null;
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
    const userDoc = await User.findById(decoded.id).select('-passwordHash');

    if (!userDoc) {
      return null;
    }

    userDoc.role = role;
    return userDoc;
  } catch (err) {
    return null;
  }
}

async function auth(req, res, next) {
  const user = await extractUserFromRequest(req);
  if (!user) {
    return res.status(401).json({ error: 'Invalid token' });
  }
  req.user = user;
  return next();
}

async function optionalAuth(req, _res, next) {
  const user = await extractUserFromRequest(req);
  if (user) {
    req.user = user;
  }
  next();
}

module.exports = auth;
module.exports.optionalAuth = optionalAuth;
