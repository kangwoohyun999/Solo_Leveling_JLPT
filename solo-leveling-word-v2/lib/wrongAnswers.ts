// =============================================
// lib/wrongAnswers.ts
// 오답노트 저장 / 불러오기 / 삭제
// localStorage 키: slw_wrong_{userId}
// =============================================

import { WrongAnswer } from '../types';

function storageKey(userId: string): string {
  return `slw_wrong_${userId}`;
}

export function getWrongAnswers(userId: string): WrongAnswer[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(storageKey(userId));
  return raw ? JSON.parse(raw) : [];
}

export function addWrongAnswer(
  userId: string,
  entry: Omit<WrongAnswer, 'count' | 'lastSeen'>
) {
  const list = getWrongAnswers(userId);
  const idx = list.findIndex((w) => w.word === entry.word);

  if (idx >= 0) {
    list[idx].count += 1;
    list[idx].lastSeen = new Date().toISOString();
  } else {
    list.push({ ...entry, count: 1, lastSeen: new Date().toISOString() });
  }

  localStorage.setItem(storageKey(userId), JSON.stringify(list));
}

export function removeWrongAnswer(userId: string, word: string) {
  const list = getWrongAnswers(userId).filter((w) => w.word !== word);
  localStorage.setItem(storageKey(userId), JSON.stringify(list));
}

export function clearAllWrongAnswers(userId: string) {
  localStorage.removeItem(storageKey(userId));
}
