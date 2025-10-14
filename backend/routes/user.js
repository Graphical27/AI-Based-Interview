const express = require('express');
const auth = require('../middleware/auth');
const User = require('../models/User');

const router = express.Router();

router.get('/me', auth, async (req, res) => {
  res.json(req.user);
});

// Save / unsave job
router.post('/saved-jobs/:jobId', auth, async (req, res) => {
  const { jobId } = req.params;
  if (!req.user.savedJobs.includes(jobId)) {
    req.user.savedJobs.push(jobId);
    await req.user.save();
  }
  res.json({ savedJobs: req.user.savedJobs });
});

router.delete('/saved-jobs/:jobId', auth, async (req, res) => {
  const { jobId } = req.params;
  req.user.savedJobs = req.user.savedJobs.filter(id => String(id) !== String(jobId));
  await req.user.save();
  res.json({ savedJobs: req.user.savedJobs });
});

router.get('/saved-jobs', auth, async (req, res) => {
  await req.user.populate('savedJobs');
  res.json({ savedJobs: req.user.savedJobs });
});

module.exports = router;
