"""
トレンドトピック調査スクリプト
Googleトレンドと独自ロジックでebookになりそうなテーマを提案する
"""
import os
import sys

# conda環境での日本語エンコードエラーを防ぐ
os.environ["PYTHONUTF8"] = "1"
os.environ["PYTHONIOENCODING"] = "utf-8"
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")

import json
import anthropic
from datetime import datetime
from dotenv import load_dotenv
from rich.console import Console
from rich.table import Table

load_dotenv()
console = Console(force_terminal=True)


GENRE_KEYWORDS = {
    "副業・お金": ["副業", "在宅ワーク", "投資", "節約", "ポイ活", "フリーランス"],
    "健康・ダイエット": ["ダイエット", "筋トレ", "食事管理", "睡眠", "メンタルヘルス"],
    "仕事術": ["時間管理", "ChatGPT活用", "Excel", "プレゼン", "転職"],
    "育児・暮らし": ["子育て", "片付け", "料理", "節約レシピ", "保活"],
    "恋愛・人間関係": ["婚活", "コミュニケーション", "人間関係", "SNS活用"],
}


def generate_topic_ideas(genre: str, keywords: list[str]) -> list[dict]:
    client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

    prompt = f"""
あなたはデジタルコンテンツ販売の専門家です。
以下のジャンルとキーワードで、Gumroadで売れるeBook・テンプレートのタイトルを5つ考えてください。

ジャンル: {genre}
キーワード例: {', '.join(keywords)}

条件:
- 日本人向け（日本語）
- 「初心者でも〇〇できる」「〇〇分でわかる」など具体的で買いたくなるタイトル
- 価格帯: 500〜1,500円（Gumroadで$5〜$15程度）
- 作成工数が少ないもの（AI生成に向いているもの）

以下のJSON形式で返してください:
[
  {{
    "title": "タイトル",
    "description": "一言説明（30字以内）",
    "type": "ebook or template or checklist",
    "estimated_pages": ページ数,
    "selling_point": "なぜ売れるか（一言）"
  }}
]
JSON以外は出力しないでください。
"""

    message = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=1024,
        messages=[{"role": "user", "content": prompt}]
    )

    raw = message.content[0].text.strip()
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    return json.loads(raw.strip())


def research(genre: str | None = None) -> list[dict]:
    all_topics = []

    if genre and genre in GENRE_KEYWORDS:
        genres_to_search = {genre: GENRE_KEYWORDS[genre]}
    else:
        genres_to_search = GENRE_KEYWORDS

    with console.status("[bold green]AIがトレンドトピックを調査中..."):
        for g, kws in genres_to_search.items():
            try:
                topics = generate_topic_ideas(g, kws)
                for t in topics:
                    t["genre"] = g
                all_topics.extend(topics)
            except Exception as e:
                console.print(f"[yellow]警告: {g}の調査をスキップ ({e})[/yellow]")

    return all_topics


def display_topics(topics: list[dict]) -> None:
    table = Table(title=f"AIが提案するeBookトピック ({datetime.now().strftime('%Y/%m/%d')})", show_lines=True)
    table.add_column("No", width=4)
    table.add_column("タイトル", min_width=30)
    table.add_column("ジャンル", width=14)
    table.add_column("種類", width=10)
    table.add_column("ページ数", width=8)
    table.add_column("売れる理由", min_width=20)

    for i, t in enumerate(topics, 1):
        table.add_row(
            str(i),
            t["title"],
            t.get("genre", "-"),
            t.get("type", "-"),
            str(t.get("estimated_pages", "-")),
            t.get("selling_point", "-"),
        )

    console.print(table)


if __name__ == "__main__":
    genre_filter = sys.argv[1] if len(sys.argv) > 1 else None
    topics = research(genre_filter)
    display_topics(topics)

    output_path = f"./output/drafts/topics_{datetime.now().strftime('%Y%m%d')}.json"
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(topics, f, ensure_ascii=False, indent=2)
    console.print(f"\n[green]トピック一覧を保存しました: {output_path}[/green]")
