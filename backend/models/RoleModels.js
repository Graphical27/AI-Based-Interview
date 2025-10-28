const mongoose = require('mongoose');
const { getRoleConnection } = require('../config/db');

const JobSchema = new mongoose.Schema({
  title: { type: String, required: true },
  company: { type: String, required: true },
  location: String,
  experience: { type: String, default: 'Entry Level' },
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
  interviewScore: { type: Number, min: 0, max: 10 },
  interviewSummary: String,
  interviewCompletedAt: Date,
  interviewDurationSeconds: Number,
  interviewHighlights: [String],
  interviewImprovements: [String],
  interviewSkillsCovered: [String],
  interviewRequirementsSummary: String,
}, { timestamps: true });

const InterviewResultSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  application: { type: mongoose.Schema.Types.ObjectId, ref: 'Application' },
  job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
  jobSnapshot: {
    jobId: mongoose.Schema.Types.ObjectId,
    title: String,
    company: String,
    type: String,
    experience: String,
  },
  userSnapshot: {
    userId: mongoose.Schema.Types.ObjectId,
    username: String,
    email: String,
  },
  score: { type: Number, min: 0, max: 10, required: true },
  durationSeconds: Number,
  totalQuestions: Number,
  totalResponses: Number,
  completionReason: { type: String, enum: ['agent-complete', 'time-expired', 'user-quit', 'unknown'], default: 'unknown' },
  summary: String,
  strengths: [String],
  improvements: [String],
  skillsCovered: [String],
  requirementsSummary: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

InterviewResultSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

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

function getInterviewResultModel(role) {
  const connection = getRoleConnection(role);
  if (!connection) {
    throw new Error(`No database connection found for role: ${role}`);
  }
  return connection.models.InterviewResult || connection.model('InterviewResult', InterviewResultSchema);
}

module.exports = { 
  getJobModel, 
  getApplicationModel, 
  getInterviewResultModel,
  JobSchema, 
  ApplicationSchema,
  InterviewResultSchema,
};