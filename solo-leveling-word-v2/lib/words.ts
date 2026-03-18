// =============================================
// lib/words.ts
// jword.csv 로드 및 파싱 (서버 사이드 전용)
// CSV 컬럼 구조가 바뀌면 parseRow() 만 수정
// =============================================

import fs from 'fs';
import path from 'path';
import { WordEntry } from '../types';

let cache: WordEntry[] | null = null;

// CSV 한 줄을 WordEntry로 변환
function parseRow(headers: string[], values: string[]): WordEntry {
  const obj: Record<string, string> = {};
  headers.forEach((h, i) => {
    obj[h.trim()] = (values[i] ?? '').trim();
  });
  return obj as WordEntry;
}

export function getAllWords(): WordEntry[] {
  if (cache) return cache;

  const csvPath = path.join(process.cwd(), 'data', 'jword.csv');
  const content = fs.readFileSync(csvPath, 'utf-8');
  const [headerLine, ...rows] = content.trim().split('\n');
  const headers = headerLine.split(',');

  cache = rows
    .filter((line) => line.trim())
    .map((line) => parseRow(headers, line.split(',')));

  return cache;
}

export function getWordsByLevel(level: string): WordEntry[] {
  return getAllWords().filter((w) => w.level === level);
}

// 캐시 초기화 (CSV 교체 후 재시작 없이 반영할 때)
export function clearCache() {
  cache = null;
}
