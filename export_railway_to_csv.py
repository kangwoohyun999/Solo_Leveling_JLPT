# export_railway_to_csv.py
import psycopg2
import csv
from psycopg2.extras import RealDictCursor

if __name__ == "__main__":
    print("🚀 Railway → CSV 파일 추출 시작")
    print("=" * 60)
    
    OLD_URL = input("1️⃣ Railway DATABASE_URL을 붙여넣기 하세요: ").strip()
    
    if not OLD_URL:
        print("❌ URL을 입력해야 합니다!")
        exit(1)

    print("\n🔗 Railway에 연결 중...")
    conn = psycopg2.connect(OLD_URL)
    cur = conn.cursor(cursor_factory=RealDictCursor)

    # 테이블별 컬럼 (id는 제외 → Supabase가 새로 생성)
    export_config = {
        "users": ["id", "username", "password", "nickname"],
        "wrong_notes": ["username", "word", "hiragana", "meaning", "level"],
        "rankings": ["username", "level", "correct", "elapsed", "created_at"]
    }

    for table_name, columns in export_config.items():
        print(f"📤 {table_name} 테이블 추출 중...")
        
        # 데이터 조회
        cur.execute(f"SELECT {', '.join(columns)} FROM {table_name}")
        rows = cur.fetchall()
        
        if not rows:
            print(f"   ⚠️  {table_name}에 데이터가 없습니다.")
            continue
        
        # CSV 저장
        filename = f"{table_name}.csv"
        with open(filename, 'w', newline='', encoding='utf-8-sig') as f:  # utf-8-sig로 한글 깨짐 방지
            writer = csv.DictWriter(f, fieldnames=columns)
            writer.writeheader()
            writer.writerows(rows)
        
        print(f"   ✅ {filename} : {len(rows)}개 행 저장 완료")

    conn.close()
    print("\n🎉 모든 CSV 파일 생성 완료!")
    print("📁 생성된 파일:")
    print("   • users.csv")
    print("   • wrong_notes.csv")
    print("   • rankings.csv")
    print("\n이제 Supabase로 import 하는 방법 알려드릴게요!")