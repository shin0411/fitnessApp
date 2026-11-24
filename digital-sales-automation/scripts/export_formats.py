"""
販売先ごとの出力を作る
- book.epub        : Kindle（KDP）にそのままアップロードできるEPUB3
- note_article.md  : noteに貼り付ける本文（無料部分と有料部分の境目に印を入れる）
- listing.md       : KDP・note・Gumroadの入力欄に貼る文言と出品手順
"""
import json
import sys
import uuid
import zipfile
from datetime import datetime, timezone
from pathlib import Path

from scripts.markdown_blocks import inline, parse

NOTE_PAID_MARKER = "――――― ここから有料（noteの「有料エリア指定」をこの位置に置く） ―――――"


def _load(draft_path: Path):
    meta = json.loads((draft_path / "meta.json").read_text(encoding="utf-8"))
    content = (draft_path / "content.md").read_text(encoding="utf-8")
    sales_copy = json.loads((draft_path / "sales_copy.json").read_text(encoding="utf-8"))
    return meta, content, sales_copy


def _split_sections(content: str) -> list[str]:
    """「## 」見出しごとに分ける（先頭の「# タイトル」は捨てる）"""
    sections, current = [], []
    for line in content.split("\n"):
        if line.startswith("## ") and current:
            sections.append("\n".join(current))
            current = []
        if line.startswith("# ") and not sections and not current:
            continue
        current.append(line)
    if current:
        sections.append("\n".join(current))
    return [s.strip() for s in sections if s.strip()]


def _xhtml(title: str, body: str) -> str:
    return (
        '<?xml version="1.0" encoding="utf-8"?>\n<!DOCTYPE html>\n'
        '<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" '
        'lang="ja" xml:lang="ja">\n'
        f"<head><meta charset=\"utf-8\"/><title>{inline(title)}</title>"
        '<link rel="stylesheet" type="text/css" href="style.css"/></head>\n'
        f"<body>\n{body}\n</body>\n</html>\n"
    )


def _section_html(markdown: str) -> str:
    out, in_list = [], False
    for kind, value in parse(markdown):
        if kind in ("bullet", "check"):
            if not in_list:
                out.append("<ul>")
                in_list = True
            prefix = "□ " if kind == "check" else ""
            out.append(f"<li>{prefix}{inline(value)}</li>")
            continue
        if in_list:
            out.append("</ul>")
            in_list = False
        if kind == "h1" or kind == "h2":
            out.append(f"<h1>{inline(value)}</h1>")
        elif kind == "h3":
            out.append(f"<h2>{inline(value)}</h2>")
        elif kind == "p":
            out.append(f"<p>{inline(value)}</p>")
        elif kind == "table":
            rows = "".join(
                "<tr>" + "".join(f"<{'th' if i == 0 else 'td'}>{inline(c)}</{'th' if i == 0 else 'td'}>"
                                 for c in row) + "</tr>"
                for i, row in enumerate(value)
            )
            out.append(f"<table>{rows}</table>")
    if in_list:
        out.append("</ul>")
    return "\n".join(out)


def create_epub(draft_dir: str) -> Path:
    draft_path = Path(draft_dir)
    meta, content, sales_copy = _load(draft_path)
    title = meta["title"]
    sections = _split_sections(content)
    book_id = f"urn:uuid:{uuid.uuid5(uuid.NAMESPACE_URL, title + meta['created_at'])}"
    modified = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

    chapters = []
    for i, sec in enumerate(sections, 1):
        heading = sec.split("\n", 1)[0].lstrip("# ").strip()
        chapters.append((f"ch{i:02d}.xhtml", heading, _xhtml(heading, _section_html(sec))))

    title_page = _xhtml(title, (
        f'<h1 class="book-title">{inline(title)}</h1>'
        f'<p class="tagline">{inline(sales_copy.get("tagline", ""))}</p>'
    ))
    nav_items = "".join(f'<li><a href="{f}">{inline(h)}</a></li>' for f, h, _ in chapters)
    nav = _xhtml("目次", f'<nav epub:type="toc" id="toc"><h1>目次</h1><ol>{nav_items}</ol></nav>')

    manifest = "".join(
        f'<item id="c{i}" href="{f}" media-type="application/xhtml+xml"/>' for i, (f, _, _) in enumerate(chapters)
    )
    spine = "".join(f'<itemref idref="c{i}"/>' for i in range(len(chapters)))
    opf = f"""<?xml version="1.0" encoding="utf-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="bookid" xml:lang="ja">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="bookid">{book_id}</dc:identifier>
    <dc:title>{inline(title)}</dc:title>
    <dc:language>ja</dc:language>
    <dc:description>{inline(sales_copy.get("description", ""))}</dc:description>
    <meta property="dcterms:modified">{modified}</meta>
  </metadata>
  <manifest>
    <item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>
    <item id="title" href="title.xhtml" media-type="application/xhtml+xml"/>
    <item id="css" href="style.css" media-type="text/css"/>
    {manifest}
  </manifest>
  <spine>
    <itemref idref="title"/>
    <itemref idref="nav"/>
    {spine}
  </spine>
</package>
"""
    css = (
        "body{font-family:sans-serif;line-height:1.8;}"
        "h1{font-size:1.4em;margin-top:1.5em;}h2{font-size:1.15em;margin-top:1.2em;}"
        ".book-title{font-size:1.8em;text-align:center;margin-top:30%;}.tagline{text-align:center;}"
        "table{border-collapse:collapse;}th,td{border:1px solid #999;padding:0.2em 0.5em;}"
    )
    container = """<?xml version="1.0" encoding="utf-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles>
</container>
"""

    output_path = draft_path / "book.epub"
    with zipfile.ZipFile(output_path, "w") as z:
        # mimetype は先頭・無圧縮でなければならない
        z.writestr(zipfile.ZipInfo("mimetype"), "application/epub+zip", compress_type=zipfile.ZIP_STORED)
        z.writestr("META-INF/container.xml", container, compress_type=zipfile.ZIP_DEFLATED)
        z.writestr("OEBPS/content.opf", opf, compress_type=zipfile.ZIP_DEFLATED)
        z.writestr("OEBPS/style.css", css, compress_type=zipfile.ZIP_DEFLATED)
        z.writestr("OEBPS/title.xhtml", title_page, compress_type=zipfile.ZIP_DEFLATED)
        z.writestr("OEBPS/nav.xhtml", nav, compress_type=zipfile.ZIP_DEFLATED)
        for f, _, body in chapters:
            z.writestr(f"OEBPS/{f}", body, compress_type=zipfile.ZIP_DEFLATED)
    return output_path


def create_note_article(draft_dir: str) -> Path:
    """無料部分 = はじめに＋第1章の前半。そこから先を有料にして続きを読みたくさせる"""
    draft_path = Path(draft_dir)
    meta, content, sales_copy = _load(draft_path)
    sections = _split_sections(content)

    free = sections[:1]
    paid = sections[1:]
    if paid:
        lines = paid[0].split("\n")
        cut = max(1, len(lines) // 3)
        free.append("\n".join(lines[:cut]))
        paid[0] = "\n".join(lines[cut:])

    text = "\n\n".join([
        sales_copy.get("tagline", ""),
        sales_copy.get("description", ""),
        "\n\n".join(free),
        NOTE_PAID_MARKER,
        "\n\n".join(paid),
    ])
    output_path = draft_path / "note_article.md"
    output_path.write_text(text.strip() + "\n", encoding="utf-8")
    return output_path


def create_listing(draft_dir: str, price_jpy: int, price_usd: float) -> Path:
    draft_path = Path(draft_dir)
    meta, content, sales_copy = _load(draft_path)
    keywords = sales_copy.get("keywords", [])[:7]
    benefits = "\n".join(f"- {b}" for b in sales_copy.get("benefits", []))

    text = f"""# 出品メモ: {meta['title']}

生成日時: {meta['created_at']} / モデル: {meta.get('model', '-')} / 文字数: {meta.get('char_count', '-')}

## 出品前の確認（必須）
- [ ] 本文を最後まで読み、事実と違う記述・断定的な効果表現・不自然な文章がないか確認した
- [ ] 他の本や記事に似すぎた部分がないか確認した

## Kindle（KDP） https://kdp.amazon.co.jp
1. 「電子書籍 または 有料コンテンツ」を作成
2. 本のタイトル: {meta['title']}
3. サブタイトル: {sales_copy.get('tagline', '')}
4. 内容紹介: 下の「説明文」を貼り付け
5. キーワード（7枠）: {' / '.join(keywords)}
6. 「AI生成コンテンツ」の質問には「はい（テキスト: AI生成）」と回答（KDPの規約で申告が必要）
7. 原稿: book.epub をアップロード。表紙はKDPの表紙作成ツールで作る
8. 価格: ¥{price_jpy}（¥250〜1,250 なら 70% ロイヤリティを選べる）。KDPセレクト（Kindle Unlimited）に登録

## note
1. 新規テキスト記事に note_article.md を貼り付け
2. 「{NOTE_PAID_MARKER[:12]}…」の行を消し、その位置に有料エリアを指定
3. 価格: ¥{price_jpy}

## Gumroad（任意）
- 価格: ${price_usd:.2f} / ファイル: book.pdf

## 説明文
{sales_copy.get('tagline', '')}

{sales_copy.get('description', '')}

【この本で得られること】
{benefits}

【対象読者】
{sales_copy.get('target_audience', '')}

※本書は生成AIを用いて作成し、著者が内容を確認しています。
"""
    output_path = draft_path / "listing.md"
    output_path.write_text(text, encoding="utf-8")
    return output_path


def export_all(draft_dir: str, price_jpy: int = 500, price_usd: float = 5.0) -> dict:
    return {
        "epub": create_epub(draft_dir),
        "note": create_note_article(draft_dir),
        "listing": create_listing(draft_dir, price_jpy, price_usd),
    }


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("使い方: python -m scripts.export_formats <draft_dir> [価格(円)]")
        sys.exit(1)
    price = int(sys.argv[2]) if len(sys.argv) > 2 else 500
    for k, v in export_all(sys.argv[1], price).items():
        print(f"{k}: {v}")
