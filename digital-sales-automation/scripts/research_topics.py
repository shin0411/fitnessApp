"""
トレンドトピック調査スクリプト
Claude APIでebookになりそうなテーマを提案する
"""
import io
import os
import sys

# Python起動後でも可能な限りUTF-8を強制する
os.environ["PYTHONUTF8"] = "1"
os.environ["PYTHONIOENCODING"] = "utf-8"
try:
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace")
except AttributeError:
    pass

import json
import traceback
import anthropic
from datetime import datetime
from dotenv import load_dotenv
from rich.console import Console
from rich.table import Table

load_dotenv()
# force_terminal を外し、encoding を明示
console = Console(encoding="utf-8", stderr=False)


GENRE_KEYWORDS = {
    "side_income":    ("副業・お金",       ["副業", "在宅ワーク", "投資", "節約", "ポイ活", "フリーランス"]),
    "health":         ("健康・ダイエット", ["ダイエット", "筋トレ", "食事管理", "睡眠", "メンタルヘルス"]),
    "work_skills":    ("仕事術",           ["時間管理", "ChatGPT活用", "Excel", "プレゼン", "転職"]),
    "family":         ("育児・暮らし",     ["子育て", "片付け", "料理", "節約レシピ", "保活"]),
    "relationship":   ("恋愛・人間関係",   ["婚活", "コミュニケーション", "人間関係", "SNS活用"]),
}


def check_api_key() -> bool:
    """APIキーが有効か確認する（ASCII onlyで確認）"""
    api_key = os.getenv("ANTHROPIC_API_KEY", "")
    if not api_key or not api_key.startswith("sk-ant-"):
        print("[ERROR] ANTHROPIC_API_KEY が .env に設定されていないか不正です")
        return False
    try:
        client = anthropic.Anthropic(api_key=api_key)
        client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=10,
            messages=[{"role": "user", "content": "hi"}]
        )
        return True
    except anthropic.AuthenticationError:
        print("[ERROR] APIキーが無効です。https://console.anthropic.com/ で確認してください")
        return False
    except Exception as e:
        print(f"[ERROR] API接続エラー: {e}")
        return False


def generate_topic_ideas(genre_jp: str, keywords: list) -> list:
    api_key = os.getenv("ANTHROPIC_API_KEY", "")
    client = anthropic.Anthropic(api_key=api_key)

    # プロンプトはすべてUnicode文字列として組み立てる
    kw_str = ", ".join(keywords)
    prompt = (
        "You are a digital content sales expert. "
        "Suggest 5 ebook/template titles for Japanese buyers.\n\n"
        f"Genre (Japanese): {genre_jp}\n"
        f"Keywords: {kw_str}\n\n"
        "Rules:\n"
        "- Titles must be in Japanese\n"
        "- Specific, actionable titles (e.g. '30分でわかる〇〇')\n"
        "- Price range: 500-1500 yen ($5-$15)\n"
        "- Easy to create with AI\n\n"
        "Return ONLY a JSON array:\n"
        '[{"title":"...","description":"...","type":"ebook","estimated_pages":20,"selling_point":"..."}]'
    )

    message = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=1024,
        messages=[{"role": "user", "content": prompt}]
    )

    raw = message.content[0].text.strip()
    if raw.startswith("```"):
        parts = raw.split("```")
        raw = parts[1] if len(parts) > 1 else raw
        if raw.startswith("json"):
            raw = raw[4:]
    return json.loads(raw.strip())


def research(genre_key: str | None = None) -> list:
    all_topics = []

    if genre_key and genre_key in GENRE_KEYWORDS:
        targets = {genre_key: GENRE_KEYWORDS[genre_key]}
    else:
        targets = GENRE_KEYWORDS

    # console.status() を使わず print で進捗表示（エンコード安全）
    print("AIがトレンドトピックを調査中...")

    for key, (genre_jp, kws) in targets.items():
        try:
            print(f"  調査中: {genre_jp} ...", flush=True)
            topics = generate_topic_ideas(genre_jp, kws)
            for t in topics:
                t["genre"] = genre_jp
            all_topics.extend(topics)
            print(f"  完了: {len(topics)}件取得", flush=True)
        except Exception as e:
            print(f"  スキップ: {key} - {type(e).__name__}: {e}", flush=True)
            traceback.print_exc()

    return all_topics


def display_topics(topics: list) -> None:
    if not topics:
        print("トピックが取得できませんでした")
        return

    table = Table(
        title=f"AI提案 eBookトピック ({datetime.now().strftime('%Y/%m/%d')})",
        show_lines=True
    )
    table.add_column("No", width=4)
    table.add_column("タイトル", min_width=30)
    table.add_column("ジャンル", width=14)
    table.add_column("種類", width=10)
    table.add_column("ページ数", width=8)
    table.add_column("売れる理由", min_width=20)

    for i, t in enumerate(topics, 1):
        table.add_row(
            str(i),
            str(t.get("title", "-")),
            str(t.get("genre", "-")),
            str(t.get("type", "-")),
            str(t.get("estimated_pages", "-")),
            str(t.get("selling_point", "-")),
        )

    console.print(table)


if __name__ == "__main__":
    if not check_api_key():
        sys.exit(1)
    genre_filter = sys.argv[1] if len(sys.argv) > 1 else None
    topics = research(genre_filter)
    display_topics(topics)

    os.makedirs("./output/drafts", exist_ok=True)
    output_path = f"./output/drafts/topics_{datetime.now().strftime('%Y%m%d')}.json"
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(topics, f, ensure_ascii=False, indent=2)
    print(f"\nトピック一覧を保存しました: {output_path}")
