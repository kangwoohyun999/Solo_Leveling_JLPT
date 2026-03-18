// =============================================
// pages/api/words.ts
// 단어 데이터 API
// GET /api/words?level=N1  → 해당 레벨 단어 배열
// GET /api/words           → 전체 단어 배열
// =============================================

import type { NextApiRequest, NextApiResponse } from 'next';
import { getWordsByLevel, getAllWords } from '../../lib/words';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { level } = req.query;

  try {
    const words = level ? getWordsByLevel(level as string) : getAllWords();
    return res.status(200).json(words);
  } catch (err) {
    console.error('[/api/words]', err);
    return res.status(500).json({ error: 'Failed to load words' });
  }
}
