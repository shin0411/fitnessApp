"""
生成されたMarkdownを、PDF・EPUBで共通に使えるブロック列に変換する
（見出し・段落・箇条書き・チェックボックス・表のみ対応）
"""
import html
import re

BOLD = re.compile(r"\*\*(.+?)\*\*")


def inline(text: str) -> str:
    """XMLとして安全な文字列にし、**太字** だけ <b> に変換する"""
    escaped = html.escape(text, quote=False)
    escaped = BOLD.sub(r"<b>\1</b>", escaped)
    return escaped.replace("*", "").replace("`", "")


def parse(markdown: str) -> list[tuple[str, object]]:
    """[(kind, value)] を返す。kind: h1 h2 h3 p bullet check table blank"""
    blocks: list[tuple[str, object]] = []
    table: list[list[str]] = []

    def flush_table():
        if table:
            blocks.append(("table", [row[:] for row in table]))
            table.clear()

    for raw in markdown.split("\n"):
        line = raw.strip()
        if line.startswith("|") and line.endswith("|"):
            cells = [c.strip() for c in line.strip("|").split("|")]
            if all(re.fullmatch(r":?-{2,}:?", c) for c in cells if c):
                continue  # 区切り行
            table.append(cells)
            continue
        flush_table()

        if not line:
            blocks.append(("blank", None))
        elif line.startswith("### "):
            blocks.append(("h3", line[4:]))
        elif line.startswith("## "):
            blocks.append(("h2", line[3:]))
        elif line.startswith("# "):
            blocks.append(("h1", line[2:]))
        elif re.match(r"^[-*] \[[ xX]\] ", line):
            blocks.append(("check", line[6:]))
        elif line.startswith("- ") or line.startswith("* "):
            blocks.append(("bullet", line[2:]))
        elif re.match(r"^\d+\. ", line):
            blocks.append(("bullet", line))
        elif line in ("---", "***"):
            blocks.append(("blank", None))
        else:
            blocks.append(("p", line))
    flush_table()
    return blocks
