# FitnessRPG リリース手順

## 前提条件

| 必要なもの | 費用 | 備考 |
|-----------|------|------|
| Apple Developer Program | $99/年 | https://developer.apple.com/programs/ |
| Expo アカウント | 無料 | https://expo.dev |
| Google Play Developer (Android のみ) | $25 一回 | https://play.google.com/console |

---

## STEP 1: Apple Developer Program に登録

1. https://developer.apple.com/programs/ を開く
2. 「Enroll」をクリック
3. Apple ID でサインイン（なければ作成）
4. Entity Type: **Individual / Sole Proprietor** を選択
5. 情報入力 → クレジットカードで $99 支払い
6. **審査完了まで 1〜3 日待つ**

承認メールが届いたら次のステップへ。

---

## STEP 2: App Store Connect でアプリ登録

1. https://appstoreconnect.apple.com を開く
2. 「マイ App」→「+」→「新規 App」
3. 入力内容:
   - プラットフォーム: iOS
   - 名前: **FitnessRPG**
   - 言語: 日本語
   - バンドル ID: **com.shin0411.fitnessrpg**
   - SKU: `fitnessrpg-001`（任意の一意な文字列）
4. 作成後、左メニュー → 一般 → App情報 → **Apple ID（数字）をメモ**

---

## STEP 3: eas.json を更新

```bash
cd ~/fitnessApp
```

`eas.json` の以下を実際の値で書き換える:

```json
"submit": {
  "production": {
    "ios": {
      "appleId": "shin0411t@gmail.com",
      "ascAppId": "1234567890",        // ← App Store Connect の Apple ID
      "appleTeamId": "ABCD1234EF"      // ← Developer Portal のチームID
    }
  }
}
```

**チームID の確認方法:**  
https://developer.apple.com/account → Membership → Team ID

---

## STEP 4: Expo アカウントとプロジェクトをリンク

```bash
cd ~/fitnessApp
npx expo login          # expo.dev のアカウントでログイン
npx eas init            # プロジェクトを EAS に登録（EAS_PROJECT_ID が app.json に追記される）
```

---

## STEP 5: アプリアイコンを準備

App Store は **1024×1024px の PNG**（透過なし）が必要。

現在のアイコン `assets/icon.png` を確認して、以下を揃える:

| ファイル | サイズ | 用途 |
|---------|--------|------|
| `assets/icon.png` | 1024×1024 | iOS アイコン |
| `assets/adaptive-icon.png` | 1024×1024 | Android アダプティブアイコン |
| `assets/splash.png` | 1284×2778 | スプラッシュスクリーン |

> 仮の画像でビルドして審査に出すことも可能。後から変更できます。

---

## STEP 6: 本番ビルドを実行

```bash
cd ~/fitnessApp
npx eas build --platform ios --profile production
```

- 初回は Apple のサインインを求められる
- 証明書・プロビジョニングプロファイルは **EAS が自動で作成・管理**してくれる
- ビルドは Expo のクラウドで行われる（Mac 不要）
- 所要時間: **15〜30 分**
- ビルド完了後 https://expo.dev/accounts/[your-account]/builds で .ipa が確認できる

---

## STEP 7: App Store に提出

```bash
npx eas submit --platform ios --profile production
```

自動で App Store Connect にアップロードされる。

---

## STEP 8: App Store Connect で審査情報を入力

https://appstoreconnect.apple.com で以下を入力:

### App 説明文（日本語）
```
身体・美容・知性をRPGゲームで鍛える、新感覚フィットネスアプリ。

ワークアウト記録、AI写真診断、ナレッジクイズの3軸＋総合レベルで
あなたの成長をLv.1〜999でリアルタイムに可視化。

【主な機能】
• 筋トレ・有酸素運動の記録 → フィジカルXP獲得
• AI（Claude Vision）による顔・体・食事の写真分析
• 4択クイズで知識レベルアップ
• GPS ランニング・ウォーキング追跡
• デイリークエスト・ストリーク管理
• ギルド機能・ランキング・相互チャレンジ
• SNS シェアカード自動生成
• 4種テーマ（かわいい / クール / 美しい / シンプル）
```

### スクリーンショット（最低 3 枚）
- iPhone 6.7インチ（1290×2796px）: ダッシュボード、クイズ、ワークアウト画面など
- iPhone 6.1インチ（1179×2556px）も推奨

### キーワード
```
フィットネス,RPG,ワークアウト,筋トレ,美容,クイズ,AI,レベルアップ,ゲーミフィケーション,健康
```

### プライバシーポリシー URL（必須）
無料で作れるサービス例:
- https://www.freeprivacypolicy.com
- https://privacypolicygenerator.info

URL を App Store Connect の「App のプライバシー」に登録。

### カテゴリ
- 主カテゴリ: **ヘルスケア / フィットネス**
- サブカテゴリ: **スポーツ**

---

## STEP 9: 審査提出

App Store Connect で「審査へ提出」をクリック。  
通常 **1〜3 日** で審査完了。

---

## Android (Google Play) の場合

```bash
npx eas build --platform android --profile production
npx eas submit --platform android --profile production
```

事前に Google Play Console でサービスアカウントキーを発行し、  
`google-play-service-account.json` としてプロジェクトルートに配置（.gitignore に追加済み）。

---

## トラブルシューティング

| エラー | 原因 | 対処 |
|--------|------|------|
| `Missing compliance` | 暗号化の申告 | 審査時に「暗号化なし」を選択 |
| `Icon contains alpha` | アイコンに透過あり | PNG を不透過で再保存 |
| `Missing privacy policy` | URL 未設定 | App Store Connect に URL 追加 |
| `Build failed - provisioning` | 証明書エラー | `npx eas credentials` で再設定 |
