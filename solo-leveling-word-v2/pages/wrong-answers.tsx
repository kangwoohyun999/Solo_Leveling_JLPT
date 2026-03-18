// =============================================
// pages/wrong-answers.tsx
// 오답노트 화면
// - 틀린 횟수 많은 순 정렬
// - 개별 삭제 가능
// =============================================

import { useState, useEffect } from 'react';
import Head from 'next/head';
import Header from '../components/layout/Header';
import { useAuth } from '../components/ui/AuthGuard';
import {
  getWrongAnswers,
  removeWrongAnswer,
  WrongAnswer,
} from '../lib/wrongAnswers';

export default function WrongAnswersPage() {
  const user = useAuth();
  const [list, setList] = useState<WrongAnswer[]>([]);

  useEffect(() => {
    if (user) setList(getWrongAnswers(user.id));
  }, [user]);

  if (!user) return null;

  const handleRemove = (word: string) => {
    removeWrongAnswer(user.id, word);
    setList(getWrongAnswers(user.id));
  };

  const sorted = [...list].sort((a, b) => b.count - a.count);

  return (
    <>
      <Head><title>JWORD — 오답노트</title></Head>
      <Header showBack pageTitle="오답노트" />

      <div className="page">
        <div className="page-inner">

          {sorted.length === 0 ? (
            // 빈 상태
            <div className="empty-state animate-in">
              <div className="empty-state-icon">📗</div>
              <p className="empty-state-text">오답이 없습니다</p>
              <p style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 10 }}>
                퀴즈를 풀어보세요!
              </p>
            </div>
          ) : (
            <>
              <p style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 20 }}>
                총{' '}
                <span style={{ color: 'var(--accent-red)', fontWeight: 600 }}>
                  {sorted.length}
                </span>
                개의 오답
              </p>

              {sorted.map((item, i) => (
                <div key={i} className="wrong-card animate-in" style={{ animationDelay: `${i * 0.03}s`, opacity: 0 }}>
                  <span className="word-japanese">{item.word}</span>
                  <span className="word-reading">{item.reading}</span>
                  <span className="word-meaning">{item.meaning}</span>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
                    <span className="wrong-count-badge">×{item.count}</span>
                    <button
                      onClick={() => handleRemove(item.word)}
                      style={{
                        background: 'none', border: 'none',
                        color: 'var(--text-muted)', cursor: 'pointer',
                        fontSize: 12, padding: 0,
                      }}
                    >
                      삭제
                    </button>
                  </div>
                </div>
              ))}
            </>
          )}

        </div>
      </div>
    </>
  );
}
