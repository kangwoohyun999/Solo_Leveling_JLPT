from fastapi import FastAPI, HTTPException, Depends, Response, Cookie
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, JSONResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import json, os, bcrypt, jwt, datetime, random
from database import get_db, init_db
import sqlalchemy
from sqlalchemy.orm import Session

SECRET_KEY = os.getenv("SECRET_KEY", "sololvling_secret_2024")
ALGORITHM = "HS256"

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/static", StaticFiles(directory="static"), name="static")

# ── N5 단어 로드 ──────────────────────────────────────────
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
with open(os.path.join(BASE_DIR, "data", "n5_words.json"), encoding="utf-8") as f:
    N5_WORDS = json.load(f)

# ── Pydantic Models ────────────────────────────────────────
class RegisterRequest(BaseModel):
    username: str
    password: str
    nickname: str

class LoginRequest(BaseModel):
    username: str
    password: str

class UpdateProfileRequest(BaseModel):
    nickname: Optional[str] = None
    current_password: Optional[str] = None
    new_password: Optional[str] = None

class WrongNoteRequest(BaseModel):
    word: str
    hiragana: str
    meaning: str
    level: str

# ── Auth helpers ───────────────────────────────────────────
def create_token(user_id: int, username: str) -> str:
    payload = {
        "sub": str(user_id),
        "username": username,
        "exp": datetime.datetime.utcnow() + datetime.timedelta(days=30)
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

def verify_token(token: str) -> dict:
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except:
        return None

def get_current_user(token: Optional[str] = Cookie(None), db: Session = Depends(get_db)):
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    payload = verify_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid token")
    from models import User
    user = db.query(User).filter(User.id == int(payload["sub"])).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

# ── Routes ─────────────────────────────────────────────────
@app.on_event("startup")
async def startup():
    init_db()

@app.get("/", response_class=HTMLResponse)
async def root():
    with open(os.path.join(BASE_DIR, "templates", "index.html"), encoding="utf-8") as f:
        return f.read()

@app.post("/api/register")
async def register(req: RegisterRequest, db: Session = Depends(get_db)):
    from models import User
    if db.query(User).filter(User.username == req.username).first():
        raise HTTPException(status_code=400, detail="이미 존재하는 아이디입니다")
    hashed = bcrypt.hashpw(req.password.encode(), bcrypt.gensalt()).decode()
    user = User(username=req.username, password_hash=hashed, nickname=req.nickname)
    db.add(user)
    db.commit()
    db.refresh(user)
    return {"message": "회원가입 성공"}

@app.post("/api/login")
async def login(req: LoginRequest, response: Response, db: Session = Depends(get_db)):
    from models import User
    user = db.query(User).filter(User.username == req.username).first()
    if not user or not bcrypt.checkpw(req.password.encode(), user.password_hash.encode()):
        raise HTTPException(status_code=401, detail="아이디 또는 비밀번호가 틀렸습니다")
    token = create_token(user.id, user.username)
    response.set_cookie("token", token, httponly=True, max_age=60*60*24*30, samesite="lax")
    return {"message": "로그인 성공", "nickname": user.nickname}

@app.post("/api/logout")
async def logout(response: Response):
    response.delete_cookie("token")
    return {"message": "로그아웃"}

@app.get("/api/me")
async def me(current_user=Depends(get_current_user)):
    return {"username": current_user.username, "nickname": current_user.nickname}

@app.put("/api/me")
async def update_me(req: UpdateProfileRequest, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    from models import User
    user = db.query(User).filter(User.id == current_user.id).first()
    if req.nickname:
        user.nickname = req.nickname
    if req.new_password:
        if not req.current_password or not bcrypt.checkpw(req.current_password.encode(), user.password_hash.encode()):
            raise HTTPException(status_code=400, detail="현재 비밀번호가 틀렸습니다")
        user.password_hash = bcrypt.hashpw(req.new_password.encode(), bcrypt.gensalt()).decode()
    db.commit()
    return {"message": "수정 완료", "nickname": user.nickname}

# ── 단어 API ───────────────────────────────────────────────
@app.get("/api/words/n5")
async def get_n5_words(current_user=Depends(get_current_user)):
    return {"words": N5_WORDS, "total": len(N5_WORDS)}

@app.get("/api/quiz/n5")
async def get_n5_quiz(count: int = 10, current_user=Depends(get_current_user)):
    if count > len(N5_WORDS):
        count = len(N5_WORDS)
    selected = random.sample(N5_WORDS, count)
    all_meanings = [w["meaning"] for w in N5_WORDS]
    questions = []
    for word in selected:
        wrong = random.sample([m for m in all_meanings if m != word["meaning"]], 2)
        choices = wrong + [word["meaning"]]
        random.shuffle(choices)
        questions.append({
            "word": word["word"],
            "hiragana": word["hiragana"],
            "answer": word["meaning"],
            "choices": choices,
            "level": "N5"
        })
    return {"questions": questions}

# ── 오답노트 API ───────────────────────────────────────────
@app.post("/api/wrongnote")
async def add_wrong(req: WrongNoteRequest, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    from models import WrongNote
    existing = db.query(WrongNote).filter(
        WrongNote.user_id == current_user.id,
        WrongNote.word == req.word,
        WrongNote.level == req.level
    ).first()
    if not existing:
        note = WrongNote(user_id=current_user.id, word=req.word, hiragana=req.hiragana, meaning=req.meaning, level=req.level)
        db.add(note)
        db.commit()
    return {"message": "오답노트에 추가됨"}

@app.get("/api/wrongnote")
async def get_wrong(current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    from models import WrongNote
    notes = db.query(WrongNote).filter(WrongNote.user_id == current_user.id).all()
    return {"notes": [{"word": n.word, "hiragana": n.hiragana, "meaning": n.meaning, "level": n.level, "id": n.id} for n in notes]}

@app.delete("/api/wrongnote/{note_id}")
async def delete_wrong(note_id: int, current_user=Depends(get_current_user), db: Session = Depends(get_db)):
    from models import WrongNote
    note = db.query(WrongNote).filter(WrongNote.id == note_id, WrongNote.user_id == current_user.id).first()
    if not note:
        raise HTTPException(status_code=404, detail="Not found")
    db.delete(note)
    db.commit()
    return {"message": "삭제됨"}
