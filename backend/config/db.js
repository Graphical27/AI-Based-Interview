const mongoose = require('mongoose');

// Store connections for each role
const connections = {
  recruiter: null,
  student: null,
  main: null
};

async function connectDB(uri) {
  if (!uri) throw new Error('MONGO_URI is not defined');
  try {
    await mongoose.connect(uri, {
      autoIndex: true,
    });
    console.log('MongoDB connected');
  } catch (err) {
    console.error('Mongo connection error:', err.message);
    process.exit(1);
  }
}

// Create role-specific database connections
async function connectRoleDB(role, baseUri) {
  if (!baseUri) throw new Error('MONGO_URI is not defined');
  
  try {
    // Extract base URI and modify database name
    const dbName = role === 'recruiter' ? 'ai_interview_recruiters' : 'ai_interview_students';
    const roleUri = baseUri.replace(/\/[^/]*\?/, `/${dbName}?`);
    
    if (connections[role]) {
      return connections[role];
    }
    
    connections[role] = mongoose.createConnection(roleUri, {
      autoIndex: true,
    });
    
    console.log(`${role} database connected: ${dbName}`);
    return connections[role];
  } catch (err) {
    console.error(`${role} database connection error:`, err.message);
    throw err;
  }
}

// Get connection for specific role
function getRoleConnection(role) {
  return connections[role];
}

// Initialize all role-based connections
async function initializeRoleConnections(baseUri) {
  try {
    await Promise.all([
      connectRoleDB('recruiter', baseUri),
      connectRoleDB('student', baseUri)
    ]);
    console.log('All role-based database connections initialized');
  } catch (err) {
    console.error('Failed to initialize role connections:', err);
    throw err;
  }
}

module.exports = { 
  connectDB, 
  connectRoleDB, 
  getRoleConnection, 
  initializeRoleConnections 
};
