const express = require('express');
const router = express.Router();
const { getApplicationModel, getJobModel, getInterviewResultModel } = require('../models/RoleModels');
const authMiddleware = require('../middleware/auth');

// Apply for a job (students apply)
router.post('/', authMiddleware, async (req, res) => {
  if (req.user.role !== 'student') {
    return res.status(403).json({ error: 'Only students can apply for jobs' });
  }

  try {
    const { jobId } = req.body;
    const userId = req.user.id;

    // Get models - jobs are in recruiter DB, applications in student DB
    const Job = getJobModel('recruiter');
    const Application = getApplicationModel('student');

    // Check if job exists in recruiter database
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Check if user already applied (in student database)
    const existingApplication = await Application.findOne({ user: userId, job: jobId });
    if (existingApplication) {
      return res.status(400).json({ error: 'You have already applied for this job' });
    }

    // Create application in student database
    const application = await Application.create({
      user: userId,
      job: jobId,
      status: 'submitted'
    });

    // Return application with job details
    res.status(201).json({
      _id: application._id,
      user: { _id: userId, username: req.user.username, email: req.user.email },
      job: { _id: job._id, title: job.title, company: job.company },
      status: application.status,
      createdAt: application.createdAt
    });
  } catch (error) {
    console.error('Apply for job error:', error);
    res.status(500).json({ error: 'Failed to apply for job' });
  }
});

// Get applications for a job (for recruiters)
router.get('/job/:jobId', authMiddleware, async (req, res) => {
  if (req.user.role !== 'recruiter') {
    return res.status(403).json({ error: 'Only recruiters can view job applications' });
  }

  try {
    const { jobId } = req.params;

    // Get models
    const Job = getJobModel('recruiter');
    const StudentApplication = getApplicationModel('student');

    // Verify the job belongs to the recruiter
    const job = await Job.findById(jobId);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    if (job.postedBy.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Find applications for this job in student database
    const applications = await StudentApplication.find({ job: jobId }).sort({ createdAt: -1 });
    
    // Get student user details for each application
    const { getUserModel } = require('../models/RoleUser');
    const StudentUser = getUserModel('student');
    
    const enrichedApplications = await Promise.all(
      applications.map(async (app) => {
        const student = await StudentUser.findById(app.user).select('username email');
        return {
          _id: app._id,
          user: student,
          job: { _id: job._id, title: job.title, company: job.company },
          status: app.status,
          createdAt: app.createdAt,
          notes: app.notes,
          interviewScore: app.interviewScore,
          interviewSummary: app.interviewSummary,
          interviewCompletedAt: app.interviewCompletedAt,
          interviewDurationSeconds: app.interviewDurationSeconds,
          interviewHighlights: app.interviewHighlights,
          interviewImprovements: app.interviewImprovements,
          interviewSkillsCovered: app.interviewSkillsCovered,
          interviewRequirementsSummary: app.interviewRequirementsSummary,
        };
      })
    );

    res.json(enrichedApplications);
  } catch (error) {
    console.error('Get job applications error:', error);
    res.status(500).json({ error: 'Failed to fetch applications' });
  }
});

// Get user's applications (for students)
router.get('/my-applications', authMiddleware, async (req, res) => {
  if (req.user.role !== 'student') {
    return res.status(403).json({ error: 'Only students can view their applications' });
  }

  try {
    const Application = getApplicationModel('student');
    const Job = getJobModel('recruiter');
    
    const applications = await Application.find({ user: req.user.id }).sort({ createdAt: -1 });
    
    // Get job details for each application
    const enrichedApplications = await Promise.all(
      applications.map(async (app) => {
        const job = await Job.findById(app.job).select('title company location type salary');
        return {
          _id: app._id,
          job: job,
          status: app.status,
          createdAt: app.createdAt,
          notes: app.notes,
          interviewScore: app.interviewScore,
          interviewSummary: app.interviewSummary,
          interviewCompletedAt: app.interviewCompletedAt,
          interviewDurationSeconds: app.interviewDurationSeconds,
          interviewHighlights: app.interviewHighlights,
          interviewImprovements: app.interviewImprovements,
          interviewSkillsCovered: app.interviewSkillsCovered,
          interviewRequirementsSummary: app.interviewRequirementsSummary,
        };
      })
    );

    res.json(enrichedApplications);
  } catch (error) {
    console.error('Get my applications error:', error);
    res.status(500).json({ error: 'Failed to fetch applications' });
  }
});

// Update application status (for recruiters)
router.put('/:applicationId/status', authMiddleware, async (req, res) => {
  if (req.user.role !== 'recruiter') {
    return res.status(403).json({ error: 'Only recruiters can update application status' });
  }

  try {
    const { applicationId } = req.params;
    const { status } = req.body;

    if (!['submitted', 'interview', 'offer', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    // Get models
    const Application = getApplicationModel('student');
    const Job = getJobModel('recruiter');

    const application = await Application.findById(applicationId);
    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    // Verify the job belongs to the recruiter
    const job = await Job.findById(application.job);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    if (job.postedBy.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    application.status = status;
    await application.save();

    // Get student details for response
    const { getUserModel } = require('../models/RoleUser');
    const StudentUser = getUserModel('student');
    const student = await StudentUser.findById(application.user).select('username email');

    const updatedApplication = {
      _id: application._id,
      user: student,
      job: { _id: job._id, title: job.title, company: job.company },
      status: application.status,
      createdAt: application.createdAt,
      notes: application.notes,
      interviewScore: application.interviewScore,
      interviewSummary: application.interviewSummary,
      interviewCompletedAt: application.interviewCompletedAt,
    };

    res.json(updatedApplication);
  } catch (error) {
    console.error('Update application status error:', error);
    res.status(500).json({ error: 'Failed to update application status' });
  }
});

// Save interview result (students submit their AI evaluation)
router.post('/:applicationId/interview-results', authMiddleware, async (req, res) => {
  if (req.user.role !== 'student') {
    return res.status(403).json({ error: 'Only students can submit interview results' });
  }

  try {
    const { applicationId } = req.params;
    const {
      score,
      summary,
      strengths = [],
      improvements = [],
      completionReason = 'unknown',
      durationSeconds = 0,
      totalQuestions = 0,
      totalResponses = 0,
      skillsCovered = [],
      requirementsSummary = '',
    } = req.body;

    const Application = getApplicationModel('student');
    const Job = getJobModel('recruiter');
    const InterviewResult = getInterviewResultModel('student');
    const { getUserModel } = require('../models/RoleUser');
    const StudentUser = getUserModel('student');

    const application = await Application.findOne({ _id: applicationId, user: req.user.id });
    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    const job = await Job.findById(application.job);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    const student = await StudentUser.findById(req.user.id).select('username email');

    application.interviewScore = score;
    application.interviewSummary = summary;
    application.interviewCompletedAt = new Date();
    application.interviewDurationSeconds = durationSeconds;
    application.interviewHighlights = strengths;
    application.interviewImprovements = improvements;
  application.interviewSkillsCovered = skillsCovered;
  application.interviewRequirementsSummary = requirementsSummary;
    await application.save();

    const resultPayload = {
      user: req.user.id,
      application: application._id,
      job: job._id,
      jobSnapshot: {
        jobId: job._id,
        title: job.title,
        company: job.company,
        type: job.type,
        experience: job.experience,
      },
      userSnapshot: {
        userId: student?._id,
        username: student?.username,
        email: student?.email,
      },
      score,
      durationSeconds,
      totalQuestions,
      totalResponses,
      completionReason,
      summary,
      strengths,
      improvements,
      skillsCovered,
      requirementsSummary,
    };

    const existingResult = await InterviewResult.findOne({ application: application._id });
    let interviewResultDoc;
    if (existingResult) {
      Object.assign(existingResult, resultPayload);
      interviewResultDoc = await existingResult.save();
    } else {
      interviewResultDoc = await InterviewResult.create(resultPayload);
    }

    res.json({
      application: {
        _id: application._id,
        job: { _id: job._id, title: job.title, company: job.company },
        status: application.status,
        interviewScore: application.interviewScore,
        interviewSummary: application.interviewSummary,
        interviewCompletedAt: application.interviewCompletedAt,
        interviewHighlights: application.interviewHighlights,
        interviewImprovements: application.interviewImprovements,
        completionReason,
        durationSeconds,
        skillsCovered,
        requirementsSummary,
      },
      result: interviewResultDoc,
    });
  } catch (error) {
    console.error('Failed to store interview results:', error);
    res.status(500).json({ error: 'Failed to store interview results' });
  }
});

module.exports = router;