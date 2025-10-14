const express = require('express');
const { getJobModel } = require('../models/RoleModels');
const auth = require('../middleware/auth');

const router = express.Router();

// List jobs with filters - Students see jobs from recruiter database
router.get('/', async (req, res) => {
  try {
    const { q, category, type, remote, urgent, verified, page = 1, pageSize = 50 } = req.query;
    
    // Jobs are always fetched from recruiter database as they post the jobs
    const Job = getJobModel('recruiter');
    
    const filter = {};
    if (q) {
      filter.$or = [
        { title: { $regex: q, $options: 'i' } },
        { company: { $regex: q, $options: 'i' } },
        { tags: { $regex: q, $options: 'i' } },
        { location: { $regex: q, $options: 'i' } },
      ];
    }
    if (category && category !== 'All') filter.category = category;
    if (type && type !== 'All') filter.type = type;
    if (remote === 'true') filter.remote = true;
    if (urgent === 'true') filter.urgent = true;
    if (verified === 'true') filter.verified = true;

    const skip = (Number(page) - 1) * Number(pageSize);
    const [items, total] = await Promise.all([
      Job.find(filter).sort({ postedAt: -1 }).skip(skip).limit(Number(pageSize)),
      Job.countDocuments(filter)
    ]);
    res.json({ items, total, page: Number(page), pageSize: Number(pageSize) });
  } catch (err) {
    console.error('Error fetching jobs:', err);
    res.status(500).json({ error: 'Failed to fetch jobs' });
  }
});

// Create job (recruiter only)
router.post('/', auth, async (req, res) => {
  if (req.user.role !== 'recruiter') {
    return res.status(403).json({ error: 'Only recruiters can post jobs' });
  }
  
  try {
    const Job = getJobModel('recruiter');
    const job = await Job.create({ ...req.body, postedBy: req.user._id });
    res.status(201).json(job);
  } catch (err) {
    console.error('Error creating job:', err);
    res.status(400).json({ error: 'Create failed', details: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const Job = getJobModel('recruiter');
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ error: 'Not found' });
    res.json(job);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch job' });
  }
});

router.put('/:id', auth, async (req, res) => {
  if (req.user.role !== 'recruiter') {
    return res.status(403).json({ error: 'Only recruiters can update jobs' });
  }
  
  try {
    const Job = getJobModel('recruiter');
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ error: 'Not found' });
    
    if (String(job.postedBy) !== String(req.user._id)) {
      return res.status(403).json({ error: 'Can only update your own jobs' });
    }
    
    Object.assign(job, req.body);
    await job.save();
    res.json(job);
  } catch (err) {
    console.error('Error updating job:', err);
    res.status(400).json({ error: 'Update failed' });
  }
});

router.delete('/:id', auth, async (req, res) => {
  if (req.user.role !== 'recruiter') {
    return res.status(403).json({ error: 'Only recruiters can delete jobs' });
  }
  
  try {
    const Job = getJobModel('recruiter');
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ error: 'Not found' });
    
    if (String(job.postedBy) !== String(req.user._id)) {
      return res.status(403).json({ error: 'Can only delete your own jobs' });
    }
    
    await Job.findByIdAndDelete(req.params.id);
    res.json({ message: 'Job deleted' });
  } catch (err) {
    console.error('Error deleting job:', err);
    res.status(400).json({ error: 'Delete failed' });
  }
});

router.delete('/:id', auth, async (req, res) => {
  const job = await Job.findById(req.params.id);
  if (!job) return res.status(404).json({ error: 'Not found' });
  if (String(job.postedBy) !== String(req.user._id) && req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  await job.deleteOne();
  res.json({ success: true });
});

module.exports = router;
