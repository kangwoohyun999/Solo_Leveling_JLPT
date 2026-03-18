// =============================================
// components/ui/QuizCountModal.tsx
// Q 버튼 클릭 시 표시되는 문제 수 설정 모달
// =============================================

import { useState } from 'react';
import { DEFAULT_QUIZ_COUNT, QUIZ_COUNT_STEP } from '../../config/quiz';

interface QuizCountModalProps {
  maxCount: number;
  onConfirm: (count: number) => void;
  onClose: () => void;
}

export default function QuizCountModal({ maxCount, onConfirm, onClose }: QuizCountModalProps) {
  const [count, setCount] = useState(Math.min(DEFAULT_QUIZ_COUNT, maxCount));

  const clamp = (n: number) => Math.max(1, Math.min(maxCount, n));

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-title">문제 수 설정</div>

        <div className="modal-input-group">
          <button
            className="modal-step-btn"
            onClick={() => setCount((n) => clamp(n - QUIZ_COUNT_STEP))}
          >
            −
          </button>
          <input
            className="modal-number-input"
            type="number"
            min={1}
            max={maxCount}
            value={count}
            onChange={(e) => setCount(clamp(Number(e.target.value)))}
          />
          <button
            className="modal-step-btn"
            onClick={() => setCount((n) => clamp(n + QUIZ_COUNT_STEP))}
          >
            +
          </button>
        </div>

        <p className="modal-info">최대 {maxCount}문제</p>

        <button className="btn-primary" onClick={() => onConfirm(count)}>
          퀴즈 시작
        </button>
        <button className="btn-secondary" onClick={onClose}>
          취소
        </button>
      </div>
    </div>
  );
}
