"""
Gumroad出品準備スクリプト
PDFと販売ページ用テキストを整理し、ブラウザを開いて手動アップロードをガイドする
"""
import json
import subprocess
import sys
import platform
from pathlib import Path
from dotenv import load_dotenv
from rich.console import Console
from rich.panel import Panel
from rich.table import Table

load_dotenv()
console = Console()

GUMROAD_NEW_PRODUCT_URL = "https://app.gumroad.com/products/new"


def open_browser(url: str) -> None:
    system = platform.system()
    try:
        if system == "Darwin":
            subprocess.run(["open", url], check=True)
        elif system == "Linux":
            subprocess.run(["xdg-open", url], check=True)
        elif system == "Windows":
            subprocess.run(["start", url], shell=True, check=True)
    except Exception:
        pass


def copy_to_clipboard(text: str) -> bool:
    system = platform.system()
    try:
        if system == "Darwin":
            subprocess.run(["pbcopy"], input=text.encode(), check=True)
            return True
        elif system == "Linux":
            subprocess.run(["xclip", "-selection", "clipboard"], input=text.encode(), check=True)
            return True
    except Exception:
        pass
    return False


def prepare_for_upload(draft_dir: str, price_usd: float = 9.0) -> None:
    draft_path = Path(draft_dir)
    meta = json.loads((draft_path / "meta.json").read_text(encoding="utf-8"))
    sales_copy = json.loads((draft_path / "sales_copy.json").read_text(encoding="utf-8"))

    title = meta["title"]
    benefits_text = "\n".join(f"✓ {b}" for b in sales_copy.get("benefits", []))
    description = f"""{sales_copy.get('tagline', '')}

{sales_copy.get('description', '')}

【この本で得られること】
{benefits_text}

【対象読者】
{sales_copy.get('target_audience', '')}
"""

    pdf_files = list(draft_path.glob("*.pdf"))
    pdf_path = pdf_files[0] if pdf_files else None

    # 入力内容を表示
    table = Table(title="Gumroadに入力する内容", show_lines=True)
    table.add_column("項目", width=18)
    table.add_column("内容", min_width=40)

    table.add_row("商品名", title)
    table.add_row("価格", f"${price_usd:.2f} USD（約¥{int(price_usd * 150):,}）")
    table.add_row("キャッチコピー", sales_copy.get("tagline", "-"))
    table.add_row("PDFファイル", str(pdf_path) if pdf_path else "❌ PDFなし（先にcreate_pdf.pyを実行）")

    console.print(table)

    # 説明文をクリップボードにコピー
    copied = copy_to_clipboard(description)
    if copied:
        console.print("\n[green]✅ 説明文をクリップボードにコピーしました（Cmd+Vで貼り付け可能）[/green]")
    else:
        console.print("\n[yellow]説明文:[/yellow]")
        console.print(description)

    # 手順を表示
    console.print(Panel(
        "[bold]Gumroadへのアップロード手順（約3分）[/bold]\n\n"
        "1. ブラウザが開きます → [bold]+ New product[/bold] をクリック\n"
        "2. [bold]商品名[/bold] を入力\n"
        "3. [bold]Price[/bold] に価格を入力\n"
        "4. [bold]Upload a file[/bold] でPDFを選択\n"
        f"   📁 {pdf_path or '（PDFを先に生成してください）'}\n"
        "5. [bold]Description[/bold] 欄に Cmd+V で説明文を貼り付け\n"
        "6. [bold]Publish[/bold] をクリックして完了\n",
        style="cyan"
    ))

    # ブラウザを開く
    console.print("[blue]Gumroadを開いています...[/blue]")
    open_browser(GUMROAD_NEW_PRODUCT_URL)

    # metaを更新
    meta["status"] = "ready_to_upload"
    (draft_path / "meta.json").write_text(
        json.dumps(meta, ensure_ascii=False, indent=2), encoding="utf-8"
    )


if __name__ == "__main__":
    if len(sys.argv) < 2:
        console.print("[red]使い方: python upload_gumroad.py <draft_dir> [価格USD][/red]")
        sys.exit(1)

    draft_dir = sys.argv[1]
    price_usd = float(sys.argv[2]) if len(sys.argv) > 2 else 9.0
    prepare_for_upload(draft_dir, price_usd)
