"""
週次メインスクリプト
土曜日に実行: トピック選択 → コンテンツ生成 → PDF作成 → Gumroadアップロード
日曜日に実行: 売上レポート確認
"""
import io
import os
import sys

os.environ["PYTHONUTF8"] = "1"
os.environ["PYTHONIOENCODING"] = "utf-8"
try:
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding="utf-8", errors="replace")
except AttributeError:
    pass

import json
from pathlib import Path
from datetime import datetime
from rich.console import Console
from rich.prompt import Prompt, Confirm
from rich.panel import Panel

console = Console()  # stdout は既にUTF-8 TextIOWrapperに差し替え済み


def saturday_workflow(genre: str | None = None) -> None:
    """土曜日のワークフロー: 新商品を1つ作って公開準備まで"""
    console.print(Panel(
        "[bold]土曜日ワークフロー[/bold]\n新しいeBookを作成します（目安: 30〜60分）",
        style="bold green"
    ))

    # Step 1: トピック調査
    console.print("\n[bold cyan]Step 1/4: トレンドトピックを調査します[/bold cyan]")
    from scripts.research_topics import check_api_key, research, display_topics
    if not check_api_key():
        console.print("[red]APIキーを .env に設定してから再実行してください[/red]")
        return
    topics = research(genre)

    if not topics:
        console.print("[red]トピックの取得に失敗しました。APIキーを確認して再実行してください。[/red]")
        return

    display_topics(topics)

    # Step 2: トピック選択
    console.print("\n[bold cyan]Step 2/4: 作成するトピックを選んでください[/bold cyan]")
    while True:
        choice = Prompt.ask(f"番号を入力 (1〜{len(topics)})", default="1")
        try:
            idx = int(choice.strip())
            if 1 <= idx <= len(topics):
                break
            console.print(f"[red]1〜{len(topics)} の数字を入力してください[/red]")
        except ValueError:
            console.print(f"[red]数字を入力してください（例: 1）[/red]")
    selected = topics[idx - 1]
    console.print(f"\n選択: [bold]{selected['title']}[/bold] ({selected['type']})")

    if not Confirm.ask("このトピックで進めますか？"):
        console.print("中断しました。再度実行してください。")
        return

    # Step 3: コンテンツ生成
    console.print("\n[bold cyan]Step 3/4: AIがコンテンツを生成します（5〜10分）[/bold cyan]")
    from scripts.generate_content import generate_ebook, generate_sales_copy, save_draft
    content = generate_ebook(selected["title"], selected["type"], selected.get("estimated_pages", 20))
    sales_copy = generate_sales_copy(selected["title"], content)
    draft_dir = save_draft(selected["title"], content, sales_copy, selected["type"])

    # Step 4: PDF生成
    console.print("\n[bold cyan]Step 4/4: PDFを生成します[/bold cyan]")
    try:
        from scripts.create_pdf import create_pdf
        pdf_path = create_pdf(str(draft_dir))
        console.print(f"[green]PDF: {pdf_path}[/green]")
    except ImportError:
        console.print("[yellow]reportlabが未インストール。先にpip install reportlabを実行してください[/yellow]")
        console.print(f"[yellow]Markdown版: {draft_dir}/content.md[/yellow]")

    # Gumroad出品準備
    price = Prompt.ask("\n販売価格（USD）", default="9")
    if Confirm.ask(f"${price}でGumroad出品の準備をしますか？"):
        from scripts.upload_gumroad import prepare_for_upload
        prepare_for_upload(str(draft_dir), float(price))

    console.print(Panel(
        "[bold green]土曜日の作業が完了しました！[/bold green]\n"
        "日曜日には: python run_weekly.py sunday",
        style="green"
    ))


def sunday_workflow() -> None:
    """日曜日のワークフロー: 売上確認 + 来週のジャンル設定"""
    console.print(Panel(
        "[bold]日曜日ワークフロー[/bold]\n売上確認と来週の準備（目安: 15〜30分）",
        style="bold blue"
    ))

    from scripts.weekly_report import generate_report
    generate_report()

    console.print("\n[bold cyan]来週作るeBookのジャンルを入力してください[/bold cyan]")
    console.print("選択肢: 副業・お金 / 健康・ダイエット / 仕事術 / 育児・暮らし / 恋愛・人間関係")
    next_genre = Prompt.ask("ジャンル（空Enterでお任せ）", default="")

    if next_genre:
        config_path = Path(".next_genre")
        config_path.write_text(next_genre, encoding="utf-8")
        console.print(f"[green]来週のジャンルを設定しました: {next_genre}[/green]")

    console.print(Panel(
        "[bold green]日曜日の作業が完了しました！[/bold green]\n"
        "来週の土曜日も: python run_weekly.py saturday",
        style="green"
    ))


if __name__ == "__main__":
    day = sys.argv[1] if len(sys.argv) > 1 else "saturday"

    # 来週のジャンル設定を読み込む
    next_genre_file = Path(".next_genre")
    genre = None
    if next_genre_file.exists():
        genre = next_genre_file.read_text(encoding="utf-8").strip() or None

    if day == "saturday":
        saturday_workflow(genre)
    elif day == "sunday":
        sunday_workflow()
    else:
        console.print("[red]使い方: python run_weekly.py [saturday|sunday][/red]")
        sys.exit(1)
