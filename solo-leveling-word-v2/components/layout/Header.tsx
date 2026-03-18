// =============================================
// components/layout/Header.tsx
// 상단 고정 헤더
// 두 가지 모드: 메인(로고+타이틀) / 서브(뒤로가기+페이지명)
// =============================================

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Drawer from './Drawer';

interface HeaderProps {
  // 서브 페이지 모드
  showBack?: boolean;
  pageTitle?: string;
  onBack?: () => void;
}

export default function Header({ showBack, pageTitle, onBack }: HeaderProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const router = useRouter();

  const handleBack = onBack ?? (() => router.back());

  return (
    <>
      <header className="header">
        {/* 왼쪽: 로고 or 뒤로가기 */}
        {showBack ? (
          <button className="back-btn" onClick={handleBack}>
            ← 뒤로
          </button>
        ) : (
          <Link href="/" className="header-logo">
            <div className="logo-icon">⚔</div>
          </Link>
        )}

        {/* 중앙: 앱 이름 or 페이지 타이틀 */}
        {showBack && pageTitle ? (
          <span className="page-title">{pageTitle}</span>
        ) : !showBack ? (
          <span className="header-title">JWORD</span>
        ) : null}

        {/* 오른쪽: 햄버거 */}
        <button
          className="header-menu-btn"
          onClick={() => setDrawerOpen(true)}
          aria-label="메뉴 열기"
        >
          <div className="menu-line" />
          <div className="menu-line" />
          <div className="menu-line" />
        </button>
      </header>

      <Drawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  );
}
