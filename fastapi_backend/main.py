import os
import re
from datetime import datetime
from typing import Callable, Dict, List, Optional, Tuple
from uuid import uuid4

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, ConfigDict, Field


def _split_skills(raw: str) -> List[str]:
    if not raw:
        return []
    # Split by comma, semicolon, or newline and strip whitespace
    parts = re.split(r"[,;\n]+", raw)
    cleaned = [item.strip() for item in parts if item.strip()]
    # Deduplicate while preserving order
    seen = set()
    unique: List[str] = []
    for item in cleaned:
        key = item.lower()
        if key not in seen:
            seen.add(key)
            unique.append(item)
    return unique


EXPERIENCE_LABELS: Dict[str, str] = {
    "fresher": "entry-level professional",
    "junior": "early-career engineer",
    "mid": "mid-level engineer",
    "senior": "senior engineer",
    "lead": "lead/principal-level expert",
}


EXPERIENCE_PROMPTS: Dict[str, str] = {
    "fresher": (
        "Since you're getting started professionally, could you walk me through a project or coursework where you applied {primary_skill}? "
        "What role did you play and what was the biggest thing you learned?"
    ),
    "junior": (
        "With a couple of years of experience, I'm curious about a situation where you had to own a feature around {primary_skill}. "
        "How did you approach the problem and what impact did it have?"
    ),
    "mid": (
        "As a mid-level engineer, tell me about a time you were accountable for delivering {primary_skill}-focused work end-to-end. "
        "What trade-offs did you manage and how did you measure success?"
    ),
    "senior": (
        "At the senior level we lean on you for depth and leadership. Can you describe a complex challenge involving {primary_skill} where you guided others or shaped the direction?"
    ),
    "lead": (
        "From a principal perspective, I'm interested in a strategic decision you made involving {primary_skill}. "
        "What context did you evaluate and how did your call influence the wider organisation?"
    ),
}


BEHAVIORAL_PROMPTS: Dict[str, str] = {
    "default": (
        "Tell me about a moment when the team hit resistance on an important goal. "
        "How did you help everyone get back on track, and what did you take away from the experience?"
    ),
    "startup": (
        "Startups move fast and ambiguity is everywhere. Describe a time you had to ship under significant uncertainty. "
        "How did you decide what "
        "to do first and what was the result?"
    ),
    "finance/banking": (
        "In finance we balance precision and risk. Share a time when compliance or risk constraints forced you to redesign your solution. "
        "What did you learn?"
    ),
    "healthcare": (
        "Healthcare demands reliability. Tell me about a feature where patient or customer trust was on the line. "
        "How did you safeguard quality?"
    ),
    "education": (
        "Education products hinge on learner success. Describe an initiative where you improved outcomes for end users. "
        "What data informed your decisions?"
    ),
    "gaming": (
        "Games thrive on engagement. Talk me through a moment where player feedback shaped your roadmap. "
        "How did you incorporate it?"
    ),
}


class CandidateProfile(BaseModel):
    role: Optional[str] = ""
    experience: Optional[str] = ""
    company: Optional[str] = ""
    skills: Optional[str] = ""
    focus: Optional[str] = ""
    industry: Optional[str] = ""


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
    strengths: List[str]
    improvements: List[str]
    completionReason: str
    durationSeconds: int
    totalQuestions: int
    totalResponses: int
    skillsCovered: List[str] = Field(default_factory=list)
    requirementsSummary: str = ""


def _compose_requirements(profile: CandidateProfile, skills: List[str]) -> str:
    fragments: List[str] = []
    if profile.role:
        fragments.append(profile.role)
    if profile.focus:
        fragments.append(profile.focus)
    if skills:
        if len(skills) == 1:
            fragments.append(skills[0])
        elif len(skills) == 2:
            fragments.append(" and ".join(skills))
        else:
            fragments.append(", ".join(skills[:-1]) + f", and {skills[-1]}")
    if profile.industry:
        fragments.append(f"experience in {profile.industry}")
    if not fragments:
        return "core problem-solving and collaboration"
    return ", ".join(fragments)


class InterviewSession:
    """Lightweight rule-based interview planner that tailors questions to the profile."""

    def __init__(self, profile: CandidateProfile):
        self.profile = profile
        self.session_id = str(uuid4())
        self.history: List[Dict[str, str]] = []
        self.phase = "introduction"
        self.step_index = 0
        self.skills = _split_skills(profile.skills)
        self.skills = self.skills[:3]  # keep the conversation focused
        self.requirements_summary = _compose_requirements(profile, self.skills)
        self.behavioral_key = profile.industry.lower() if profile.industry else ""
        self.complete = False
        self.plan = self._build_plan()
        self.started_at = datetime.utcnow()

    def _build_plan(self) -> List[Tuple[str, Callable[[Optional[str]], str]]]:
        plan: List[Tuple[str, Callable[[Optional[str]], str]]] = []
        plan.append(("introduction", self._intro_question))
        plan.append(("technical-basic", self._experience_probe))

        for index, skill in enumerate(self.skills):
            phase = "technical-intermediate" if index == 0 else "technical-advanced"
            plan.append((phase, self._skill_question_factory(skill, index)))

        if self.profile.focus:
            plan.append(("technical-advanced", self._focus_question))
        else:
            plan.append(("technical-advanced", self._scenario_question))

        plan.append(("behavioral", self._behavioral_question))
        plan.append(("closing", self._closing_prompt))
        return plan

    def _add_history(self, role: str, message: str, phase: Optional[str] = None) -> None:
        entry = {
            "role": role,
            "message": message,
            "timestamp": datetime.utcnow().isoformat(),
            "phase": phase or self.phase,
        }
        self.history.append(entry)

    def record_user_message(self, message: str) -> None:
        self._add_history("user", message)

    def next_ai_turn(self, latest_user_message: Optional[str] = None) -> Tuple[str, str, bool]:
        if self.complete:
            follow_up = self._post_closing_ack(latest_user_message)
            self._add_history("ai", follow_up, phase="closing")
            return follow_up, "closing", True

        if self.step_index >= len(self.plan):
            self.complete = True
            return self.next_ai_turn(latest_user_message)

        phase, builder = self.plan[self.step_index]
        self.phase = phase
        message = builder(latest_user_message)

        self._add_history("ai", message)
        self.step_index += 1

        if self.step_index >= len(self.plan):
            self.complete = True

        return message, phase, self.complete

    # Evaluation helpers -------------------------------------------------

    def _count_turns(self) -> Tuple[int, int]:
        user_turns = [entry for entry in self.history if entry["role"] == "user"]
        ai_turns = [entry for entry in self.history if entry["role"] == "ai"]
        return len(ai_turns), len(user_turns)

    def _average_response_length(self) -> float:
        user_turns = [entry for entry in self.history if entry["role"] == "user"]
        if not user_turns:
            return 0.0
        total_chars = sum(len(turn["message"]) for turn in user_turns)
        return total_chars / len(user_turns)

    def _coverage_ratio(self) -> float:
        if not self.plan:
            return 0.0
        covered_phases = {entry["phase"] for entry in self.history if entry["role"] == "ai" and entry.get("phase")}
        return min(1.0, len(covered_phases) / len(self.plan))

    def generate_evaluation(self, completion_reason: Optional[str], duration_seconds: Optional[int]) -> Dict[str, object]:
        total_questions, total_responses = self._count_turns()
        avg_length = self._average_response_length()
        coverage = self._coverage_ratio()

        # Scoring heuristics: participation, depth, coverage
        participation_score = min(1.0, total_responses / max(4, len(self.plan)))
        depth_score = min(1.0, avg_length / 240.0)
        coverage_score = coverage

        raw_score = 4.0 + (participation_score * 3.5) + (depth_score * 1.5) + (coverage_score * 1.0)
        score = max(1.0, min(10.0, round(raw_score, 1)))

        strengths: List[str] = []
        improvements: List[str] = []

        if total_responses >= 4:
            strengths.append("Consistently responded to the interviewer prompts.")
        if avg_length >= 140:
            strengths.append("Provided detailed, narrative-style answers with strong context.")
        elif avg_length >= 90:
            strengths.append("Demonstrated concise explanations with relevant examples.")

        if coverage >= 0.8:
            strengths.append("Covered most of the planned interview topics.")

        if total_responses <= 2:
            improvements.append("Increase the number of follow-up details to show fuller ownership of outcomes.")
        if avg_length < 80:
            improvements.append("Expand answers with specifics—mention stakeholders, metrics, or tools used.")
        if coverage < 0.6:
            improvements.append("Aim to progress through more of the interview agenda by keeping answers focused.")

        if not improvements:
            improvements.append("Consider closing answers with explicit results or key takeaways to reinforce impact.")

        summary_parts = [
            f"You answered {total_responses} of {max(total_questions, total_responses)} prompts",
            f"covering about {int(coverage * 100)}% of the planned topics",
        ]
        if avg_length:
            summary_parts.append(f"with an average answer length of {int(avg_length)} characters")
        summary = " ".join(summary_parts) + "."

        computed_duration = duration_seconds or int(max((datetime.utcnow() - self.started_at).total_seconds(), 0))

        return {
            "sessionId": self.session_id,
            "role": self.profile.role or "",
            "company": self.profile.company or "",
            "score": score,
            "summary": summary,
            "strengths": strengths,
            "improvements": improvements,
            "completionReason": completion_reason or "unknown",
            "durationSeconds": computed_duration,
            "totalQuestions": total_questions,
            "totalResponses": total_responses,
            "skillsCovered": self.skills,
            "requirementsSummary": self.requirements_summary,
        }

    # Question builders -------------------------------------------------

    def _intro_question(self, _: Optional[str]) -> str:
        role = self.profile.role or "this role"
        company = self.profile.company or "the team"
        level = EXPERIENCE_LABELS.get(self.profile.experience or "", "professional")
        return (
            f"Hi there! I'm the AI interviewer for the {role} opportunity at {company}. "
            f"To get us started, could you give me a quick overview of your background as {level} "
            f"and what draws you to this position?"
        )

    def _experience_probe(self, latest_user_message: Optional[str]) -> str:
        primary_skill = self.skills[0] if self.skills else "the core technologies in this role"
        template = EXPERIENCE_PROMPTS.get(
            (self.profile.experience or "").lower(),
            (
                "Tell me about a recent piece of work where you delivered strong results with {primary_skill}. "
                "What made it challenging and how did you measure impact?"
            ),
        )
        return template.format(primary_skill=primary_skill)

    def _skill_question_factory(self, skill: str, index: int):
        skill_name = skill

        def _question(_: Optional[str]) -> str:
            requirement = self.requirements_summary
            depth_prompt = (
                "At this stage I'd like to go deeper into how you operate when the constraints get tight."
                if index > 0
                else "Let's connect your experience to what we need on this team."
            )
            return (
                f"This {self.profile.role or 'role'} depends heavily on {skill_name}. {depth_prompt} "
                f"Can you describe a moment where {skill_name} was essential and how you ensured the work aligned with {requirement}?"
            )

        return _question

    def _focus_question(self, latest_user_message: Optional[str]) -> str:
        focus_area = self.profile.focus
        return (
            f"You mentioned a focus on {focus_area}. Suppose we're planning the next quarter and need a roadmap that strengthens our {focus_area.lower()} capabilities. "
            f"How would you evaluate what to build, and what signals would you watch during delivery?"
        )

    def _scenario_question(self, latest_user_message: Optional[str]) -> str:
        role = self.profile.role or "this"
        return (
            f"Imagine you join as our {role}. On day one you discover the codebase hasn't kept pace with the current requirements around {self.requirements_summary}. "
            f"What first steps would you take in the opening weeks to build context and start improvements?"
        )

    def _behavioral_question(self, latest_user_message: Optional[str]) -> str:
        key = self.behavioral_key
        prompt = BEHAVIORAL_PROMPTS.get(key, BEHAVIORAL_PROMPTS["default"])
        return prompt

    def _closing_prompt(self, latest_user_message: Optional[str]) -> str:
        company = self.profile.company or "our team"
        return (
            f"Thanks for your thoughtful responses. Before we wrap, what questions do you have for {company} or about the way we approach {self.requirements_summary}?"
        )

    def _post_closing_ack(self, latest_user_message: Optional[str]) -> str:
        return (
            "I appreciate the conversation today. We'll review everything in detail and follow up with next steps soon. "
            "Feel free to reach out if anything else comes to mind."
        )


# ---------------------------------------------------------------------
# FastAPI application setup

app = FastAPI(title="AI Interview Service", version="0.1.0")

allowed_origins = [origin.strip() for origin in os.getenv("CORS_ORIGINS", "http://localhost:5173").split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins or ["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


_sessions: Dict[str, InterviewSession] = {}


@app.get("/api/health")
def health_check() -> Dict[str, str]:
    return {"status": "ok", "service": "fastapi-interview"}


@app.post("/api/interview/start", response_model=StartInterviewResponse)
def start_interview(payload: StartInterviewRequest) -> StartInterviewResponse:
    session = InterviewSession(payload.profile)
    opening_message, phase, done = session.next_ai_turn()

    _sessions[session.session_id] = session

    return StartInterviewResponse(
        sessionId=session.session_id,
        message=opening_message,
        phase=phase,
        done=done,
    )


@app.post("/api/interview/message", response_model=MessageResponse)
def continue_interview(payload: MessageRequest) -> MessageResponse:
    session = _sessions.get(payload.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Interview session not found")

    user_message = payload.message.strip()
    if not user_message:
        raise HTTPException(status_code=400, detail="Message cannot be empty")

    session.record_user_message(user_message)
    ai_message, phase, done = session.next_ai_turn(user_message)

    return MessageResponse(
        sessionId=session.session_id,
        message=ai_message,
        phase=phase,
        done=done,
    )


@app.delete("/api/interview/{session_id}")
def end_interview(session_id: str) -> Dict[str, str]:
    if session_id in _sessions:
        del _sessions[session_id]
    return {"status": "ended", "sessionId": session_id}


@app.post("/api/interview/finalize", response_model=FinalizeInterviewResponse)
def finalize_interview(payload: FinalizeInterviewRequest) -> FinalizeInterviewResponse:
    session = _sessions.get(payload.session_id)
    if not session:
        raise HTTPException(status_code=404, detail="Interview session not found")

    evaluation = session.generate_evaluation(payload.completion_reason, payload.duration_seconds)
    del _sessions[payload.session_id]

    return FinalizeInterviewResponse(**evaluation)


if __name__ == "__main__":  # pragma: no cover
    import uvicorn

    uvicorn.run(
        "main:app",
        host=os.getenv("HOST", "0.0.0.0"),
        port=int(os.getenv("PORT", "8000")),
        reload=True,
    )
