"""
MarkdownをPDFに変換するスクリプト
reportlabを使用して日本語対応のPDFを生成する
"""
import os
import sys
import json
from pathlib import Path
from datetime import datetime
from dotenv import load_dotenv
from rich.console import Console

load_dotenv()
console = Console()


def create_pdf(draft_dir: str) -> Path:
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.units import mm
    from reportlab.lib import colors
    from reportlab.platypus import (
        SimpleDocTemplate, Paragraph, Spacer, HRFlowable, PageBreak
    )
    from reportlab.pdfbase import pdfmetrics
    from reportlab.pdfbase.ttfonts import TTFont

    draft_path = Path(draft_dir)
    meta = json.loads((draft_path / "meta.json").read_text(encoding="utf-8"))
    content = (draft_path / "content.md").read_text(encoding="utf-8")
    sales_copy = json.loads((draft_path / "sales_copy.json").read_text(encoding="utf-8"))

    title = meta["title"]
    output_path = draft_path / f"{title[:30]}.pdf"

    # フォント設定（システムフォントを自動検出）
    font_paths = [
        "/usr/share/fonts/truetype/noto/NotoSansCJK-Regular.ttc",
        "/usr/share/fonts/opentype/noto/NotoSansCJKjp-Regular.otf",
        "/System/Library/Fonts/ヒラギノ角ゴシック W3.ttc",
        "/usr/share/fonts/truetype/fonts-japanese-gothic.ttf",
    ]

    font_name = "Helvetica"  # fallback
    for fp in font_paths:
        if os.path.exists(fp):
            try:
                pdfmetrics.registerFont(TTFont("JapaneseFont", fp))
                font_name = "JapaneseFont"
                break
            except Exception:
                continue

    doc = SimpleDocTemplate(
        str(output_path),
        pagesize=A4,
        rightMargin=20*mm,
        leftMargin=20*mm,
        topMargin=25*mm,
        bottomMargin=25*mm,
    )

    styles = getSampleStyleSheet()
    style_title = ParagraphStyle(
        "CustomTitle",
        parent=styles["Title"],
        fontName=font_name,
        fontSize=24,
        spaceAfter=6*mm,
        textColor=colors.HexColor("#1a1a2e"),
    )
    style_h1 = ParagraphStyle(
        "CustomH1",
        parent=styles["Heading1"],
        fontName=font_name,
        fontSize=16,
        spaceBefore=8*mm,
        spaceAfter=3*mm,
        textColor=colors.HexColor("#16213e"),
    )
    style_h2 = ParagraphStyle(
        "CustomH2",
        parent=styles["Heading2"],
        fontName=font_name,
        fontSize=13,
        spaceBefore=5*mm,
        spaceAfter=2*mm,
        textColor=colors.HexColor("#0f3460"),
    )
    style_body = ParagraphStyle(
        "CustomBody",
        parent=styles["Normal"],
        fontName=font_name,
        fontSize=10,
        leading=16,
        spaceAfter=3*mm,
    )
    style_bullet = ParagraphStyle(
        "CustomBullet",
        parent=style_body,
        leftIndent=10*mm,
        bulletIndent=5*mm,
    )

    story = []

    # 表紙
    story.append(Spacer(1, 30*mm))
    story.append(Paragraph(title, style_title))
    story.append(HRFlowable(width="100%", thickness=2, color=colors.HexColor("#e94560")))
    story.append(Spacer(1, 5*mm))
    story.append(Paragraph(sales_copy.get("tagline", ""), style_h2))
    story.append(Spacer(1, 10*mm))
    story.append(Paragraph(f"対象読者: {sales_copy.get('target_audience', '')}", style_body))
    story.append(Spacer(1, 5*mm))
    for benefit in sales_copy.get("benefits", []):
        story.append(Paragraph(f"✓ {benefit}", style_bullet))
    story.append(Spacer(1, 10*mm))
    story.append(Paragraph(
        f"発行日: {datetime.now().strftime('%Y年%m月%d日')}",
        style_body
    ))
    story.append(PageBreak())

    # 本文をMarkdownからパース
    for line in content.split("\n"):
        line = line.strip()
        if not line:
            story.append(Spacer(1, 3*mm))
            continue
        if line.startswith("# "):
            story.append(Paragraph(line[2:], style_title))
        elif line.startswith("## "):
            story.append(Paragraph(line[3:], style_h1))
        elif line.startswith("### "):
            story.append(Paragraph(line[4:], style_h2))
        elif line.startswith("- ") or line.startswith("* "):
            story.append(Paragraph(f"• {line[2:]}", style_bullet))
        elif line.startswith("**") and line.endswith("**"):
            story.append(Paragraph(f"<b>{line[2:-2]}</b>", style_body))
        else:
            clean = line.replace("**", "").replace("*", "").replace("`", "")
            story.append(Paragraph(clean, style_body))

    doc.build(story)
    return output_path


if __name__ == "__main__":
    if len(sys.argv) < 2:
        console.print("[red]使い方: python create_pdf.py <draft_dir>[/red]")
        sys.exit(1)

    draft_dir = sys.argv[1]
    with console.status("[bold green]PDFを生成中..."):
        pdf_path = create_pdf(draft_dir)

    console.print(f"[bold green]✅ PDF生成完了: {pdf_path}[/bold green]")
    console.print(f"\n次のステップ: python scripts/upload_gumroad.py '{draft_dir}'")
