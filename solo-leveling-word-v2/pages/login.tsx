// =============================================
// pages/login.tsx
// 로그인 / 회원가입 화면
// 탭 전환으로 두 기능 모두 처리
// =============================================

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import { login, register, getSession } from '../lib/auth';

type Tab = 'login' | 'register';

interface FormState {
  username: string;
  email: string;
  password: string;
}

const EMPTY_FORM: FormState = { username: '', email: '', password: '' };

export default function LoginPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('login');
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [error, setError] = useState('');

  // 이미 로그인된 경우 메인으로
  useEffect(() => {
    if (getSession()) router.replace('/');
  }, [router]);

  const set = (key: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const switchTab = (next: Tab) => {
    setTab(next);
    setError('');
    setForm(EMPTY_FORM);
  };

  const validate = (): string => {
    if (tab === 'register' && !form.username.trim()) return '닉네임을 입력하세요.';
    if (!form.email.trim()) return '이메일을 입력하세요.';
    if (!form.password)     return '비밀번호를 입력하세요.';
    if (tab === 'register' && form.password.length < 6)
      return '비밀번호는 6자 이상이어야 합니다.';
    return '';
  };

  const handleSubmit = () => {
    const err = validate();
    if (err) { setError(err); return; }
    setError('');

    if (tab === 'login') {
      const user = login(form.email, form.password);
      if (!user) { setError('이메일 또는 비밀번호가 올바르지 않습니다.'); return; }
    } else {
      const user = register(form.username, form.email, form.password);
      if (!user) { setError('이미 사용 중인 이메일입니다.'); return; }
    }

    router.push('/');
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSubmit();
  };

  return (
    <>
      <Head><title>JWORD — 로그인</title></Head>

      <div className="login-page">
        <div className="login-card animate-in">

          {/* 로고 */}
          <div className="login-logo">
            <div className="login-logo-icon">⚔</div>
            <div className="login-app-name">JWORD</div>
            <div className="login-app-sub">SOLO LEVELING WORD</div>
          </div>

          {/* 탭 */}
          <div className="login-tabs">
            <button
              className={`login-tab-btn ${tab === 'login' ? 'active' : ''}`}
              onClick={() => switchTab('login')}
            >
              로그인
            </button>
            <button
              className={`login-tab-btn ${tab === 'register' ? 'active' : ''}`}
              onClick={() => switchTab('register')}
            >
              회원가입
            </button>
          </div>

          {/* 닉네임 (회원가입 전용) */}
          {tab === 'register' && (
            <div className="form-group">
              <label className="form-label">닉네임</label>
              <input
                className="form-input"
                type="text"
                placeholder="헌터 이름"
                value={form.username}
                onChange={set('username')}
                onKeyDown={onKey}
              />
            </div>
          )}

          {/* 이메일 */}
          <div className="form-group">
            <label className="form-label">이메일</label>
            <input
              className="form-input"
              type="email"
              placeholder="hunter@example.com"
              value={form.email}
              onChange={set('email')}
              onKeyDown={onKey}
            />
          </div>

          {/* 비밀번호 */}
          <div className="form-group">
            <label className="form-label">비밀번호</label>
            <input
              className="form-input"
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={set('password')}
              onKeyDown={onKey}
            />
          </div>

          {/* 에러 메시지 */}
          {error && <p className="form-error">{error}</p>}

          {/* 제출 버튼 */}
          <button
            className="btn-primary"
            style={{ marginTop: 24 }}
            onClick={handleSubmit}
          >
            {tab === 'login' ? '로그인' : '회원가입'}
          </button>

        </div>
      </div>
    </>
  );
}
