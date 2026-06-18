import { z } from 'zod';

export const ChildSchema = z.object({
  id: z.string(),
  name: z.string().min(1, '名前を入力してください'),
});

export const TaskSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'タスク名を入力してください'),
  icon: z.string().default('pencil'),
  category: z.enum(['homework', 'habit', 'other']).default('homework'),
  childId: z.string(),
});

export const DailyTaskInstanceSchema = z.object({
  id: z.string(), // インスタンスを区別するための固有ID
  taskId: z.string(), // 素材タスクのID
  completed: z.boolean().default(false),
  pages: z.string().optional(), // 宿題などの進めるページ数（例：「1〜2」）
});

export const DayPlanSchema = z.object({
  date: z.string(), // YYYY-MM-DD
  morning: z.array(DailyTaskInstanceSchema).default([]),
  lunch: z.array(DailyTaskInstanceSchema).default([]),
  dinner: z.array(DailyTaskInstanceSchema).default([]),
});

export type Child = z.infer<typeof ChildSchema>;
export type Task = z.infer<typeof TaskSchema>;
export type DailyTaskInstance = z.infer<typeof DailyTaskInstanceSchema>;
export type DayPlan = z.infer<typeof DayPlanSchema>;
