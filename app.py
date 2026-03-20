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

# ── 단어 데이터 로드 (N1~N5 전체) ────────────────────────
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
        print(f'[단어로드] {lv}: 파일 없음')

# ── DB 연결 ──────────────────────────────────────────────
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
    cur.execute("""
        CREATE TABLE IF NOT EXISTS users (
            id       SERIAL PRIMARY KEY,
            username TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            nickname TEXT UNIQUE NOT NULL
        )
    """)
    # 기존 DB에 nickname UNIQUE 없으면 안전하게 추가
    cur.execute("""
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM pg_constraint
                WHERE conname = 'users_nickname_key'
            ) THEN
                ALTER TABLE users ADD CONSTRAINT users_nickname_key UNIQUE (nickname);
            END IF;
        END$$;
    """)
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
            nickname   TEXT NOT NULL,
            level      TEXT NOT NULL,
            elapsed_ms INTEGER NOT NULL,
            score      INTEGER NOT NULL,
            created_at TIMESTAMP NOT NULL DEFAULT NOW()
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

# ── 앱 시작 시 DB 초기화 ─────────────────────────────────
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

# ── 인증 라우트 ───────────────────────────────────────────
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
        except Exception as e:
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
        try:
            conn = get_db(); cur = conn.cursor()
            # 닉네임 중복 사전 체크
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
        except psycopg2.errors.UniqueViolation:
            conn.rollback(); cur.close(); conn.close()
            return render_template('register.html', error='이미 존재하는 아이디 또는 닉네임입니다.')
        except Exception as e:
            print(f'[register 오류] {e}')
            return render_template('register.html', error=f'서버 오류: {str(e)}')
    return render_template('register.html')

@app.route('/logout')
def logout():
    session.pop('username', None)
    return redirect(url_for('login'))

# ── 페이지 라우트 ─────────────────────────────────────────
@app.route('/main')
def main():
    if 'username' not in session:
        return redirect(url_for('login'))
    user = get_user(session['username'])
    if not user:
        session.pop('username', None)
        return redirect(url_for('login'))
    level_counts = {lv: len(WORDS.get(lv, [])) for lv in LEVEL_INFO}
    return render_template('main.html', user=user, level_counts=level_counts)

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

# ── API ──────────────────────────────────────────────────
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
        questions.append({
            'word':     w['word'],
            'hiragana': w['hiragana'],
            'answer':   w['meaning'],
            'choices':  choices
        })
    return jsonify({'questions': questions, 'total': len(pool)})

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
        """, (
            session['username'],
            body.get('word'), body.get('hiragana'),
            body.get('meaning'), body.get('level', 'N5')
        ))
        conn.commit(); cur.close(); conn.close()
        return jsonify({'ok': True})
    except Exception as e:
        print(f'[api_add_wrongnote 오류] {e}')
        return jsonify({'error': str(e)}), 500

@app.route('/api/wrongnote/<int:note_id>', methods=['DELETE'])
def api_delete_wrongnote(note_id):
    if 'username' not in session:
        return jsonify({'error': 'unauthorized'}), 401
    try:
        conn = get_db(); cur = conn.cursor()
        cur.execute(
            'DELETE FROM wrong_notes WHERE id=%s AND username=%s',
            (note_id, session['username'])
        )
        conn.commit(); cur.close(); conn.close()
        return jsonify({'ok': True})
    except Exception as e:
        print(f'[api_delete_wrongnote 오류] {e}')
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

        if nickname and nickname != user['nickname']:
            cur.execute('SELECT 1 FROM users WHERE nickname = %s AND username != %s',
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
            if nickname and nickname != user['nickname']:
                cur.execute('UPDATE rankings SET nickname=%s WHERE username=%s',
                            (nickname, session['username']))
            conn.commit()

        cur.close(); conn.close()
        return jsonify({'ok': True})
    except Exception as e:
        print(f'[api_update_account 오류] {e}')
        return jsonify({'error': str(e)}), 500

# ── 랭킹 페이지 ───────────────────────────────────────────
@app.route('/ranking')
def ranking():
    if 'username' not in session:
        return redirect(url_for('login'))
    user = get_user(session['username'])
    if not user:
        return redirect(url_for('login'))
    level = request.args.get('level', 'N5').upper()
    try:
        conn = get_db(); cur = conn.cursor()
        cur.execute("""
            SELECT DISTINCT ON (username)
                nickname, elapsed_ms, score, created_at
            FROM rankings
            WHERE level = %s AND score = 20
            ORDER BY username, elapsed_ms ASC
        """, (level,))
        rows = [dict(r) for r in cur.fetchall()]
        rows.sort(key=lambda x: x['elapsed_ms'])
        for r in rows:
            r['created_at'] = r['created_at'].strftime('%Y-%m-%d') if r.get('created_at') else ''
        cur.close(); conn.close()
    except Exception as e:
        print(f'[ranking 오류] {e}')
        rows = []
    return render_template('ranking.html', user=user, level=level, rows=rows)

# ── 랭킹 저장 API ─────────────────────────────────────────
@app.route('/api/ranking', methods=['POST'])
def api_save_ranking():
    if 'username' not in session:
        return jsonify({'error': 'unauthorized'}), 401
    try:
        body       = request.get_json()
        level      = body.get('level', 'N5').upper()
        elapsed_ms = int(body.get('elapsed_ms', 0))
        score      = int(body.get('score', 0))
        user       = get_user(session['username'])
        if not user:
            return jsonify({'error': 'user not found'}), 404
        conn = get_db(); cur = conn.cursor()
        cur.execute("""
            INSERT INTO rankings (username, nickname, level, elapsed_ms, score)
            VALUES (%s, %s, %s, %s, %s)
        """, (session['username'], user['nickname'], level, elapsed_ms, score))
        conn.commit(); cur.close(); conn.close()
        return jsonify({'ok': True})
    except Exception as e:
        print(f'[api_save_ranking 오류] {e}')
        return jsonify({'error': str(e)}), 500

# ── 랭킹 조회 API ─────────────────────────────────────────
@app.route('/api/ranking/<level>')
def api_get_ranking(level):
    if 'username' not in session:
        return jsonify({'error': 'unauthorized'}), 401
    level = level.upper()
    try:
        conn = get_db(); cur = conn.cursor()
        cur.execute("""
            SELECT DISTINCT ON (username)
                nickname, elapsed_ms, score, created_at
            FROM rankings
            WHERE level = %s AND score = 20
            ORDER BY username, elapsed_ms ASC
        """, (level,))
        rows = [dict(r) for r in cur.fetchall()]
        rows.sort(key=lambda x: x['elapsed_ms'])
        for r in rows:
            r['created_at'] = r['created_at'].strftime('%Y-%m-%d') if r.get('created_at') else ''
        cur.close(); conn.close()
        return jsonify({'rankings': rows[:20]})
    except Exception as e:
        print(f'[api_get_ranking 오류] {e}')
        return jsonify({'rankings': []}), 500

# ── 닉네임 중복 체크 API ──────────────────────────────────
@app.route('/api/check_nickname')
def api_check_nickname():
    nickname = request.args.get('nickname', '').strip()
    if not nickname:
        return jsonify({'available': False})
    try:
        conn = get_db(); cur = conn.cursor()
        cur.execute('SELECT 1 FROM users WHERE nickname = %s', (nickname,))
        exists = cur.fetchone() is not None
        cur.close(); conn.close()
        return jsonify({'available': not exists})
    except Exception as e:
        return jsonify({'available': False, 'error': str(e)})

# ── 헬스체크 ─────────────────────────────────────────────
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

