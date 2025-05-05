# Shuu

快適なエディターを提供することをコンセプトにデスクトップアプリケーションを開発しています。

## プロジェクトコンセプト

快適なエディターを提供するためにアプリケーションを開発しています。
このアプリは書きやすいエディターと生成AI時代に適したエディタを作ることをゴールとしています。

## 主要機能

- エディタ (MVP)
- エディタで作成したファイルを MCP Server で情報を提供し、生成 AI が記録した情報を元に回答できるようにする (正規リリース)

## 開発セットアップ

> **注意**: このプロジェクトは[Electron React Boilerplate](https://github.com/electron-react-boilerplate/electron-react-boilerplate)をベースにしています。

### 必要条件

- Node.js 14.x以上
- npm 7.x以上
- Git

### インストール

リポジトリをクローンし、依存関係をインストールします：

```bash
git clone https://github.com/yourusername/shuu.git
cd shuu
npm install
```

### 開発の開始

開発モードでアプリを起動：

```bash
npm run dev
```

開発モードではホットリローディングが有効になっており、コードの変更がリアルタイムに反映されます。

## ビルド

ローカルプラットフォーム用にアプリケーションをビルドするには：

```bash
# macOS Universal
npm run build:mac

# Windows
npm run build:win

# Linux
npm run build:linux
```

すべてのプラットフォームでのビルド前に型チェックが実行されます：

```bash
npm run typecheck
```

## CSSスタイリングガイド

アプリケーションのスタイリングは、コンポーネントごとにモジュール化されたCSSファイルで管理されています。以下のガイドラインに従ってスタイリングを行ってください。

### CSSファイル構成

スタイルシートは以下のように機能別に分割されています：

```
src/renderer/
├── App.css                   # メインCSSファイル（インポート用）
└── styles/
    ├── base.css              # 基本スタイル
    ├── layout.css            # レイアウト構造
    ├── sidebar.css           # サイドバーコンポーネント
    ├── header.css            # ヘッダーコンポーネント
    ├── pdf-viewer.css        # PDFビューア関連
    ├── editor.css            # エディタとMarkdownプレビュー
    ├── directory-explorer.css # ディレクトリエクスプローラー
    ├── file-components.css   # ファイル選択・最近使用したファイル
    └── welcome-status.css    # ウェルカム画面・状態表示
```

### スタイリングルール

1. **コンポーネント分離の原則**
   - 各コンポーネントのスタイルは対応するCSSファイルに定義する
   - 共通で使われるスタイルのみbase.cssに定義する

2. **命名規則**
   - コンポーネント名をプレフィックスとしたクラス名を使用する
     - 例: `.sidebar-item`、`.editor-container`
   - 状態を表す場合は末尾に状態名を付ける
     - 例: `.sidebar-item.active`、`.editor-filepath.modified`

3. **レイアウト管理**
   - 全体的なページレイアウトは`layout.css`で管理
   - コンポーネント内の要素配置はコンポーネント自体のCSSファイルで管理

4. **変数とカラーパレット**
   - 色やサイズなどの共通値は変数として定義（今後CSS変数の導入を検討）
   - 基本カラーパレット
     - プライマリカラー: `#4a86e8`（青）
     - セカンダリカラー: `#2c3e50`（濃紺）
     - アクセントカラー: `#34a853`（緑）
     - エラーカラー: `#f44336`（赤）
     - 背景色: `#f5f5f5`（薄灰色）
     - テキストカラー: `#333`（濃灰色）

5. **新しいスタイルの追加手順**
   - 関連するコンポーネントのCSSファイルを特定
   - 既存の命名パターンに沿ったクラス名を設定
   - コメントで役割を明確に記述
   - 共通スタイルとの一貫性を確認

6. **レスポンシブデザイン**
   - 基本的にデスクトップアプリのため固定サイズを中心に設計
   - ウィンドウサイズの変更に対応するためFlexboxレイアウトを積極的に活用

### モジュールの責務

各CSSファイルの役割と責務を以下に示します：

- **base.css**: 基本的なHTML要素のスタイルとグローバルなリセットCSS
- **layout.css**: アプリケーション全体のレイアウト構造とグリッドシステム
- **sidebar.css**: サイドナビゲーションバーとそのアイテムのスタイル
- **header.css**: アプリケーションのトップヘッダーと関連コントロール
- **pdf-viewer.css**: PDFドキュメントの表示と関連するナビゲーションコントロール
- **editor.css**: テキストエディタとMarkdownプレビューのスタイル
- **directory-explorer.css**: ファイルシステム表示のためのエクスプローラーUI
- **file-components.css**: ファイル選択ダイアログと最近使用したファイルのUI
- **welcome-status.css**: 初期画面、ローディング、エラー表示など状態関連のUI

## 技術スタック

- [Electron](https://www.electronjs.org/) - クロスプラットフォームデスクトップアプリケーションフレームワーク
- [React](https://reactjs.org/) - UIコンポーネントを構築するためのJavaScriptライブラリ
- [React Router](https://reactrouter.com/) - Reactアプリケーションのルーティング
- [Vite](https://vitejs.dev/) - 次世代フロントエンドツール
- [TypeScript](https://www.typescriptlang.org/) - 静的型付け

## プロジェクト構造

```
shuu/
├── assets/           # アプリケーションアイコンなどの静的ファイル
├── out/              # ビルドされたアプリケーション
└── src/
    ├── main/         # Electronのメインプロセス
    ├── preload/      # プリロードスクリプト
    └── renderer/     # Reactを使用するレンダラープロセス
        ├── styles/   # モジュール化されたCSSファイル
        ├── components/ # Reactコンポーネント
        ├── utils/    # ユーティリティ関数
        └── src/      # エントリーポイント
```

## 開発フィロソフィー

このプロジェクトは「MVP開発」の原則に従い、必要最小限の機能と依存関係で開発を進めています。テストフレームワークやリンターなどの開発ツールは必要に応じて後から導入します。これにより、開発の初期段階での複雑さを減らし、迅速な機能開発に集中できるようにしています。

## コントリビューションガイドライン

1. このリポジトリをフォークする
2. 機能開発用の新しいブランチを作成: `git checkout -b feature/amazing-feature`
3. 変更をコミット: `git commit -m 'Add some amazing feature'`
4. ブランチにプッシュ: `git push origin feature/amazing-feature`
5. プルリクエストを作成
