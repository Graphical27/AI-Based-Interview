const express = require('express');
const auth = require('../middleware/auth');
const { getUserModel } = require('../models/RoleUser');

const router = express.Router();

router.get('/me', auth, async (req, res) => {
  res.json(req.user);
});

// Save / unsave job (for students only)
router.post('/saved-jobs/:jobId', auth, async (req, res) => {
  if (req.user.role !== 'student') {
    return res.status(403).json({ error: 'Only students can save jobs' });
  }

  try {
    const { jobId } = req.params;
    const User = getUserModel('student');
    const user = await User.findById(req.user._id);
    
    if (!user.savedJobs.includes(jobId)) {
      user.savedJobs.push(jobId);
      await user.save();
    }
    res.json({ savedJobs: user.savedJobs });
  } catch (error) {
    res.status(500).json({ error: 'Failed to save job' });
  }
});

router.delete('/saved-jobs/:jobId', auth, async (req, res) => {
  if (req.user.role !== 'student') {
    return res.status(403).json({ error: 'Only students can unsave jobs' });
  }

  try {
    const { jobId } = req.params;
    const User = getUserModel('student');
    const user = await User.findById(req.user._id);
    
    user.savedJobs = user.savedJobs.filter(id => String(id) !== String(jobId));
    await user.save();
    res.json({ savedJobs: user.savedJobs });
  } catch (error) {
    res.status(500).json({ error: 'Failed to unsave job' });
  }
});

router.get('/saved-jobs', auth, async (req, res) => {
  if (req.user.role !== 'student') {
    return res.status(403).json({ error: 'Only students can view saved jobs' });
  }

  try {
    const User = getUserModel('student');
    const user = await User.findById(req.user._id);
    // Note: You might need to populate with jobs from recruiter DB
    res.json({ savedJobs: user.savedJobs });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get saved jobs' });
  }
});

module.exports = router;
