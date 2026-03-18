/* ════════════════════════════════════════════════════════
   js/6_init.js  —  앱 초기화 & 이벤트 리스너 등록
   ✏️  새 버튼/화면 추가 시 이 파일에 이벤트 리스너 추가
       로드 순서: 이 파일은 항상 마지막에 로드됩니다.
════════════════════════════════════════════════════════ */

/* ══════════════
   앱 진입점
══════════════ */
async function init() {
  // 1) 단어 데이터 로드 (CSV or 폴백)
  await loadWordData();

  // 2) 세션 확인 → 자동 로그인
  const session = getSession();
  if (session) {
    setSession(session);
    loadWrongNotes();
    showScreen('mainScreen');
  } else {
    showScreen('loginScreen');
  }

  // 3) 이벤트 리스너 일괄 등록
  _registerEvents();
}

/* ══════════════
   이벤트 리스너
══════════════ */
function _registerEvents() {

  /* ── 로그인 화면 ────────────────────────────────────── */
  $('btnLogin').addEventListener('click', handleLogin);

  // 비밀번호 필드에서 Enter → 로그인
  $('loginPw').addEventListener('keydown', e => {
    if (e.key === 'Enter') handleLogin();
  });

  $('btnOpenRegister').addEventListener('click', openRegisterModal);

  /* ── 회원가입 모달 ──────────────────────────────────── */
  $('btnRegister').addEventListener('click', handleRegister);
  $('btnCloseRegister').addEventListener('click', closeRegisterModal);

  // 모달 오버레이 클릭 → 닫기
  $('registerModal').addEventListener('click', e => {
    if (e.target === $('registerModal')) closeRegisterModal();
  });

  /* ── 메인 화면 — 헤더 ───────────────────────────────── */
  $('hamburgerBtn').addEventListener('click', openDrawer);

  /* ── 드로어 ─────────────────────────────────────────── */
  $('drawerOverlay').addEventListener('click', closeDrawer);
  $('drawerCloseBtn').addEventListener('click', closeDrawer);
  $('drawerMenuAccount').addEventListener('click', openAccount);
  $('drawerMenuWrong').addEventListener('click', openWrongNote);
  $('btnLogout').addEventListener('click', handleLogout);

  /* ── 메인 화면 — 레벨 버튼들 ───────────────────────── */
  document.querySelectorAll('.level-btn[data-level]').forEach(btn => {
    btn.addEventListener('click', () => openLevel(btn.dataset.level));
  });

  /* ── 단어 목록 화면 ─────────────────────────────────── */
  $('btnBackFromWord').addEventListener('click', () => showScreen('mainScreen'));
  $('quizFab').addEventListener('click', openQuizCount);

  /* ── 문제 수 선택 화면 ──────────────────────────────── */
  $('btnBackFromCount').addEventListener('click', () => showScreen('wordScreen'));

  document.querySelectorAll('.count-option-btn').forEach(btn => {
    btn.addEventListener('click', () => selectCount(parseInt(btn.dataset.count, 10)));
  });

  // 직접 입력 시 프리셋 선택 해제
  $('customCountInput').addEventListener('input', () => {
    document.querySelectorAll('.count-option-btn').forEach(b => b.classList.remove('selected'));
  });

  $('btnStartQuiz').addEventListener('click', startQuiz);

  /* ── 퀴즈 화면 ──────────────────────────────────────── */
  $('btnBackFromQuiz').addEventListener('click', () => showScreen('wordScreen'));
  $('btnRetry').addEventListener('click', retryQuiz);
  $('btnToList').addEventListener('click', backToWordList);

  /* ── 계정 화면 ──────────────────────────────────────── */
  $('btnBackFromAccount').addEventListener('click', () => showScreen('mainScreen'));
  $('btnSaveAccount').addEventListener('click', saveAccount);

  /* ── 오답 노트 화면 ─────────────────────────────────── */
  $('btnBackFromWrong').addEventListener('click', () => showScreen('mainScreen'));
}

/* ── 짧은 id 셀렉터 헬퍼 ───────────────────────────────── */
/** document.getElementById 단축형 */
function $(id) {
  return document.getElementById(id);
}

/* ── DOMContentLoaded 후 앱 시작 ────────────────────────── */
document.addEventListener('DOMContentLoaded', init);
