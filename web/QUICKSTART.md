# FitnessRPG クイックスタート

## 1. Supabaseプロジェクトを作る

1. [supabase.com](https://supabase.com) にアクセスしてログイン
2. **New Project** ボタンで新規プロジェクト作成（名前: `fitnessrpg`、リージョン: Tokyo）
3. **SQL Editor** → **New query** を開いて `web/supabase/schema.sql` の内容を全てペースト → **Run**
4. 「Success」と出たらOK

## 2. 環境変数を設定する

```bash
cd ~/fitnessApp
git pull origin claude/workout-tracking-app-GvGbS
cd web
cp .env.local.example .env.local
nano .env.local   # 下記を記入
```

Supabaseダッシュボードの **Settings → API** からコピー:

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
```

## 3. 起動する

```bash
npm install
npm run dev
```

ブラウザで http://localhost:3000 を開く

## 4. アカウント作成してログイン

- 「新規登録」でアカウントを作成
- メールに確認リンクが届く（クリック必要）
- ログイン後にダッシュボードが表示される

## 機能一覧

| ページ | URL | 機能 |
|------|-----|------|
| ダッシュボード | /dashboard | 4軸レベル表示、クエスト |
| 筋トレ記録 | /log | ワークアウトセッション、タイマー |
| クイズ | /quiz | 5科目、難易度1-5、タイムバトル |
| 写真診断 | /analyze | 顔・体型・柔軟性 |
| 栄養管理 | /nutrition | 食事記録、マクロ引算 |
| 成長記録 | /progress | XPグラフ、履歴 |
| 実績 | /achievements | バッジコレクション |
| ギルド | /guild | パーティ機能 |
| ランキング | /ranking | リーダーボード |
| プロフィール | /profile | テーマ切り替え、設定 |
