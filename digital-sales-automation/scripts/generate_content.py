"""
eBookコンテンツ自動生成スクリプト
タイトルを入力するとAIが本文を生成し、Markdownファイルとして保存する
"""
import json
import os
import sys
import anthropic
from datetime import datetime
from pathlib import Path
from dotenv import load_dotenv
from rich.console import Console
from rich.markdown import Markdown

load_dotenv()
console = Console()


EBOOK_SYSTEM_PROMPT = """
あなたはベストセラーのeBook著者です。
読者が「買ってよかった」と感じる、実用的で読みやすい日本語のeBookを書いてください。

文体のルール:
- 話しかけるような親しみやすい文体
- 箇条書きと具体例を多用する
- 各章の冒頭に「この章で学ぶこと」を入れる
- 章末に「まとめ」と「次のアクション」を入れる
- 初心者でも3日以内に実践できる内容にする
"""


def generate_ebook(title: str, ebook_type: str = "ebook", pages: int = 20) -> str:
    client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

    if ebook_type == "template":
        content_prompt = f"""
「{title}」というタイトルのテンプレート集を作成してください。

構成:
1. はじめに（このテンプレートの使い方）
2. テンプレート本体（5〜8種類のすぐ使えるテンプレート）
3. 活用事例（各テンプレートの具体的な使い方）
4. カスタマイズ方法

Markdown形式で出力してください。
"""
    elif ebook_type == "checklist":
        content_prompt = f"""
「{title}」というタイトルのチェックリスト・ガイドブックを作成してください。

構成:
1. はじめに（このチェックリストの目的）
2. 基本チェックリスト（初心者向け20項目）
3. 応用チェックリスト（中級者向け15項目）
4. よくあるミスと対策
5. 達成シート（進捗を記録できるページ）

Markdown形式で出力してください。
"""
    else:
        content_prompt = f"""
「{title}」というタイトルのeBook（約{pages}ページ相当）を作成してください。

構成（必ず以下の順番で）:
# {title}

## はじめに
- 著者メッセージ（なぜこのeBookを書いたか）
- この本で得られること（3つの価値）
- 対象読者

## 第1章: 基礎知識
## 第2章: 具体的な方法（ステップ別）
## 第3章: よくある失敗と対策
## 第4章: 応用・発展編
## 第5章: まとめとアクションプラン

各章は1,000〜1,500文字程度で書いてください。
Markdown形式で出力してください。
"""

    console.print(f"[bold blue]AIが '{title}' の本文を生成中...[/bold blue]")

    full_content = ""
    with client.messages.stream(
        model="claude-sonnet-4-6",
        max_tokens=4096,
        system=EBOOK_SYSTEM_PROMPT,
        messages=[{"role": "user", "content": content_prompt}]
    ) as stream:
        for text in stream.text_stream:
            full_content += text
            print(text, end="", flush=True)

    print("\n")
    return full_content


def generate_sales_copy(title: str, content_preview: str) -> dict:
    client = anthropic.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

    prompt = f"""
以下のeBookの販売ページ用テキストを作成してください。

タイトル: {title}
内容プレビュー: {content_preview[:500]}

以下のJSON形式で返してください:
{{
  "tagline": "キャッチコピー（20字以内）",
  "description": "商品説明（200字以内、買いたくなる文章）",
  "benefits": ["メリット1", "メリット2", "メリット3"],
  "target_audience": "対象読者（50字以内）",
  "price_justification": "なぜこの価格が適正か（50字以内）"
}}
JSON以外は出力しないでください。
"""

    message = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=512,
        messages=[{"role": "user", "content": prompt}]
    )

    raw = message.content[0].text.strip()
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    return json.loads(raw.strip())


def save_draft(title: str, content: str, sales_copy: dict, ebook_type: str) -> Path:
    safe_title = "".join(c for c in title if c.isalnum() or c in " _-")[:40].strip()
    timestamp = datetime.now().strftime("%Y%m%d_%H%M")
    draft_dir = Path(f"./output/drafts/{timestamp}_{safe_title}")
    draft_dir.mkdir(parents=True, exist_ok=True)

    (draft_dir / "content.md").write_text(content, encoding="utf-8")
    (draft_dir / "sales_copy.json").write_text(
        json.dumps(sales_copy, ensure_ascii=False, indent=2), encoding="utf-8"
    )

    meta = {
        "title": title,
        "type": ebook_type,
        "created_at": datetime.now().isoformat(),
        "status": "draft",
        "word_count": len(content),
    }
    (draft_dir / "meta.json").write_text(
        json.dumps(meta, ensure_ascii=False, indent=2), encoding="utf-8"
    )

    return draft_dir


if __name__ == "__main__":
    if len(sys.argv) < 2:
        console.print("[red]使い方: python generate_content.py 'タイトル' [ebook|template|checklist] [ページ数][/red]")
        sys.exit(1)

    title = sys.argv[1]
    ebook_type = sys.argv[2] if len(sys.argv) > 2 else "ebook"
    pages = int(sys.argv[3]) if len(sys.argv) > 3 else 20

    content = generate_ebook(title, ebook_type, pages)

    console.print("\n[bold yellow]販売ページ用テキストを生成中...[/bold yellow]")
    sales_copy = generate_sales_copy(title, content)

    draft_dir = save_draft(title, content, sales_copy, ebook_type)

    console.print(f"\n[bold green]✅ 下書きを保存しました: {draft_dir}[/bold green]")
    console.print("\n[bold]販売ページ用テキスト:[/bold]")
    console.print(f"  キャッチコピー: {sales_copy['tagline']}")
    console.print(f"  説明文: {sales_copy['description']}")
    console.print(f"\n次のステップ: python scripts/create_pdf.py '{draft_dir}'")
