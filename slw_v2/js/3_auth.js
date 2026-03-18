/* ════════════════════════════════════════════════════════
   js/3_auth.js  —  인증 (로그인 · 회원가입 · 세션)
   ✏️  로그인 로직, 유효성 검사, 세션 방식 수정 시 이 파일 편집
════════════════════════════════════════════════════════ */

/* ── localStorage 키 상수 ────────────────────────────── */
const LS_USERS   = 'slw_users';    // 전체 유저 목록
const LS_SESSION = 'slw_session';  // 현재 세션 유저

/* ══════════════
   localStorage 헬퍼
══════════════ */

/** 저장된 전체 유저 객체 반환 */
function getUsers() {
  return JSON.parse(localStorage.getItem(LS_USERS) || '{}');
}

/** 특정 유저 저장 */
function saveUser(id, data) {
  const users = getUsers();
  users[id] = data;
  localStorage.setItem(LS_USERS, JSON.stringify(users));
}

/** 세션 유저 반환 (없으면 null) */
function getSession() {
  return JSON.parse(localStorage.getItem(LS_SESSION) || 'null');
}

/** 세션 저장 + App.user 갱신 */
function setSession(user) {
  localStorage.setItem(LS_SESSION, JSON.stringify(user));
  App.user = user;
}

/** 세션 삭제 + App.user 초기화 */
function clearSession() {
  localStorage.removeItem(LS_SESSION);
  App.user = null;
}

/* ══════════════
   로그인
══════════════ */

function handleLogin() {
  const email = document.getElementById('loginEmail').value.trim();
  const pw    = document.getElementById('loginPw').value;
  const errEl = document.getElementById('loginError');

  // ── 빈 값 체크
  if (!email || !pw) {
    return showError(errEl, '이메일과 비밀번호를 입력해주세요.');
  }

  // ── 유저 조회
  const users = getUsers();
  const user  = Object.values(users).find(u => u.email === email);

  if (!user || user.password !== btoa(pw)) {
    return showError(errEl, '이메일 또는 비밀번호가 올바르지 않습니다.');
  }

  // ── 성공
  hideError(errEl);
  setSession(user);
  loadWrongNotes();
  showScreen('mainScreen');
  showToast('👋 환영합니다, ' + user.name + '!');
}

/* ══════════════
   회원가입 모달
══════════════ */

function openRegisterModal() {
  document.getElementById('registerModal').classList.add('open');
}

function closeRegisterModal() {
  document.getElementById('registerModal').classList.remove('open');
  // 입력값 초기화
  ['regName', 'regEmail', 'regPw'].forEach(id => {
    document.getElementById(id).value = '';
  });
  hideError(document.getElementById('regError'));
}

function handleRegister() {
  const name  = document.getElementById('regName').value.trim();
  const email = document.getElementById('regEmail').value.trim();
  const pw    = document.getElementById('regPw').value;
  const errEl = document.getElementById('regError');

  // ── 빈 값 체크
  if (!name || !email || !pw) {
    return showError(errEl, '모든 항목을 입력해주세요.');
  }

  // ── 이메일 중복 체크
  const users = getUsers();
  if (Object.values(users).find(u => u.email === email)) {
    return showError(errEl, '이미 사용 중인 이메일입니다.');
  }

  // ── 저장
  const id      = 'user_' + Date.now();
  const newUser = { id, name, email, password: btoa(pw) };
  saveUser(id, newUser);

  hideError(errEl);
  closeRegisterModal();
  showToast('✅ 가입 완료! 로그인해주세요.');
}

/* ══════════════
   로그아웃
══════════════ */

function handleLogout() {
  clearSession();
  closeDrawer();
  showScreen('loginScreen');
  showToast('로그아웃 되었습니다.');
}

/* ══════════════
   계정 정보 수정
══════════════ */

function openAccount() {
  closeDrawer();
  if (!App.user) return;

  document.getElementById('accName').value  = App.user.name  ?? '';
  document.getElementById('accEmail').value = App.user.email ?? '';
  document.getElementById('accPw').value    = '';
  showScreen('accountScreen');
}

function saveAccount() {
  const name  = document.getElementById('accName').value.trim();
  const newPw = document.getElementById('accPw').value;

  if (!name) return showToast('이름을 입력해주세요.');

  const users = getUsers();
  const u     = users[App.user.id];
  if (!u) return;

  u.name = name;
  if (newPw) u.password = btoa(newPw);

  saveUser(App.user.id, u);
  setSession(u);
  showToast('✅ 정보가 저장되었습니다.');
}

/* ══════════════
   에러 메시지 헬퍼
══════════════ */

function showError(el, msg) {
  el.textContent = msg;
  el.classList.add('show');
}

function hideError(el) {
  el.classList.remove('show');
}
