# SoloLeveling Word 🗡️

일본어 JLPT 단어 학습 플랫폼 — Railway 배포용

## 프로젝트 구조

```
solo_leveling_word/
├── main.py           # FastAPI 앱 (라우터 전체)
├── database.py       # DB 연결 (SQLite / PostgreSQL)
├── models.py         # ORM 모델 (User, WrongNote)
├── requirements.txt  # 패키지 목록
├── Procfile          # Railway 시작 명령
├── data/
│   └── n5_words.json # N5 단어 664개
├── static/           # 정적 파일 폴더
└── templates/
    └── index.html    # SPA 전체 프론트엔드
```

## Railway 배포 방법

### 1. GitHub 업로드
```bash
git init
git add .
git commit -m "init: SoloLeveling Word"
git remote add origin <your-repo-url>
git push -u origin main
```

### 2. Railway 프로젝트 생성
1. https://railway.app 접속
2. New Project → Deploy from GitHub repo
3. 이 저장소 선택

### 3. PostgreSQL 추가
1. Railway 대시보드 → + New → Database → PostgreSQL
2. 자동으로 `DATABASE_URL` 환경변수가 연결됨

### 4. 환경변수 설정
Railway 대시보드 → Variables 탭:
```
SECRET_KEY=your_super_secret_key_here_change_this
```
> ⚠️ SECRET_KEY 반드시 변경하세요!

### 5. 도메인 설정
Settings → Networking → Generate Domain

---

## 로컬 실행 (개발)

```bash
pip install -r requirements.txt
uvicorn main:app --reload
# → http://localhost:8000
```

SQLite로 자동 실행됨 (별도 DB 불필요)

---

## 기능 목록

- ✅ 회원가입 / 로그인 (JWT + httpOnly 쿠키)
- ✅ N5 단어장 664개 (가나 + 한자 + 뜻)
- ✅ N5 퀴즈 (문제 수 선택, 3지선다)
- ✅ 오답노트 (자동 저장 + 수동 삭제)
- ✅ 계정 정보 수정 (닉네임, 비밀번호)
- 🔜 N4 ~ N1, 연계 기능 (Coming Soon)
