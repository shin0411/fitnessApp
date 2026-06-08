"""
GumroadへのeBook自動アップロードスクリプト
Gumroad API v2を使用
"""
import os
import sys
import json
import requests
from pathlib import Path
from dotenv import load_dotenv
from rich.console import Console

load_dotenv()
console = Console()

GUMROAD_API_BASE = "https://api.gumroad.com/v2"


def get_headers() -> dict:
    token = os.getenv("GUMROAD_ACCESS_TOKEN")
    if not token:
        raise ValueError("GUMROAD_ACCESS_TOKEN が .env に設定されていません")
    return {"Authorization": f"Bearer {token}"}


def create_product(title: str, description: str, price_cents: int) -> dict:
    """Gumroadに商品を新規作成する"""
    resp = requests.post(
        f"{GUMROAD_API_BASE}/products",
        headers=get_headers(),
        data={
            "name": title,
            "description": description,
            "price": price_cents,
            "currency": "usd",
            "published": "false",  # まず非公開で作成
        },
        timeout=30,
    )
    resp.raise_for_status()
    return resp.json()["product"]


def upload_file(product_id: str, pdf_path: Path) -> dict:
    """商品にPDFファイルをアップロードする"""
    with open(pdf_path, "rb") as f:
        resp = requests.put(
            f"{GUMROAD_API_BASE}/products/{product_id}/files",
            headers=get_headers(),
            files={"file": (pdf_path.name, f, "application/pdf")},
            timeout=120,
        )
    resp.raise_for_status()
    return resp.json()


def publish_product(product_id: str) -> dict:
    """商品を公開する"""
    resp = requests.put(
        f"{GUMROAD_API_BASE}/products/{product_id}",
        headers=get_headers(),
        data={"published": "true"},
        timeout=30,
    )
    resp.raise_for_status()
    return resp.json()["product"]


def upload(draft_dir: str, price_usd: float | None = None, auto_publish: bool = False) -> str:
    draft_path = Path(draft_dir)
    meta = json.loads((draft_path / "meta.json").read_text(encoding="utf-8"))
    sales_copy = json.loads((draft_path / "sales_copy.json").read_text(encoding="utf-8"))

    title = meta["title"]
    default_price = float(os.getenv("DEFAULT_PRICE_USD", "9"))
    price_cents = int((price_usd or default_price) * 100)

    # 説明文を組み立てる
    benefits_text = "\n".join(f"✓ {b}" for b in sales_copy.get("benefits", []))
    description = f"""{sales_copy.get('tagline', '')}

{sales_copy.get('description', '')}

【この本で得られること】
{benefits_text}

【対象読者】
{sales_copy.get('target_audience', '')}
"""

    console.print(f"[blue]Gumroadに商品を作成中: {title}[/blue]")
    product = create_product(title, description, price_cents)
    product_id = product["id"]
    console.print(f"[green]商品ID: {product_id}[/green]")

    # PDFを探す
    pdf_files = list(draft_path.glob("*.pdf"))
    if not pdf_files:
        raise FileNotFoundError(f"PDFが見つかりません: {draft_path}/*.pdf")

    pdf_path = pdf_files[0]
    console.print(f"[blue]PDFをアップロード中: {pdf_path.name}[/blue]")
    upload_file(product_id, pdf_path)
    console.print("[green]ファイルアップロード完了[/green]")

    product_url = f"https://app.gumroad.com/products/{product_id}/edit"

    if auto_publish:
        product = publish_product(product_id)
        product_url = product.get("short_url", product_url)
        console.print(f"[bold green]✅ 公開完了！[/bold green]")
    else:
        console.print(f"[bold yellow]✅ 下書き保存完了。以下のURLで確認・公開してください:[/bold yellow]")

    console.print(f"[link]{product_url}[/link]")

    # metaに記録
    meta["gumroad_product_id"] = product_id
    meta["gumroad_url"] = product_url
    meta["status"] = "published" if auto_publish else "pending_review"
    (draft_path / "meta.json").write_text(
        json.dumps(meta, ensure_ascii=False, indent=2), encoding="utf-8"
    )

    return product_url


if __name__ == "__main__":
    if len(sys.argv) < 2:
        console.print("[red]使い方: python upload_gumroad.py <draft_dir> [価格USD] [--publish][/red]")
        sys.exit(1)

    draft_dir = sys.argv[1]
    price_usd = float(sys.argv[2]) if len(sys.argv) > 2 and sys.argv[2] != "--publish" else None
    auto_publish = "--publish" in sys.argv

    url = upload(draft_dir, price_usd, auto_publish)
    console.print(f"\n商品URL: {url}")
