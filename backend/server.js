require('dotenv').config({ path: '../.env' });
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const { v4: uuidv4 } = require('uuid');
const { connectDB, initializeRoleConnections } = require('./config/db');
const InterviewSession = require('./models/InterviewSession');
const authMiddleware = require('./middleware/auth');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

// Middleware
// Support multiple origins (comma separated) for dev convenience
const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:5173").split(/[,;\s]+/).filter(Boolean);
app.use(cors({
  origin: function(origin, callback) {
    if (!origin) return callback(null, true); // allow non-browser or same-origin
    if (allowedOrigins.includes(origin)) return callback(null, true);
    console.warn('CORS blocked origin:', origin, 'Allowed:', allowedOrigins);
    return callback(new Error('Not allowed by CORS'));
  }
}));
app.use(express.json());

// Initialize Gemini AI (optional if key provided)
let model = null;
if (process.env.GEMINI_API_KEY) {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
} else {
  console.warn('GEMINI_API_KEY not provided. AI interview responses will be stubbed.');
}

// In-memory storage for interview sessions (use database in production)
const interviewSessions = new Map(); // in-memory cache; persisted to Mongo

// Interview memory system
class InterviewMemory {
  constructor() {
    this.context = [];
    this.userProfile = {};
    this.interviewPhase = 'setup';
    this.topics = [];
    this.followUpQuestions = [];
    this.questionCount = 0;
    this.difficulty = 'easy';
  }

  setUserProfile(profile) {
    this.userProfile = profile;
    this.interviewPhase = 'introduction';
    console.log('User profile set:', profile);
  }

  addInteraction(role, message, timestamp = new Date()) {
    this.context.push({
      id: uuidv4(),
      role,
      message,
      timestamp,
      phase: this.interviewPhase
    });
    
    if (role === 'ai') {
      this.questionCount++;
    }
  }

  getContext() {
    return this.context;
  }

  updatePhase(phase) {
    this.interviewPhase = phase;
  }

  updateDifficulty() {
    // Progressive difficulty based on question count and user responses
    if (this.questionCount <= 3) {
      this.difficulty = 'easy';
    } else if (this.questionCount <= 6) {
      this.difficulty = 'medium';
    } else {
      this.difficulty = 'hard';
    }
  }

  getDifficultyContext() {
    const difficultyMap = {
      'easy': 'Ask introductory and basic questions. Focus on getting to know the candidate.',
      'medium': 'Ask intermediate questions. Dive deeper into experience and skills.',
      'hard': 'Ask challenging questions. Focus on problem-solving and advanced concepts.'
    };
    return difficultyMap[this.difficulty] || difficultyMap['easy'];
  }

  getUserProfileContext() {
    if (!this.userProfile || Object.keys(this.userProfile).length === 0) {
      return '';
    }

    const profile = this.userProfile;
    let context = `\nCandidate Profile:
- Position: ${profile.role}
- Experience Level: ${profile.experience}
- Target Company: ${profile.company}`;

    if (profile.focus) {
      context += `\n- Focus Area: ${profile.focus}`;
    }
    if (profile.industry) {
      context += `\n- Industry Preference: ${profile.industry}`;
    }
    if (profile.skills) {
      context += `\n- Key Skills: ${profile.skills}`;
    }

    return context;
  }

  addTopic(topic) {
    if (!this.topics.includes(topic)) {
      this.topics.push(topic);
    }
  }

  generateContextSummary() {
    const recentContext = this.context.slice(-10); // Last 10 interactions
    return recentContext.map(item => `${item.role}: ${item.message}`).join('\n');
  }
}

// AI Interview Controller
class AIInterviewer {
  constructor() {
    this.systemPrompt = `You are an expert AI interviewer conducting a professional job interview. Your role is to:

1. Conduct a comprehensive interview tailored to the candidate's profile
2. Start with easy questions and gradually increase difficulty as the interview progresses
3. Ask relevant questions based on the candidate's role, experience level, and target company
4. Be professional, encouraging, and engaging while maintaining high standards
5. Ask follow-up questions to dive deeper into topics
6. Cover different aspects: technical skills, experience, problem-solving, cultural fit, and behavioral situations
7. Remember everything discussed and reference it appropriately
8. Keep responses concise but meaningful (2-3 sentences max per response)
9. Adapt questions based on the candidate's responses and demonstrated competency

Interview Progression:
- Start with warm introduction and basic questions (easy)
- Progress to role-specific technical questions (medium difficulty)  
- Advance to complex problem-solving and system design (hard difficulty)
- Include behavioral questions throughout
- End with candidate questions and closing

Always maintain a professional, encouraging tone while being thorough in your assessment. Tailor questions to the specific role and company the candidate is targeting.`;
  }

  async generateResponse(memory, userMessage) {
    try {
      // Update difficulty based on progress
      memory.updateDifficulty();
      
      const contextSummary = memory.generateContextSummary();
      const userProfileContext = memory.getUserProfileContext();
      const difficultyContext = memory.getDifficultyContext();
      
      const prompt = `${this.systemPrompt}

${userProfileContext}

Current Difficulty Level: ${memory.difficulty.toUpperCase()}
Difficulty Instructions: ${difficultyContext}

Interview Context:
${contextSummary}

Current Phase: ${memory.interviewPhase}
Question Count: ${memory.questionCount}
Topics Covered: ${memory.topics.join(', ') || 'None yet'}

Candidate's Latest Response: "${userMessage}"

Generate your next interview question or response. Be conversational and build on what has been discussed. 

${memory.questionCount === 0 ? 
  'This is the start of the interview. Give a warm, professional welcome. Reference their target role and company, then ask them to introduce themselves briefly.' : 
  'Continue the interview flow naturally, asking appropriate questions for the current difficulty level and phase.'
}

Remember to keep responses concise (2-3 sentences) and always end with a clear question.`;

      let text = 'AI model not configured.';
      if (model) {
        const result = await model.generateContent(prompt);
        const response = result.response;
        text = response.text();
      } else {
        // fallback simple echo style
        text = `Thanks for sharing. (stub) You said: ${userMessage}. Could you elaborate further?`;
      }

      // Update interview phase and extract topics
      this.updateInterviewPhase(memory, userMessage, text);

      return text;
    } catch (error) {
      console.error('Error generating AI response:', error);
      return "I apologize, but I'm having trouble processing that. Could you please repeat your response?";
    }
  }

  updateInterviewPhase(memory, userMessage, aiResponse) {
    const questionCount = memory.questionCount;
    
    // Phase progression based on question count and content
    if (questionCount <= 2) {
      memory.updatePhase('introduction');
    } else if (questionCount <= 5 && memory.difficulty === 'easy') {
      memory.updatePhase('technical-basic');  
    } else if (questionCount <= 8 && memory.difficulty === 'medium') {
      memory.updatePhase('technical-intermediate');
    } else if (questionCount <= 12 && memory.difficulty === 'hard') {
      memory.updatePhase('technical-advanced');
    } else if (questionCount <= 15) {
      memory.updatePhase('behavioral');
    } else {
      memory.updatePhase('closing');
    }

    // Extract and add relevant topics from user message
    const topics = this.extractTopics(userMessage);
    topics.forEach(topic => memory.addTopic(topic));
  }

  extractTopics(message) {
    const techKeywords = [
      // Programming languages
      'javascript', 'python', 'java', 'react', 'node', 'typescript', 'go', 'rust', 'c++',
      // Technologies
      'database', 'sql', 'mongodb', 'api', 'rest', 'graphql', 'docker', 'kubernetes', 'aws', 'azure',
      // Concepts
      'frontend', 'backend', 'fullstack', 'microservices', 'architecture', 'design patterns',
      'testing', 'ci/cd', 'agile', 'scrum', 'devops',
      // General
      'project', 'experience', 'team', 'leadership', 'management', 'startup', 'machine learning', 'ai'
    ];
    
    const words = message.toLowerCase().split(/\s+/);
    return techKeywords.filter(keyword => 
      words.some(word => word.includes(keyword) || keyword.includes(word))
    );
  }
}

const aiInterviewer = new AIInterviewer();

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Start new interview session
  socket.on('start-interview', async (userProfile) => {
    const sessionId = uuidv4();
  const memory = new InterviewMemory();
    
    // Set user profile if provided
    if (userProfile) {
      memory.setUserProfile(userProfile);
    }
    
  interviewSessions.set(sessionId, memory);
    
    socket.join(sessionId);
    socket.sessionId = sessionId;
    
    // Generate personalized initial message
    const getInitialMessage = () => {
      if (userProfile && userProfile.role && userProfile.company) {
        return `Hello! Welcome to your AI interview for the ${userProfile.role} position at ${userProfile.company}. I'm excited to learn more about your experience and see how you'd be a great fit. Let's start with you telling me briefly about yourself and what draws you to this role.`;
      }
      return "Hello! Welcome to your AI interview session. I'm excited to learn more about you and your experience. Let's start with you telling me a bit about yourself and what position you're interested in.";
    };
    
    const initialMessage = getInitialMessage();
    memory.addInteraction('ai', initialMessage);
    
    socket.emit('ai-response', {
      message: initialMessage,
      sessionId: sessionId,
      phase: memory.interviewPhase
    });

    // Persist session
    try {
      await InterviewSession.create({
        sessionId,
        user: socket.user?._id,
        userProfile,
        interviewPhase: memory.interviewPhase,
        topics: memory.topics,
        questionCount: memory.questionCount,
        difficulty: memory.difficulty,
        messages: memory.getContext()
      });
    } catch (e) {
      console.error('Persist session error', e.message);
    }
    
    console.log(`Interview started for session ${sessionId} with profile:`, userProfile);
  });

  // Handle user message
  socket.on('user-message', async (data) => {
    const { message, sessionId } = data;
    const memory = interviewSessions.get(sessionId || socket.sessionId);
    
    if (!memory) {
      socket.emit('error', { message: 'Interview session not found' });
      return;
    }

    // Add user message to memory
    memory.addInteraction('user', message);

    // Generate AI response
    try {
      const aiResponse = await aiInterviewer.generateResponse(memory, message);
      memory.addInteraction('ai', aiResponse);

      socket.emit('ai-response', {
        message: aiResponse,
        sessionId: sessionId || socket.sessionId,
        phase: memory.interviewPhase
      });

      // Update DB
      try {
        await InterviewSession.findOneAndUpdate({ sessionId: sessionId || socket.sessionId }, {
          interviewPhase: memory.interviewPhase,
          topics: memory.topics,
          questionCount: memory.questionCount,
          difficulty: memory.difficulty,
          messages: memory.getContext()
        });
      } catch (e) {
        console.error('Update session error', e.message);
      }
    } catch (error) {
      console.error('Error processing message:', error);
      socket.emit('error', { message: 'Error processing your message' });
    }
  });

  // Handle speech-to-text
  socket.on('speech-text', async (data) => {
    const { text, sessionId } = data;
    // Treat speech input same as text input
    socket.emit('user-message', { message: text, sessionId });
  });

  // Get interview history
  socket.on('get-history', (sessionId) => {
    const memory = interviewSessions.get(sessionId);
    if (memory) {
      socket.emit('interview-history', {
        context: memory.getContext(),
        phase: memory.interviewPhase,
        topics: memory.topics
      });
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/jobs', require('./routes/jobs'));
app.use('/api/applications', require('./routes/applications'));
app.use('/api/dashboard', require('./routes/dashboard'));
app.use('/api/users', require('./routes/user'));

// REST API endpoints
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'AI Interview Server is running' });
});

app.get('/api/session/:sessionId', (req, res) => {
  const { sessionId } = req.params;
  const memory = interviewSessions.get(sessionId);
  
  if (!memory) {
    return res.status(404).json({ error: 'Session not found' });
  }

  res.json({
    sessionId,
    context: memory.getContext(),
    phase: memory.interviewPhase,
    topics: memory.topics
  });
});

// Connect DB then start server
const PORT = process.env.PORT || 3001;
connectDB(process.env.MONGO_URI).then(async () => {
  // Initialize role-based database connections
  await initializeRoleConnections(process.env.MONGO_URI);
  
  server.listen(PORT, () => {
    console.log(`AI Interview Server running on port ${PORT}`);
    console.log(`CORS enabled for origins: ${allowedOrigins.join(', ')}`);
  });
});


