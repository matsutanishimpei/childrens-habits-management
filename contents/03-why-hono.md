# なぜ Hono なのか — Servlet / Express / Spring Boot との比較

> **前提知識:** Java Servlet でリクエスト処理を書いた経験がある

---

## 1. Servlet のコードを思い出す

```java
@WebServlet("/api/users")
public class UserServlet extends HttpServlet {
    @Override
    protected void doGet(HttpServletRequest req, HttpServletResponse resp) 
            throws ServletException, IOException {
        resp.setContentType("application/json");
        resp.setCharacterEncoding("UTF-8");
        
        List<User> users = userDao.findAll();
        String json = new ObjectMapper().writeValueAsString(users);
        resp.getWriter().write(json);
    }

    @Override
    protected void doPost(HttpServletRequest req, HttpServletResponse resp) 
            throws ServletException, IOException {
        BufferedReader reader = req.getReader();
        StringBuilder sb = new StringBuilder();
        String line;
        while ((line = reader.readLine()) != null) {
            sb.append(line);
        }
        User user = new ObjectMapper().readValue(sb.toString(), User.class);
        // バリデーション... 保存... レスポンス...
    }
}
```

**20行以上書いて、やっと JSON を返すだけ。** ボイラープレート（お決まりのコード）が多すぎる。

---

## 2. Hono で同じことを書くと

```typescript
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { createUserSchema } from '@my-app/shared';

const app = new Hono();

// GET /api/users
app.get('/api/users', async (c) => {
  const users = await db.select().from(usersTable).all();
  return c.json(users);
});

// POST /api/users（バリデーション付き）
app.post('/api/users',
  zValidator('json', createUserSchema),
  async (c) => {
    const data = c.req.valid('json');
    // data は型安全（CreateUserInput 型）
    const user = await db.insert(usersTable).values(data).returning().get();
    return c.json(user, 201);
  }
);
```

**直感的で、短い。** Servlet の儀式的なコードが不要。

---

## 3. なぜ Express や Spring Boot ではなく Hono なのか

### 3.1 比較表

| 観点 | Java Servlet | Spring Boot | Express (Node.js) | **Hono** |
|------|-------------|-------------|-------------------|----------|
| 言語 | Java | Java | JavaScript | **TypeScript** |
| 起動時間 | 数秒〜十数秒 | 数秒〜数十秒 | 数百ms | **数ms（エッジ起動）** |
| バンドルサイズ | WAR数十MB | JAR数十MB | node_modules数百MB | **最小14KB** |
| 型安全な RPC | ❌ | ❌（OpenAPI生成は可能） | ❌ | **✅ ネイティブ対応** |
| サーバレス対応 | ❌ | △（Lambda用アダプタ必要） | △ | **✅ マルチランタイム** |
| 学習コスト | 高い | 高い | 低い | **低い** |

### 3.2 Hono を選ぶ決定的な理由

#### 理由 1: RPC による型安全な通信

これが **Express にはない Hono だけの武器**。

```typescript
// Backend: ルーターを定義し、型をエクスポート
const routes = app.get('/api/users/:id', async (c) => {
  const id = c.req.param('id');
  const user = await getUser(id);
  return c.json(user);  // ← この戻り値の型が自動で推論される
});

export type AppType = typeof routes;
```

```typescript
// Frontend: 型安全に API を呼ぶ
import { hc } from 'hono/client';
import type { AppType } from '@my-app/backend';

const client = hc<AppType>('/');

// ↓ パス、パラメータ、レスポンスの型が全部補完される
const res = await client.api.users[':id'].$get({ param: { id: '1' } });
const user = await res.json();
// user.name → string ✅（コンパイル時に保証）
```

**OpenAPI も Swagger も不要。** TypeScript の型推論だけで、フロントとバックが型安全に繋がる。

Servlet/JSP 時代は「サーバの `request.setAttribute()` と JSP の `${user.name}` が合ってるか」を  
**実行して確認するしかなかった**。Hono RPC ならエディタが即座にエラーを出してくれる。

#### 理由 2: エッジ（Cloudflare Workers）でネイティブに動く

```
【従来のサーバ】
  東京リージョン1台 → 世界中のユーザーがそこにアクセス
  遠い人はレイテンシ（遅延）が大きい

【Cloudflare Workers + Hono】
  世界300+拠点にデプロイ → ユーザーの最寄りの拠点が応答
  どこからアクセスしても高速
```

Spring Boot を Cloudflare Workers で動かすことは不可能。  
Express は動くが、Worker 環境用のアダプタが必要で、Node.js 固有の API が使えない。  
**Hono は最初から Web Standard API で設計されている** ため、どこでもそのまま動く。

#### 理由 3: ミニマルで高速

```
Hono 本体: ~14KB（gzip）
Express:   ~200KB
Spring Boot: ~30MB（起動に必要な最小構成）
```

Cloudflare Workers には **1MBのサイズ制限** がある。  
Express すら入れるのがギリギリの環境で、Hono は余裕で収まる。

---

## 4. Servlet の概念がどう対応するか

### 4.1 ルーティング

```java
// Servlet: web.xml またはアノテーション
@WebServlet("/api/users/*")
public class UserServlet extends HttpServlet {
    protected void doGet(...) { /* GET処理 */ }
    protected void doPost(...) { /* POST処理 */ }
}
```

```typescript
// Hono: メソッドチェーンで宣言
app.get('/api/users', handler);      // GET
app.post('/api/users', handler);     // POST
app.get('/api/users/:id', handler);  // パスパラメータ
app.delete('/api/users/:id', handler);
```

### 4.2 フィルター → ミドルウェア

```java
// Servlet Filter
@WebFilter("/*")
public class AuthFilter implements Filter {
    public void doFilter(ServletRequest req, ServletResponse resp, FilterChain chain) {
        // 認証チェック
        if (!isAuthenticated(req)) {
            ((HttpServletResponse) resp).sendError(401);
            return;
        }
        chain.doFilter(req, resp);  // 次へ進む
    }
}
```

```typescript
// Hono Middleware
app.use('/api/*', async (c, next) => {
  const token = c.req.header('Authorization');
  if (!token) return c.json({ error: 'Unauthorized' }, 401);
  // 検証...
  await next();  // 次へ進む
});
```

同じ概念（リクエストを横断的に処理する）が、より少ないコードで実現できる。

### 4.3 コンテキスト

```java
// Servlet: request と response が分離
String name = request.getParameter("name");
response.setStatus(200);
response.getWriter().write(json);
```

```typescript
// Hono: Context (c) に統合
const name = c.req.query('name');
return c.json({ message: 'ok' }, 200);
```

---

## 5. 「Express でよくない？」への回答

Node.js の Web フレームワークとして Express は圧倒的なシェアを持つ。  
でも Express は **2014年設計** のフレームワーク。

| 観点 | Express | Hono |
|------|---------|------|
| TypeScript | 後付け（型定義ファイル） | ネイティブ TypeScript |
| RPC（型安全通信） | ❌ なし | ✅ 組み込み |
| 非同期処理 | コールバック / try-catch | async/await ネイティブ |
| ランタイム | Node.js のみ | Node, Deno, Bun, Workers, Lambda... |
| パフォーマンス | 遅め | 高速（TrieRouter） |
| サイズ | 200KB+ | 14KB |

Express を使うなら、型安全な通信のために **tRPC** や **OpenAPI** を別途導入する必要がある。  
Hono ならそれが **最初から入っている**。

---

## 6. 「Spring Boot でよくない？」への回答

Spring Boot は素晴らしいフレームワーク。エンタープライズ開発では今でも主力。  
だが、このテンプレートの目的には合わない：

| 観点 | Spring Boot | Hono |
|------|-------------|------|
| デプロイ先 | AWS EC2, ECS, Lambda | Cloudflare Workers（無料枠あり） |
| コールドスタート | 数秒〜数十秒 | 数ms |
| フロントとの型共有 | 不可能（Java ↔ TypeScript） | **可能（同じ TypeScript）** |
| 学生の学習コスト | 高い（DI, AOP, JPA...） | 低い（Web APIの基本だけ） |
| 月額コスト | 最低でも数千円（EC2等） | 無料（Workers Free plan: 10万リクエスト/日） |

**特に重要なのは「フロントとの型共有」。**  
Spring Boot で API を作っても、React のフロントエンドとは言語が違うので型が共有できない。  
OpenAPI 定義を書いて、そこからクライアントコードを生成して…という追加作業が発生する。

Hono + TypeScript なら、**`export type AppType = typeof routes` の1行で型が共有される**。

---

## まとめ

Hono を選ぶ理由は3つに集約される：

1. **RPC による型安全通信** — フロントとバックの型がコンパイル時に保証される
2. **エッジネイティブ** — Cloudflare Workers で世界中に無料デプロイ
3. **ミニマル** — 覚えることが少なく、コードが短い

```
Servlet の知識は無駄にならない。
「リクエストを受けて、処理して、レスポンスを返す」という本質は同じ。
ただ、その周りの儀式的なコードが、モダンなフレームワークでは不要になった。
```

---

> **次:** [04-why-vite-react.md](./04-why-vite-react.md) — なぜ Vite + React なのか
