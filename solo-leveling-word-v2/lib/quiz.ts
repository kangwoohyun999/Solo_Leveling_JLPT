// =============================================
// lib/quiz.ts
// 퀴즈 관련 순수 로직 (UI 없음)
// 셔플, 선택지 생성, 등급 계산
// =============================================

import { WordEntry, QuizRank } from '../types';
import { RANK_THRESHOLDS, ANSWER_CHOICES } from '../config/quiz';

// 배열 랜덤 셔플
export function shuffle<T>(arr: T[]): T[] {
  return [...arr].sort(() => Math.random() - 0.5);
}

// 퀴즈용 단어 뽑기 (셔플 후 n개)
export function pickQuizWords(words: WordEntry[], count: number): WordEntry[] {
  return shuffle(words).slice(0, Math.min(count, words.length));
}

// 객관식 선택지 생성
// 정답 1개 + 오답 (ANSWER_CHOICES - 1)개
export function generateChoices(correct: WordEntry, pool: WordEntry[]): string[] {
  const wrongPool = pool
    .filter((w) => w.meaning !== correct.meaning)
    .map((w) => w.meaning);

  const wrongs = shuffle(wrongPool).slice(0, ANSWER_CHOICES - 1);
  return shuffle([correct.meaning, ...wrongs]);
}

// 점수 → 등급
export function calcRank(score: number, total: number): QuizRank {
  const pct = total === 0 ? 0 : score / total;
  for (const { rank, min } of RANK_THRESHOLDS) {
    if (pct >= min) return rank;
  }
  return 'D';
}
