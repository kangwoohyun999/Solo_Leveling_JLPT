// =============================================
// types/index.ts
// 앱 전체에서 사용하는 TypeScript 타입 모음
// 새 타입 추가 시 여기에만 추가하면 됩니다
// =============================================

// 단어 데이터 (jword.csv 한 행)
export interface WordEntry {
  level: string;   // N1 ~ N5
  word: string;    // 일본어 한자
  reading: string; // 히라가나 발음
  meaning: string; // 한국어 뜻
}

// 로그인 사용자 정보
export interface User {
  id: string;
  username: string;
  email: string;
  createdAt: string;
}

// 오답노트 항목
export interface WrongAnswer {
  word: string;
  reading: string;
  meaning: string;
  level: string;
  count: number;      // 틀린 횟수
  lastSeen: string;   // 마지막 오답 시각 (ISO)
}

// 퀴즈 결과 등급
export type QuizRank = 'S' | 'A' | 'B' | 'C' | 'D';

// 답안 상태
export type AnswerState = 'idle' | 'correct' | 'wrong';

// 레벨 버튼 설정
export interface LevelConfig {
  id: string;
  label: string;
  sub: string;
  disabled?: boolean;
  colorClass: string;
}
