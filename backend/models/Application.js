const mongoose = require('mongoose');

const ApplicationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
  status: { type: String, enum: ['submitted', 'interview', 'offer', 'rejected'], default: 'submitted' },
  notes: String,
}, { timestamps: true });

module.exports = mongoose.model('Application', ApplicationSchema);
