const mongoose = require('mongoose');

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
  postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  postedAt: { type: Date, default: Date.now },
}, { timestamps: true });

module.exports = mongoose.model('Job', JobSchema);
