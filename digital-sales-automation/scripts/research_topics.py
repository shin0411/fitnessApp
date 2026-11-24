"""
トレンドトピック調査スクリプト
Claude APIでeBookになりそうなテーマを提案する
"""
import json
import os
import sys
from datetime import datetime
from pathlib import Path

from rich.console import Console
from rich.table import Table

from scripts.llm import RESEARCH_MODEL, CreditError, call_text, extract_json

console = Console()


GENRE_KEYWORDS = {
    "side_income":    ("副業・お金",       ["副業", "在宅ワーク", "節約", "ポイ活", "フリーランス", "家計管理"]),
    "health":         ("健康・ダイエット", ["ダイエット", "筋トレ", "食事管理", "睡眠", "ストレッチ"]),
    "work_skills":    ("仕事術",           ["時間管理", "生成AI活用", "Excel", "プレゼン", "転職"]),
    "family":         ("育児・暮らし",     ["子育て", "片付け", "料理", "節約レシピ", "保活"]),
    "relationship":   ("恋愛・人間関係",   ["婚活", "コミュニケーション", "人間関係", "SNS活用"]),
}

HISTORY_FILE = Path("./output/history.json")


def check_api_key() -> bool:
    """APIキーの形式だけ確認する（APIは呼ばない。残高不足は実際の呼び出しで検出する）"""
    api_key = os.getenv("ANTHROPIC_API_KEY", "")
    if not api_key.startswith("sk-ant-"):
        print("[ERROR] ANTHROPIC_API_KEY が設定されていないか形式が不正です")
        return False
    return True


def resolve_genre(genre: str | None) -> str | None:
    """英語キー（health）でも日本語名（健康・ダイエット）でも受け付ける"""
    if not genre:
        return None
    genre = genre.strip()
    if genre in GENRE_KEYWORDS:
        return genre
    for key, (jp, _) in GENRE_KEYWORDS.items():
        if genre == jp or genre in jp:
            return key
    return None


def load_history() -> list[str]:
    """過去に作ったタイトル一覧（重複回避用）"""
    titles = set()
    if HISTORY_FILE.exists():
        try:
            titles.update(json.loads(HISTORY_FILE.read_text(encoding="utf-8")))
        except (json.JSONDecodeError, TypeError):
            pass
    for meta in Path("./output/drafts").glob("*/meta.json"):
        try:
            titles.add(json.loads(meta.read_text(encoding="utf-8"))["title"])
        except (json.JSONDecodeError, KeyError):
            continue
    return sorted(titles)


def add_to_history(title: str) -> None:
    titles = set(load_history())
    titles.add(title)
    HISTORY_FILE.parent.mkdir(parents=True, exist_ok=True)
    HISTORY_FILE.write_text(json.dumps(sorted(titles), ensure_ascii=False, indent=2), encoding="utf-8")


def generate_topic_ideas(genre_jp: str, keywords: list, avoid: list[str]) -> list:
    avoid_str = "\n".join(f"- {t}" for t in avoid[-30:]) or "（なし）"
    prompt = (
        "あなたは日本のKindleストアとnoteで売れるデジタルコンテンツの専門家です。\n"
        "日本の読者向けに、eBookのタイトル案を5つ提案してください。\n\n"
        f"ジャンル: {genre_jp}\n"
        f"キーワード: {', '.join(keywords)}\n\n"
        "条件:\n"
        "- 日本語のタイトル。Amazonで実際に検索されそうな語句を含める\n"
        "- 広すぎるテーマではなく、対象読者と悩みを絞る（例: 「30代共働きの3日で終わる冷蔵庫片付け」）\n"
        "- 価格は500〜1,000円で売れる内容\n"
        "- 医療・投資の個別助言が必要なテーマは避ける\n"
        "- 次の既存タイトルと重複しない:\n"
        f"{avoid_str}\n\n"
        "JSON配列だけを返してください:\n"
        '[{"title":"...","description":"...","type":"ebook","estimated_pages":20,"selling_point":"..."}]\n'
        'type は "ebook" / "template" / "checklist" のいずれか。'
    )
    raw = call_text(prompt, model=RESEARCH_MODEL, max_tokens=4000, effort="low")
    topics = extract_json(raw)
    return [t for t in topics if isinstance(t, dict) and t.get("title")]


def research(genre_key: str | None = None) -> list:
    all_topics = []
    genre_key = resolve_genre(genre_key)
    targets = {genre_key: GENRE_KEYWORDS[genre_key]} if genre_key else GENRE_KEYWORDS
    avoid = load_history()

    print("AIがトレンドトピックを調査中...")
    for key, (genre_jp, kws) in targets.items():
        try:
            print(f"  調査中: {genre_jp} ...", flush=True)
            topics = generate_topic_ideas(genre_jp, kws, avoid)
            for t in topics:
                t["genre"] = genre_jp
                t.setdefault("type", "ebook")
            all_topics.extend(t for t in topics if t["title"] not in avoid)
            print(f"  完了: {len(topics)}件取得", flush=True)
        except CreditError:
            raise
        except Exception as e:
            print(f"  スキップ: {key} - {type(e).__name__}: {e}", flush=True)

    return all_topics


def display_topics(topics: list) -> None:
    if not topics:
        print("トピックが取得できませんでした")
        return

    table = Table(title=f"AI提案 eBookトピック ({datetime.now().strftime('%Y/%m/%d')})", show_lines=True)
    table.add_column("No", width=4)
    table.add_column("タイトル", min_width=30)
    table.add_column("ジャンル", width=14)
    table.add_column("種類", width=10)
    table.add_column("売れる理由", min_width=20)

    for i, t in enumerate(topics, 1):
        table.add_row(
            str(i),
            str(t.get("title", "-")),
            str(t.get("genre", "-")),
            str(t.get("type", "-")),
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
