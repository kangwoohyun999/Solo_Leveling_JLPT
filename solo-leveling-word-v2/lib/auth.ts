// =============================================
// lib/auth.ts
// 로그인 / 회원가입 / 세션 관리
// 실제 DB 연동 시 이 파일만 수정하면 됩니다
// =============================================

import { User } from '../types';

const USERS_KEY = 'slw_users';
const SESSION_KEY = 'slw_session';

// --- 내부 헬퍼 ---

function getUsers(): User[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(USERS_KEY);
  return raw ? JSON.parse(raw) : [];
}

function saveUsers(users: User[]) {
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

function hashPassword(pw: string): string {
  return btoa(pw); // 실 서비스에서는 bcrypt 등으로 교체
}

// --- 공개 API ---

export function register(username: string, email: string, password: string): User | null {
  const users = getUsers();
  if (users.find((u) => u.email === email)) return null; // 중복 이메일

  const user: User = {
    id: Date.now().toString(),
    username,
    email,
    createdAt: new Date().toISOString(),
  };

  saveUsers([...users, user]);
  localStorage.setItem(`slw_pwd_${email}`, hashPassword(password));
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
  return user;
}

export function login(email: string, password: string): User | null {
  const stored = localStorage.getItem(`slw_pwd_${email}`);
  if (!stored || stored !== hashPassword(password)) return null;

  const user = getUsers().find((u) => u.email === email);
  if (!user) return null;

  sessionStorage.setItem(SESSION_KEY, JSON.stringify(user));
  return user;
}

export function logout() {
  sessionStorage.removeItem(SESSION_KEY);
}

export function getSession(): User | null {
  if (typeof window === 'undefined') return null;
  const raw = sessionStorage.getItem(SESSION_KEY);
  return raw ? JSON.parse(raw) : null;
}

export function updateUser(updates: Partial<Omit<User, 'id' | 'email' | 'createdAt'>>): User | null {
  const session = getSession();
  if (!session) return null;

  const users = getUsers();
  const updated: User = { ...session, ...updates };
  const next = users.map((u) => (u.id === updated.id ? updated : u));

  saveUsers(next);
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(updated));
  return updated;
}
