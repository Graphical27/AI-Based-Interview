const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { getRoleConnection } = require('../config/db');

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, index: true },
  email: { type: String, required: true, unique: true, lowercase: true, index: true },
  passwordHash: { type: String, required: true },
  role: { type: String, enum: ['student', 'recruiter', 'admin'], default: 'student' },
  profile: {
    fullName: String,
    experience: String,
    targetCompany: String,
    focus: String,
    industry: String,
    skills: [String],
  },
  savedJobs: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Job' }],
}, { timestamps: true });

UserSchema.methods.comparePassword = async function (plain) {
  return bcrypt.compare(plain, this.passwordHash);
};

UserSchema.statics.hashPassword = async function (plain) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plain, salt);
};

// Factory function to get User model for specific role
function getUserModel(role) {
  const connection = getRoleConnection(role);
  if (!connection) {
    throw new Error(`No database connection found for role: ${role}`);
  }
  
  // Return existing model or create new one
  return connection.models.User || connection.model('User', UserSchema);
}

module.exports = { getUserModel, UserSchema };