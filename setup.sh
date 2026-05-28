#!/usr/bin/env bash
# ============================================================================
# FitnessRPG セットアップヘルパー
# ============================================================================
# 使い方:
#   1. git clone でこのリポジトリを取得
#   2. cd fitnessapp
#   3. ./setup.sh
# ============================================================================

set -e

GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${BLUE}=====================================================${NC}"
echo -e "${BLUE}  FitnessRPG セットアップヘルパー${NC}"
echo -e "${BLUE}=====================================================${NC}"
echo ""

# --- Step 1: Node.js check ---
echo -e "${YELLOW}[1/4] Node.js を確認しています...${NC}"
if ! command -v node &> /dev/null; then
  echo -e "${RED}✗ Node.js がインストールされていません${NC}"
  echo "  → https://nodejs.org/ から LTS 版をインストールしてください"
  exit 1
fi
NODE_VERSION=$(node --version)
echo -e "${GREEN}✓ Node.js ${NODE_VERSION}${NC}"
echo ""

# --- Step 2: npm install ---
echo -e "${YELLOW}[2/4] 依存パッケージをインストールしています (1-3分)...${NC}"
npm install --no-audit --no-fund
echo -e "${GREEN}✓ パッケージインストール完了${NC}"
echo ""

# --- Step 3: .env setup ---
echo -e "${YELLOW}[3/4] 環境変数 (.env) を設定します${NC}"
if [ -f .env ]; then
  echo -e "${BLUE}  .env が既に存在します。スキップします。${NC}"
else
  echo ""
  echo "  Supabase Dashboard → 該当プロジェクト → Settings → API"
  echo "  から以下の2つをコピーしてください:"
  echo ""
  read -p "  Project URL (https://xxxxx.supabase.co): " SUPABASE_URL
  read -p "  anon public key (eyJhbGc... で始まる長い文字列): " SUPABASE_ANON_KEY
  echo ""
  read -p "  Claude API Key (任意・空でEnter): " CLAUDE_API_KEY

  cat > .env <<EOF
EXPO_PUBLIC_SUPABASE_URL=${SUPABASE_URL}
EXPO_PUBLIC_SUPABASE_ANON_KEY=${SUPABASE_ANON_KEY}
EXPO_PUBLIC_CLAUDE_API_KEY=${CLAUDE_API_KEY}
EOF
  echo -e "${GREEN}✓ .env を作成しました${NC}"
fi
echo ""

# --- Step 4: Database setup instructions ---
echo -e "${YELLOW}[4/4] データベースをセットアップしてください${NC}"
echo ""
echo "  以下の手順を実行してください:"
echo ""
echo "  1. Supabase Dashboard を開く"
echo "     https://supabase.com/dashboard"
echo ""
echo "  2. 該当プロジェクト → 左メニュー [SQL Editor]"
echo ""
echo "  3. [+ New query] をクリック"
echo ""
echo "  4. 以下のファイルの中身を全てコピーして貼り付け:"
echo -e "     ${BLUE}supabase/SETUP.sql${NC}"
echo ""
echo "  5. [Run] (右下) をクリック → 'Success' が出ればOK"
echo ""
echo -e "${YELLOW}  ↑ 完了したら Enter を押してください...${NC}"
read

echo ""
echo -e "${GREEN}=====================================================${NC}"
echo -e "${GREEN}  ✓ セットアップ完了！${NC}"
echo -e "${GREEN}=====================================================${NC}"
echo ""
echo "  以下のコマンドで開発サーバーを起動:"
echo ""
echo -e "    ${BLUE}npx expo start${NC}"
echo ""
echo "  起動後、QRコードが出ます。スマホの Expo Go アプリ で読み取ってください。"
echo "  (iPhone は標準カメラアプリでもOK)"
echo ""
