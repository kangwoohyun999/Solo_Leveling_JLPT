/* ════════════════════════════════════════════════════════
   js/4_wordlist.js  —  드로어 메뉴 & 단어 목록 화면
   ✏️  드로어 동작, 단어 목록 렌더링 수정 시 이 파일 편집
════════════════════════════════════════════════════════ */

/* ══════════════
   사이드 드로어
══════════════ */

function openDrawer() {
  document.getElementById('drawerOverlay').classList.add('open');
  document.getElementById('mainDrawer').classList.add('open');
  _syncDrawerUser();
}

function closeDrawer() {
  document.getElementById('drawerOverlay').classList.remove('open');
  document.getElementById('mainDrawer').classList.remove('open');
}

/** 드로어에 현재 유저 정보 반영 */
function _syncDrawerUser() {
  if (!App.user) return;
  document.getElementById('drawerUsername').textContent = App.user.name  ?? '사용자';
  document.getElementById('drawerEmail').textContent    = App.user.email ?? '';
}

/* ══════════════
   단어 목록 화면
══════════════ */

/**
 * 레벨 버튼 클릭 시 호출.
 * 단어 목록 화면을 해당 레벨로 초기화하고 표시합니다.
 * @param {string} level - 'N1' ~ 'N5'
 */
function openLevel(level) {
  App.currentLevel = level;
  const words = App.wordData[level] ?? [];

  // ── 헤더 업데이트
  const titleEl = document.getElementById('wordScreenTitle');
  titleEl.textContent  = level;
  titleEl.style.color  = getLevelColor(level);
  document.getElementById('wordCountBadge').textContent = words.length + '개';

  // ── 단어 목록 렌더링
  _renderWordList(words);

  // ── Q(퀴즈) 버튼 표시
  document.getElementById('quizFab').classList.add('visible');

  showScreen('wordScreen');
}

/**
 * 단어 배열을 받아 목록 UI를 생성합니다.
 * @param {Object[]} words
 */
function _renderWordList(words) {
  const listEl = document.getElementById('wordList');
  listEl.innerHTML = '';

  if (words.length === 0) {
    listEl.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📂</div>
        <p>단어 데이터가 없습니다.<br>jword.csv에 단어를 추가해주세요.</p>
      </div>`;
    return;
  }

  words.forEach((w, i) => {
    const card = document.createElement('div');
    card.className = 'word-card';
    // 순차 애니메이션 (최대 0.5s 지연)
    card.style.animationDelay = Math.min(i * 0.03, 0.5) + 's';
    card.innerHTML = `
      <span class="word-jp">${w.word}</span>
      <span class="word-reading">${w.reading}</span>
      <span class="word-kr">${w.meaning}</span>
    `;
    listEl.appendChild(card);
  });
}

/* ══════════════
   오답 노트 화면
══════════════ */

function openWrongNote() {
  closeDrawer();
  _renderWrongNoteList();
  showScreen('wrongNoteScreen');
}

/**
 * 오답 노트 목록 UI를 생성합니다.
 */
function _renderWrongNoteList() {
  loadWrongNotes(); // 3_auth → 5_quiz 에서 정의됨 (wrongnotes.js)
  const listEl = document.getElementById('wrongNoteList');
  listEl.innerHTML = '';

  if (App.wrongNotes.length === 0) {
    listEl.innerHTML = `
      <div class="empty-state">
        <div class="empty-icon">📝</div>
        <p>아직 오답 노트가 없어요.<br>퀴즈를 풀고 틀린 단어를 확인하세요!</p>
      </div>`;
    return;
  }

  // 컬럼 헤더
  const header = document.createElement('div');
  header.className = 'word-list-header';
  header.innerHTML = '<span>단어</span><span>발음</span><span style="text-align:right">뜻</span>';
  listEl.appendChild(header);

  // 단어 카드
  App.wrongNotes.forEach((w, i) => {
    const card = document.createElement('div');
    card.className = 'word-card';
    card.style.animationDelay = Math.min(i * 0.03, 0.5) + 's';
    card.innerHTML = `
      <span class="word-jp">${w.word}</span>
      <span class="word-reading">${w.reading}</span>
      <span class="word-kr">${w.meaning}</span>
    `;
    listEl.appendChild(card);
  });
}
