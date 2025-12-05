import os
import json
import re
from datetime import datetime
from typing import Dict, List, Optional
from uuid import uuid4

from dotenv import load_dotenv
from google import genai
from google.genai import types

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel, ConfigDict, Field
import edge_tts
import tempfile


# --- 1. Setup & Configuration ---
load_dotenv()

API_KEY = os.getenv("GEMINI_API_KEY")
if not API_KEY:
    raise ValueError("GEMINI_API_KEY not found in .env file.")

client = genai.Client(api_key=API_KEY)

# Use the latest stable model
MODEL_NAME = "gemini-2.0-flash" 

# --- 2. Data Models ---
class CandidateProfile(BaseModel):
    role: Optional[str] = "Software Engineer"
    experience: Optional[str] = "Junior"
    company: Optional[str] = "Tech Corp"
    skills: Optional[str] = "Python"
    focus: Optional[str] = "Backend"
    industry: Optional[str] = "Software"

class StartInterviewRequest(BaseModel):
    profile: CandidateProfile

class StartInterviewResponse(BaseModel):
    sessionId: str
    message: str
    phase: str
    done: bool = False

class MessageRequest(BaseModel):
    session_id: str = Field(..., alias="sessionId")
    message: str
    model_config = ConfigDict(populate_by_name=True)

class MessageResponse(BaseModel):
    sessionId: str
    message: str
    phase: str
    done: bool = False

class FinalizeInterviewRequest(BaseModel):
    session_id: str = Field(..., alias="sessionId")
    completion_reason: Optional[str] = Field(default=None, alias="completionReason")
    duration_seconds: Optional[int] = Field(default=None, alias="durationSeconds")
    model_config = ConfigDict(populate_by_name=True)

class FinalizeInterviewResponse(BaseModel):
    sessionId: str
    role: Optional[str] = ""
    company: Optional[str] = ""
    score: float
    summary: str
    strengths: List[str] = Field(default_factory=list)
    improvements: List[str] = Field(default_factory=list)
    completionReason: str
    durationSeconds: int
    totalQuestions: int
    totalResponses: int
    skillsCovered: List[str] = Field(default_factory=list)
    requirementsSummary: str = ""

# --- 3. Interview Logic ---

class InterviewSession:
    def __init__(self, profile: CandidateProfile):
        self.profile = profile
        self.session_id = str(uuid4())
        self.started_at = datetime.utcnow()
        self.message_count = 0
        self.local_history: List[Dict[str, str]] = []

        # --- BUILD THE PERSONA ---
        # We inject the specific profile details here.
        system_instruction = f"""
        ROLE: You are a professional Technical Interviewer for the company '{self.profile.company}'.
        YOUR GOAL: Assess the candidate for the role of '{self.profile.role}' ({self.profile.experience} level).
        
        INTERVIEW CONTEXT:
        - Industry: {self.profile.industry}
        - Focus Area: {self.profile.focus}
        - Required Skills: {self.profile.skills}

        STRICT RULES:
        1. **ACT AS THE INTERVIEWER**: Do NOT be a helpful assistant. Do not say "How can I help you?". You are leading this meeting.
        2. **ONE QUESTION AT A TIME**: Ask exactly one question per turn. Wait for the answer.
        3. **VERIFY ANSWERS**: 
           - If the answer is good, briefly acknowledge it and move to the next topic.
           - If the answer is vague, ask a follow-up: "Could you be more specific about...?"
           - If the answer is wrong, politely correct them and ask them to try again or move on.
        4. **PROGRESSION**:
           - Start with an Introduction (ask them to introduce themselves).
           - Move to 2-3 Technical Questions based on {self.profile.skills}.
           - Ask 1 Behavioral Question (e.g., "Tell me about a time you failed...").
           - Close the interview.
        5. **ENDING**: When the interview is done (approx 5-7 turns), output exactly: [INTERVIEW_COMPLETE]
        """

        # Initialize Chat with System Instruction
        self.chat = client.chats.create(
            model=MODEL_NAME,
            config=types.GenerateContentConfig(
                system_instruction=system_instruction,
                temperature=0.7, # Add some creativity but keep it focused
            )
        )

    def start(self) -> str:
        """
        Triggers the first message from the AI.
        """
        # We send a hidden "trigger" message to get the AI to introduce itself.
        # This message is NOT recorded in the history shown to the user.
        trigger_msg = f"Hello, I am the candidate. I am ready for my {self.profile.role} interview."
        
        try:
            response = self.chat.send_message(trigger_msg)
            ai_message = response.text
        except Exception as e:
            print(f"Gemini Start Error: {e}")
            ai_message = f"Hello. I am the interviewer for {self.profile.company}. Shall we begin?"

        self._record("ai", ai_message)
        return ai_message

    def next_turn(self, user_message: str) -> (str, bool):
        self._record("user", user_message)
        
        try:
            response = self.chat.send_message(user_message)
            ai_text = response.text
        except Exception as e:
            print(f"Gemini Chat Error: {e}")
            return "I'm having trouble parsing that. Could you rephrase?", False

        self._record("ai", ai_text)

        is_done = "[INTERVIEW_COMPLETE]" in ai_text
        clean_text = ai_text.replace("[INTERVIEW_COMPLETE]", "").strip()
        
        return clean_text, is_done

    def _record(self, role: str, text: str):
        self.local_history.append({
            "role": role,
            "message": text,
            "timestamp": datetime.utcnow().isoformat()
        })
        if role == "ai":
            self.message_count += 1

    def generate_evaluation(self, duration_seconds: int) -> Dict:
        # Build transcript
        transcript = "\n".join([
            f"{entry['role'].upper()}: {entry['message']}" 
            for entry in self.local_history 
            if entry['role'] in ['user', 'ai']
        ])

        prompt = f"""
        Analyze this interview transcript and output a JSON object and Give a very very strict marking.
        
        TRANSCRIPT:
        {transcript}

        REQUIRED JSON FORMAT:
        {{
            "score": <float 1-10 based on technical accuracy and communication>,
            "summary": "<2-3 sentence summary of the candidate's performance>",
            "strengths": ["<strength 1>", "<strength 2>", "<strength 3>"],
            "improvements": ["<improvement 1>", "<improvement 2>", "<improvement 3>"],
            "skillsCovered": ["<skill 1>", "<skill 2>"],
            "requirementsSummary": "Candidate assessed for {self.profile.role}."
        }}
        Output raw JSON only (no markdown).
        """

        try:
            response = client.models.generate_content(
                model=MODEL_NAME,
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json"
                )
            )
            text = response.text.strip()
            
            # Cleanup markdown if present
            if text.startswith("```"):
                text = re.sub(r"^```json|^```", "", text).strip()
            if text.endswith("```"):
                text = text[:-3].strip()

            return json.loads(text)
        except Exception as e:
            print(f"Evaluation Error: {e}")
            return {
                "score": 0.0,
                "summary": "Evaluation failed.",
                "strengths": [],
                "improvements": [],
                "skillsCovered": [],
                "requirementsSummary": "Error"
            }

# --- 4. API Endpoints ---

app = FastAPI(title="AI Interviewer", version="3.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

_sessions: Dict[str, InterviewSession] = {}

@app.get("/api/health")
def health():
    return {"status": "ok", "model": MODEL_NAME}

@app.post("/api/interview/start", response_model=StartInterviewResponse)
def start_interview(payload: StartInterviewRequest):
    session = InterviewSession(payload.profile)
    msg = session.start()
    _sessions[session.session_id] = session
    return StartInterviewResponse(
        sessionId=session.session_id,
        message=msg,
        phase="interview",
        done=False
    )

@app.post("/api/interview/message", response_model=MessageResponse)
def message(payload: MessageRequest):
    session = _sessions.get(payload.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    ai_msg, done = session.next_turn(payload.message)
    
    return MessageResponse(
        sessionId=session.session_id,
        message=ai_msg,
        phase="interview",
        done=done
    )

@app.post("/api/interview/finalize", response_model=FinalizeInterviewResponse)
def finalize(payload: FinalizeInterviewRequest):
    session = _sessions.get(payload.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    
    duration = payload.duration_seconds or 0
    eval_data = session.generate_evaluation(duration)
    del _sessions[payload.session_id]
    
    return FinalizeInterviewResponse(
        sessionId=payload.session_id,
        role=session.profile.role,
        company=session.profile.company,
        completionReason=payload.completion_reason or "done",
        durationSeconds=duration,
        totalQuestions=session.message_count,
        totalResponses=session.message_count,
        **eval_data
    )

class TTSRequest(BaseModel):
    text: str
    voice: str = "en-US-EmmaMultilingualNeural"

@app.post("/api/tts")
async def generate_tts(payload: TTSRequest):
    try:
        voice = payload.voice
        if "Journey" in voice: 
             voice = "en-US-EmmaMultilingualNeural"
             
        communicate = edge_tts.Communicate(payload.text, voice)
        filename = f"tts_{uuid4()}.mp3"
        filepath = os.path.join(tempfile.gettempdir(), filename)
        await communicate.save(filepath)
        return FileResponse(filepath, media_type="audio/mpeg", filename="speech.mp3")
    except Exception as e:
        print(f"TTS Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)