# なぜモノレポ構成なのか

> **前提知識:** Maven / Gradle でプロジェクトをビルドした経験がある

---

## 1. 素朴な疑問：フロントとバックを分けないの？

Java の世界では、バックエンドとフロントエンドは別プロジェクトであることが多い：

```
my-backend/        ← Java (Maven) プロジェクト
  pom.xml
  src/main/java/...

my-frontend/       ← 別リポジトリ or 別ディレクトリ
  package.json
  src/...
```

この構成だと、**APIの仕様が変わるたびに両方のリポジトリを更新** する必要がある。  
そして更新し忘れてバグになる。日常茶飯事。

---

## 2. モノレポ（Monorepo）とは

**1つのリポジトリに、関連するすべてのプロジェクトを入れる** 構成。

```
my-app/                    ← 1つのリポジトリ
  package.json             ← ルート（ワークスペース管理）
  packages/
    shared/                ← Zod スキーマ・型定義
      package.json
      src/
    backend/               ← Hono API サーバ
      package.json
      src/
    frontend/              ← React アプリ
      package.json
      src/
```

Google, Meta, Microsoft, Uber… 世界の大手テック企業の多くがモノレポを採用している。

---

## 3. なぜモノレポなのか — 3つの理由

### 理由 1: 型の共有が「ただの import」になる

```typescript
// Frontend から Shared のスキーマを使う
import { createUserSchema, type User } from '@my-app/shared';

// Backend から同じスキーマを使う
import { createUserSchema } from '@my-app/shared';
```

別リポジトリだと、npm に公開するか、Git サブモジュールを使うか、  
API仕様書を書いてコード生成するか… 面倒な仕組みが必要になる。

モノレポなら **`import` するだけ** 。追加の仕組みは不要。

### 理由 2: 変更が一発でわかる

Shared の Zod スキーマを変更すると：

```
$ npm run typecheck

packages/backend/src/index.ts:15:3 - error TS2353:
  Property 'phone' does not exist on type 'CreateUserInput'.

packages/frontend/src/components/UserForm.tsx:22:7 - error TS2353:
  Property 'phone' does not exist on type 'CreateUserInput'.
```

**全パッケージのコンパイルエラーが一発で表示される。**  
別リポジトリだと、バックエンドを直して、次にフロントエンドのリポジトリを開いて…  
という切り替えコストが発生する。

### 理由 3: 依存関係が統一される

```json
// ルートの package.json
{
  "workspaces": ["packages/*"]
}
```

`npm install` をルートで1回実行するだけで、全パッケージの依存がインストールされる。  
React のバージョン違い、TypeScript のバージョン違いによるバグが起きにくい。

---

## 4. Java の世界で言えば何に当たる？

### Maven マルチモジュール

```xml
<!-- Java の場合：親 pom.xml -->
<modules>
  <module>shared</module>
  <module>backend</module>
  <module>frontend</module>
</modules>
```

npm workspaces は、**Maven のマルチモジュール構成と同じ思想** 。

| 概念 | Maven マルチモジュール | npm workspaces |
|------|---------------------|----------------|
| プロジェクト定義 | `pom.xml` | `package.json` |
| 親の設定 | 親 `pom.xml` の `<modules>` | ルート `package.json` の `"workspaces"` |
| モジュール間参照 | `<dependency>` で `groupId:artifactId` | `"dependencies"` で `"@my-app/shared": "*"` |
| 一括ビルド | `mvn install` | `npm run build --workspaces` |
| 依存管理 | `<dependencyManagement>` | ルートの `node_modules` に集約 |

---

## 5. このテンプレートの依存関係

```
              ┌─────────────┐
              │   shared    │  ← 誰にも依存しない（Zod のみ）
              └──────┬──────┘
                     │
          ┌─────────┴──────────┐
          │                    │
   ┌──────┴──────┐     ┌──────┴──────┐
   │   backend   │     │  frontend   │
   │             │     │             │
   │ depends on: │     │ depends on: │
   │  - shared   │     │  - shared   │
   │  - hono     │     │  - backend  │ ← 型(AppType)のみ参照
   │             │     │  - react    │
   └─────────────┘     └─────────────┘
```

**重要なルール:**
- `shared` → どちらにも依存しない。純粋なスキーマと型。
- `backend` → `shared` に依存。`frontend` には絶対に依存しない。
- `frontend` → `shared` と `backend` の **型** に依存。実行時にはAPIを呼ぶだけ。

この依存の方向を守ることで、各パッケージを独立して開発・テストできる。

---

## 6. 「全部1つのフォルダに入れるのとは何が違うの？」

```
# ❌ これはモノレポではない。ただの「ごちゃまぜプロジェクト」
my-app/
  package.json      ← 全依存が1つに
  src/
    server.ts
    App.tsx
    schema.ts
    UserForm.tsx
    api-handler.ts
```

```
# ✅ モノレポ = パッケージ境界が明確
my-app/
  packages/
    shared/          ← 独自の package.json, 独自の責務
    backend/         ← 独自の package.json, 独自の責務
    frontend/        ← 独自の package.json, 独自の責務
```

モノレポの本質は **「1つのリポジトリの中に、明確な境界を持った複数のパッケージがある」** こと。  
各パッケージは独自の `package.json` を持ち、依存関係が宣言されている。

これにより：
- Backend のコードが Frontend のコンポーネントを import することを **構造的に防げる**
- Shared に React や Hono の依存が混入することを **構造的に防げる**
- 各パッケージを単独でビルド・テストできる

---

## 7. 実際の開発フロー

### 新機能追加の流れ

```bash
# 1. Shared: Zod スキーマを追加
#    packages/shared/src/schemas/task.ts を作成

# 2. Backend: API エンドポイントを追加
#    packages/backend/src/index.ts にルートを追加

# 3. Frontend: UIコンポーネントを作成
#    packages/frontend/src/components/TaskList.tsx を作成

# 4. 型チェック（全パッケージ一括）
npm run typecheck
# → 不整合があれば全部のエラーが出る

# 5. 開発サーバ起動
npm run dev:backend    # ターミナル1
npm run dev:frontend   # ターミナル2
```

### 仕様変更の流れ

```bash
# 1. Shared のスキーマを変更
#    例: userSchema に phone フィールドを追加

# 2. npm run typecheck
#    → Backend と Frontend の両方で
#      「phone を扱ってないぞ」とエラーが出る

# 3. Backend と Frontend を修正

# 4. 再度 npm run typecheck → 全クリア ✅
```

**スキーマ変更の影響範囲が、コンパイラが教えてくれる。** これがモノレポ + TypeScript の力。

---

## まとめ

| 観点 | 別リポジトリ | モノレポ |
|------|------------|---------|
| 型の共有 | npm公開 / コード生成が必要 | `import` するだけ |
| 仕様変更の影響確認 | 各リポジトリで個別にチェック | `npm run typecheck` で一括 |
| 依存の統一 | 各リポジトリで個別管理 | ルートで一括管理 |
| 境界の強制 | リポジトリが分かれているので自然に | `package.json` で明示的に宣言 |
| Git 管理 | 複数リポジトリの同期が必要 | 1つのリポジトリで完結 |

**モノレポは「コードを1か所にまとめる」ことではない。**  
**「関連するコードを1つのリポジトリで管理しつつ、パッケージ間の境界を明確にする」** ための構成。  
型安全なフルスタック開発において、これがもっとも効率的な構成になる。

---

> ここまで読んだ君へ：  
> 全体像は掴めたはず。あとは手を動かすだけだ。  
> [README.md](../README.md) の「クイックスタート」に戻って、実際に動かしてみよう。
