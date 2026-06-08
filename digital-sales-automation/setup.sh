#!/bin/bash
# 初回セットアップスクリプト

echo "=== デジタル商品販売自動化システム セットアップ ==="
echo ""

# Python確認
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3が見つかりません。インストールしてください。"
    exit 1
fi
echo "✅ Python3: $(python3 --version)"

# pip確認
if ! command -v pip3 &> /dev/null; then
    echo "❌ pip3が見つかりません。"
    exit 1
fi

# 依存パッケージインストール
echo ""
echo "パッケージをインストール中..."
pip3 install -r requirements.txt -q
echo "✅ パッケージインストール完了"

# .envファイルセットアップ
echo ""
if [ ! -f ".env" ]; then
    cp .env.example .env
    echo "✅ .envファイルを作成しました"
    echo ""
    echo "⚠️  以下の設定が必要です:"
    echo "   1. https://console.anthropic.com/ でAPIキーを取得"
    echo "   2. https://app.gumroad.com/settings/advanced でアクセストークンを取得"
    echo "   3. .envファイルを編集してキーを設定してください"
else
    echo "✅ .envファイルは既に存在します"
fi

# outputディレクトリ作成
mkdir -p output/{drafts,approved,published} reports
echo "✅ ディレクトリ作成完了"

echo ""
echo "=== セットアップ完了 ==="
echo ""
echo "次のステップ:"
echo "  1. .env ファイルにAPIキーを設定する"
echo "  2. python run_weekly.py saturday  ← 土曜日に実行"
echo "  3. python run_weekly.py sunday    ← 日曜日に実行"
echo ""
