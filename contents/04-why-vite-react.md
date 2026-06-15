# なぜ Vite + React なのか — JSP との決別

> **前提知識:** JSP でサーバサイドレンダリングを経験している

---

## 1. JSP で何が起きていたか

```jsp
<%@ page contentType="text/html; charset=UTF-8" %>
<%@ taglib uri="http://java.sun.com/jsp/jstl/core" prefix="c" %>
<html>
<body>
  <h1>ユーザー一覧</h1>
  <table>
    <c:forEach var="user" items="${users}">
      <tr>
        <td>${user.name}</td>
        <td>${user.email}</td>
        <td>
          <form method="POST" action="/delete">
            <input type="hidden" name="id" value="${user.id}" />
            <button type="submit">削除</button>
          </form>
        </td>
      </tr>
    </c:forEach>
  </table>
</body>
</html>
```

このとき何が起きている？

1. ブラウザが `/users` にリクエスト  
2. サーバ（Servlet）がDBからデータを取得  
3. サーバが JSP テンプレートにデータを埋め込んで **完成した HTML** を生成  
4. ブラウザは受け取った HTML をそのまま表示  
5. 「削除」ボタンを押すとフォームが POST される → **ページ全体がリロード**

これが **サーバサイドレンダリング（SSR）** 。  
画面の生成はすべてサーバの仕事。ブラウザは HTML を表示するだけの「ビューア」。

---

## 2. この仕組みの限界

### 限界 1: ページ全体がリロードされる

「削除」ボタンを押すたびに、画面が白くなってリロードされる。  
ユーザーがリストをスクロールしていても、位置はリセットされる。

**現代の Web アプリ** を思い浮かべてほしい：
- Gmail：メールを削除しても画面は遷移しない。リストからスッと消える。
- Notion：テキストを編集すると即座に反映される。「保存」ボタンもない。
- Google Maps：地図をドラッグすると裏でデータが読み込まれる。ページリロードはない。

これらは **ブラウザ上で動くアプリケーション** だ。サーバに HTML を作ってもらうのではなく、  
ブラウザ自身がデータを取得し、画面を書き換えている。

### 限界 2: サーバの負荷が大きい

100人が同時にアクセスすると、サーバは100枚の HTML を生成する必要がある。  
HTML の生成（テンプレートエンジンの処理）はそれなりにコストがかかる。

**JSON API + クライアントレンダリング** なら、サーバは JSON データを返すだけ。  
画面の描画はユーザーの端末（ブラウザ）に任せられる。負荷の分散。

### 限界 3: フロントエンドの表現力に制限がある

JSP で以下のようなUIを作るのは極めて困難：
- ドラッグ＆ドロップでリストを並べ替え
- リアルタイム検索（1文字打つごとに結果が絞り込まれる）
- モーダル（ポップアップ）の中にフォームがあり、送信後にリストが更新される
- アニメーション付きのページ遷移

JSP は「HTML を文字列として組み立てる」テンプレートエンジン。  
**インタラクティブな振る舞い** を実装するには、結局 JavaScript を書くことになる。  
でもそうすると、JSP の `<c:forEach>` と JavaScript の DOM 操作が混在して地獄になる。

---

## 3. React が解決すること

### 3.1 コンポーネント = 再利用可能な UI 部品

```tsx
// UserCard コンポーネント
function UserCard({ user }: { user: User }) {
  return (
    <div className="card">
      <h3>{user.name}</h3>
      <p>{user.email}</p>
      <button onClick={() => deleteUser(user.id)}>削除</button>
    </div>
  );
}

// UserList コンポーネント（UserCard を使い回す）
function UserList({ users }: { users: User[] }) {
  return (
    <div>
      {users.map(user => (
        <UserCard key={user.id} user={user} />
      ))}
    </div>
  );
}
```

JSP の `<c:forEach>` に似ているが、決定的な違いがある：

| JSP | React |
|-----|-------|
| サーバで実行 → HTML 文字列を生成 | ブラウザで実行 → DOM を直接操作 |
| 表示したら終わり | 状態が変わると自動で再描画 |
| 部品の再利用は `<jsp:include>` | コンポーネントをそのまま import |
| 型チェックなし | TypeScript で props が型安全 |

### 3.2 状態管理 = 画面が「生きている」

```tsx
function Counter() {
  const [count, setCount] = useState(0);  // 状態を持つ
  
  return (
    <div>
      <p>カウント: {count}</p>
      <button onClick={() => setCount(count + 1)}>+1</button>
    </div>
  );
}
```

ボタンをクリックすると `count` が変わり、**画面が自動で更新** される。  
ページリロードはない。DOM の変更された部分だけが書き換わる。

JSP でこれをやろうとすると、JavaScript で DOM を手動操作する必要がある：

```javascript
// JSP 時代の素の JavaScript
document.getElementById('count').textContent = newCount;
// この要素IDとJSPのHTML構造が合ってないとバグる
// 複雑なUIになると手動管理が破綻する
```

React は **「この状態ならこの画面」** という宣言的な記述で、DOM 操作を自動化している。

### 3.3 データの取得 = API 呼び出し

```tsx
function UserList() {
  const [users, setUsers] = useState<User[]>([]);

  useEffect(() => {
    // Hono RPC で型安全に API を呼ぶ
    const fetchUsers = async () => {
      const res = await client.api.users.$get();
      const data = await res.json();
      setUsers(data);  // 取得したデータで画面を更新
    };
    fetchUsers();
  }, []);

  return (
    <ul>
      {users.map(user => <li key={user.id}>{user.name}</li>)}
    </ul>
  );
}
```

JSP では `request.getAttribute("users")` でサーバから渡されたデータを使っていた。  
React では **ブラウザが自分で API を呼んでデータを取得する**。サーバはデータを返すだけ。

---

## 4. なぜ Vite なのか

React のコードはそのままではブラウザで動かない（JSX 構文、TypeScript、モジュール等）。  
**ビルドツール** が必要。Vite はそのビルドツール。

### 4.1 Java で言えば Maven / Gradle に相当する

| 観点 | Maven (Java) | Vite (TypeScript/React) |
|------|-------------|------------------------|
| 役割 | コンパイル + パッケージング | トランスパイル + バンドル |
| 入力 | `.java` ファイル | `.tsx`, `.ts`, `.css` |
| 出力 | `.war` / `.jar` | `index.html` + `.js` + `.css` |
| 開発サーバ | Tomcat (ホットデプロイ) | Vite Dev Server (HMR) |

### 4.2 HMR（Hot Module Replacement）

Vite の最大の魅力。コードを保存した瞬間、**ページリロードなしで** 変更が反映される。

```
コードを編集 → 保存 → 0.1秒後にブラウザに反映 ← ページリロードなし！
```

Tomcat でのホットデプロイは数秒〜十数秒かかっていた。  
Vite の HMR は **ミリ秒単位** 。開発体験が圧倒的に快適。

### 4.3 なぜ Create React App (CRA) ではないのか

以前は CRA が React プロジェクトの定番だった。だが：
- CRA は **2023年に開発終了** 。React 公式もCRAを推奨していない。
- CRA の開発サーバは遅い（Webpack ベース）。
- Vite は CRA より **10〜100倍速い** ビルドを実現。

React 公式が推奨するフレームワークは Next.js や Remix だが、  
このテンプレートでは **Cloudflare Workers をバックエンドにしている** ため、  
フロントエンドは純粋な SPA（Single Page Application）として Vite で構築している。

---

## 5. MVC パターンの進化

### 5.1 Servlet/JSP の MVC

```
Model:      JavaBeans / DAO（データ）
View:       JSP（HTML生成）
Controller: Servlet（リクエスト処理）

─── すべてサーバ上で完結 ───
```

### 5.2 このテンプレートの関心分離

```
【サーバ側】
  Model:      D1 Database + Zod スキーマ
  Controller: Hono ルートハンドラ
  → JSON API として機能。View の責務はない。

【クライアント側】
  View:       React コンポーネント（UI 描画）
  ViewModel:  React Hooks（状態管理・API呼び出し）
  → ブラウザ内で完結するアプリケーション
```

**MVC の考え方は生きている。** ただ、View がサーバ（JSP）からクライアント（React）に移動した。  
そして、サーバとクライアントの間は **JSON API** で繋がっている。

---

## 6. JSP から React への概念マッピング

| JSP の概念 | React の対応物 | 備考 |
|-----------|---------------|------|
| `<c:forEach>` | `array.map()` | リストの繰り返し描画 |
| `<c:if>` | `{condition && <...>}` | 条件付き表示 |
| `${user.name}` | `{user.name}` | データの埋め込み |
| `<jsp:include page="header.jsp">` | `<Header />` | 部品の再利用 |
| `<form action="/submit">` | `<form onSubmit={handleSubmit}>` | フォーム送信 |
| `request.getAttribute()` | `useState` / `useEffect` | データの取得と保持 |
| JSTL タグライブラリ | React コンポーネントライブラリ | UI部品の再利用 |
| `request.getParameter()` | `useForm()` (react-hook-form) | フォーム入力の取得 |

---

## 7. 「じゃあ SSR は完全に不要なの？」

そうではない。用途によって使い分ける：

| レンダリング方式 | 適している場面 | 例 |
|----------------|--------------|-----|
| SSR (JSP等) | SEO重要 + コンテンツ中心 | ブログ、ニュースサイト |
| CSR (React SPA) | 操作中心のアプリ | 管理画面、ダッシュボード |
| SSR + Hydration (Next.js等) | 両方必要 | ECサイト、SNS |

このテンプレートで作るのは **操作中心の業務アプリ** なので、CSR（SPA）が最適。  
検索エンジンにインデックスされる必要がない管理画面やツールに向いている。

---

## まとめ

| 観点 | JSP | Vite + React |
|------|-----|-------------|
| 画面生成の場所 | サーバ | ブラウザ |
| ページ遷移 | リロード | 画面内で切り替え（SPA） |
| データバインディング | 手動（EL式 + JSTL） | 自動（状態が変わると再描画） |
| 型安全性 | なし（EL式は文字列） | TypeScript で保証 |
| 開発速度 | Tomcat再起動が必要 | HMR で瞬時に反映 |
| インタラクティブUI | 困難（JS手動追加） | 得意（React の本領） |

**JSP の知識は無駄にならない。**  
「テンプレートにデータを埋め込んで画面を作る」という本質は React も同じ。  
ただ、それが **サーバからブラウザに移動し、リアクティブ（反応的）になった** というだけだ。

---

> **次:** [05-monorepo.md](./05-monorepo.md) — なぜモノレポ構成なのか
