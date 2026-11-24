# デジタル商品 自動生成パイプライン

毎週1冊、eBookを自動で生成し、Kindle（KDP）・note・Gumroadに出品できる形で出力する。
出品は各サービスにAPIが無いため、原稿を人が確認してから手動で行う。

## 自動実行（GitHub Actions）
1. リポジトリの Settings > Secrets and variables > Actions に `ANTHROPIC_API_KEY` を登録
2. 毎週土曜 09:00（日本時間）に `.github/workflows/ebook-weekly.yml` が動く。Actions タブの「Run workflow」で手動実行もできる
3. 実行結果の Artifacts から `ebook-<番号>` をダウンロード
4. `listing.md` の手順に沿って出品する

## 出力ファイル
| ファイル | 使い道 |
| --- | --- |
| `book.epub` | Kindle（KDP）にアップロード |
| `note_article.md` | noteに貼り付け（有料エリアの位置に印あり） |
| `book.pdf` | Gumroad用 |
| `listing.md` | タイトル・説明文・キーワード・出品手順 |
| `content.md` | 原稿（Markdown） |

## 手元で実行
```bash
./setup.sh              # 初回のみ
./run.sh saturday       # 対話式
./run.sh saturday --auto --genre health --price 500
./run.sh sunday         # 売上レポート（Gumroadのみ）
```

## 費用の目安
1冊あたりAPI費用は約¥30（本文: claude-sonnet-5-5、調査と販売文: claude-haiku-5-5）。
`CONTENT_MODEL=claude-opus-5-5` にすると品質が上がり約¥60。
クレジット不足のときは「APIクレジット不足で停止」と表示して終了コード2で止まる。
