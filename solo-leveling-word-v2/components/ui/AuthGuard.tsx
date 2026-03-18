// =============================================
// components/ui/AuthGuard.tsx
// 로그인 체크 훅 — 모든 보호 페이지에서 사용
// getSession() 없으면 /login 으로 리다이렉트
// =============================================

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { getSession } from '../../lib/auth';
import { User } from '../../types';

export function useAuth(): User | null {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const session = getSession();
    if (!session) {
      router.replace('/login');
    } else {
      setUser(session);
    }
  }, [router]);

  return user;
}
