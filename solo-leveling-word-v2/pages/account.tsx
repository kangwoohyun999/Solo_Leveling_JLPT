// =============================================
// pages/account.tsx
// 계정 정보 화면
// - 닉네임 수정 가능
// - 이메일·가입일 표시 (수정 불가)
// =============================================

import { useState } from 'react';
import Head from 'next/head';
import Header from '../components/layout/Header';
import { useAuth } from '../components/ui/AuthGuard';
import { updateUser } from '../lib/auth';

export default function AccountPage() {
  const user = useAuth();
  const [editing, setEditing]   = useState(false);
  const [username, setUsername] = useState('');
  const [success, setSuccess]   = useState('');

  if (!user) return null;

  const startEdit = () => {
    setUsername(user.username);
    setEditing(true);
    setSuccess('');
  };

  const handleSave = () => {
    if (!username.trim()) return;
    updateUser({ username: username.trim() });
    setEditing(false);
    setSuccess('저장되었습니다.');
    setTimeout(() => setSuccess(''), 2500);
  };

  const joinDate = new Date(user.createdAt).toLocaleDateString('ko-KR', {
    year: 'numeric', month: 'long', day: 'numeric',
  });

  return (
    <>
      <Head><title>JWORD — 계정 정보</title></Head>
      <Header showBack pageTitle="계정 정보" />

      <div className="account-page animate-in">

        {/* 아바타 */}
        <div className="account-avatar">⚔</div>

        {/* 정보 카드 */}
        <div className="account-card">
          <p className="account-card-title">내 정보</p>

          {/* 닉네임 */}
          <div className="account-field">
            <p className="account-field-label">닉네임</p>
            {editing ? (
              <input
                className="form-input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSave()}
                autoFocus
              />
            ) : (
              <p className="account-field-value" style={{ fontFamily: 'Cinzel, serif' }}>
                {user.username}
              </p>
            )}
          </div>

          {/* 이메일 (수정 불가) */}
          <div className="account-field">
            <p className="account-field-label">이메일</p>
            <p className="account-field-value" style={{ color: 'var(--text-secondary)' }}>
              {user.email}
            </p>
          </div>

          {/* 가입일 */}
          <div className="account-field">
            <p className="account-field-label">가입일</p>
            <p className="account-field-value" style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
              {joinDate}
            </p>
          </div>
        </div>

        {/* 성공 메시지 */}
        {success && <div className="alert-success">{success}</div>}

        {/* 버튼 */}
        {editing ? (
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="btn-primary" onClick={handleSave} style={{ flex: 1 }}>
              저장
            </button>
            <button
              className="btn-secondary"
              onClick={() => setEditing(false)}
              style={{ flex: 1, margin: 0 }}
            >
              취소
            </button>
          </div>
        ) : (
          <button className="btn-primary" onClick={startEdit}>
            정보 수정
          </button>
        )}

      </div>
    </>
  );
}
