#!/bin/bash
# 日本語エンコードエラーを防ぐためPython起動前に設定
export PYTHONUTF8=1
export LANG=en_US.UTF-8
export LC_ALL=en_US.UTF-8
export PYTHONIOENCODING=utf-8

# .envファイルの存在確認
if [ ! -f ".env" ]; then
    echo "ERROR: .env ファイルが見つかりません"
    echo "実行してください: cp .env.example .env && open -e .env"
    exit 1
fi

# APIキーの設定確認（値は表示しない）
if ! grep -q "ANTHROPIC_API_KEY=sk-ant-" .env; then
    echo ""
    echo "=========================================="
    echo "ERROR: .env に ANTHROPIC_API_KEY が未設定です"
    echo "=========================================="
    echo ""
    echo "手順:"
    echo "  1. open -e .env  を実行"
    echo "  2. 以下の形式でキーを入力して保存:"
    echo "     ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxx"
    echo ""
    echo "APIキー取得: https://console.anthropic.com/settings/keys"
    exit 1
fi

echo "✅ APIキー確認OK"
python run_weekly.py "$@"
