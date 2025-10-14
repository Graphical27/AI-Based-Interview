# AI-Based Interview Application

A comprehensive AI-powered interview system with real-time voice interaction, webcam support, and intelligent conversation memory using Google Gemini API.

## 🚀 Features

### Backend Features:
- **Gemini AI Integration**: (optional) Uses Google's Gemini API for intelligent interview conversations
- **Adaptive Interview Memory**: AI remembers past context, phases, difficulty, and topics
- **Real-time Communication**: Socket.io for instant AI ↔ user messaging
- **MongoDB Persistence**: Users, Jobs, Applications, Interview Sessions stored in Mongo Atlas
- **JWT Auth**: Secure stateless auth with role-based endpoints (student / recruiter / admin)
- **RESTful API**: Jobs, Users, Dashboard summary, Authentication

### Frontend Features:
- **Chat Interface**: Clean, modern chat UI showing AI and user messages
- **Voice Recording**: Speech-to-text functionality for natural conversation
- **Text-to-Speech**: AI responses are converted to speech automatically
- **Webcam Integration**: Live video feed during interviews
- **Typing Animation**: Visual feedback when AI is processing responses
- **Responsive Design**: Works on desktop and mobile devices
- **Interview Phases**: Visual indicators for different interview stages

### User Experience:
- **Login System**: Secure JWT authentication (register & login)
- **Dashboard**: Dynamic stats from persisted data (applications, interviews, success rate)
- **Real-time Mock Interview**: Simulates actual interview conditions
- **Adaptive Questions**: AI adjusts difficulty and topics based on responses
- **Professional Interface**: Modern, clean design with smooth animations

## 🛠️ Setup Instructions

### Prerequisites
- Node.js (v18+ recommended)
- MongoDB Atlas account (or local MongoDB)
- Google Gemini API key (optional for AI responses; stubbed responses without it)

### 1. Clone and Install Dependencies

```bash
# Backend setup
cd backend
npm install

# Frontend setup
cd ..
npm install
```

### 2. Environment Configuration

Copy `.env.example` to `.env` and fill values:

```env
PORT=3001
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.4qljlwn.mongodb.net/ai_interview?retryWrites=true&w=majority&appName=Cluster0
JWT_SECRET=replace_with_long_random_string
GEMINI_API_KEY=optional_key_for_ai
CORS_ORIGIN=http://localhost:5173
```

Notes:
- If `GEMINI_API_KEY` is missing, backend returns stub AI responses (still functional for flow testing).
- `MONGO_URI` can be a local instance: `mongodb://127.0.0.1:27017/ai_interview`.

### 3. Get Your Gemini API Key

1. Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy the generated API key
5. Replace the placeholder in your `.env` file

### 4. Start the Application

#### Start Backend Server:
```bash
cd backend
npm run dev
```
The backend will run on http://localhost:3001

#### Start Frontend Server:
```bash
npm run dev
```
The frontend will run on http://localhost:5174

### 5. Access the Application

1. Open your browser and go to http://localhost:5174
2. Register a new user (or login if already created). Authentication now uses the database.
3. From the dashboard, click "AI Interview" or "Start AI Interview"
4. Allow microphone and camera permissions when prompted
5. Start your AI-powered mock interview!

## 🎯 How to Use

### Starting an Interview:
1. **Login**: Use any credentials to access the dashboard
2. **Navigate**: Click the "AI Interview" button in sidebar or "Start AI Interview" banner
3. **Permissions**: Allow microphone and camera access
4. **Begin**: The AI will greet you and start the interview

### During the Interview:
- **Voice Input**: Click the microphone button and speak your answers
- **Text Input**: Type responses in the chat box
- **AI Responses**: Listen to AI questions (auto-played) or read them in chat
- **Webcam**: Your video feed shows during the interview for realistic simulation
- **Real-time**: AI adapts questions based on your previous responses

### Interview Phases:
1. **Introduction**: Basic introductory questions
2. **Technical**: Skills and experience-focused questions  
3. **Behavioral**: Situational and behavioral questions
4. **Closing**: Final questions and wrap-up

## 🏗️ Technical Architecture

### Backend Stack:
- **Express.js** (REST API & middleware)
- **Socket.io** (real-time AI interview stream)
- **MongoDB + Mongoose** (persistence layer)
- **JWT** (auth & role-based access)
- **Google Gemini API** (AI generation – optional)
- **bcryptjs** (password hashing)

### Frontend Stack:
- **React**: UI framework
- **Socket.io Client**: Real-time client
- **Web Speech API**: Voice recognition and synthesis
- **MediaDevices API**: Webcam access
- **React Router**: Navigation

### Key Components:
- **InterviewPage**: Main interview interface
- **ChatInterface**: Message display and input
- **VoiceRecorder**: Speech-to-text functionality
- **WebcamCapture**: Video feed management
- **TypingAnimation**: AI thinking indicator

---

**Note**: Google Gemini API is optional; without it a stub AI response path operates for development.
**Database:** MongoDB (Atlas or local)
**ODM:** Mongoose

---

## 📦 API Overview

### Auth
| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| POST | /api/auth/register | username, email, password, role? | Create user |
| POST | /api/auth/login | username, password | Obtain JWT |

### Jobs
| Method | Endpoint | Query/Body | Notes |
| GET | /api/jobs | q, category, type, remote, urgent, verified, page, pageSize | Public list |
| GET | /api/jobs/:id |  | Job detail |
| POST | /api/jobs | job fields | Recruiter/Admin |
| PUT | /api/jobs/:id | job fields | Owner/Admin |
| DELETE | /api/jobs/:id |  | Owner/Admin |

### Dashboard
| GET | /api/dashboard/summary | (auth) | Returns counts + recommendedJobs |

### User
| GET | /api/users/me | (auth) | Current user |
| GET | /api/users/saved-jobs | (auth) | Saved jobs list |
| POST | /api/users/saved-jobs/:jobId | (auth) | Save job |
| DELETE | /api/users/saved-jobs/:jobId | (auth) | Unsave job |

### Interview (Socket.io)
Namespace: default
Events:
- `start-interview` (userProfile) → server emits `ai-response`
- `user-message` (message, sessionId)
- `ai-response` (message, phase, sessionId)
- `get-history` (sessionId) → `interview-history`

Session transcripts persisted in `InterviewSession` collection.

## 🔐 Security
* Passwords hashed (bcryptjs, 10 rounds)
* JWT tokens (7d expiry) – store in `localStorage` for demo; move to httpOnly cookies for production
* CORS restricted via `CORS_ORIGIN`
* Never commit real credentials – `.env.example` provided instead

## 🧪 Testing
Use `backend/test.http` (REST Client) or curl.

Example registration:
```bash
curl -X POST http://localhost:3001/api/auth/register \
	-H "Content-Type: application/json" \
	-d '{"username":"demo","email":"demo@example.com","password":"Password123!"}'
```

## 🧩 Next Improvements
- Add pagination & sorting to jobs on frontend (currently client-filtered)
- Add Application creation endpoint & integrate "Apply" button
- Add profile editing & resume upload (use Multer + S3/Cloud storage)
- Enhance AI scoring/feedback after interview ends
