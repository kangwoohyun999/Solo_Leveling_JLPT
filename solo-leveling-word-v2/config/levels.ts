// =============================================
// config/levels.ts
// 레벨 버튼 목록 설정
// 새 레벨 추가 / 이름 변경 / 순서 변경은 여기서
// =============================================

import { LevelConfig } from '../types';

export const LEVELS: LevelConfig[] = [
  {
    id: 'yonkei',
    label: '연계',
    sub: '준비 중',
    colorClass: 'yonkei',
    disabled: true,
  },
  {
    id: 'N5',
    label: 'N5',
    sub: '입문 · 기초',
    colorClass: '',
  },
  {
    id: 'N4',
    label: 'N4',
    sub: '초급',
    colorClass: '',
  },
  {
    id: 'N3',
    label: 'N3',
    sub: '중급',
    colorClass: '',
  },
  {
    id: 'N2',
    label: 'N2',
    sub: '중상급',
    colorClass: '',
  },
  {
    id: 'N1',
    label: 'N1',
    sub: '고급 · 최상위',
    colorClass: 'n1',
  },
];

// 레벨별 강조 색상 (퀴즈, 단어 목록에서 사용)
export const LEVEL_COLORS: Record<string, string> = {
  N1: 'var(--accent-gold)',
  N2: '#f97316',
  N3: 'var(--accent-cyan)',
  N4: 'var(--accent-blue)',
  N5: 'var(--accent-purple)',
};
