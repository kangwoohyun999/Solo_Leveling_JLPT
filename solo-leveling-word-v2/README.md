# ⚔ JWORD — Solo Leveling Word v2

## 파일 구조 & 수정 가이드

```
solo-leveling-word/
│
├── 📁 config/              ★ 설정값 — 가장 자주 수정하는 곳
│   ├── levels.ts           레벨 목록, 버튼 이름, 색상
│   └── quiz.ts             문제 수 기본값, 등급 기준, 딜레이
│
├── 📁 types/
│   └── index.ts            TypeScript 타입 정의 모음
│
├── 📁 lib/                 ★ 핵심 로직
│   ├── auth.ts             로그인/회원가입/세션 (DB 연동 시 여기만)
│   ├── words.ts            CSV 파싱 (컬럼 구조 변경 시 여기만)
│   ├── wrongAnswers.ts     오답노트 저장/로드
│   └── quiz.ts             셔플, 선택지 생성, 등급 계산
│
├── 📁 styles/
│   ├── globals.css         파트 import 목록
│   └── parts/              ★ CSS 기능별 분리
│       ├── tokens.css      색상, 폰트, CSS 변수  ← 색상 변경 여기
│       ├── background.css  배경 그리드/글로우
│       ├── layout.css      헤더, 드로어, 페이지 래퍼
│       ├── components.css  버튼, 카드, 모달, 폼
│       ├── pages.css       각 화면별 스타일
│       └── animations.css  애니메이션 키프레임
│
├── 📁 components/
│   ├── layout/
│   │   ├── Header.tsx      상단 헤더 (로고/뒤로가기 모드)
│   │   └── Drawer.tsx      슬라이드 메뉴 (항목: MENU_ITEMS 배열)
│   └── ui/
│       ├── AuthGuard.tsx   로그인 체크 훅 (useAuth)
│       ├── WordCard.tsx    단어 카드 한 행
│       └── QuizCountModal.tsx  문제 수 설정 모달
│
├── 📁 pages/               ★ 화면 (URL = 파일명)
│   ├── _app.tsx            앱 루트
│   ├── _document.tsx       HTML head 설정
│   ├── index.tsx           / 메인 화면
│   ├── login.tsx           /login 로그인·회원가입
│   ├── account.tsx         /account 계정 정보
│   ├── wrong-answers.tsx   /wrong-answers 오답노트
│   ├── level/[level].tsx   /level/N1 단어 목록
│   ├── quiz/[level].tsx    /quiz/N1?count=10 퀴즈
│   └── api/words.ts        GET /api/words?level=N1
│
└── 📁 data/
    └── jword.csv           ★ 단어 데이터 (교체 가능)
```

---

## 자주 수정하는 작업

### 레벨 추가/이름 변경
```ts
// config/levels.ts 의 LEVELS 배열에 항목 추가
{ id: 'N5', label: 'N5', sub: '입문', colorClass: '' }
```

### 색상 테마 변경
```css
/* styles/parts/tokens.css 의 :root 변수 수정 */
--accent-blue: #3d6bff;
--accent-gold: #f0c040;
```

### 퀴즈 기본 문제 수 변경
```ts
// config/quiz.ts
export const DEFAULT_QUIZ_COUNT = 10; // ← 여기
```

### 등급 기준 조정
```ts
// config/quiz.ts > RANK_THRESHOLDS
{ rank: 'S', min: 0.95 }, // 95% 이상 → S
{ rank: 'A', min: 0.80 }, // 80% 이상 → A
```

### 드로어 메뉴 항목 추가
```ts
// components/layout/Drawer.tsx > MENU_ITEMS
{ href: '/new-page', icon: '🆕', label: '새 메뉴' }
```

### jword.csv 교체
```csv
level,word,reading,meaning
N5,日本語,にほんご,일본어
```
컬럼 순서가 바뀌면 `lib/words.ts > parseRow()` 도 수정.

---

## Vercel 배포

```bash
npm install
npm run build   # 로컬 빌드 테스트

git init && git add . && git commit -m "init"
git push origin main
# vercel.com → New Project → import → Deploy
```
