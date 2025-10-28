const mongoose = require('mongoose');
const { getRoleConnection } = require('../config/db');

const JobSchema = new mongoose.Schema({
  title: { type: String, required: true },
  company: { type: String, required: true },
  location: String,
  type: { type: String, enum: ['Full-time', 'Contract', 'Part-time', 'Internship'], default: 'Full-time' },
  salary: String,
  remote: { type: Boolean, default: false },
  tags: [String],
  category: String,
  urgent: { type: Boolean, default: false },
  verified: { type: Boolean, default: false },
  description: String,
  logo: String,
  interviewDurationMinutes: { type: Number, default: 20, min: 1, max: 180 },
  postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  postedAt: { type: Date, default: Date.now },
}, { timestamps: true });

const ApplicationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
  status: { type: String, enum: ['submitted', 'interview', 'offer', 'rejected'], default: 'submitted' },
  notes: String,
}, { timestamps: true });

// Factory functions to get models for specific roles
function getJobModel(role) {
  const connection = getRoleConnection(role);
  if (!connection) {
    throw new Error(`No database connection found for role: ${role}`);
  }
  return connection.models.Job || connection.model('Job', JobSchema);
}

function getApplicationModel(role) {
  const connection = getRoleConnection(role);
  if (!connection) {
    throw new Error(`No database connection found for role: ${role}`);
  }
  return connection.models.Application || connection.model('Application', ApplicationSchema);
}

module.exports = { 
  getJobModel, 
  getApplicationModel, 
  JobSchema, 
  ApplicationSchema 
};