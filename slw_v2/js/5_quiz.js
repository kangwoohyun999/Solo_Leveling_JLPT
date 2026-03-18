/* ════════════════════════════════════════════════════════
   js/5_quiz.js  —  퀴즈 로직 (문제수 선택 · 퀴즈 · 오답)
   ✏️  퀴즈 흐름, 정답 판정, 오답 저장 수정 시 이 파일 편집
════════════════════════════════════════════════════════ */

/* ══════════════
   문제 수 선택 화면
══════════════ */

/** Q 버튼 클릭 → 문제 수 선택 화면 열기 */
function openQuizCount() {
  // 선택 초기화
  document.querySelectorAll('.count-option-btn').forEach(b => b.classList.remove('selected'));
  document.getElementById('customCountInput').value = '';
  App.quizCount = 10;
  document.querySelector('[data-count="10"]')?.classList.add('selected');

  showScreen('quizCountScreen');
}

/** 프리셋 버튼 클릭 시 선택 표시 */
function selectCount(n) {
  App.quizCount = n;
  document.querySelectorAll('.count-option-btn').forEach(b => b.classList.remove('selected'));
  document.querySelector(`[data-count="${n}"]`)?.classList.add('selected');
  document.getElementById('customCountInput').value = '';
}

/* ══════════════
   퀴즈 시작
══════════════ */

/** "START QUIZ" 버튼 → 단어 섞고 퀴즈 화면 진입 */
function startQuiz() {
  // 직접 입력값 우선 처리
  const customVal = document.getElementById('customCountInput').value;
  if (customVal) {
    const n = parseInt(customVal, 10);
    if (!n || n < 1) return showToast('올바른 숫자를 입력해주세요.');
    App.quizCount = n;
  }

  const allWords = App.wordData[App.currentLevel] ?? [];
  if (allWords.length === 0) return showToast('단어 데이터가 없습니다.');

  // 랜덤 추출
  const shuffled = [...allWords].sort(() => Math.random() - 0.5);
  App.quizWords  = shuffled.slice(0, Math.min(App.quizCount, allWords.length));
  App.quizIdx    = 0;
  App.quizScore  = 0;

  showScreen('quizScreen');
  _renderQuestion();
}

/* ══════════════
   문제 렌더링
══════════════ */

function _renderQuestion() {
  const total = App.quizWords.length;
  const idx   = App.quizIdx;
  const word  = App.quizWords[idx];
  const pool  = App.wordData[App.currentLevel] ?? [];

  // 진행 표시
  document.getElementById('quizCounter').textContent      = `${idx + 1} / ${total}`;
  document.getElementById('quizProgressBar').style.width  = `${(idx / total) * 100}%`;

  // 단어 표시
  document.getElementById('quizWordJp').textContent      = word.word;
  document.getElementById('quizWordReading').textContent = word.reading;

  // ── 보기 생성: 정답 1개 + 오답 2개 (랜덤)
  const wrong   = pool
    .filter(w => w.word !== word.word)
    .sort(() => Math.random() - 0.5)
    .slice(0, 2);

  const options = [word, ...wrong].sort(() => Math.random() - 0.5);

  const grid = document.getElementById('answersGrid');
  grid.innerHTML = '';

  options.forEach(opt => {
    const btn = document.createElement('button');
    btn.className   = 'answer-btn';
    btn.textContent = opt.meaning;
    btn.addEventListener('click', () => _handleAnswer(btn, opt.meaning, word.meaning));
    grid.appendChild(btn);
  });
}

/* ══════════════
   정답 처리
══════════════ */

/**
 * @param {HTMLButtonElement} btnEl  - 클릭된 버튼
 * @param {string}            chosen - 선택한 뜻
 * @param {string}            correct- 정답 뜻
 */
function _handleAnswer(btnEl, chosen, correct) {
  // 모든 버튼 비활성화 + 정답 강조
  document.querySelectorAll('.answer-btn').forEach(b => {
    b.disabled = true;
    if (b.textContent === correct) b.classList.add('correct');
  });

  if (chosen === correct) {
    // 정답
    btnEl.classList.add('correct');
    App.quizScore++;
  } else {
    // 오답
    btnEl.classList.add('wrong');
    _addToWrongNotes(App.quizWords[App.quizIdx]);
  }

  // 다음 문제로 (0.9초 후)
  setTimeout(() => {
    App.quizIdx++;
    if (App.quizIdx >= App.quizWords.length) {
      _showResult();
    } else {
      _renderQuestion();
    }
  }, 900);
}

/* ══════════════
   결과 화면
══════════════ */

function _showResult() {
  const total = App.quizWords.length;
  const score = App.quizScore;
  const pct   = Math.round((score / total) * 100);

  // 점수 이모지 결정
  let emoji = '😢';
  if      (pct >= 90) emoji = '🏆';
  else if (pct >= 70) emoji = '🎉';
  else if (pct >= 50) emoji = '💪';

  document.getElementById('resultEmoji').textContent = emoji;
  document.getElementById('resultScore').textContent = `${score}/${total}`;
  document.getElementById('resultLabel').textContent = `정답률 ${pct}%`;
  document.getElementById('quizProgressBar').style.width = '100%';

  document.getElementById('quizResultOverlay').classList.add('show');
}

/** 다시 풀기 버튼 */
function retryQuiz() {
  document.getElementById('quizResultOverlay').classList.remove('show');
  App.quizIdx   = 0;
  App.quizScore = 0;
  App.quizWords = [...App.quizWords].sort(() => Math.random() - 0.5);
  _renderQuestion();
}

/** 단어 목록으로 버튼 */
function backToWordList() {
  document.getElementById('quizResultOverlay').classList.remove('show');
  showScreen('wordScreen');
}

/* ══════════════
   오답 노트 저장/불러오기
══════════════ */

/** 오답 단어를 App.wrongNotes에 추가하고 localStorage에 저장 */
function _addToWrongNotes(word) {
  const already = App.wrongNotes.find(w => w.word === word.word);
  if (!already) {
    App.wrongNotes.push({ ...word, level: App.currentLevel });
  }
  saveWrongNotes();
}

/** localStorage에 오답 노트 저장 */
function saveWrongNotes() {
  if (!App.user) return;
  const key = 'slw_wrong_' + App.user.id;
  localStorage.setItem(key, JSON.stringify(App.wrongNotes));
}

/** localStorage에서 오답 노트 불러오기 */
function loadWrongNotes() {
  if (!App.user) return;
  const key  = 'slw_wrong_' + App.user.id;
  const raw  = localStorage.getItem(key);
  App.wrongNotes = raw ? JSON.parse(raw) : [];
}
