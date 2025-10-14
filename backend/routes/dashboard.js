const express = require('express');
const auth = require('../middleware/auth');
const Application = require('../models/Application');
const Job = require('../models/Job');
const InterviewSession = require('../models/InterviewSession');

const router = express.Router();

router.get('/summary', auth, async (req, res) => {
  const userId = req.user._id;
  const [applications, interviews, jobs] = await Promise.all([
    Application.find({ user: userId }),
    InterviewSession.find({ user: userId }),
    Job.find({})
  ]);
  const interviewRequests = interviews.length; // simplistic
  const successRate = applications.length ? Math.round((applications.filter(a => a.status === 'offer').length / applications.length) * 100) : 0;
  res.json({
    applicationsCount: applications.length,
    interviewRequests,
    successRate,
    recommendedJobs: jobs.slice(0, 6),
  });
});

module.exports = router;
