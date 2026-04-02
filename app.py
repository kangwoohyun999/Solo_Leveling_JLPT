import os
import json
import random
import psycopg2
import psycopg2.extras
from flask import (
    Flask, render_template, request,
    redirect, url_for, session, jsonify
)

app = Flask(__name__)
app.secret_key = os.environ.get('SECRET_KEY', 'slword_secret_2025')

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
WORDS = {}
LEVEL_INFO = {
    'N5': {'label': '입문'},
    'N4': {'label': '초급'},
    'N3': {'label': '중급'},
    'N2': {'label': '중상급'},
    'N1': {'label': '고급'},
}

for lv in ['N5', 'N4', 'N3', 'N2', 'N1']:
    fpath = os.path.join(BASE_DIR, 'data', f'{lv.lower()}_words.json')
    try:
        with open(fpath, encoding='utf-8') as f:
            WORDS[lv] = json.load(f)
        print(f'[단어로드] {lv}: {len(WORDS[lv])}개')
    except FileNotFoundError:
        WORDS[lv] = []

# 히라가나 데이터 로드
HIRAGANA = []
try:
    with open(os.path.join(BASE_DIR, 'data', 'hiragana.json'), encoding='utf-8') as f:
        HIRAGANA = json.load(f)
    print(f'[히라가나로드] {len(HIRAGANA)}개')
except FileNotFoundError:
    pass

# 한자 단어장 데이터 로드
KANJI_WORDS = []
try:
    with open(os.path.join(BASE_DIR, 'data', 'kanji_words.json'), encoding='utf-8') as f:
        KANJI_WORDS = json.load(f)
    print(f'[한자로드] {len(KANJI_WORDS)}개')
except FileNotFoundError:
    pass

def get_db_url():
    url = os.environ.get('DATABASE_URL', '')
    if url.startswith('postgres://'):
        url = url.replace('postgres://', 'postgresql://', 1)
    return url

def get_db():
    url = get_db_url()
    if not url:
        raise RuntimeError('DATABASE_URL 환경변수가 없습니다.')
    return psycopg2.connect(url, cursor_factory=psycopg2.extras.RealDictCursor)

def init_db():
    conn = get_db()
    cur = conn.cursor()

    # users 테이블 생성
    cur.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id       SERIAL PRIMARY KEY,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            nickname TEXT NOT NULL
        )
    """)
    conn.commit()

    # nickname UNIQUE 제약 — information_schema로 안전하게 확인 후 추가
    cur.execute("""
        SELECT COUNT(*) AS cnt FROM information_schema.table_constraints
        WHERE table_name='users' AND constraint_name='users_nickname_key'
    """)
    row = cur.fetchone()
    if row and int(row['cnt']) == 0:
        try:
            cur.execute(
                "ALTER TABLE users ADD CONSTRAINT users_nickname_key UNIQUE (nickname)"
            )
            conn.commit()
        except Exception as e:
            conn.rollback()
            print(f'[nickname UNIQUE 추가 스킵] {e}')

    cur.execute("""
        CREATE TABLE IF NOT EXISTS wrong_notes (
            id       SERIAL PRIMARY KEY,
            username TEXT NOT NULL REFERENCES users(username) ON DELETE CASCADE,
            word     TEXT NOT NULL,
            hiragana TEXT NOT NULL,
            meaning  TEXT NOT NULL,
            level    TEXT NOT NULL DEFAULT 'N5',
            UNIQUE (username, word, level)
        )
    """)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS rankings (
            id         SERIAL PRIMARY KEY,
            username   TEXT NOT NULL REFERENCES users(username) ON DELETE CASCADE,
            level      TEXT NOT NULL,
            correct    INTEGER NOT NULL DEFAULT 0,
            elapsed    NUMERIC(10,2) NOT NULL DEFAULT 0,
            created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
            UNIQUE (username, level)
        )
    """)
    conn.commit()
    cur.close()
    conn.close()
    print('[DB] 테이블 초기화 완료')

def get_user(username):
    try:
        conn = get_db()
        cur = conn.cursor()
        cur.execute('SELECT * FROM users WHERE username = %s', (username,))
        row = cur.fetchone()
        cur.close(); conn.close()
        return dict(row) if row else None
    except Exception as e:
        print(f'[get_user 오류] {e}')
        return None

@app.before_request
def ensure_db():
    if request.path == '/health':
        return
    if not getattr(app, '_db_initialized', False):
        try:
            init_db()
            app._db_initialized = True
        except Exception as e:
            print(f'[DB 초기화 실패] {e}')
            return render_template('db_error.html'), 500

@app.route('/')
def index():
    if 'username' in session:
        return redirect(url_for('main'))
    return redirect(url_for('login'))

@app.route('/login', methods=['GET', 'POST'])
def login():
    if 'username' in session:
        return redirect(url_for('main'))
    if request.method == 'POST':
        username = request.form.get('username', '').strip()
        password = request.form.get('password', '').strip()
        try:
            user = get_user(username)
        except Exception:
            return render_template('login.html', error='서버 오류가 발생했습니다.')
        if user and user['password'] == password:
            session['username'] = username
            return redirect(url_for('main'))
        return render_template('login.html', error='아이디 또는 비밀번호가 틀렸습니다.')
    return render_template('login.html')

@app.route('/register', methods=['GET', 'POST'])
def register():
    if 'username' in session:
        return redirect(url_for('main'))
    if request.method == 'POST':
        username = request.form.get('username', '').strip()
        password = request.form.get('password', '').strip()
        nickname = request.form.get('nickname', '').strip() or username
        if not username or not password:
            return render_template('register.html', error='아이디와 비밀번호를 입력해주세요.')
        if len(username) < 4:
            return render_template('register.html', error='아이디는 4자 이상이어야 합니다.')
        if len(password) < 6:
            return render_template('register.html', error='비밀번호는 6자 이상이어야 합니다.')
        conn = None
        try:
            conn = get_db(); cur = conn.cursor()
            cur.execute('SELECT 1 FROM users WHERE nickname = %s', (nickname,))
            if cur.fetchone():
                cur.close(); conn.close()
                return render_template('register.html', error='이미 사용 중인 닉네임입니다.')
            cur.execute(
                'INSERT INTO users (username, password, nickname) VALUES (%s, %s, %s)',
                (username, password, nickname)
            )
            conn.commit(); cur.close(); conn.close()
            session['username'] = username
            return redirect(url_for('main'))
        except psycopg2.errors.UniqueViolation as e:
            if conn: conn.rollback()
            err_str = str(e)
            try: cur.close()
            except: pass
            if conn: conn.close()
            if 'nickname' in err_str:
                return render_template('register.html', error='이미 사용 중인 닉네임입니다.')
            return render_template('register.html', error='이미 존재하는 아이디입니다.')
        except Exception as e:
            print(f'[register 오류] {e}')
            return render_template('register.html', error=f'서버 오류: {str(e)}')
    return render_template('register.html')

@app.route('/logout')
def logout():
    session.pop('username', None)
    return redirect(url_for('login'))

@app.route('/main')
def main():
    if 'username' not in session:
        return redirect(url_for('login'))
    user = get_user(session['username'])
    if not user:
        session.pop('username', None)
        return redirect(url_for('login'))
    level_counts = {lv: len(WORDS.get(lv, [])) for lv in LEVEL_INFO}
    total_words = sum(level_counts.values())
    return render_template('main.html', user=user, level_counts=level_counts,
                           total_words=total_words, kanji_count=len(KANJI_WORDS))

@app.route('/wordlist/<level>')
def wordlist(level):
    if 'username' not in session:
        return redirect(url_for('login'))
    user = get_user(session['username'])
    if not user:
        return redirect(url_for('login'))
    level = level.upper()
    words = WORDS.get(level, [])
    return render_template('wordlist.html', user=user, level=level, words=words)

@app.route('/quiz/<level>')
def quiz(level):
    if 'username' not in session:
        return redirect(url_for('login'))
    user = get_user(session['username'])
    if not user:
        return redirect(url_for('login'))
    level = level.upper()
    total = len(WORDS.get(level, []))
    return render_template('quiz.html', user=user, level=level, total=total)

@app.route('/ranking_quiz/<level>')
def ranking_quiz(level):
    if 'username' not in session:
        return redirect(url_for('login'))
    user = get_user(session['username'])
    if not user:
        return redirect(url_for('login'))
    level = level.upper()
    total = len(WORDS.get(level, []))
    return render_template('ranking_quiz.html', user=user, level=level, total=total)

@app.route('/hiragana')
def hiragana():
    if 'username' not in session:
        return redirect(url_for('login'))
    from collections import OrderedDict
    rows = OrderedDict()
    for item in HIRAGANA:
        row = item['row']
        if row not in rows:
            rows[row] = []
        rows[row].append(item)
    return render_template('hiragana.html',
                           rows=rows,
                           total=len(HIRAGANA))

@app.route('/hiragana_quiz')
def hiragana_quiz():
    if 'username' not in session:
        return redirect(url_for('login'))
    import json as _json
    return render_template('hiragana_quiz.html',
                           hiragana_json=_json.dumps(HIRAGANA, ensure_ascii=False))

@app.route('/kanji')
def kanji():
    if 'username' not in session:
        return redirect(url_for('login'))
    import json as _json
    return render_template('kanji.html',
                           words_json=_json.dumps(KANJI_WORDS, ensure_ascii=False),
                           total=len(KANJI_WORDS))

@app.route('/ranking_menu')
def ranking_menu():
    if 'username' not in session:
        return redirect(url_for('login'))
    user = get_user(session['username'])
    if not user:
        return redirect(url_for('login'))
    return render_template('ranking_menu.html', user=user)

@app.route('/ranking/<level>')
def ranking(level):
    if 'username' not in session:
        return redirect(url_for('login'))
    user = get_user(session['username'])
    if not user:
        return redirect(url_for('login'))
    level = level.upper()
    try:
        conn = get_db(); cur = conn.cursor()
        cur.execute("""
            SELECT r.username, u.nickname, r.correct, r.elapsed,
                   RANK() OVER (ORDER BY r.correct DESC, r.elapsed ASC) AS rank
            FROM rankings r
            JOIN users u ON r.username = u.username
            WHERE r.level = %s
            ORDER BY r.correct DESC, r.elapsed ASC
            LIMIT 100
        """, (level,))
        top100 = [dict(row) for row in cur.fetchall()]

        cur.execute("""
            SELECT r.username, u.nickname, r.correct, r.elapsed,
                   RANK() OVER (ORDER BY r.correct DESC, r.elapsed ASC) AS rank
            FROM rankings r
            JOIN users u ON r.username = u.username
            WHERE r.level = %s
            ORDER BY r.correct DESC, r.elapsed ASC
        """, (level,))
        all_rows = [dict(row) for row in cur.fetchall()]
        my_record = next((row for row in all_rows if row['username'] == session['username']), None)
        cur.close(); conn.close()
    except Exception as e:
        print(f'[ranking 오류] {e}')
        top100 = []; my_record = None

    return render_template('ranking.html', user=user, level=level,
                           top100=top100, my_record=my_record)

@app.route('/wrongnote')
def wrongnote():
    if 'username' not in session:
        return redirect(url_for('login'))
    user = get_user(session['username'])
    if not user:
        return redirect(url_for('login'))
    try:
        conn = get_db(); cur = conn.cursor()
        cur.execute(
            'SELECT * FROM wrong_notes WHERE username=%s ORDER BY level, id DESC',
            (session['username'],)
        )
        notes = [dict(r) for r in cur.fetchall()]
        cur.close(); conn.close()
    except Exception as e:
        print(f'[wrongnote 오류] {e}')
        notes = []
    return render_template('wrongnote.html', user=user, notes=notes)

@app.route('/account')
def account():
    if 'username' not in session:
        return redirect(url_for('login'))
    user = get_user(session['username'])
    if not user:
        return redirect(url_for('login'))
    return render_template('account.html', user=user)

@app.route('/api/quiz/<level>')
def api_quiz(level):
    if 'username' not in session:
        return jsonify({'error': 'unauthorized'}), 401
    level = level.upper()
    try:
        count = int(request.args.get('count', 10))
    except ValueError:
        count = 10
    pool = WORDS.get(level, [])
    if not pool:
        return jsonify({'questions': [], 'error': f'{level} 단어 데이터가 없습니다.'}), 404
    count = min(count, len(pool))
    selected = random.sample(pool, count)
    all_meanings = [w['meaning'] for w in pool]
    questions = []
    for w in selected:
        other = [m for m in all_meanings if m != w['meaning']]
        wrong = random.sample(other, min(2, len(other)))
        choices = wrong + [w['meaning']]
        random.shuffle(choices)
        questions.append({'word': w['word'], 'hiragana': w['hiragana'],
                          'answer': w['meaning'], 'choices': choices})
    return jsonify({'questions': questions, 'total': len(pool)})

@app.route('/api/ranking_quiz/<level>')
def api_ranking_quiz(level):
    if 'username' not in session:
        return jsonify({'error': 'unauthorized'}), 401
    level = level.upper()
    pool = WORDS.get(level, [])
    if not pool:
        return jsonify({'questions': [], 'error': f'{level} 단어 데이터가 없습니다.'}), 404
    count = min(30, len(pool))
    selected = random.sample(pool, count)
    all_meanings = [w['meaning'] for w in pool]
    questions = []
    for w in selected:
        other = [m for m in all_meanings if m != w['meaning']]
        wrong = random.sample(other, min(2, len(other)))
        choices = wrong + [w['meaning']]
        random.shuffle(choices)
        questions.append({'word': w['word'], 'hiragana': w['hiragana'],
                          'answer': w['meaning'], 'choices': choices})
    return jsonify({'questions': questions, 'total': len(pool)})

@app.route('/api/ranking', methods=['POST'])
def api_save_ranking():
    if 'username' not in session:
        return jsonify({'error': 'unauthorized'}), 401
    try:
        body    = request.get_json()
        level   = body.get('level', '').upper()
        correct = int(body.get('correct', 0))
        elapsed = float(body.get('elapsed', 0))
        if level not in LEVEL_INFO:
            return jsonify({'error': '잘못된 레벨'}), 400
        conn = get_db(); cur = conn.cursor()
        cur.execute('SELECT correct, elapsed FROM rankings WHERE username=%s AND level=%s',
                    (session['username'], level))
        existing = cur.fetchone()
        updated = False
        if existing is None:
            cur.execute('INSERT INTO rankings (username, level, correct, elapsed) VALUES (%s,%s,%s,%s)',
                        (session['username'], level, correct, elapsed))
            updated = True
        else:
            if (correct > existing['correct'] or
                (correct == existing['correct'] and elapsed < float(existing['elapsed']))):
                cur.execute('UPDATE rankings SET correct=%s, elapsed=%s, created_at=NOW() WHERE username=%s AND level=%s',
                            (correct, elapsed, session['username'], level))
                updated = True
        conn.commit()
        cur.execute("""
            SELECT COUNT(*)+1 AS rank FROM rankings
            WHERE level=%s AND (correct > %s OR (correct = %s AND elapsed < %s))
        """, (level, correct, correct, elapsed))
        row = cur.fetchone()
        my_rank = int(row['rank']) if row else 1
        cur.close(); conn.close()
        return jsonify({'ok': True, 'updated': updated, 'rank': my_rank})
    except Exception as e:
        print(f'[api_save_ranking 오류] {e}')
        return jsonify({'error': str(e)}), 500

@app.route('/api/wrongnote', methods=['GET'])
def api_get_wrongnote():
    if 'username' not in session:
        return jsonify({'error': '로그인 필요'}), 401
    try:
        conn = get_db(); cur = conn.cursor()
        cur.execute(
            'SELECT * FROM wrong_notes WHERE username=%s ORDER BY level, id DESC',
            (session['username'],)
        )
        notes = [dict(r) for r in cur.fetchall()]
        cur.close(); conn.close()
        return jsonify({'notes': notes})
    except Exception as e:
        print(f'[api_get_wrongnote 오류] {e}')
        return jsonify({'notes': []})

@app.route('/api/wrongnote', methods=['POST'])
def api_add_wrongnote():
    if 'username' not in session:
        return jsonify({'error': 'unauthorized'}), 401
    try:
        body = request.get_json()
        conn = get_db(); cur = conn.cursor()
        cur.execute("""
            INSERT INTO wrong_notes (username, word, hiragana, meaning, level)
            VALUES (%s, %s, %s, %s, %s)
            ON CONFLICT (username, word, level) DO NOTHING
        """, (session['username'], body.get('word'), body.get('hiragana'),
               body.get('meaning'), body.get('level', 'N5')))
        conn.commit(); cur.close(); conn.close()
        return jsonify({'ok': True})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/wrongnote/all', methods=['DELETE'])
def api_delete_all_wrongnote():
    if 'username' not in session:
        return jsonify({'error': 'unauthorized'}), 401
    username = session['username']
    try:
        conn = get_db()
        cur  = conn.cursor()
        cur.execute('DELETE FROM wrong_notes WHERE username=%s', (username,))
        conn.commit()
        cur.close(); conn.close()
        return jsonify({'ok': True})
    except Exception as e:
        print(f'[wrongnote/all 오류] {e}')
        return jsonify({'error': str(e)}), 500

@app.route('/api/wrongnote/<int:note_id>', methods=['DELETE'])
def api_delete_wrongnote(note_id):
    if 'username' not in session:
        return jsonify({'error': 'unauthorized'}), 401
    try:
        conn = get_db(); cur = conn.cursor()
        cur.execute('DELETE FROM wrong_notes WHERE id=%s AND username=%s',
                    (note_id, session['username']))
        conn.commit(); cur.close(); conn.close()
        return jsonify({'ok': True})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/account', methods=['POST'])
def api_update_account():
    if 'username' not in session:
        return jsonify({'error': 'unauthorized'}), 401
    try:
        body     = request.get_json()
        nickname = body.get('nickname', '').strip()
        cur_pw   = body.get('current_password', '')
        new_pw   = body.get('new_password', '')
        conn = get_db(); cur = conn.cursor()
        user = get_user(session['username'])
        updates = []; params = []
        if nickname:
            cur.execute('SELECT 1 FROM users WHERE nickname=%s AND username!=%s',
                        (nickname, session['username']))
            if cur.fetchone():
                cur.close(); conn.close()
                return jsonify({'error': '이미 사용 중인 닉네임입니다.'}), 400
            updates.append('nickname=%s'); params.append(nickname)
        if new_pw:
            if user['password'] != cur_pw:
                cur.close(); conn.close()
                return jsonify({'error': '현재 비밀번호가 틀렸습니다.'}), 400
            if len(new_pw) < 6:
                cur.close(); conn.close()
                return jsonify({'error': '비밀번호는 6자 이상이어야 합니다.'}), 400
            updates.append('password=%s'); params.append(new_pw)
        if updates:
            params.append(session['username'])
            cur.execute(f"UPDATE users SET {', '.join(updates)} WHERE username=%s", params)
            conn.commit()
        cur.close(); conn.close()
        return jsonify({'ok': True})
    except Exception as e:
        print(f'[api_update_account 오류] {e}')
        return jsonify({'error': str(e)}), 500

@app.route('/health')
def health():
    try:
        conn = get_db(); cur = conn.cursor()
        cur.execute('SELECT 1')
        cur.close(); conn.close()
        return jsonify({'status': 'ok', 'db': 'connected'})
    except Exception as e:
        return jsonify({'status': 'error', 'db': str(e)}), 500

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)
