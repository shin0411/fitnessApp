# FitnessRPG セットアップガイド

スマホでアプリを起動するまでの完全手順です。

---

## 📋 必要なもの

- **Mac** (Windows/Linuxでも可)
- **Node.js 18以上** ([nodejs.org](https://nodejs.org/) から LTS をインストール)
- **Git** (Macなら `xcode-select --install` で入る)
- **Supabaseアカウント** (無料・[supabase.com/dashboard](https://supabase.com/dashboard))
- **Expoアカウント** (無料・[expo.dev/signup](https://expo.dev/signup))
- **Expo Go アプリ** (スマホに App Store / Play Store からインストール)

---

## 🚀 Phase 1: Supabaseプロジェクト作成 (5分)

### 1-1. プロジェクト作成

1. [https://supabase.com/dashboard](https://supabase.com/dashboard) にログイン
2. **[New project]** をクリック
3. 以下を入力:
   - **Name**: `fitnessapp` (任意)
   - **Database Password**: 強めのパスワードを設定 → **必ずメモ**
   - **Region**: `Northeast Asia (Tokyo)`
   - **Pricing Plan**: `Free`
4. **[Create new project]** クリック
5. セットアップに 2〜3分 (待ち時間OK)

### 1-2. API情報を取得

セットアップ完了後:

1. 左メニュー **Settings ⚙ → API**
2. 以下の2つをメモ:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: `eyJhbGc...` で始まる長い文字列

### 1-3. データベースをセットアップ

1. 左メニュー **SQL Editor**
2. **[+ New query]** クリック
3. リポジトリの **`supabase/SETUP.sql`** の中身を全てコピー → 貼り付け
4. 右下 **[Run]** クリック → "Success" 表示でOK

→ これだけで以下が全てセットアップされます:
- 30以上のテーブル
- Row Level Security (RLS) ポリシー
- Storage バケット (写真診断・食事写真・シェアカード)
- 自動Profile作成トリガー
- クイズ問題 50問+
- ベンチマークペルソナ 7体
- アチーブメント 30個+

### 1-4. Authentication設定 (重要)

1. 左メニュー **Authentication → Providers**
2. **Email** をクリック → トグルがONであることを確認
3. **Confirm email** を **OFF** にする (開発時は確認メール無しで楽になります)
4. **[Save]**

---

## 🛠 Phase 2: ローカル環境セットアップ (10分)

### 2-1. リポジトリをクローン

```bash
git clone https://github.com/shin0411/fitnessApp.git
cd fitnessApp
git checkout claude/workout-tracking-app-GvGbS
```

### 2-2. 自動セットアップスクリプト実行

```bash
./setup.sh
```

→ Node.jsチェック・npm install・.env作成 を対話的に実施します。

### 2-3. (手動の場合) 個別実行

```bash
# 依存関係インストール
npm install

# .env を手動作成
cat > .env <<EOF
EXPO_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
EXPO_PUBLIC_CLAUDE_API_KEY=
EOF
```

---

## 📱 Phase 3: スマホで起動 (3分)

### 3-1. Expo Go をスマホにインストール

- **iPhone**: App Store で「**Expo Go**」検索 → インストール
- **Android**: Google Play で「**Expo Go**」検索 → インストール

### 3-2. 開発サーバー起動

PCのターミナルで:

```bash
npx expo start
```

→ **QRコード**が表示されます。

### 3-3. スマホで読み取り

- **iPhone**: 標準カメラアプリでQRを読む → "Expo Goで開く" タップ
- **Android**: Expo Goアプリ → "Scan QR Code" → 読み取り

⚠️ **PCとスマホが同じWi-Fi**である必要があります。

---

## 🎮 動作確認

1. ログイン画面が表示される
2. **新規登録** → メール・パスワード・ユーザー名を入力 → 作成
3. ゴール設定画面 → 好きなペルソナを選択
4. ダッシュボード表示 → 4軸レベル (全Lv.1) が見える
5. **クイズタブ** → 問題が表示されれば DB 設定OK
6. **ワークアウト記録** → 種目追加・セット入力 → XP獲得確認

---

## 📦 アプリをスマホに本格インストール (EAS Build)

開発が落ち着いたら、APKとしてビルドして配布できます:

```bash
npm install -g eas-cli
eas login
eas init
eas build --platform android --profile preview
```

→ クラウドビルド (15-25分) → URL からAPKダウンロード → スマホでインストール

---

## ❓ トラブルシューティング

### "command not found: git" / "xcrun: error"
```bash
xcode-select --install
```

### "command not found: node"
[https://nodejs.org/](https://nodejs.org/) からLTS版をインストール

### Expo Goで読み取ったが起動しない
- PCとスマホが**同じWi-Fi**か確認
- それでも駄目なら: `npx expo start --tunnel` で起動 (要 `npm install -g @expo/ngrok`)

### Supabase接続エラー
- `.env` の URL と KEY が正しいか再確認
- Supabase Dashboard で SQL Editor の実行結果に "Success" が出たか確認

### "Cannot find module 'expo-router/internal/routing'"
```bash
rm -rf node_modules package-lock.json
npm install
```

---

## 🌟 次のステップ

- **テーマ切り替え**: プロフィール → テーマ設定 で4テーマ試す
- **デイリークエスト**: ダッシュボードでクエスト達成
- **AI写真診断**: Claude API Key を `.env` に設定すると有効化
- **招待コード**: プロフィールの招待コードを友達に → 双方+500 XP

楽しんでください 🎉
