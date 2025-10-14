const express = require('express');
const Job = require('../models/Job');
const auth = require('../middleware/auth');

const router = express.Router();

// List jobs with filters
router.get('/', async (req, res) => {
  const { q, category, type, remote, urgent, verified, page = 1, pageSize = 50 } = req.query;
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
});

// Create job (recruiter or admin)
router.post('/', auth, async (req, res) => {
  if (!['recruiter', 'admin'].includes(req.user.role)) return res.status(403).json({ error: 'Forbidden' });
  try {
    const job = await Job.create({ ...req.body, postedBy: req.user._id });
    res.status(201).json(job);
  } catch (err) {
    res.status(400).json({ error: 'Create failed', details: err.message });
  }
});

router.get('/:id', async (req, res) => {
  const job = await Job.findById(req.params.id);
  if (!job) return res.status(404).json({ error: 'Not found' });
  res.json(job);
});

router.put('/:id', auth, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ error: 'Not found' });
    if (String(job.postedBy) !== String(req.user._id) && req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    Object.assign(job, req.body);
    await job.save();
    res.json(job);
  } catch (err) {
    res.status(400).json({ error: 'Update failed' });
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
