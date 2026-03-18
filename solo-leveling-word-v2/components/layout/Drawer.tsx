// =============================================
// components/layout/Drawer.tsx
// 오른쪽 슬라이드 드로어 메뉴
// 메뉴 항목 추가/제거는 MENU_ITEMS 배열만 수정
// =============================================

import Link from 'next/link';
import { useRouter } from 'next/router';
import { logout } from '../../lib/auth';

interface DrawerProps {
  open: boolean;
  onClose: () => void;
}

// ── 메뉴 항목 목록 (여기서 추가/수정) ──
const MENU_ITEMS = [
  { href: '/account',       icon: '👤', label: '계정 정보' },
  { href: '/wrong-answers', icon: '📝', label: '오답노트'   },
];

export default function Drawer({ open, onClose }: DrawerProps) {
  const router = useRouter();

  const handleLogout = () => {
    logout();
    onClose();
    router.push('/login');
  };

  return (
    <>
      {/* 오버레이 */}
      <div
        className={`drawer-overlay ${open ? 'open' : ''}`}
        onClick={onClose}
      />

      {/* 드로어 본체 */}
      <nav className={`drawer ${open ? 'open' : ''}`}>
        <div className="drawer-header">메뉴</div>

        {MENU_ITEMS.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="drawer-item"
            onClick={onClose}
          >
            <span className="drawer-item-icon">{item.icon}</span>
            {item.label}
          </Link>
        ))}

        {/* 빈 공간 */}
        <div style={{ flex: 1 }} />

        {/* 로그아웃 */}
        <button
          className="drawer-item"
          onClick={handleLogout}
          style={{ color: 'var(--accent-red)' }}
        >
          <span className="drawer-item-icon">🚪</span>
          로그아웃
        </button>
      </nav>
    </>
  );
}
