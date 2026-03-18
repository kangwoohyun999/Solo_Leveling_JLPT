// =============================================
// pages/quiz/[level].tsx
// 퀴즈 화면
// - 상단 진행 바 + 카운터
// - 단어 박스 (일본어 + 발음)
// - 3지선다 버튼
// - 완료 시 결과 화면
// =============================================

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Header from '../../components/layout/Header';
import { useAuth } from '../../components/ui/AuthGuard';
import { addWrongAnswer } from '../../lib/wrongAnswers';
import { shuffle, pickQuizWords, generateChoices, calcRank } from '../../lib/quiz';
import { NEXT_QUESTION_DELAY, RANK_COLORS } from '../../config/quiz';
import { WordEntry, AnswerState } from '../../types';

// ── 결과 화면 ──────────────────────────────
function ResultScreen({
  score,
  total,
  level,
}: {
  score: number;
  total: number;
  level: string;
}) {
  const router = useRouter();
  const rank = calcRank(score, total);
  const color = RANK_COLORS[rank];

  return (
    <div className="result-page animate-in">
      <p className="result-label">RANK</p>
      <p className="result-rank" style={{ color }}>
        {rank}
      </p>
      <p className="result-score">
        {score} / {total} 정답
      </p>

      <div className="result-actions">
        <button
          className="btn-primary"
          onClick={() => router.push(`/quiz/${level}?count=${total}`)}
        >
          다시 도전
        </button>
        <button
          className="btn-secondary"
          onClick={() => router.push(`/level/${level}`)}
        >
          단어 목록으로
        </button>
        <button
          className="btn-secondary"
          onClick={() => router.push('/wrong-answers')}
        >
          오답노트 보기
        </button>
      </div>
    </div>
  );
}

// ── 퀴즈 화면 ──────────────────────────────
export default function QuizPage() {
  const router = useRouter();
  const { level, count } = router.query as { level: string; count: string };

  const user = useAuth();
  const [allWords, setAllWords]   = useState<WordEntry[]>([]);
  const [quizWords, setQuizWords] = useState<WordEntry[]>([]);
  const [choices, setChoices]     = useState<string[]>([]);
  const [current, setCurrent]     = useState(0);
  const [selected, setSelected]   = useState<number | null>(null);
  const [state, setState]         = useState<AnswerState>('idle');
  const [score, setScore]         = useState(0);
  const [finished, setFinished]   = useState(false);
  const [loading, setLoading]     = useState(true);

  // 단어 로드 + 퀴즈 셋업
  useEffect(() => {
    if (!level) return;
    fetch(`/api/words?level=${level}`)
      .then((r) => r.json())
      .then((data: WordEntry[]) => {
        setAllWords(data);
        const picked = pickQuizWords(data, Number(count) || 10);
        setQuizWords(picked);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [level, count]);

  // 현재 문제의 선택지 생성
  const makeChoices = useCallback(
    (idx: number, quiz: WordEntry[], pool: WordEntry[]) => {
      setChoices(generateChoices(quiz[idx], pool));
      setSelected(null);
      setState('idle');
    },
    []
  );

  useEffect(() => {
    if (quizWords.length > 0 && current < quizWords.length) {
      makeChoices(current, quizWords, allWords);
    }
  }, [current, quizWords, allWords, makeChoices]);

  if (!user) return null;

  // 로딩 중
  if (loading) {
    return (
      <>
        <Head><title>JWORD — 퀴즈</title></Head>
        <Header showBack onBack={() => router.push(`/level/${level}`)} />
        <p className="loading-text">퀴즈 준비 중...</p>
      </>
    );
  }

  // 완료 → 결과 화면
  if (finished) {
    return (
      <>
        <Head><title>JWORD — 결과</title></Head>
        <Header showBack onBack={() => router.push(`/level/${level}`)} />
        <ResultScreen score={score} total={quizWords.length} level={level} />
      </>
    );
  }

  if (quizWords.length === 0) return null;

  const currentWord = quizWords[current];
  const progress = (current / quizWords.length) * 100;

  // 답안 선택
  const handleAnswer = (idx: number) => {
    if (state !== 'idle') return;
    setSelected(idx);

    const isCorrect = choices[idx] === currentWord.meaning;

    if (isCorrect) {
      setState('correct');
      setScore((s) => s + 1);
    } else {
      setState('wrong');
      // 오답노트에 저장
      addWrongAnswer(user.id, {
        word:    currentWord.word,
        reading: currentWord.reading,
        meaning: currentWord.meaning,
        level:   currentWord.level,
      });
    }

    // 다음 문제 / 완료
    setTimeout(() => {
      if (current + 1 >= quizWords.length) {
        setFinished(true);
      } else {
        setCurrent((c) => c + 1);
      }
    }, NEXT_QUESTION_DELAY);
  };

  return (
    <>
      <Head><title>JWORD — 퀴즈 {level}</title></Head>
      <Header showBack onBack={() => router.push(`/level/${level}`)} />

      {/* 진행 바 */}
      <div className="quiz-progress-bar">
        <div className="quiz-progress-fill" style={{ width: `${progress}%` }} />
      </div>

      {/* 카운터 */}
      <p className="quiz-counter">
        {current + 1} / {quizWords.length}
      </p>

      {/* 단어 박스 */}
      <div className="quiz-body">
        <div className="quiz-word-box">
          <p className="quiz-word">{currentWord.word}</p>
          <p className="quiz-reading">{currentWord.reading}</p>
        </div>
      </div>

      {/* 선택지 */}
      <div className="quiz-answers">
        {choices.map((choice, i) => {
          let cls = 'answer-btn';
          if (selected !== null) {
            if (choice === currentWord.meaning) cls += ' correct';
            else if (i === selected)            cls += ' wrong';
          }
          return (
            <button
              key={i}
              className={cls}
              onClick={() => handleAnswer(i)}
              disabled={selected !== null}
            >
              {choice}
            </button>
          );
        })}
      </div>
    </>
  );
}
