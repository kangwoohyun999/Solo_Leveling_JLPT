# migrate.py
import os
import psycopg2
from psycopg2.extras import RealDictCursor

def migrate_table(old_conn, new_conn, table_name, columns, conflict_clause=""):
    old_cur = old_conn.cursor(cursor_factory=RealDictCursor)
    new_cur = new_conn.cursor()

    # id 컬럼 제외하고 데이터만 가져옴 (SERIAL은 Supabase에서 새로 생성)
    select_cols = ", ".join([c for c in columns if c != "id"])
    old_cur.execute(f"SELECT {select_cols} FROM {table_name}")
    rows = old_cur.fetchall()

    inserted = 0
    for row in rows:
        values = [row[col] for col in select_cols.split(", ")]
        placeholders = ", ".join(["%s"] * len(values))
        
        sql = f"""
            INSERT INTO {table_name} ({select_cols})
            VALUES ({placeholders})
            {conflict_clause}
        """
        try:
            new_cur.execute(sql, values)
            inserted += 1
        except Exception as e:
            print(f"[{table_name}] 스킵: {row.get('username', row)} - {e}")
            new_conn.rollback()
    
    new_conn.commit()
    print(f"✅ {table_name}: {inserted}개 데이터 이동 완료")

# ====================== 실행 ======================
if __name__ == "__main__":
    OLD_URL = os.environ.get("postgresql://postgres:GbrRpFECRjTAjAPDEqhQqRZxVLiThRig@postgres.railway.internal:5432/railway")      # Railway URL
    NEW_URL = os.environ.get("postgresql://postgres.vmteuoubyznoipqkvcxa:sololevelingjlpt@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres")      # Supabase URL
    
    if not OLD_URL or not NEW_URL:
        print("❌ OLD_DATABASE_URL와 NEW_DATABASE_URL 환경변수를 설정해주세요!")
        exit(1)

    old_conn = psycopg2.connect(OLD_URL)
    new_conn = psycopg2.connect(NEW_URL)

    print("🚀 Railway → Supabase 데이터 마이그레이션 시작...")

    # 1. users (가장 먼저!)
    migrate_table(
        old_conn, new_conn, "users",
        ["id", "username", "password", "nickname"],
        "ON CONFLICT (username) DO NOTHING"
    )

    # 2. wrong_notes
    migrate_table(
        old_conn, new_conn, "wrong_notes",
        ["id", "username", "word", "hiragana", "meaning", "level"],
        "ON CONFLICT (username, word, level) DO NOTHING"
    )

    # 3. rankings
    migrate_table(
        old_conn, new_conn, "rankings",
        ["id", "username", "level", "correct", "elapsed", "created_at"],
        "ON CONFLICT (username, level) DO UPDATE SET "
        "correct = EXCLUDED.correct, "
        "elapsed = EXCLUDED.elapsed, "
        "created_at = EXCLUDED.created_at"
    )

    old_conn.close()
    new_conn.close()
    print("🎉 모든 데이터 마이그레이션 완료!")