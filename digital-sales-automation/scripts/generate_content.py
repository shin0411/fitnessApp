"""
eBookコンテンツ自動生成スクリプト
タイトルを入力するとAIが本文を章ごとに生成し、Markdownファイルとして保存する。
章ごとに分けて呼び出すので、長い本でも途中で切れない。
"""
import json
import sys
from datetime import datetime
from pathlib import Path

from rich.console import Console

from scripts.llm import CONTENT_MODEL, RESEARCH_MODEL, call_text, extract_json

console = Console()


EBOOK_SYSTEM_PROMPT = """
あなたはベストセラーのeBook著者です。
読者が「買ってよかった」と感じる、実用的で読みやすい日本語のeBookを書いてください。

文体のルール:
- 話しかけるような親しみやすい文体
- 箇条書きと具体例を多用する
- 初心者でも3日以内に実践できる内容にする
- Markdownで出力し、前置きや「承知しました」などの返事は書かない

守ること（法令・販売規約）:
- 健康・ダイエット・美容: 「治る」「必ず痩せる」など効果を断定しない。病気の診断や治療の助言はしない。必要に応じて医師への相談を促す
- お金・投資: 特定の銘柄・商品の売買を勧めない。利益を保証しない。一般的な知識の説明に留める
- 実在の人物・企業・統計の数字を作らない。確かでない数字は書かない
- 他の書籍や記事の文章を書き写さない
"""


# 種類ごとの章立て: (見出し, その章に書く内容, 目安の文字数)
SECTION_PLANS = {
    "ebook": [
        ("はじめに", "著者メッセージ（なぜこの本を書いたか）、この本で得られる3つの価値、対象読者", 800),
        ("第1章: 基礎知識", "この章で学ぶこと、押さえるべき基礎、章末のまとめと次のアクション", 1300),
        ("第2章: 具体的な方法（ステップ別）", "この章で学ぶこと、ステップごとの手順と具体例、章末のまとめと次のアクション", 1500),
        ("第3章: よくある失敗と対策", "この章で学ぶこと、失敗例と対策を5つ以上、章末のまとめと次のアクション", 1300),
        ("第4章: 応用・発展編", "この章で学ぶこと、慣れてきた人向けの工夫、章末のまとめと次のアクション", 1300),
        ("第5章: まとめとアクションプラン", "全体の振り返り、今日・3日後・1週間後にやることのアクションプラン", 1000),
    ],
    "template": [
        ("はじめに", "このテンプレート集の使い方と対象読者", 700),
        ("テンプレート本体", "すぐ使えるテンプレートを5〜8種類。各テンプレートはそのまま書き写せる形にする", 2500),
        ("活用事例", "各テンプレートの具体的な使い方の例", 1500),
        ("カスタマイズ方法", "自分用に書き換えるコツ", 800),
    ],
    "checklist": [
        ("はじめに", "このチェックリストの目的と使い方", 700),
        ("基本チェックリスト", "初心者向け20項目。各項目は「- [ ] 」で始める", 1500),
        ("応用チェックリスト", "中級者向け15項目。各項目は「- [ ] 」で始める", 1300),
        ("よくあるミスと対策", "ミスと対策を5つ以上", 1000),
        ("達成シート", "進捗を記録できる表（Markdownの表）", 500),
    ],
}


def _section_prompt(title: str, plan: list, index: int) -> str:
    heading, what, chars = plan[index]
    toc = "\n".join(f"- {h}" for h, _, _ in plan)
    return f"""
「{title}」という本の一部を書いています。

本全体の目次:
{toc}

今回書くのは「{heading}」だけです。
書く内容: {what}
分量: {chars}文字程度

最初の行は「## {heading}」にしてください。
小見出しは「### 」を使ってください。他の章の内容は書かないでください。
"""


def generate_ebook(title: str, ebook_type: str = "ebook", pages: int = 20) -> str:
    """章ごとに生成して1冊分のMarkdownを返す（pages は互換性のため残している）"""
    plan = SECTION_PLANS.get(ebook_type, SECTION_PLANS["ebook"])
    sections = [f"# {title}"]
    for i, (heading, _, _) in enumerate(plan):
        console.print(f"[blue]  生成中 ({i + 1}/{len(plan)}): {heading}[/blue]")
        text = call_text(_section_prompt(title, plan, i), system=EBOOK_SYSTEM_PROMPT)
        if not text.lstrip().startswith("## "):
            text = f"## {heading}\n\n{text}"
        sections.append(text)
    return "\n\n".join(sections) + "\n"


def generate_sales_copy(title: str, content: str) -> dict:
    prompt = f"""
以下のeBookの販売ページ用テキストを作成してください。

タイトル: {title}
内容プレビュー: {content[:1500]}

以下のJSON形式で返してください:
{{
  "tagline": "キャッチコピー（20字以内）",
  "description": "商品説明（300字以内、買いたくなる文章。効果の断定や誇大表現はしない）",
  "benefits": ["メリット1", "メリット2", "メリット3"],
  "target_audience": "対象読者（50字以内）",
  "keywords": ["Amazonで検索されそうな語句を7つ"],
  "price_justification": "なぜこの価格が適正か（50字以内）"
}}
JSON以外は出力しないでください。
"""
    raw = call_text(prompt, model=RESEARCH_MODEL, max_tokens=4000, effort="low")
    copy = extract_json(raw)
    copy.setdefault("keywords", [])
    return copy


def _safe_name(title: str) -> str:
    return "".join(c for c in title if c.isalnum() or c in " _-")[:40].strip() or "untitled"


def save_draft(title: str, content: str, sales_copy: dict, ebook_type: str, genre: str | None = None) -> Path:
    timestamp = datetime.now().strftime("%Y%m%d_%H%M")
    draft_dir = Path(f"./output/drafts/{timestamp}_{_safe_name(title)}")
    draft_dir.mkdir(parents=True, exist_ok=True)

    (draft_dir / "content.md").write_text(content, encoding="utf-8")
    (draft_dir / "sales_copy.json").write_text(
        json.dumps(sales_copy, ensure_ascii=False, indent=2), encoding="utf-8"
    )

    meta = {
        "title": title,
        "type": ebook_type,
        "genre": genre,
        "model": CONTENT_MODEL,
        "created_at": datetime.now().isoformat(),
        "status": "draft",
        "char_count": len(content),
        "ai_generated": True,
    }
    (draft_dir / "meta.json").write_text(
        json.dumps(meta, ensure_ascii=False, indent=2), encoding="utf-8"
    )

    return draft_dir


if __name__ == "__main__":
    if len(sys.argv) < 2:
        console.print("[red]使い方: python -m scripts.generate_content 'タイトル' [ebook|template|checklist][/red]")
        sys.exit(1)

    title = sys.argv[1]
    ebook_type = sys.argv[2] if len(sys.argv) > 2 else "ebook"

    content = generate_ebook(title, ebook_type)

    console.print("\n[bold yellow]販売ページ用テキストを生成中...[/bold yellow]")
    sales_copy = generate_sales_copy(title, content)

    draft_dir = save_draft(title, content, sales_copy, ebook_type)

    console.print(f"\n[bold green]✅ 下書きを保存しました: {draft_dir}[/bold green]")
    console.print(f"  キャッチコピー: {sales_copy.get('tagline', '')}")
    console.print(f"\n次のステップ: python -m scripts.create_pdf '{draft_dir}'")
