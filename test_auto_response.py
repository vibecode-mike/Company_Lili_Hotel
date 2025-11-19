#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
自動回應功能單元測試
"""
import sys
sys.path.insert(0, '/data2/lili_hotel/line_app')

from datetime import datetime, time as dt_time
from sqlalchemy import create_engine, text as sql_text
from sqlalchemy.orm import Session

# 資料庫連接
DATABASE_URL = "mysql+pymysql://root:123456@127.0.0.1:3306/lili_hotel"
engine = create_engine(DATABASE_URL, echo=False)

def test_keyword_trigger():
    """測試關鍵字觸發邏輯"""
    print("\n" + "="*60)
    print("測試 1: 關鍵字觸發")
    print("="*60)
    
    test_cases = [
        ("訂房", True, "完全匹配"),
        ("房型", True, "完全匹配"),
        ("價格", True, "完全匹配"),
        ("訂房資訊", False, "部分匹配（應該不觸發）"),
        ("hello", False, "無關鍵字"),
    ]
    
    with Session(engine) as session:
        for message, should_trigger, desc in test_cases:
            message_lower = message.strip().lower()
            
            # 查詢邏輯（模擬 check_keyword_trigger）
            result = session.execute(sql_text("""
                SELECT ar.id, ark.id as keyword_id
                FROM auto_responses ar
                JOIN auto_response_keywords ark ON ar.id = ark.auto_response_id
                WHERE ar.trigger_type = 'keyword'
                  AND ar.is_active = 1
                  AND ark.is_enabled = 1
                  AND LOWER(ark.keyword) = :msg
                ORDER BY ar.created_at ASC
                LIMIT 1
            """), {"msg": message_lower}).fetchone()
            
            triggered = result is not None
            status = "✅ PASS" if triggered == should_trigger else "❌ FAIL"
            
            print(f"{status} | 訊息: '{message}' | {desc}")
            if triggered:
                print(f"     → 觸發自動回應 ID: {result[0]}, 關鍵字 ID: {result[1]}")

def test_time_trigger():
    """測試時間觸發邏輯"""
    print("\n" + "="*60)
    print("測試 2: 時間觸發")
    print("="*60)
    
    now = datetime.now()
    current_time = now.time()
    current_date = now.date()
    
    print(f"當前時間: {current_time.strftime('%H:%M:%S')}")
    print(f"當前日期: {current_date}")
    
    with Session(engine) as session:
        result = session.execute(sql_text("""
            SELECT ar.id, ar.name, ar.trigger_time_start, ar.trigger_time_end
            FROM auto_responses ar
            WHERE ar.trigger_type = 'time'
              AND ar.is_active = 1
              AND (ar.date_range_start IS NULL OR ar.date_range_start <= :today)
              AND (ar.date_range_end IS NULL OR ar.date_range_end >= :today)
            ORDER BY ar.created_at ASC
            LIMIT 1
        """), {"today": current_date}).fetchone()
        
        if result:
            auto_response_id, name, time_start, time_end = result
            
            # 檢查時間範圍
            if time_start and time_end:
                if time_start <= time_end:
                    in_range = time_start <= current_time <= time_end
                else:
                    in_range = current_time >= time_start or current_time <= time_end
                
                status = "✅ PASS" if in_range else "⚠️ WARNING"
                print(f"{status} | 自動回應: '{name}' (ID: {auto_response_id})")
                print(f"     → 時間範圍: {time_start} - {time_end}")
                print(f"     → {'在範圍內' if in_range else '不在範圍內'}")
            else:
                print(f"✅ PASS | 自動回應: '{name}' (ID: {auto_response_id})")
                print(f"     → 無時間限制（全天候觸發）")
        else:
            print("❌ FAIL | 沒有找到已啟用的時間觸發自動回應")

def test_welcome_trigger():
    """測試歡迎訊息配置"""
    print("\n" + "="*60)
    print("測試 3: 歡迎訊息配置")
    print("="*60)
    
    with Session(engine) as session:
        result = session.execute(sql_text("""
            SELECT ar.id, ar.name, COUNT(arm.id) as message_count
            FROM auto_responses ar
            LEFT JOIN auto_response_messages arm ON ar.id = arm.response_id
            WHERE ar.trigger_type = 'welcome'
              AND ar.is_active = 1
            GROUP BY ar.id
            ORDER BY ar.created_at ASC
            LIMIT 1
        """)).fetchone()
        
        if result:
            auto_response_id, name, msg_count = result
            status = "✅ PASS" if msg_count > 0 else "⚠️ WARNING"
            print(f"{status} | 歡迎訊息: '{name}' (ID: {auto_response_id})")
            print(f"     → 訊息數量: {msg_count}")
            
            # 查看訊息內容
            messages = session.execute(sql_text("""
                SELECT sequence_order, message_content
                FROM auto_response_messages
                WHERE response_id = :id
                ORDER BY sequence_order
            """), {"id": auto_response_id}).fetchall()
            
            for seq, content in messages:
                preview = content[:50] + "..." if len(content) > 50 else content
                print(f"     → 訊息 {seq}: {preview}")
        else:
            print("❌ FAIL | 沒有找到已啟用的歡迎訊息")

def test_message_content():
    """測試訊息內容配置"""
    print("\n" + "="*60)
    print("測試 4: 訊息內容完整性")
    print("="*60)
    
    with Session(engine) as session:
        result = session.execute(sql_text("""
            SELECT ar.id, ar.name, ar.response_count,
                   COUNT(arm.id) as actual_message_count
            FROM auto_responses ar
            LEFT JOIN auto_response_messages arm ON ar.id = arm.response_id
            WHERE ar.id IN (1, 2, 3)
            GROUP BY ar.id
            ORDER BY ar.id
        """)).fetchall()
        
        for auto_id, name, expected_count, actual_count in result:
            status = "✅ PASS" if expected_count == actual_count else "❌ FAIL"
            print(f"{status} | {name} (ID: {auto_id})")
            print(f"     → 預期訊息數: {expected_count}, 實際訊息數: {actual_count}")

def test_statistics_fields():
    """測試統計欄位"""
    print("\n" + "="*60)
    print("測試 5: 統計欄位檢查")
    print("="*60)
    
    with Session(engine) as session:
        # 檢查 auto_responses 表
        columns = session.execute(sql_text("""
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = 'lili_hotel' 
              AND TABLE_NAME = 'auto_responses'
              AND COLUMN_NAME IN ('trigger_count', 'success_rate')
        """)).fetchall()
        
        has_trigger_count = any(col[0] == 'trigger_count' for col in columns)
        has_success_rate = any(col[0] == 'success_rate' for col in columns)
        
        print(f"{'✅' if has_trigger_count else '❌'} trigger_count 欄位")
        print(f"{'✅' if has_success_rate else '❌'} success_rate 欄位")
        
        # 檢查 auto_response_keywords 表
        columns = session.execute(sql_text("""
            SELECT COLUMN_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE TABLE_SCHEMA = 'lili_hotel' 
              AND TABLE_NAME = 'auto_response_keywords'
              AND COLUMN_NAME IN ('match_type', 'is_enabled', 'match_count', 'last_triggered_at')
        """)).fetchall()
        
        required_fields = ['match_type', 'is_enabled', 'match_count', 'last_triggered_at']
        for field in required_fields:
            has_field = any(col[0] == field for col in columns)
            print(f"{'✅' if has_field else '❌'} {field} 欄位")

if __name__ == "__main__":
    print("\n" + "="*60)
    print("  自動回應功能單元測試")
    print("="*60)
    
    try:
        test_statistics_fields()
        test_keyword_trigger()
        test_time_trigger()
        test_welcome_trigger()
        test_message_content()
        
        print("\n" + "="*60)
        print("  測試完成")
        print("="*60 + "\n")
        
    except Exception as e:
        print(f"\n❌ 測試執行錯誤: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
