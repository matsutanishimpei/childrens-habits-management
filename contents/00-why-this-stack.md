# なぜこのスタックなのか？ — Servlet/JSP から Modern Web へ

> **対象読者:** Java Servlet, MVC, JSP を経験済みの学生
> **ゴール:** このテンプレート (Hono + Vite/React + Zod) が「なぜこの構成なのか」を、君たちが知っている世界と対比しながら理解する。

---

## 1. まず結論：何が変わったのか

| 観点 | Java Servlet / JSP 時代 | このテンプレート |
|------|-------------------------|------------------|
| サーバ | Tomcat（常駐プロセス） | Cloudflare Workers（関数単位で起動） |
| 画面生成 | サーバが HTML を組み立てて返す（SSR） | ブラウザ側の React が画面を描く（CSR） |
| 状態管理 | `HttpSession`（サーバに保持） | JWT / Cookie（サーバは状態を持たない） |
| 型の共有 | Java の型はサーバだけの話 | Zod スキーマで Front ↔ Back が同じ型を共有 |
| 通信 | フォーム POST → サーバが画面ごとリダイレクト | JSON API (REST) → 画面は部分的に更新 |
| デプロイ | WAR ファイルを Tomcat に配備 | `wrangler deploy` で世界中のエッジにデプロイ |

ひとことで言えば、**「サーバが全部やる」世界から「フロントとバックが役割分担する」世界への移行**だ。

---

## 2. なぜ Servlet/JSP "だけ" では不十分なのか

### 2.1 ユーザー体験（UX）の壁

Servlet/JSP では、ボタンを押すたびにページ全体がリロードされる。  
現代の Web アプリ（Gmail, Notion, Slack）は **画面遷移なしでデータが更新される** のが当たり前になっている。
これを実現するには、ブラウザ側に独立した「アプリケーション」が必要 → **React や Vue のような UI フレームワーク**が生まれた理由。

### 2.2 スケーラビリティの壁

Tomcat は1台のサーバで動く。ユーザーが増えたらどうする？  
- サーバを増やす → でも `HttpSession` が特定のサーバに紐づいてしまう（スティッキーセッション問題）  
- セッションを共有する → Redis 等の外部ストアが必要 → 構成が複雑化  

**「サーバが状態を持たない（ステートレス）」** 設計にすれば、どのサーバに振り分けても同じ結果が返る。  
→ 詳しくは [01-stateless.md](./01-stateless.md) で解説。

### 2.3 型安全性の壁

Java のサーバサイドは型が強い。でも **JSP に渡す瞬間、型は消える**。  
`request.setAttribute("users", userList)` → JSP 側では `Object` にキャストして使う。  
フロントエンドとバックエンドの境界で「型の断絶」が起きていた。

このテンプレートでは、**Zod という1つのスキーマ定義**がフロントからバックまで貫通する。  
→ 詳しくは [02-why-zod.md](./02-why-zod.md) で解説。

---

## 3. このテンプレートの全体像

```
┌──────────────────────────────────────────────────┐
│                  ブラウザ（ユーザー）                 │
│    React (Vite)  ←── Hono RPC ──→  JSON API     │
└──────────────┬───────────────────────┬───────────┘
               │                       │
               │   型が貫通している！    │
               │                       │
        ┌──────┴───────┐        ┌──────┴──────┐
        │   Frontend   │        │   Backend   │
        │  (React)     │        │   (Hono)    │
        └──────┬───────┘        └──────┬──────┘
               │                       │
               └───────┬───────────────┘
                       │
                ┌──────┴──────┐
                │   Shared    │
                │  (Zod型)    │
                └─────────────┘
```

- **Shared**: Zod スキーマを書く場所。「このデータはこういう形をしている」を1か所で定義。
- **Backend (Hono)**: API サーバ。Shared のスキーマでリクエストを検証する。
- **Frontend (Vite/React)**: ブラウザ上の UI。Hono RPC で API を型安全に呼ぶ。

この構成のメリットは **「仕様変更は Shared の Zod を直すだけ。するとフロントもバックもコンパイルエラーで教えてくれる」** ということ。Servlet 時代のように、JSP のフォーム名とサーバのパラメータ名がズレて実行時に初めて気づく…という事故が構造的に起きない。

---

## 4. Servlet/JSP との用語マッピング

覚えなくていい。「あ、あれのことか」と思えれば十分。

| Servlet/JSP の概念 | このテンプレートの対応物 | 備考 |
|--------------------|-----------------------|------|
| `HttpServlet` | Hono のルートハンドラ | `app.get('/users', (c) => ...)` |
| `web.xml` / アノテーション | Hono のルーター定義 | コードでルーティングを宣言 |
| `HttpServletRequest` | Hono の `Context (c)` | `c.req.query()`, `c.req.json()` |
| `HttpServletResponse` | `c.json()`, `c.text()` | レスポンスを返すヘルパー |
| JSP（ビュー） | React コンポーネント | ブラウザ側で HTML を生成 |
| `request.setAttribute()` | API の JSON レスポンス | データは JSON で渡す |
| `RequestDispatcher.forward()` | React Router の `navigate()` | 画面遷移はブラウザ側で制御 |
| `HttpSession` | JWT / Cookie | → [01-stateless.md](./01-stateless.md) 参照 |
| `Filter` | Hono の Middleware | 認証やログなどの横断的処理 |
| Maven / Gradle | npm workspaces | パッケージ管理とビルド |
| WAR デプロイ | `wrangler deploy` | ワンコマンドでエッジにデプロイ |

---

## 5. 読み進める順番

| # | ファイル | 内容 |
|---|---------|------|
| 01 | [01-stateless.md](./01-stateless.md) | なぜサーバは状態を持たないのか（ステートレス設計） |
| 02 | [02-why-zod.md](./02-why-zod.md) | なぜ Zod を「型の源泉」にするのか |
| 03 | [03-why-hono.md](./03-why-hono.md) | なぜ Hono なのか（Express/Spring Boot との比較） |
| 04 | [04-why-vite-react.md](./04-why-vite-react.md) | なぜ Vite + React なのか（JSP との決別） |
| 05 | [05-monorepo.md](./05-monorepo.md) | なぜモノレポ構成なのか |

---

> **💡 ヒント:** 全部を一気に読む必要はない。まずこのファイルの表を眺めて全体像を掴んだら、気になるトピックから読んでいけばいい。
