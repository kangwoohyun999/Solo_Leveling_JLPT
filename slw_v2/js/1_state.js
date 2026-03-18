/* ════════════════════════════════════════════════════════
   js/1_state.js  —  전역 상태 & 공용 유틸리티
   ✏️  앱 상태 구조, 화면 전환, 토스트 수정 시 이 파일 편집
════════════════════════════════════════════════════════ */

/* ── 앱 전역 상태 ────────────────────────────────────── */
const App = {
  user:         null,   // 현재 로그인 유저 객체
  currentLevel: null,   // 선택된 레벨 (N1~N5)
  wordData:     {},     // { N1: [...], N2: [...], ... }

  // 퀴즈 관련
  quizWords: [],        // 퀴즈에 사용할 단어 배열
  quizIdx:   0,         // 현재 문제 인덱스
  quizScore: 0,         // 맞힌 개수
  quizCount: 10,        // 선택한 문제 수

  // 오답 노트
  wrongNotes: [],       // [{ level, word, reading, meaning }, ...]
};

/* ── 화면 전환 ───────────────────────────────────────── */
/**
 * 특정 화면 id를 활성화하고 나머지를 숨깁니다.
 * @param {string} id - 보여줄 화면 요소의 id
 */
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const el = document.getElementById(id);
  if (el) {
    el.classList.add('active');
    window.scrollTo(0, 0);
  }
}

/* ── 토스트 알림 ─────────────────────────────────────── */
/**
 * 하단에 짧은 알림 메시지를 표시합니다.
 * @param {string} msg - 표시할 메시지
 * @param {number} duration - 표시 시간(ms), 기본 2200
 */
function showToast(msg, duration = 2200) {
  const toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), duration);
}

/* ── 레벨 색상 반환 ──────────────────────────────────── */
/**
 * 레벨 문자열에 맞는 강조 색상 hex 값을 반환합니다.
 * @param {string} level - 'N1' ~ 'N5'
 * @returns {string} CSS 색상 값
 */
function getLevelColor(level) {
  const colors = {
    N5: '#64ffda',
    N4: '#00d4ff',
    N3: '#a78bfa',
    N2: '#ffa500',
    N1: '#ff4d6d',
  };
  return colors[level] ?? '#ffffff';
}
