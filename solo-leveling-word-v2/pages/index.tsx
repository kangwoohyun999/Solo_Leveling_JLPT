// =============================================
// pages/index.tsx
// 메인 화면 — 레벨 선택 버튼 목록
// 레벨 추가/변경: config/levels.ts 수정
// =============================================

import Head from 'next/head';
import Link from 'next/link';
import Header from '../components/layout/Header';
import { useAuth } from '../components/ui/AuthGuard';
import { LEVELS } from '../config/levels';

export default function HomePage() {
  const user = useAuth();
  if (!user) return null; // 로그인 체크 중

  return (
    <>
      <Head><title>JWORD — 메인</title></Head>
      <Header />

      <div className="page">
        <div className="page-inner">

          {/* 인사 */}
          <div className="main-greeting animate-in stagger-1">
            <p style={{ color: 'var(--text-muted)', fontSize: 13, letterSpacing: 1, marginBottom: 6 }}>
              환영합니다,
            </p>
            <p className="main-greeting-name">{user.username}</p>
            <p style={{ color: 'var(--text-muted)', fontSize: 12, marginTop: 4 }}>
              오늘도 레벨업 하세요 ⚔
            </p>
          </div>

          <div className="section-label animate-in stagger-2">단어 레벨 선택</div>

          {/* 레벨 버튼 목록 */}
          <div className="level-grid">
            {LEVELS.map((level, i) => {
              const cls = [
                'level-btn',
                level.colorClass,
                level.disabled ? 'disabled' : '',
                'animate-in',
                `stagger-${Math.min(i + 3, 6)}`,
              ]
                .filter(Boolean)
                .join(' ');

              if (level.disabled) {
                return (
                  <div key={level.id} className={cls}>
                    <div className="level-btn-meta">
                      <span>{level.label}</span>
                      <span className="level-btn-sub">{level.sub}</span>
                    </div>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>준비중</span>
                  </div>
                );
              }

              return (
                <Link
                  key={level.id}
                  href={`/level/${level.id}`}
                  className={cls}
                >
                  <div className="level-btn-meta">
                    <span>{level.label}</span>
                    <span className="level-btn-sub">{level.sub}</span>
                  </div>
                  <span className="level-btn-arrow">→</span>
                </Link>
              );
            })}
          </div>

        </div>
      </div>
    </>
  );
}
