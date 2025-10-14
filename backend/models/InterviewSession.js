const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  role: { type: String, enum: ['ai', 'user'], required: true },
  message: { type: String, required: true },
  phase: String,
  timestamp: { type: Date, default: Date.now },
});

const InterviewSessionSchema = new mongoose.Schema({
  sessionId: { type: String, index: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  userProfile: {
    role: String,
    experience: String,
    company: String,
    focus: String,
    industry: String,
    skills: String,
  },
  interviewPhase: { type: String, default: 'setup' },
  topics: [String],
  questionCount: { type: Number, default: 0 },
  difficulty: { type: String, default: 'easy' },
  messages: [MessageSchema],
}, { timestamps: true });

module.exports = mongoose.model('InterviewSession', InterviewSessionSchema);
