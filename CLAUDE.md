# CLAUDE.md - Mastra Deploy プロジェクト分析レポート

## 📋 プロジェクト概要

**mastra-deploy_1** は、Mastraフレームワークを使用したAIエージェント・ワークフローシステムです。
複数のAIエージェントと自動化ワークフローを統合したデプロイメント用アプリケーションとして設計されています。

### 基本情報
- **フレームワーク**: Mastra v0.10.5（AIオーケストレーション）
- **言語**: TypeScript (ES Module)
- **AI モデル**: OpenAI gpt-4o-mini
- **Node.js要件**: ≥ 20.9.0
- **ライセンス**: ISC

## 🏗️ アーキテクチャ構成

### コアコンポーネント
```
src/mastra/
├── index.ts              # メインエントリーポイント
├── agents/               # AIエージェント定義
│   ├── weather-agent.ts  # 天気情報エージェント
│   └── mcp-agent.ts      # MCP統合エージェント
├── tools/                # 個別ツール実装
│   └── weather-tool.ts   # 天気API連携ツール
└── workflows/            # ワークフロー定義
    └── weather-workflow.ts # 天気ベース活動推奨
```

### 技術スタック
```json
{
  "core": "@mastra/core@0.10.5",
  "storage": "@mastra/libsql@0.10.2", 
  "logging": "@mastra/loggers@0.10.2",
  "mcp": "@mastra/mcp@0.10.3",
  "memory": "@mastra/memory@0.10.3",
  "ai": "@ai-sdk/openai@1.3.22",
  "validation": "zod@3.25.63"
}
```

## 🤖 実装済み機能

### 1. Weather Agent (`weather-agent.ts`)
**目的**: 天気情報取得・提供エージェント

**機能**:
- Open-Meteo API経由の現在天気取得
- 多言語地名の英語翻訳対応
- 詳細気象データ（温度、体感温度、湿度、風速、突風、天気コード）
- 100種類以上の天気状況コード対応

**設定**:
```typescript
model: openai('gpt-4o-mini')
tools: { weatherTool }
memory: LibSQLStore (file:../mastra.db)
```

### 2. MCP Agent (`mcp-agent.ts`)
**目的**: Web検索とMastraドキュメント検索エージェント

**機能**:
- **Brave Search**: Web検索（BRAVE_API_KEY必要）
- **Mastra Docs**: GitMCP経由のMastraフレームワーク情報検索
- 動的ツール統合（MCP Protocol準拠）

**MCP Server設定**:
```typescript
servers: {
  "brave-search": {
    command: "/usr/local/bin/npx",
    args: ["-y", "@modelcontextprotocol/server-brave-search"],
    env: { BRAVE_API_KEY: process.env.BRAVE_API_KEY }
  },
  "mastra-docs": {
    url: new URL("https://gitmcp.io/mastra-ai/mastra")
  }
}
```

### 3. Weather Workflow (`weather-workflow.ts`)
**目的**: 天気データに基づく詳細活動推奨システム

**処理フロー**:
1. **fetchWeather**: 地名 → 座標変換 → 天気予報取得
2. **planActivities**: AIによる時間帯別活動提案

**出力形式**:
- 📅 日付別セクション
- 🌡️ 天気概要（温度、降水確率）
- 🌅 朝の活動（屋外活動 + 最適時間）
- 🌞 午後の活動（屋外活動 + 最適時間）
- 🏠 屋内代替案
- ⚠️ 特別考慮事項

### 4. Weather Tool (`weather-tool.ts`)
**目的**: Open-Meteo API連携の再利用可能ツール

**API統合**:
- Geocoding API: 地名 → 座標変換
- Weather API: 現在天気データ取得
- エラーハンドリング: 地名未発見時の例外処理

## 🚀 実行方法

### 1. 依存関係インストール
```bash
npm install
```

### 2. 環境変数設定
```bash
# 必須
OPENAI_API_KEY=your_openai_api_key

# オプション（MCP Agent Web検索用）
BRAVE_API_KEY=your_brave_api_key
```

### 3. 実行コマンド
```bash
# 開発モード
npm run dev

# ビルド
npm run build  

# 本番実行
npm run start
```

### 最小実行要件
- ✅ Node.js ≥ 20.9.0
- ✅ OPENAI_API_KEY（必須）
- ⚪ BRAVE_API_KEY（Web検索時のみ）

## 🔧 拡張可能性

### 新しいツール追加例
```typescript
// データベースツール
createTool({
  id: 'database-query',
  description: 'SQLデータベースクエリ実行',
  inputSchema: z.object({ query: z.string() }),
  execute: async ({ context }) => { /* DB接続・実行 */ }
});

// APIツール
createTool({
  id: 'news-api', 
  description: 'ニュースAPI連携',
  inputSchema: z.object({ category: z.string() }),
  execute: async ({ context }) => { /* News API */ }
});
```

### 新しいエージェント追加例
```typescript
// 金融エージェント
export const financeAgent = new Agent({
  name: 'Finance Agent',
  instructions: '株価・為替・仮想通貨情報を提供',
  model: openai('gpt-4o-mini'),
  tools: { stockTool, currencyTool, cryptoTool },
  memory: new Memory({ storage: new LibSQLStore({...}) })
});
```

### 高度なワークフロー例
```typescript
const dataProcessingWorkflow = createWorkflow({
  id: 'data-processing',
  inputSchema: z.object({ dataSource: z.string() })
})
.then(fetchData)      // データ取得
.then(cleanData)      // データクリーニング
.then(analyzeData)    // AI分析  
.then(generateReport) // レポート生成
.then(sendEmail);     // 結果送信
```

### 外部サービス統合候補
- **Discord/Slack Bot**: コミュニケーション統合
- **GitHub API**: リポジトリ操作
- **Database**: PostgreSQL, MongoDB, Redis
- **Vector DB**: Pinecone, Qdrant, ChromaDB
- **File Storage**: AWS S3, Google Cloud Storage

## 📊 開発履歴・パターン

### 最近のコミット傾向
```
d51d409 MCPエージェント再追加
015e118 MCP エージェント再追加  
136eb2b テレメトリー設定削除
a252847 テレメトリー設定修正
69d55d6 テストコミット
```

**開発パターン**:
- MCPエージェントの実装で複数回試行
- テレメトリー設定の最適化（不要設定削除）
- index.tsの簡素化（12行削除）

### コード品質特徴
- ✅ **型安全性**: TypeScript + Zod スキーマ
- ✅ **エラーハンドリング**: 地名未発見等の例外処理
- ✅ **モジュラー設計**: エージェント・ツール・ワークフロー分離
- ✅ **プロトコル準拠**: MCP標準対応
- ✅ **実用性**: 実際のAPI統合（Open-Meteo, Brave Search）

## 🔍 トラブルシューティング

### 一般的な問題
1. **OPENAI_API_KEY未設定**: 全エージェントで必須
2. **BRAVE_API_KEY未設定**: MCP Agent検索機能制限
3. **Node.js バージョン**: 20.9.0以上必要
4. **メモリ設定**: LibSQLでfile/memory切り替え可能

### デバッグヒント
- `mastra dev`: 開発モードでリアルタイムログ
- Pino Logger: 設定可能ログレベル（info, debug, error）
- Memory Storage: `:memory:` vs `file:../mastra.db`

## 📈 パフォーマンス考慮事項

### 現在の設定
- **Storage**: メモリ内SQLite（`:memory:`）
- **Model**: gpt-4o-mini（高速・コスト効率）
- **Memory**: ユーザー別永続化対応

### 最適化ポイント
- 本番環境: `file:../mastra.db` に変更
- ベクトル検索: 大量データ時はPinecone等検討
- キャッシュ: 頻繁なAPI呼び出し時はRedis検討

---

## 🏷️ メタ情報

- **最終分析日**: 2025-06-23
- **Mastra Version**: 0.10.5
- **Claude分析者**: Sonnet 4
- **リポジトリ状態**: 開発中（変更ファイル多数）

**このドキュメントは、Claudeが効率的にプロジェクトを理解・操作するための包括的リファレンスです。**