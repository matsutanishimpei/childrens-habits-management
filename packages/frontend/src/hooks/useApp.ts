import { useState, useEffect } from 'react';
import client from '../lib/hc';
import { Child, Task, DayPlan, DailyTaskInstance, Family } from '@my-app/shared';
import { toLocalISOString } from '../utils/date';

export const UNITS = ['ページ', '回', '問', '章', '分'] as const;
export type UnitType = typeof UNITS[number];

export const detectUnit = (pagesVal: string | undefined): UnitType => {
  if (!pagesVal) return 'ページ';
  for (const unit of UNITS) {
    if (pagesVal.endsWith(unit)) return unit;
  }
  for (const unit of UNITS) {
    if (pagesVal.includes(unit)) return unit;
  }
  return 'ページ';
};

export const getQuickOptions = (unit: UnitType): string[] => {
  switch (unit) {
    case 'ページ': return ['1ページ', '2ページ', '7ページ'];
    case '回': return ['1回', '2回', '3回'];
    case '問': return ['5問', '10問', '20問'];
    case '章': return ['1章', '2章', '3章'];
    case '分': return ['10分', '15分', '30分'];
    default: return ['1ページ', '2ページ', '7ページ'];
  }
};

export const isCustomValue = (val: string | undefined, unit: UnitType): boolean => {
  if (!val) return false;
  const options = getQuickOptions(unit);
  return !options.includes(val);
};

export const useApp = () => {
  const [family, setFamily] = useState<Family | null>(null);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'today' | 'plan' | 'calendar' | 'tasks' | 'children'>('today');
  const [children, setChildren] = useState<Child[]>([]);
  const [activeChild, setActiveChild] = useState<Child | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [dayPlans, setDayPlans] = useState<DayPlan[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return toLocalISOString(new Date());
  });
  
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const start = new Date(d.setDate(diff));
    start.setHours(0, 0, 0, 0);
    return start;
  });

  const [copiedPlan, setCopiedPlan] = useState<{
    morning: DailyTaskInstance[];
    lunch: DailyTaskInstance[];
    dinner: DailyTaskInstance[];
  } | null>(null);

  // Check active session on mount
  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await client.api.auth.me.$get();
        if (res.ok) {
          const data = await res.json();
          if (data.success) {
            setFamily(data.family);
          }
        }
      } catch (err) {
        console.error("Failed to check session", err);
      } finally {
        setAuthLoading(false);
      }
    };
    checkSession();
  }, []);

  // Load children when family logs in
  useEffect(() => {
    if (!family) {
      setChildren([]);
      setActiveChild(null);
      setTasks([]);
      setDayPlans([]);
      return;
    }

    const loadChildren = async () => {
      setLoading(true);
      try {
        const res = await client.api.children.$get();
        if (res.ok) {
          const list = await res.json();
          setChildren(list);
          if (list.length > 0) {
            setActiveChild(list[0]);
          } else {
            setActiveChild(null);
          }
        }
      } catch (err) {
        console.error("Failed to load children", err);
      } finally {
        setLoading(false);
      }
    };
    loadChildren();
  }, [family]);

  // Load tasks and dayPlans when activeChild changes
  useEffect(() => {
    if (!activeChild) {
      setTasks([]);
      setDayPlans([]);
      return;
    }
    
    const loadData = async () => {
      try {
        const [tasksRes, plansRes] = await Promise.all([
          client.api.tasks.$get({ query: { childId: activeChild.id } }),
          client.api['day-plans'].$get({ query: { childId: activeChild.id } })
        ]);
        
        if (tasksRes.ok) {
          setTasks(await tasksRes.json());
        }
        if (plansRes.ok) {
          setDayPlans(await plansRes.json());
        }
      } catch (err) {
        console.error("Failed to load child data", err);
      }
    };
    loadData();
  }, [activeChild]);

  // Helper: Get plan for a date
  const getDayPlan = (dateStr: string): DayPlan => {
    const plan = dayPlans.find(p => p.date === dateStr);
    return plan || { date: dateStr, morning: [], lunch: [], dinner: [] };
  };

  // Helper: Save day plan to backend
  const saveDayPlan = async (dateStr: string, updatedPlan: DayPlan) => {
    if (!activeChild) return;
    
    // Update local state immediately (Optimistic UI)
    setDayPlans(prev => {
      const filtered = prev.filter(p => p.date !== dateStr);
      return [...filtered, updatedPlan];
    });

    try {
      await client.api['day-plans'].$post({
        json: {
          date: dateStr,
          childId: activeChild.id,
          morning: updatedPlan.morning,
          lunch: updatedPlan.lunch,
          dinner: updatedPlan.dinner
        }
      });
    } catch (err) {
      console.error("Failed to save day plan", err);
    }
  };

  const changeWeek = (offset: number) => {
    const newStart = new Date(currentWeekStart);
    newStart.setDate(currentWeekStart.getDate() + offset * 7);
    setCurrentWeekStart(newStart);
  };

  const offsetSelectedDate = (offset: number) => {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() + offset);
    setSelectedDate(toLocalISOString(current));
  };

  const handleCreateTask = async (name: string, icon: string, category: 'homework' | 'habit' | 'other') => {
    if (!activeChild || !name.trim()) return;
    
    const newTask: Task = {
      id: Math.random().toString(36).substring(2, 9),
      name,
      icon,
      category,
      childId: activeChild.id
    };

    setTasks(prev => [...prev, newTask]);

    try {
      await client.api.tasks.$post({ json: newTask });
    } catch (err) {
      console.error("Failed to create task", err);
    }
  };

  const handleDeleteStockTask = async (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    try {
      await client.api.tasks[":id"].$delete({ param: { id } });
    } catch (err) {
      console.error("Failed to delete task", err);
    }
  };

  const addTaskToMeal = async (taskId: string, dateStr: string, meal: 'morning' | 'lunch' | 'dinner') => {
    const plan = getDayPlan(dateStr);
    const newInstance: DailyTaskInstance = {
      id: Math.random().toString(36).substring(2, 9),
      taskId,
      completed: false
    };
    const updated = {
      ...plan,
      [meal]: [...plan[meal], newInstance]
    };
    await saveDayPlan(dateStr, updated);
  };

  const removeTaskFromMeal = async (dateStr: string, meal: 'morning' | 'lunch' | 'dinner', instanceId: string) => {
    const plan = getDayPlan(dateStr);
    const updated = {
      ...plan,
      [meal]: plan[meal].filter(inst => inst.id !== instanceId)
    };
    await saveDayPlan(dateStr, updated);
  };

  const toggleTaskCompletion = async (dateStr: string, meal: 'morning' | 'lunch' | 'dinner', instanceId: string) => {
    const plan = getDayPlan(dateStr);
    const updated = {
      ...plan,
      [meal]: plan[meal].map(inst => 
        inst.id === instanceId ? { ...inst, completed: !inst.completed } : inst
      )
    };
    await saveDayPlan(dateStr, updated);
  };

  const updateTaskPages = async (dateStr: string, meal: 'morning' | 'lunch' | 'dinner', instanceId: string, pagesValue: string) => {
    const plan = getDayPlan(dateStr);
    const updated = {
      ...plan,
      [meal]: plan[meal].map(inst => 
        inst.id === instanceId ? { ...inst, pages: pagesValue } : inst
      )
    };
    await saveDayPlan(dateStr, updated);
  };

  const handleUnitChange = async (dateStr: string, meal: 'morning' | 'lunch' | 'dinner', instanceId: string, currentVal: string | undefined, newUnit: UnitType) => {
    const numMatch = currentVal ? currentVal.match(/\d+/) : null;
    const num = numMatch ? numMatch[0] : '1';
    const newVal = `${num}${newUnit}`;
    await updateTaskPages(dateStr, meal, instanceId, newVal);
  };

  const copyCurrentDayPlan = (dateStr: string) => {
    const plan = getDayPlan(dateStr);
    setCopiedPlan({
      morning: plan.morning,
      lunch: plan.lunch,
      dinner: plan.dinner
    });
  };

  const pasteToDayPlan = async (dateStr: string) => {
    if (!copiedPlan) return;

    const cloneInstances = (instances: DailyTaskInstance[]) => {
      return instances.map(inst => ({
        ...inst,
        id: Math.random().toString(36).substring(2, 9),
        completed: false
      }));
    };

    const updated: DayPlan = {
      date: dateStr,
      morning: cloneInstances(copiedPlan.morning),
      lunch: cloneInstances(copiedPlan.lunch),
      dinner: cloneInstances(copiedPlan.dinner)
    };

    await saveDayPlan(dateStr, updated);
  };

  const pasteToWeekdays = async () => {
    if (!copiedPlan || !activeChild) return;

    // Monday to Friday dates of the currently selected week
    const dates: string[] = [];
    for (let i = 0; i < 5; i++) {
      const d = new Date(currentWeekStart);
      d.setDate(currentWeekStart.getDate() + i);
      dates.push(toLocalISOString(d));
    }

    const cloneInstances = (instances: DailyTaskInstance[]) => {
      return instances.map(inst => ({
        ...inst,
        id: Math.random().toString(36).substring(2, 9),
        completed: false
      }));
    };

    const updatedPlans = dates.map(dateStr => ({
      date: dateStr,
      morning: cloneInstances(copiedPlan.morning),
      lunch: cloneInstances(copiedPlan.lunch),
      dinner: cloneInstances(copiedPlan.dinner)
    }));

    setDayPlans(prev => {
      const filtered = prev.filter(p => !dates.includes(p.date));
      return [...filtered, ...updatedPlans];
    });

    try {
      await Promise.all(
        updatedPlans.map(plan => 
          client.api['day-plans'].$post({
            json: {
              date: plan.date,
              childId: activeChild.id,
              morning: plan.morning,
              lunch: plan.lunch,
              dinner: plan.dinner
            }
          })
        )
      );
    } catch (err) {
      console.error("Failed to batch save plans", err);
    }
  };

  const handleCreateChild = async (name: string) => {
    if (!name.trim()) return;
    const newChild: Child = {
      id: Math.random().toString(36).substring(2, 9),
      name
    };

    setChildren(prev => [...prev, newChild]);
    if (children.length === 0) {
      setActiveChild(newChild);
    }

    try {
      await client.api.children.$post({ json: newChild });
      const tasksRes = await client.api.tasks.$get({ query: { childId: newChild.id } });
      if (tasksRes.ok) {
        const loadedTasks = await tasksRes.json();
        if (activeChild?.id === newChild.id) {
          setTasks(loadedTasks);
        }
      }
    } catch (err) {
      console.error("Failed to create child", err);
    }
  };

  const handleDeleteChild = async (id: string) => {
    if (children.length <= 1) return;

    setChildren(prev => prev.filter(c => c.id !== id));
    
    if (activeChild?.id === id) {
      const remaining = children.filter(c => c.id !== id);
      setActiveChild(remaining[0] || null);
    }

    try {
      await client.api.children[":id"].$delete({ param: { id } });
    } catch (err) {
      console.error("Failed to delete child", err);
    }
  };

  const handleLogin = async (name: string, passcode: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await client.api.auth.login.$post({ json: { name, passcode } });
      const data = await res.json();
      if (res.ok && data && 'family' in data && 'token' in data) {
        localStorage.setItem('token', data.token as string);
        setFamily(data.family as any);
        return { success: true };
      } else {
        const errorMsg = data && 'error' in data && typeof data.error === 'string' ? data.error : 'ログインに失敗しました';
        return { success: false, error: errorMsg };
      }
    } catch (err) {
      console.error(err);
      return { success: false, error: '通信エラーが発生しました' };
    }
  };

  const handleRegister = async (name: string, passcode: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await client.api.auth.register.$post({ json: { name, passcode } });
      const data = await res.json();
      if (res.ok && data && 'family' in data && 'token' in data) {
        localStorage.setItem('token', data.token as string);
        setFamily(data.family as any);
        return { success: true };
      } else {
        const errorMsg = data && 'error' in data && typeof data.error === 'string' ? data.error : '登録に失敗しました';
        return { success: false, error: errorMsg };
      }
    } catch (err) {
      console.error(err);
      return { success: false, error: '通信エラーが発生しました' };
    }
  };

  const handleLogout = async () => {
    try {
      await client.api.auth.logout.$post();
    } catch (err) {
      console.error("Failed to logout", err);
    } finally {
      localStorage.removeItem('token');
      setFamily(null);
      setActiveTab('today');
    }
  };

  return {
    family,
    authLoading,
    activeTab,
    setActiveTab,
    children,
    activeChild,
    setActiveChild,
    tasks,
    dayPlans,
    loading,
    selectedDate,
    setSelectedDate,
    currentWeekStart,
    setCurrentWeekStart,
    copiedPlan,
    getDayPlan,
    changeWeek,
    offsetSelectedDate,
    handleCreateTask,
    handleDeleteStockTask,
    addTaskToMeal,
    removeTaskFromMeal,
    toggleTaskCompletion,
    updateTaskPages,
    handleUnitChange,
    copyCurrentDayPlan,
    pasteToDayPlan,
    pasteToWeekdays,
    handleCreateChild,
    handleDeleteChild,
    handleLogin,
    handleRegister,
    handleLogout
  };
};
