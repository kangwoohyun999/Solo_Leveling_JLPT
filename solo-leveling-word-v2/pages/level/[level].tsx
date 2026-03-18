// =============================================
// pages/level/[level].tsx
// 단어 목록 화면 (N1~N5)
// - 단어 카드 스크롤 목록
// - 우하단 고정 Q 버튼
// - 문제 수 모달 → 퀴즈로 이동
// =============================================

import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Header from '../../components/layout/Header';
import WordCard from '../../components/ui/WordCard';
import QuizCountModal from '../../components/ui/QuizCountModal';
import { useAuth } from '../../components/ui/AuthGuard';
import { LEVEL_COLORS } from '../../config/levels';
import { WordEntry } from '../../types';

export default function LevelPage() {
  const router = useRouter();
  const { level } = router.query as { level: string };

  const user = useAuth();
  const [words, setWords] = useState<WordEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // 단어 불러오기
  useEffect(() => {
    if (!level) return;
    setLoading(true);
    fetch(`/api/words?level=${level}`)
      .then((r) => r.json())
      .then((data: WordEntry[]) => {
        setWords(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [level]);

  if (!user) return null;

  const accentColor = LEVEL_COLORS[level] ?? 'var(--accent-cyan)';

  const handleStartQuiz = (count: number) => {
    router.push(`/quiz/${level}?count=${count}`);
  };

  return (
    <>
      <Head><title>JWORD — {level}</title></Head>

      {/* 헤더: 뒤로가기 + 레벨 이름 */}
      <Header
        showBack
        pageTitle={level}
        onBack={() => router.push('/')}
      />

      <div className="page">
        {loading ? (
          <p className="loading-text">단어 로딩 중...</p>
        ) : (
          <>
            {/* 단어 수 표시 */}
            <p className="word-list-info">
              총{' '}
              <span style={{ color: accentColor, fontWeight: 600 }}>
                {words.length}
              </span>
              개의 단어
            </p>

            {/* 단어 카드 목록 */}
            <div className="word-list">
              {words.map((w, i) => (
                <WordCard
                  key={i}
                  word={w}
                  style={{ animationDelay: `${i * 0.018}s`, opacity: 0 }}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Q 플로팅 버튼 (단어 있을 때만 표시) */}
      {!loading && words.length > 0 && (
        <button
          className="quiz-fab"
          onClick={() => setShowModal(true)}
          aria-label="퀴즈 시작"
        >
          Q
        </button>
      )}

      {/* 문제 수 설정 모달 */}
      {showModal && (
        <QuizCountModal
          maxCount={words.length}
          onConfirm={handleStartQuiz}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}
