/// <reference types="@cloudflare/workers-types" />
import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { ChildSchema, TaskSchema } from '@my-app/shared';

type Bindings = {
  DB: D1Database;
};

const app = new Hono<{ Bindings: Bindings }>().basePath('/api');

const routes = app
  // 1. GET /children - Get children list
  .get('/children', async (c) => {
    const { results } = await c.env.DB.prepare('SELECT * FROM children').all();
    const children = results.map((row: any) => ({
      id: row.id as string,
      name: row.name as string,
    }));
    return c.json(children);
  })

  // 1.1 POST /children - Add a new child with default tasks seeded
  .post(
    '/children',
    zValidator('json', ChildSchema),
    async (c) => {
      const child = c.req.valid('json');
      const statements = [];
      
      statements.push(
        c.env.DB.prepare('INSERT INTO children (id, name) VALUES (?, ?)')
          .bind(child.id, child.name)
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

  // 1.2 DELETE /children/:id - Delete a child
  .delete(
    '/children/:id',
    async (c) => {
      const id = c.req.param('id');
      await c.env.DB.prepare('DELETE FROM children WHERE id = ?').bind(id).run();
      return c.json({ success: true });
    }
  )
  
  // 2. GET /tasks - Get tasks for a child
  .get(
    '/tasks',
    zValidator('query', z.object({ childId: z.string() })),
    async (c) => {
      const { childId } = c.req.valid('query');
      const { results } = await c.env.DB.prepare(
        'SELECT * FROM tasks WHERE child_id = ?'
      )
        .bind(childId)
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

  // 3. POST /tasks - Create a task
  .post(
    '/tasks',
    zValidator('json', TaskSchema),
    async (c) => {
      const task = c.req.valid('json');
      await c.env.DB.prepare(
        'INSERT INTO tasks (id, name, icon, category, child_id) VALUES (?, ?, ?, ?, ?)'
      )
        .bind(task.id, task.name, task.icon, task.category, task.childId)
        .run();
      return c.json(task);
    }
  )

  // 4. DELETE /tasks/:id - Delete a task
  .delete('/tasks/:id', async (c) => {
    const id = c.req.param('id');
    await c.env.DB.prepare('DELETE FROM tasks WHERE id = ?').bind(id).run();
    return c.json({ success: true });
  })

  // 5. GET /day-plans - Get day plans for a child
  .get(
    '/day-plans',
    zValidator('query', z.object({ childId: z.string() })),
    async (c) => {
      const { childId } = c.req.valid('query');
      const { results } = await c.env.DB.prepare(
        'SELECT * FROM daily_task_instances WHERE child_id = ?'
      )
        .bind(childId)
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

  // 6. POST /day-plans - Save (overwrite) a day plan for a child
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

      const statements = [];
      // Delete existing instances for this child and date
      statements.push(
        c.env.DB.prepare(
          'DELETE FROM daily_task_instances WHERE child_id = ? AND date = ?'
        ).bind(childId, date)
      );

      // Helper to push insert statements
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

      // Run batch transaction
      await c.env.DB.batch(statements);

      return c.json({ success: true });
    }
  );

export type AppType = typeof routes;
export default app;
