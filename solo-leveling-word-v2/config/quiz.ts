// =============================================
// config/quiz.ts
// 퀴즈 관련 설정
// 문제 수 기본값, 등급 기준 등을 여기서 수정
// =============================================

import { QuizRank } from '../types';

// 문제 수 기본값
export const DEFAULT_QUIZ_COUNT = 10;

// 문제 수 조절 단위 (+/- 버튼)
export const QUIZ_COUNT_STEP = 5;

// 오답 선택지 개수 (정답 1개 포함한 총 보기 수)
export const ANSWER_CHOICES = 3;

// 정답 후 다음 문제로 넘어가는 딜레이 (ms)
export const NEXT_QUESTION_DELAY = 1000;

// 등급 기준 (퍼센트)
export const RANK_THRESHOLDS: { rank: QuizRank; min: number }[] = [
  { rank: 'S', min: 0.95 },
  { rank: 'A', min: 0.80 },
  { rank: 'B', min: 0.60 },
  { rank: 'C', min: 0.40 },
  { rank: 'D', min: 0 },
];

// 등급별 색상
export const RANK_COLORS: Record<QuizRank, string> = {
  S: 'var(--accent-gold)',
  A: 'var(--accent-cyan)',
  B: 'var(--accent-blue)',
  C: 'var(--accent-purple)',
  D: 'var(--accent-red)',
};
