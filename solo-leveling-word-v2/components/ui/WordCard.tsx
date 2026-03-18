// =============================================
// components/ui/WordCard.tsx
// 단어 목록 한 행 (일본어 / 히라가나 / 한국어)
// =============================================

import { WordEntry } from '../../types';

interface WordCardProps {
  word: WordEntry;
  style?: React.CSSProperties;
}

export default function WordCard({ word, style }: WordCardProps) {
  return (
    <div className="word-card animate-in" style={style}>
      <span className="word-japanese">{word.word}</span>
      <span className="word-reading">{word.reading}</span>
      <span className="word-meaning">{word.meaning}</span>
    </div>
  );
}
