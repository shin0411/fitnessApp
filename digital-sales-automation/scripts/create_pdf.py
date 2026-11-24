"""
MarkdownをPDFに変換するスクリプト
reportlabを使用して日本語対応のPDFを生成する
"""
import json
import os
import sys
from datetime import datetime
from pathlib import Path

from rich.console import Console

from scripts.markdown_blocks import inline, parse

console = Console()

# reportlab の TTFont は TrueType アウトラインのみ対応（Noto CJK の .otf/.ttc は不可）
FONT_PATHS = [
    "/usr/share/fonts/opentype/ipaexfont-gothic/ipaexg.ttf",
    "/usr/share/fonts/opentype/ipafont-gothic/ipag.ttf",
    "/usr/share/fonts/truetype/fonts-japanese-gothic.ttf",
    "/System/Library/Fonts/ヒラギノ角ゴシック W3.ttc",
    "/Library/Fonts/Arial Unicode.ttf",
]


def _register_font() -> str:
    from reportlab.pdfbase import pdfmetrics
    from reportlab.pdfbase.cidfonts import UnicodeCIDFont
    from reportlab.pdfbase.ttfonts import TTFont

    for fp in FONT_PATHS:
        if os.path.exists(fp):
            try:
                pdfmetrics.registerFont(TTFont("JapaneseFont", fp))
                return "JapaneseFont"
            except Exception:
                continue
    # フォントファイルが無い環境: 埋め込みなしの日本語CIDフォントで文字化けを防ぐ
    pdfmetrics.registerFont(UnicodeCIDFont("HeiseiKakuGo-W5"))
    console.print("[yellow]日本語フォントが見つからないため HeiseiKakuGo-W5（非埋め込み）を使います[/yellow]")
    return "HeiseiKakuGo-W5"


def create_pdf(draft_dir: str) -> Path:
    from reportlab.lib import colors
    from reportlab.lib.pagesizes import A4
    from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
    from reportlab.lib.units import mm
    from reportlab.platypus import HRFlowable, PageBreak, Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

    draft_path = Path(draft_dir)
    meta = json.loads((draft_path / "meta.json").read_text(encoding="utf-8"))
    content = (draft_path / "content.md").read_text(encoding="utf-8")
    sales_copy = json.loads((draft_path / "sales_copy.json").read_text(encoding="utf-8"))

    title = meta["title"]
    output_path = draft_path / "book.pdf"
    font_name = _register_font()

    doc = SimpleDocTemplate(
        str(output_path), pagesize=A4,
        rightMargin=20 * mm, leftMargin=20 * mm, topMargin=25 * mm, bottomMargin=25 * mm,
        title=title,
    )

    styles = getSampleStyleSheet()
    base = dict(fontName=font_name, wordWrap="CJK")
    style_title = ParagraphStyle("T", parent=styles["Title"], fontSize=24, leading=32, spaceAfter=6 * mm,
                                 textColor=colors.HexColor("#1a1a2e"), **base)
    style_h1 = ParagraphStyle("H1", parent=styles["Heading1"], fontSize=16, leading=22, spaceBefore=8 * mm,
                              spaceAfter=3 * mm, textColor=colors.HexColor("#16213e"), **base)
    style_h2 = ParagraphStyle("H2", parent=styles["Heading2"], fontSize=13, leading=18, spaceBefore=5 * mm,
                              spaceAfter=2 * mm, textColor=colors.HexColor("#0f3460"), **base)
    style_body = ParagraphStyle("B", parent=styles["Normal"], fontSize=10, leading=16, spaceAfter=3 * mm, **base)
    style_bullet = ParagraphStyle("L", parent=style_body, leftIndent=10 * mm, bulletIndent=5 * mm)

    story = [Spacer(1, 30 * mm), Paragraph(inline(title), style_title),
             HRFlowable(width="100%", thickness=2, color=colors.HexColor("#e94560")), Spacer(1, 5 * mm),
             Paragraph(inline(sales_copy.get("tagline", "")), style_h2), Spacer(1, 10 * mm),
             Paragraph(inline(f"対象読者: {sales_copy.get('target_audience', '')}"), style_body), Spacer(1, 5 * mm)]
    for benefit in sales_copy.get("benefits", []):
        story.append(Paragraph(inline(f"✓ {benefit}"), style_bullet))
    story += [Spacer(1, 10 * mm),
              Paragraph(f"発行日: {datetime.now().strftime('%Y年%m月%d日')}", style_body), PageBreak()]

    first_h1 = True
    for kind, value in parse(content):
        if kind == "blank":
            story.append(Spacer(1, 2 * mm))
        elif kind == "h1":
            if first_h1:  # 表紙と同じタイトルは繰り返さない
                first_h1 = False
                continue
            story.append(Paragraph(inline(value), style_title))
        elif kind == "h2":
            story.append(Paragraph(inline(value), style_h1))
        elif kind == "h3":
            story.append(Paragraph(inline(value), style_h2))
        elif kind == "bullet":
            story.append(Paragraph(f"• {inline(value)}", style_bullet))
        elif kind == "check":
            story.append(Paragraph(f"□ {inline(value)}", style_bullet))
        elif kind == "table":
            data = [[Paragraph(inline(c), style_body) for c in row] for row in value]
            t = Table(data, hAlign="LEFT")
            t.setStyle(TableStyle([("GRID", (0, 0), (-1, -1), 0.5, colors.grey),
                                   ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#eeeeee"))]))
            story.append(t)
        else:
            story.append(Paragraph(inline(value), style_body))

    doc.build(story)
    return output_path


if __name__ == "__main__":
    if len(sys.argv) < 2:
        console.print("[red]使い方: python -m scripts.create_pdf <draft_dir>[/red]")
        sys.exit(1)
    pdf_path = create_pdf(sys.argv[1])
    console.print(f"[bold green]✅ PDF生成完了: {pdf_path}[/bold green]")
