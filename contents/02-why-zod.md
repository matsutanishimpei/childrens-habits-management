# なぜ Zod を「型の源泉」にするのか

> **前提知識:** Java のクラスやインターフェースによる型定義の経験がある

---

## 1. Java の世界での「型」

Java では、データの構造はクラスで定義する：

```java
public class User {
    private int id;
    private String name;
    private String email;
    // getter, setter, constructor...
}
```

この `User` クラスは **コンパイル時** に型チェックされる。  
`user.getName()` は String を返す。型が違えばコンパイルエラー。素晴らしい。

**でも、外の世界からデータが来たらどうだろう？**

```java
// フォームからのリクエスト
String name = request.getParameter("name");  // null かもしれない
String age = request.getParameter("age");    // "abc" かもしれない
int ageInt = Integer.parseInt(age);          // 💥 NumberFormatException!
```

Java の型システムは、**外部入力を信じてくれない**。当然だ。  
だから手動でバリデーション（検証）を書く。何度も、何度も。

---

## 2. TypeScript の「型」の限界

TypeScript に移ると、型はさらにトリッキーになる。

```typescript
// 型を定義
type User = {
  id: number;
  name: string;
  email: string;
};

// API からデータを受け取る
const data = await request.json();  // ← 型は any 😱
```

TypeScript の型は **コンパイル時にしか存在しない**。  
JavaScript にトランスパイルされた瞬間、型の情報は全て消える。

```typescript
// TypeScript の型はランタイムでは無力
const user: User = JSON.parse('{"id": "abc", "name": 123}');
// ↑ コンパイルエラーなし。実行時に壊れる。
```

Java のクラスは実行時にも存在する（リフレクション等）。  
TypeScript の `type` は実行時には**ただの幻**。

---

## 3. Zod が解決すること

Zod は **「型定義」と「バリデーション」を1つに統合** するライブラリ。

```typescript
import { z } from 'zod';

// ① スキーマを定義（これが "唯一の真実" になる）
const userSchema = z.object({
  id: z.number().int().positive(),
  name: z.string().min(1).max(100),
  email: z.string().email(),
});

// ② スキーマから TypeScript の型を抽出
type User = z.infer<typeof userSchema>;
// → { id: number; name: string; email: string }

// ③ 実行時にバリデーション
const result = userSchema.safeParse(unknownData);
if (result.success) {
  const user = result.data;  // ← 型が保証されている！
} else {
  console.error(result.error.issues);  // ← 何が間違っていたか分かる
}
```

**Java と比較すると：**

| 概念 | Java | Zod |
|------|------|-----|
| 型定義 | `class User { ... }` | `z.object({ ... })` |
| バリデーション | 手書きの if文 / Bean Validation | スキーマに組み込み済み |
| エラーメッセージ | 自分で書く | 自動生成される |
| 型の抽出 | クラスがそのまま型 | `z.infer<typeof schema>` |

---

## 4. なぜ「型を手書き」してはいけないのか

TypeScript で型とバリデーションを別々に書くとこうなる：

```typescript
// ❌ アンチパターン：型の二重管理

// 型を定義
type CreateUserInput = {
  name: string;
  email: string;
  age: number;
};

// バリデーション関数を別に書く
function validateCreateUser(data: unknown): data is CreateUserInput {
  if (typeof data !== 'object' || data === null) return false;
  if (typeof (data as any).name !== 'string') return false;
  if (typeof (data as any).email !== 'string') return false;
  if (typeof (data as any).age !== 'number') return false;
  // あれ、email のフォーマットチェックは？ age の範囲は？
  // 型に phone を足したけどバリデーションを更新し忘れた...
  return true;
}
```

**型とバリデーションが別の場所にある** → 片方を変更してもう片方を変え忘れる → バグ。  
Java でも `DTO` と `Entity` とバリデーションアノテーションが散らばって同じ問題が起きる。

Zod なら：

```typescript
// ✅ 正しいパターン：Zod が Single Source of Truth

const createUserSchema = z.object({
  name: z.string().min(1, "名前は必須です"),
  email: z.string().email("メールアドレスの形式が不正です"),
  age: z.number().int().min(0).max(150),
});

// 型は自動的に導出される。手書き不要。
type CreateUserInput = z.infer<typeof createUserSchema>;
```

スキーマを変えれば、型もバリデーションも自動で追従する。**ズレようがない。**

---

## 5. このテンプレートでの Zod の使われ方

### 5.1 Shared パッケージ（単一の真実の情報源）

```
packages/shared/
  src/
    schemas/
      user.ts       ← Zod スキーマ
    types/
      user.ts       ← z.infer で型を抽出
    index.ts        ← 再エクスポート
```

```typescript
// packages/shared/src/schemas/user.ts
import { z } from 'zod';

export const userSchema = z.object({
  id: z.number().int(),
  name: z.string().min(1),
  email: z.string().email(),
  createdAt: z.string().datetime(),
});

export const createUserSchema = userSchema.omit({ id: true, createdAt: true });
```

```typescript
// packages/shared/src/types/user.ts
import { z } from 'zod';
import { userSchema, createUserSchema } from '../schemas/user';

export type User = z.infer<typeof userSchema>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
```

### 5.2 Backend（バリデーションに使う）

```typescript
// packages/backend/src/index.ts
import { zValidator } from '@hono/zod-validator';
import { createUserSchema } from '@my-app/shared';

app.post('/api/users',
  zValidator('json', createUserSchema),  // ← リクエストを自動検証
  async (c) => {
    const data = c.req.valid('json');     // ← 型安全なデータ
    // data.name → string（保証済み）
    // data.email → string, email形式（保証済み）
    // ...DB に保存
  }
);
```

Java Servlet で `request.getParameter()` して手動でチェックしていた処理が、  
`zValidator` **一行で完結** する。しかも型が付いてくる。

### 5.3 Frontend（フォームバリデーションに使う）

```typescript
// packages/frontend/src/components/UserForm.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createUserSchema, type CreateUserInput } from '@my-app/shared';

function UserForm() {
  const { register, handleSubmit, formState: { errors } } = useForm<CreateUserInput>({
    resolver: zodResolver(createUserSchema),  // ← 同じスキーマ！
  });
  // ...
}
```

**Backend と Frontend で全く同じバリデーションルール** が適用される。  
「サーバでは通るけどフロントのバリデーションが厳しすぎる」みたいなズレが起きない。

---

## 6. 型の流れ — 全体図

```
        ┌─────────────────────────────────────────┐
        │          Shared (Zod スキーマ)            │
        │                                         │
        │  createUserSchema = z.object({...})     │
        │  type CreateUserInput = z.infer<...>    │
        └──────────┬───────────────┬──────────────┘
                   │               │
          import   │               │  import
                   ↓               ↓
        ┌──────────────┐  ┌──────────────────┐
        │   Backend    │  │    Frontend      │
        │              │  │                  │
        │ zValidator   │  │ zodResolver      │
        │ でリクエスト  │  │ でフォーム       │
        │ を検証       │  │ を検証           │
        └──────────────┘  └──────────────────┘
```

**スキーマを1か所変えれば、全部に伝播する。**  
これが「Single Source of Truth（唯一の真実の情報源）」の力。

---

## 7. Java 経験者が引っかかるポイント

### Q: Java の Bean Validation (`@NotNull`, `@Email`) と何が違う？

A: 思想は似ている。違いは **スコープ** 。
- Bean Validation → サーバサイドのみ。クライアント（ブラウザ）では使えない。
- Zod → サーバでもクライアントでも同じスキーマが動く。JavaScript だから。

### Q: `z.infer` って結局 Java のジェネリクスみたいなもの？

A: 近い。Java で `List<User>` と書くと中身が `User` だと分かるように、  
`z.infer<typeof userSchema>` と書くとスキーマから型が推論される。  
ただし Java と違い、**実行時に消える**。型チェックはコンパイル（トランスパイル）時のみ。

### Q: なぜ TypeScript の `interface` や `type` だけじゃダメなの？

A: TypeScript の型は **実行時に消える** から。  
`interface User { name: string }` と書いても、ユーザーが `{ name: 123 }` を送ってきたら防げない。  
Zod は実行時にもデータを検証してくれる **ランタイムバリデーター** 。

---

## まとめ

| 観点 | Java Bean Validation | TypeScript 手書き型 | Zod |
|------|---------------------|-------------------|-----|
| コンパイル時の型安全性 | ✅ | ✅ | ✅ |
| 実行時のバリデーション | ✅ | ❌（消える） | ✅ |
| フロントで再利用 | ❌ | ❌（JSPに型はない） | ✅ |
| 型とバリデーションの一致保証 | △（別定義になりがち） | ❌ | ✅（自動導出） |

**Zod = 「型定義」+「バリデーション」+「エラーメッセージ」が全部入りの、フルスタックなスキーマ定義ツール。**

---

> **次:** [03-why-hono.md](./03-why-hono.md) — なぜ Hono なのか
