/* Seed database with initial users, jobs, and sample applications */
require('dotenv').config({ path: '../.env' });
const { connectDB } = require('../config/db');
const User = require('../models/User');
const Job = require('../models/Job');
const Application = require('../models/Application');

async function ensureUser({ username, email, password, role }) {
  let user = await User.findOne({ username });
  if (!user) {
    const passwordHash = await User.hashPassword(password);
    user = await User.create({ username, email, passwordHash, role });
    console.log(`Created user: ${username}`);
  } else {
    console.log(`User exists: ${username}`);
  }
  return user;
}

function daysAgo(n) { return new Date(Date.now() - n * 24 * 60 * 60 * 1000); }

const jobsData = [
  { title:'Senior React Developer', company:'TechFlow Inc.', location:'Remote', type:'Full-time', salary:'$120k - $150k', remote:true, tags:['React','TypeScript','Node.js','GraphQL'], category:'Engineering', urgent:true, verified:true, description:'We are looking for a Senior React Developer to join our dynamic team and help build the next generation of web applications.', logo:'🚀', postedAt: daysAgo(2) },
  { title:'Data Scientist', company:'DataMinds Analytics', location:'New York, NY', type:'Full-time', salary:'$110k - $140k', remote:false, tags:['Python','ML','TensorFlow','Pandas'], category:'Data', urgent:false, verified:true, description:'Join our data science team to extract insights from complex datasets and build machine learning models.', logo:'📊', postedAt: daysAgo(7) },
  { title:'UX/UI Designer', company:'Creative Studio', location:'London (Remote)', type:'Contract', salary:'$80k - $100k', remote:true, tags:['Figma','Prototyping','User Research','Design Systems'], category:'Design', urgent:true, verified:false, description:'Create exceptional user experiences for our mobile and web applications. Strong portfolio required.', logo:'🎨', postedAt: daysAgo(1) },
  { title:'Product Manager', company:'InnovateCorp', location:'San Francisco, CA', type:'Full-time', salary:'$130k - $160k', remote:false, tags:['Strategy','Agile','Analytics','Roadmaps'], category:'Product', urgent:true, verified:true, description:'Drive product strategy and execution for our flagship products. Work closely with engineering and design teams.', logo:'🎯', postedAt: daysAgo(5) },
  { title:'DevOps Engineer', company:'CloudTech Solutions', location:'Remote', type:'Full-time', salary:'$115k - $145k', remote:true, tags:['AWS','Docker','Kubernetes','CI/CD'], category:'Engineering', urgent:false, verified:true, description:'Help scale our cloud infrastructure and streamline deployment processes.', logo:'☁️', postedAt: daysAgo(3) },
  { title:'Frontend Developer', company:'WebCraft Agency', location:'Seattle, WA', type:'Full-time', salary:'$95k - $125k', remote:false, tags:['Vue.js','JavaScript','CSS','HTML5'], category:'Engineering', urgent:false, verified:true, description:'Build beautiful and responsive user interfaces for our growing platform.', logo:'💻', postedAt: daysAgo(6) },
  { title:'Full Stack Developer', company:'ScaleDB', location:'Chicago, IL', type:'Full-time', salary:'$100k - $140k', remote:true, tags:['Node.js','React','PostgreSQL','APIs'], category:'Engineering', urgent:false, verified:true, description:'Build scalable web applications using modern JavaScript technologies and cloud services.', logo:'⚡', postedAt: daysAgo(4) },
  { title:'Machine Learning Engineer', company:'AI Innovations', location:'Boston, MA', type:'Full-time', salary:'$140k - $170k', remote:true, tags:['Python','TensorFlow','PyTorch','MLOps'], category:'Data', urgent:true, verified:true, description:'Build and deploy machine learning models at scale. Experience with deep learning frameworks required.', logo:'🤖', postedAt: daysAgo(2) },
];

async function seed({ reset = false } = {}) {
  await connectDB(process.env.MONGO_URI);

  if (reset) {
    await Promise.all([
      Job.deleteMany({}),
      Application.deleteMany({})
    ]);
    console.log('Cleared jobs & applications collections');
  }

  const recruiter = await ensureUser({ username:'recruiter1', email:'recruiter1@example.com', password:'RecruiterPass1!', role:'recruiter' });
  const student = await ensureUser({ username:'student1', email:'student1@example.com', password:'StudentPass1!', role:'student' });

  for (const job of jobsData) {
    const existing = await Job.findOne({ title: job.title, company: job.company });
    if (existing) {
      existing.set(job);
      await existing.save();
      console.log(`Updated job: ${job.title}`);
    } else {
      await Job.create({ ...job, postedBy: recruiter._id });
      console.log(`Created job: ${job.title}`);
    }
  }

  // Sample applications (first two jobs)
  const firstTwo = await Job.find().sort({ createdAt: 1 }).limit(2);
  for (const j of firstTwo) {
    const existsApp = await Application.findOne({ user: student._id, job: j._id });
    if (!existsApp) {
      await Application.create({ user: student._id, job: j._id, status: 'submitted' });
      console.log(`Created application for job ${j.title}`);
    }
  }

  const counts = {
    users: await User.countDocuments(),
    jobs: await Job.countDocuments(),
    applications: await Application.countDocuments(),
  };
  console.log('Seed complete:', counts);
  process.exit(0);
}

const args = process.argv.slice(2);
const reset = args.includes('--reset');
seed({ reset }).catch(err => { console.error(err); process.exit(1); });
