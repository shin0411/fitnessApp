"""
週次売上レポート生成スクリプト
Gumroad APIから売上データを取得してレポートを表示する
"""
import os
import requests
from datetime import datetime, timedelta
from dotenv import load_dotenv
from rich.console import Console
from rich.table import Table
from rich.panel import Panel

load_dotenv()
console = Console()

GUMROAD_API_BASE = "https://api.gumroad.com/v2"


def get_headers() -> dict:
    token = os.getenv("GUMROAD_ACCESS_TOKEN")
    if not token:
        raise ValueError("GUMROAD_ACCESS_TOKEN が .env に設定されていません")
    return {"Authorization": f"Bearer {token}"}


def get_products() -> list[dict]:
    resp = requests.get(f"{GUMROAD_API_BASE}/products", headers=get_headers(), timeout=30)
    resp.raise_for_status()
    return resp.json().get("products", [])


def get_sales(after_date: str | None = None) -> list[dict]:
    params = {}
    if after_date:
        params["after"] = after_date

    all_sales = []
    page = 1
    while True:
        params["page"] = page
        resp = requests.get(
            f"{GUMROAD_API_BASE}/sales",
            headers=get_headers(),
            params=params,
            timeout=30,
        )
        resp.raise_for_status()
        data = resp.json()
        sales = data.get("sales", [])
        if not sales:
            break
        all_sales.extend(sales)
        if not data.get("next_page_url"):
            break
        page += 1

    return all_sales


def generate_report() -> None:
    today = datetime.now()
    week_ago = (today - timedelta(days=7)).strftime("%Y-%m-%d")
    month_ago = (today - timedelta(days=30)).strftime("%Y-%m-%d")

    console.print(Panel(
        f"[bold]ポイ活デジタル販売 週次レポート[/bold]\n{today.strftime('%Y年%m月%d日')}",
        style="bold blue"
    ))

    with console.status("[bold green]Gumroadからデータ取得中..."):
        products = get_products()
        weekly_sales = get_sales(week_ago)
        monthly_sales = get_sales(month_ago)

    # 商品一覧
    product_table = Table(title="商品一覧", show_lines=True)
    product_table.add_column("商品名", min_width=30)
    product_table.add_column("価格", width=10)
    product_table.add_column("累計売上", width=12)
    product_table.add_column("ステータス", width=10)

    for p in products:
        product_table.add_row(
            p.get("name", "-")[:30],
            f"${p.get('price', 0) / 100:.2f}",
            f"{p.get('sales_count', 0)}件",
            "[green]公開中[/green]" if p.get("published") else "[yellow]非公開[/yellow]",
        )

    console.print(product_table)

    # 週次集計
    weekly_revenue = sum(float(s.get("price", 0)) for s in weekly_sales)
    monthly_revenue = sum(float(s.get("price", 0)) for s in monthly_sales)

    summary_table = Table(title="収益サマリー", show_lines=True)
    summary_table.add_column("期間", width=15)
    summary_table.add_column("件数", width=10)
    summary_table.add_column("収益（USD）", width=15)
    summary_table.add_column("収益（円換算）", width=15)

    usd_to_jpy = 150  # 概算レート

    summary_table.add_row(
        "過去7日間",
        f"{len(weekly_sales)}件",
        f"${weekly_revenue:.2f}",
        f"¥{weekly_revenue * usd_to_jpy:,.0f}",
    )
    summary_table.add_row(
        "過去30日間",
        f"{len(monthly_sales)}件",
        f"${monthly_revenue:.2f}",
        f"¥{monthly_revenue * usd_to_jpy:,.0f}",
    )

    console.print(summary_table)

    # アドバイス
    if len(products) == 0:
        console.print(Panel(
            "まだ商品がありません。\n"
            "python scripts/run_weekly.py を実行して最初の商品を作成しましょう！",
            title="[yellow]次のアクション[/yellow]",
            style="yellow"
        ))
    elif monthly_revenue < 50:
        console.print(Panel(
            "収益を増やすには:\n"
            "1. 商品数を増やす（週1〜2商品を目標に）\n"
            "2. 価格を$9〜$15の範囲で試す\n"
            "3. タイトルにキーワードを入れてSEO対策",
            title="[cyan]AIアドバイス[/cyan]",
            style="cyan"
        ))
    else:
        console.print(Panel(
            f"月収${monthly_revenue:.2f}（約¥{monthly_revenue * usd_to_jpy:,.0f}）順調です！\n"
            "売れている商品の関連シリーズを作るとさらに収益アップ！",
            title="[green]好調![/green]",
            style="green"
        ))


if __name__ == "__main__":
    generate_report()
