"""
週次メインスクリプト
  python run_weekly.py saturday          対話式: トピック選択 → 生成 → PDF/EPUB/note用出力
  python run_weekly.py saturday --auto   自動: 入力なしで最後まで進める（GitHub Actions用）
  python run_weekly.py sunday            売上レポート確認 + 来週のジャンル設定
"""
import argparse
import os
import sys
from pathlib import Path

from dotenv import load_dotenv
from rich.console import Console
from rich.panel import Panel
from rich.prompt import Confirm, Prompt

load_dotenv()
console = Console()

DEFAULT_PRICE_JPY = int(os.getenv("DEFAULT_PRICE_JPY", "500"))
DEFAULT_PRICE_USD = float(os.getenv("DEFAULT_PRICE_USD", "5"))


def _choose_topic(topics: list, auto: bool) -> dict | None:
    if auto:
        return topics[0]
    console.print("\n[bold cyan]Step 2/4: 作成するトピックを選んでください[/bold cyan]")
    while True:
        choice = Prompt.ask(f"番号を入力 (1〜{len(topics)})", default="1")
        try:
            idx = int(choice.strip())
            if 1 <= idx <= len(topics):
                break
        except ValueError:
            pass
        console.print(f"[red]1〜{len(topics)} の数字を入力してください[/red]")
    selected = topics[idx - 1]
    if not Confirm.ask(f"「{selected['title']}」で進めますか？"):
        return None
    return selected


def saturday_workflow(genre: str | None = None, auto: bool = False, price_jpy: int = DEFAULT_PRICE_JPY) -> int:
    """新商品を1つ作って出品準備まで。戻り値は終了コード"""
    from scripts.create_pdf import create_pdf
    from scripts.export_formats import export_all
    from scripts.generate_content import generate_ebook, generate_sales_copy, save_draft
    from scripts.llm import CreditError, GenerationError
    from scripts.research_topics import add_to_history, check_api_key, display_topics, research

    console.print(Panel(f"[bold]土曜日ワークフロー{'（自動）' if auto else ''}[/bold]\n新しいeBookを作成します",
                        style="bold green"))
    if not check_api_key():
        return 1

    try:
        console.print("\n[bold cyan]Step 1/4: トレンドトピックを調査します[/bold cyan]")
        topics = research(genre)
        if not topics:
            console.print("[red]トピックの取得に失敗しました[/red]")
            return 1
        display_topics(topics)

        selected = _choose_topic(topics, auto)
        if selected is None:
            console.print("中断しました。")
            return 0
        console.print(f"\n選択: [bold]{selected['title']}[/bold] ({selected.get('type', 'ebook')})")

        console.print("\n[bold cyan]Step 3/4: AIがコンテンツを章ごとに生成します[/bold cyan]")
        content = generate_ebook(selected["title"], selected.get("type", "ebook"))
        sales_copy = generate_sales_copy(selected["title"], content)
    except CreditError as e:
        console.print(Panel(str(e), title="[red]APIクレジット不足で停止[/red]", style="red"))
        return 2
    except GenerationError as e:
        console.print(f"[red]生成が止まりました: {e}[/red]")
        return 1

    draft_dir = save_draft(selected["title"], content, sales_copy, selected.get("type", "ebook"),
                           selected.get("genre"))
    add_to_history(selected["title"])

    console.print("\n[bold cyan]Step 4/4: PDF・EPUB・note用テキストを作成します[/bold cyan]")
    pdf_path = create_pdf(str(draft_dir))
    outputs = export_all(str(draft_dir), price_jpy, DEFAULT_PRICE_USD)
    console.print(f"[green]PDF: {pdf_path}\nEPUB: {outputs['epub']}\nnote: {outputs['note']}\n"
                  f"出品メモ: {outputs['listing']}[/green]")

    # GitHub Actions で後続ステップが成果物の場所を読めるようにする
    gh_output = os.getenv("GITHUB_OUTPUT")
    if gh_output:
        with open(gh_output, "a", encoding="utf-8") as f:
            f.write(f"draft_dir={draft_dir}\n")

    if not auto and Confirm.ask(f"${DEFAULT_PRICE_USD:.0f}でGumroad出品の準備もしますか？", default=False):
        from scripts.upload_gumroad import prepare_for_upload
        prepare_for_upload(str(draft_dir), DEFAULT_PRICE_USD)

    console.print(Panel(
        "[bold green]生成が完了しました[/bold green]\n"
        f"{draft_dir}/listing.md の手順で、原稿を確認してからKindle・noteに出品してください。",
        style="green",
    ))
    return 0


def sunday_workflow() -> int:
    """売上確認 + 来週のジャンル設定"""
    console.print(Panel("[bold]日曜日ワークフロー[/bold]\n売上確認と来週の準備", style="bold blue"))

    from scripts.weekly_report import generate_report
    generate_report()

    console.print("\n[bold cyan]来週作るeBookのジャンルを入力してください[/bold cyan]")
    console.print("選択肢: 副業・お金 / 健康・ダイエット / 仕事術 / 育児・暮らし / 恋愛・人間関係")
    next_genre = Prompt.ask("ジャンル（空Enterでお任せ）", default="")
    if next_genre:
        Path(".next_genre").write_text(next_genre, encoding="utf-8")
        console.print(f"[green]来週のジャンルを設定しました: {next_genre}[/green]")
    return 0


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="デジタル商品の週次ワークフロー")
    parser.add_argument("day", nargs="?", default="saturday", choices=["saturday", "sunday"])
    parser.add_argument("--auto", action="store_true", help="入力なしで最後まで進める")
    parser.add_argument("--genre", default=None, help="例: health / 健康・ダイエット")
    parser.add_argument("--price", type=int, default=DEFAULT_PRICE_JPY, help="販売価格（円）")
    args = parser.parse_args(argv)

    if args.day == "sunday":
        return sunday_workflow()

    genre = args.genre
    next_genre_file = Path(".next_genre")
    if not genre and next_genre_file.exists():
        genre = next_genre_file.read_text(encoding="utf-8").strip() or None
    return saturday_workflow(genre, auto=args.auto, price_jpy=args.price)


if __name__ == "__main__":
    sys.exit(main())
