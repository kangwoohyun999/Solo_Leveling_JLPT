/* ════════════════════════════════════════════════════════
   js/2_data.js  —  단어 데이터 로딩 (CSV 파싱)
   ✏️  단어 추가/수정은 data/jword.csv 파일에서 직접 하세요.
       CSV 형식 변경, 파일 경로 변경 시 이 파일 편집.
════════════════════════════════════════════════════════ */

/* ── CSV 파일 경로 ────────────────────────────────────── */
const WORD_CSV_PATH = './data/jword.csv';

/* ── CSV 텍스트 파서 ──────────────────────────────────── */
/**
 * CSV 텍스트를 객체 배열로 변환합니다.
 * 첫 번째 줄을 헤더로 사용합니다.
 * @param {string} text - CSV 원문
 * @returns {Object[]}
 */
function parseCSV(text) {
  const lines   = text.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim());

  return lines.slice(1).map(line => {
    const vals = line.split(',').map(v => v.trim());
    const obj  = {};
    headers.forEach((h, i) => { obj[h] = vals[i] ?? ''; });
    return obj;
  });
}

/* ── 폴백 샘플 데이터 ─────────────────────────────────── */
/*  CSV 파일을 불러오지 못했을 때 사용하는 기본 단어 목록.
    실제 운영 시에는 jword.csv에 단어를 추가하고 여기는 건드리지 않아도 됩니다. */
const FALLBACK_WORDS = [
  // N5
  { level:'N5', word:'日本語', reading:'にほんご', meaning:'일본어'  },
  { level:'N5', word:'先生',   reading:'せんせい', meaning:'선생님'  },
  { level:'N5', word:'学生',   reading:'がくせい', meaning:'학생'    },
  { level:'N5', word:'水',     reading:'みず',     meaning:'물'      },
  { level:'N5', word:'食べる', reading:'たべる',   meaning:'먹다'    },
  { level:'N5', word:'行く',   reading:'いく',     meaning:'가다'    },
  { level:'N5', word:'来る',   reading:'くる',     meaning:'오다'    },
  { level:'N5', word:'見る',   reading:'みる',     meaning:'보다'    },
  { level:'N5', word:'話す',   reading:'はなす',   meaning:'말하다'  },
  { level:'N5', word:'大きい', reading:'おおきい', meaning:'크다'    },
  // N4
  { level:'N4', word:'電車',   reading:'でんしゃ', meaning:'전철'    },
  { level:'N4', word:'駅',     reading:'えき',     meaning:'역'      },
  { level:'N4', word:'始める', reading:'はじめる', meaning:'시작하다'},
  { level:'N4', word:'覚える', reading:'おぼえる', meaning:'기억하다'},
  { level:'N4', word:'旅行',   reading:'りょこう', meaning:'여행'    },
  // N3
  { level:'N3', word:'経済',   reading:'けいざい', meaning:'경제'    },
  { level:'N3', word:'社会',   reading:'しゃかい', meaning:'사회'    },
  { level:'N3', word:'技術',   reading:'ぎじゅつ', meaning:'기술'    },
  { level:'N3', word:'問題',   reading:'もんだい', meaning:'문제'    },
  { level:'N3', word:'変化',   reading:'へんか',   meaning:'변화'    },
  // N2
  { level:'N2', word:'分析',   reading:'ぶんせき', meaning:'분석'    },
  { level:'N2', word:'評価',   reading:'ひょうか', meaning:'평가'    },
  { level:'N2', word:'効率',   reading:'こうりつ', meaning:'효율'    },
  { level:'N2', word:'課題',   reading:'かだい',   meaning:'과제'    },
  { level:'N2', word:'目標',   reading:'もくひょう',meaning:'목표'   },
  // N1
  { level:'N1', word:'概念',   reading:'がいねん', meaning:'개념'    },
  { level:'N1', word:'本質',   reading:'ほんしつ', meaning:'본질'    },
  { level:'N1', word:'認識',   reading:'にんしき', meaning:'인식'    },
  { level:'N1', word:'矛盾',   reading:'むじゅん', meaning:'모순'    },
  { level:'N1', word:'克服',   reading:'こくふく', meaning:'극복'    },
];

/* ── 메인 로드 함수 ───────────────────────────────────── */
/**
 * CSV 파일을 fetch해서 App.wordData에 레벨별로 저장합니다.
 * 실패 시 FALLBACK_WORDS를 사용합니다.
 */
async function loadWordData() {
  const levels = ['N5', 'N4', 'N3', 'N2', 'N1'];

  try {
    const res  = await fetch(WORD_CSV_PATH);
    if (!res.ok) throw new Error('CSV fetch 실패');
    const text = await res.text();
    const rows = parseCSV(text);

    levels.forEach(lv => {
      App.wordData[lv] = rows.filter(r => r.level === lv);
    });

    console.log('[SLW] 단어 데이터 로드 완료 (CSV)');
  } catch (err) {
    console.warn('[SLW] CSV 로드 실패 → 폴백 데이터 사용:', err.message);

    levels.forEach(lv => {
      App.wordData[lv] = FALLBACK_WORDS.filter(r => r.level === lv);
    });
  }
}
