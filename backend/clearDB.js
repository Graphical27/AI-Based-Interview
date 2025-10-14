require('dotenv').config({ path: '../.env' });
const { connectDB } = require('./config/db');
const Job = require('./models/Job');
const Application = require('./models/Application');

async function clearDatabase() {
  try {
    console.log('MONGO_URI:', process.env.MONGO_URI ? 'Found' : 'Not found');
    await connectDB(process.env.MONGO_URI);
    
    const jobCount = await Job.countDocuments();
    const appCount = await Application.countDocuments();
    console.log('Before clearing - Jobs:', jobCount, 'Applications:', appCount);
    
    await Job.deleteMany({});
    await Application.deleteMany({});
    
    console.log('✅ Cleared all jobs and applications from database');
    console.log('Database is now clean for recruiter-created jobs');
    
    process.exit(0);
  } catch (error) {
    console.error('Error clearing database:', error);
    process.exit(1);
  }
}

clearDatabase();