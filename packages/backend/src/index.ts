/// <reference types="@cloudflare/workers-types" />
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';
import { sign, verify } from 'hono/jwt';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { ChildSchema, TaskSchema, AuthSchema } from '@my-app/shared';

type Bindings = {
  DB: D1Database;
  JWT_SECRET?: string;
};

type Variables = {
  familyId: string;
};

async function hashPasscode(passcode: string): Promise<string> {
  const msgUint8 = new TextEncoder().encode(passcode);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

const app = new Hono<{ Bindings: Bindings; Variables: Variables }>().basePath('/api');

app.use('*', cors({
  origin: (origin) => origin || '*',
  credentials: true,
}));

// JWT 認証ミドルウェア (特定のパスを保護)
const authMiddleware = async (c: any, next: any) => {
  const token = getCookie(c, 'token');
  if (!token) {
    return c.json({ success: false, error: 'Unauthorized' }, 401);
  }
  try {
    const secret = c.env.JWT_SECRET || 'dev-secret-key-fallback';
    const payload = await verify(token, secret, 'HS256');
    c.set('familyId', payload.familyId);
    await next();
  } catch (err) {
    return c.json({ success: false, error: 'Unauthorized' }, 401);
  }
};

// 認証が必要なルートへの適用
app.use('/children', authMiddleware);
app.use('/children/*', authMiddleware);
app.use('/tasks', authMiddleware);
app.use('/tasks/*', authMiddleware);
app.use('/day-plans', authMiddleware);
app.use('/day-plans/*', authMiddleware);

const routes = app
  // -------------------------------------------------------------
  // 1. Auth エンドポイント
  // -------------------------------------------------------------
  
  // 新規登録
  .post(
    '/auth/register',
    zValidator('json', AuthSchema),
    async (c) => {
      const { name, passcode } = c.req.valid('json');
      
      const existing = await c.env.DB.prepare('SELECT id FROM families WHERE name = ?')
        .bind(name)
        .first();
      if (existing) {
        return c.json({ success: false, error: 'この家庭名は既に登録されています' }, 400);
      }

      const id = Math.random().toString(36).substring(2, 11);
      const passcodeHash = await hashPasscode(passcode);

      await c.env.DB.prepare('INSERT INTO families (id, name, passcode_hash) VALUES (?, ?, ?)')
        .bind(id, name, passcodeHash)
        .run();

      const secret = c.env.JWT_SECRET || 'dev-secret-key-fallback';
      const token = await sign({
        familyId: id,
        name: name,
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 365
      }, secret);

      setCookie(c, 'token', token, {
        httpOnly: true,
        secure: c.req.url.startsWith('https://'),
        sameSite: 'Lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 365
      });

      return c.json({ success: true, family: { id, name } });
    }
  )

  // ログイン
  .post(
    '/auth/login',
    zValidator('json', AuthSchema),
    async (c) => {
      const { name, passcode } = c.req.valid('json');

      const family = await c.env.DB.prepare('SELECT * FROM families WHERE name = ?')
        .bind(name)
        .first<any>();

      if (!family) {
        return c.json({ success: false, error: '家庭名または合言葉が間違っています' }, 401);
      }

      const passcodeHash = await hashPasscode(passcode);
      if (family.passcode_hash !== passcodeHash) {
        return c.json({ success: false, error: '家庭名または合言葉が間違っています' }, 401);
      }

      const secret = c.env.JWT_SECRET || 'dev-secret-key-fallback';
      const token = await sign({
        familyId: family.id,
        name: family.name,
        exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 365
      }, secret);

      setCookie(c, 'token', token, {
        httpOnly: true,
        secure: c.req.url.startsWith('https://'),
        sameSite: 'Lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 365
      });

      return c.json({ success: true, family: { id: family.id, name: family.name } });
    }
  )

  // セッション確認
  .get('/auth/me', async (c) => {
    const token = getCookie(c, 'token');
    if (!token) {
      return c.json({ success: false, error: '未ログインです' }, 401);
    }
    try {
      const secret = c.env.JWT_SECRET || 'dev-secret-key-fallback';
      const payload = await verify(token, secret, 'HS256');
      return c.json({
        success: true,
        family: { id: payload.familyId as string, name: payload.name as string }
      });
    } catch (err) {
      return c.json({ success: false, error: 'セッションが無効です' }, 401);
    }
  })

  // ログアウト
  .post('/auth/logout', async (c) => {
    deleteCookie(c, 'token', { path: '/' });
    return c.json({ success: true });
  })

  // -------------------------------------------------------------
  // 2. 子ども管理 (Family-scoped)
  // -------------------------------------------------------------

  // 子ども一覧
  .get('/children', async (c) => {
    const familyId = c.get('familyId');
    const { results } = await c.env.DB.prepare('SELECT * FROM children WHERE family_id = ?')
      .bind(familyId)
      .all();
    const children = results.map((row: any) => ({
      id: row.id as string,
      name: row.name as string,
    }));
    return c.json(children);
  })

  // 新規追加
  .post(
    '/children',
    zValidator('json', ChildSchema),
    async (c) => {
      const child = c.req.valid('json');
      const familyId = c.get('familyId');
      const statements = [];
      
      statements.push(
        c.env.DB.prepare('INSERT INTO children (id, name, family_id) VALUES (?, ?, ?)')
          .bind(child.id, child.name, familyId)
      );

      const defaultTasks = [
        { name: 'さんすうドリル', icon: 'pencil', category: 'homework' },
        { name: 'こくごドリル', icon: 'pencil', category: 'homework' },
        { name: 'おんどく（音読）', icon: 'book', category: 'homework' },
        { name: 'あさがおの水やり', icon: 'flower', category: 'habit' },
        { name: 'ラジオ体操', icon: 'smile', category: 'habit' },
        { name: 'はみがき（歯磨き）', icon: 'star', category: 'habit' }
      ];

      for (const t of defaultTasks) {
        const taskId = Math.random().toString(36).substring(2, 9);
        statements.push(
          c.env.DB.prepare('INSERT INTO tasks (id, name, icon, category, child_id) VALUES (?, ?, ?, ?, ?)')
            .bind(taskId, t.name, t.icon, t.category, child.id)
        );
      }

      await c.env.DB.batch(statements);
      return c.json(child);
    }
  )

  // 削除
  .delete(
    '/children/:id',
    async (c) => {
      const id = c.req.param('id');
      const familyId = c.get('familyId');
      await c.env.DB.prepare('DELETE FROM children WHERE id = ? AND family_id = ?')
        .bind(id, familyId)
        .run();
      return c.json({ success: true });
    }
  )
  
  // -------------------------------------------------------------
  // 3. タスクマスター管理 (Family-scoped via children join)
  // -------------------------------------------------------------

  .get(
    '/tasks',
    zValidator('query', z.object({ childId: z.string() })),
    async (c) => {
      const { childId } = c.req.valid('query');
      const familyId = c.get('familyId');
      const { results } = await c.env.DB.prepare(
        'SELECT t.* FROM tasks t JOIN children c ON t.child_id = c.id WHERE t.child_id = ? AND c.family_id = ?'
      )
        .bind(childId, familyId)
        .all();

      const mapped = results.map((row: any) => ({
        id: row.id,
        name: row.name,
        icon: row.icon,
        category: row.category as 'homework' | 'habit' | 'other',
        childId: row.child_id,
      }));
      return c.json(mapped);
    }
  )

  .post(
    '/tasks',
    zValidator('json', TaskSchema),
    async (c) => {
      const task = c.req.valid('json');
      const familyId = c.get('familyId');

      // Verify child belongs to this family
      const child = await c.env.DB.prepare('SELECT id FROM children WHERE id = ? AND family_id = ?')
        .bind(task.childId, familyId)
        .first();
      if (!child) {
        return c.json({ success: false, error: 'Unauthorized' }, 401);
      }

      await c.env.DB.prepare(
        'INSERT INTO tasks (id, name, icon, category, child_id) VALUES (?, ?, ?, ?, ?)'
      )
        .bind(task.id, task.name, task.icon, task.category, task.childId)
        .run();
      return c.json(task);
    }
  )

  .delete('/tasks/:id', async (c) => {
    const id = c.req.param('id');
    const familyId = c.get('familyId');

    // Scope delete by checking if child belongs to the family
    await c.env.DB.prepare(
      'DELETE FROM tasks WHERE id = ? AND child_id IN (SELECT id FROM children WHERE family_id = ?)'
    )
      .bind(id, familyId)
      .run();
    return c.json({ success: true });
  })

  // -------------------------------------------------------------
  // 4. 日々の記録管理 (Family-scoped via children join)
  // -------------------------------------------------------------

  .get(
    '/day-plans',
    zValidator('query', z.object({ childId: z.string() })),
    async (c) => {
      const { childId } = c.req.valid('query');
      const familyId = c.get('familyId');
      const { results } = await c.env.DB.prepare(
        'SELECT d.* FROM daily_task_instances d JOIN children c ON d.child_id = c.id WHERE d.child_id = ? AND c.family_id = ?'
      )
        .bind(childId, familyId)
        .all();

      const plansMap = new Map<string, { morning: any[]; lunch: any[]; dinner: any[] }>();

      for (const row of results as any[]) {
        if (!plansMap.has(row.date)) {
          plansMap.set(row.date, { morning: [], lunch: [], dinner: [] });
        }
        const dayData = plansMap.get(row.date)!;
        const instance = {
          id: row.id,
          taskId: row.task_id,
          completed: row.completed === 1,
          pages: row.pages || undefined,
        };

        if (row.meal === 'morning') dayData.morning.push(instance);
        else if (row.meal === 'lunch') dayData.lunch.push(instance);
        else if (row.meal === 'dinner') dayData.dinner.push(instance);
      }

      const dayPlans = Array.from(plansMap.entries()).map(([date, meals]) => ({
        date,
        morning: meals.morning,
        lunch: meals.lunch,
        dinner: meals.dinner,
      }));

      return c.json(dayPlans);
    }
  )

  .post(
    '/day-plans',
    zValidator(
      'json',
      z.object({
        date: z.string(),
        childId: z.string(),
        morning: z.array(
          z.object({
            id: z.string(),
            taskId: z.string(),
            completed: z.boolean(),
            pages: z.string().optional(),
          })
        ),
        lunch: z.array(
          z.object({
            id: z.string(),
            taskId: z.string(),
            completed: z.boolean(),
            pages: z.string().optional(),
          })
        ),
        dinner: z.array(
          z.object({
            id: z.string(),
            taskId: z.string(),
            completed: z.boolean(),
            pages: z.string().optional(),
          })
        ),
      })
    ),
    async (c) => {
      const { date, childId, morning, lunch, dinner } = c.req.valid('json');
      const familyId = c.get('familyId');

      // Verify child belongs to this family
      const child = await c.env.DB.prepare('SELECT id FROM children WHERE id = ? AND family_id = ?')
        .bind(childId, familyId)
        .first();
      if (!child) {
        return c.json({ success: false, error: 'Unauthorized' }, 401);
      }

      const statements = [];
      statements.push(
        c.env.DB.prepare(
          'DELETE FROM daily_task_instances WHERE child_id = ? AND date = ?'
        ).bind(childId, date)
      );

      const addInserts = (instances: any[], meal: string) => {
        for (const inst of instances) {
          statements.push(
            c.env.DB.prepare(
              'INSERT INTO daily_task_instances (id, task_id, date, meal, completed, pages, child_id) VALUES (?, ?, ?, ?, ?, ?, ?)'
            ).bind(
              inst.id,
              inst.taskId,
              date,
              meal,
              inst.completed ? 1 : 0,
              inst.pages || null,
              childId
            )
          );
        }
      };

      addInserts(morning, 'morning');
      addInserts(lunch, 'lunch');
      addInserts(dinner, 'dinner');

      await c.env.DB.batch(statements);

      return c.json({ success: true });
    }
  );

export type AppType = typeof routes;
export default app;
