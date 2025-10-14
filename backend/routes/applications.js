const express = require('express');
const router = express.Router();
const Application = require('../models/Application');
const Job = require('../models/Job');
const authMiddleware = require('../middleware/auth');

// Apply for a job
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { jobId } = req.body;
    const userId = req.user.id;

    // Check if job exists
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Check if user already applied
    const existingApplication = await Application.findOne({ user: userId, job: jobId });
    if (existingApplication) {
      return res.status(400).json({ error: 'You have already applied for this job' });
    }

    // Create application
    const application = await Application.create({
      user: userId,
      job: jobId,
      status: 'submitted'
    });

    const populatedApplication = await Application.findById(application._id)
      .populate('user', 'username email')
      .populate('job', 'title company');

    res.status(201).json(populatedApplication);
  } catch (error) {
    console.error('Apply for job error:', error);
    res.status(500).json({ error: 'Failed to apply for job' });
  }
});

// Get applications for a job (for recruiters)
router.get('/job/:jobId', authMiddleware, async (req, res) => {
  try {
    const { jobId } = req.params;

    // Verify the job belongs to the recruiter
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    if (job.postedBy.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const applications = await Application.find({ job: jobId })
      .populate('user', 'username email')
      .populate('job', 'title company')
      .sort({ createdAt: -1 });

    res.json(applications);
  } catch (error) {
    console.error('Get job applications error:', error);
    res.status(500).json({ error: 'Failed to fetch applications' });
  }
});

// Get user's applications (for students)
router.get('/my-applications', authMiddleware, async (req, res) => {
  try {
    const applications = await Application.find({ user: req.user.id })
      .populate('job', 'title company location type salary')
      .sort({ createdAt: -1 });

    res.json(applications);
  } catch (error) {
    console.error('Get my applications error:', error);
    res.status(500).json({ error: 'Failed to fetch applications' });
  }
});

// Update application status (for recruiters)
router.put('/:applicationId/status', authMiddleware, async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { status } = req.body;

    if (!['submitted', 'interview', 'offer', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const application = await Application.findById(applicationId).populate('job');
    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    // Verify the job belongs to the recruiter
    if (application.job.postedBy.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    application.status = status;
    await application.save();

    const updatedApplication = await Application.findById(applicationId)
      .populate('user', 'username email')
      .populate('job', 'title company');

    res.json(updatedApplication);
  } catch (error) {
    console.error('Update application status error:', error);
    res.status(500).json({ error: 'Failed to update application status' });
  }
});

module.exports = router;