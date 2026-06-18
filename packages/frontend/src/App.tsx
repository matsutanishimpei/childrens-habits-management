import React, { useState, useEffect, useRef } from 'react';
import { 
  Pencil, Book, Flower2, Star, Paintbrush, Utensils, Smile, 
  Plus, Trash2, ChevronLeft, ChevronRight, Check, X, 
  Sparkles, Coffee, Moon, Soup, HelpCircle, CheckSquare, Calendar, Settings,
  Copy, Clipboard
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Task, DailyTaskInstance, DayPlan } from '@my-app/shared';

// アイコンマッピング
const getIcon = (iconName: string, className = "w-5 h-5") => {
  switch (iconName) {
    case 'pencil': return <Pencil className={className} />;
    case 'book': return <Book className={className} />;
    case 'flower': return <Flower2 className={className} />;
    case 'star': return <Star className={className} />;
    case 'brush': return <Paintbrush className={className} />;
    case 'utensils': return <Utensils className={className} />;
    case 'smile': return <Smile className={className} />;
    default: return <Sparkles className={className} />;
  }
};

const ICON_OPTIONS = [
  { name: 'pencil', label: 'えんぴつ' },
  { name: 'book', label: 'ほん' },
  { name: 'flower', label: 'おはな' },
  { name: 'star', label: 'ほし' },
  { name: 'brush', label: 'えのぐ' },
  { name: 'utensils', label: 'おてつだい' },
  { name: 'smile', label: 'たいそう' }
];

// 単位抽出とクイックボタン制御のヘルパー
const UNITS = ['ページ', '回', '問', '章', '分'] as const;
type UnitType = typeof UNITS[number];

const detectUnit = (pagesVal: string | undefined): UnitType => {
  if (!pagesVal) return 'ページ';
  for (const unit of UNITS) {
    if (pagesVal.endsWith(unit)) return unit;
  }
  for (const unit of UNITS) {
    if (pagesVal.includes(unit)) return unit;
  }
  return 'ページ';
};

const getQuickOptions = (unit: UnitType): string[] => {
  switch (unit) {
    case 'ページ': return ['1ページ', '2ページ', '7ページ'];
    case '回': return ['1回', '2回', '3回'];
    case '問': return ['5問', '10問', '20問'];
    case '章': return ['1章', '2章', '3章'];
    case '分': return ['10分', '15分', '30分'];
    default: return ['1ページ', '2ページ', '7ページ'];
  }
};

const DEFAULT_TASKS: Task[] = [
  { id: '1', name: 'さんすうドリル', icon: 'pencil', category: 'homework' },
  { id: '2', name: 'こくごドリル', icon: 'pencil', category: 'homework' },
  { id: '3', name: 'おんどく（音読）', icon: 'book', category: 'homework' },
  { id: '4', name: 'あさがおの水やり', icon: 'flower', category: 'habit' },
  { id: '5', name: 'ラジオ体操', icon: 'smile', category: 'habit' },
  { id: '6', name: 'はみがき（歯磨き）', icon: 'star', category: 'habit' },
];

export const App = () => {
  // ナビゲーション状態 ('today': 今日のチェック, 'plan': スケジュール計画, 'tasks': タスクマスタ設定)
  const [activeTab, setActiveTab] = useState<'today' | 'plan' | 'tasks'>('today');

  // 状態管理
  const [copiedPlan, setCopiedPlan] = useState<{
    morning: DailyTaskInstance[];
    lunch: DailyTaskInstance[];
    dinner: DailyTaskInstance[];
  } | null>(null);

  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem('summer_tasks');
    return saved ? JSON.parse(saved) : DEFAULT_TASKS;
  });

  const [dayPlans, setDayPlans] = useState<DayPlan[]>(() => {
    const saved = localStorage.getItem('summer_day_plans');
    return saved ? JSON.parse(saved) : [];
  });

  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const start = new Date(d.setDate(diff));
    start.setHours(0, 0, 0, 0);
    return start;
  });

  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const d = new Date();
    return d.toISOString().split('T')[0];
  });

  // 操作状態
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [newTaskName, setNewTaskName] = useState('');
  const [newTaskIcon, setNewTaskIcon] = useState('pencil');
  const [newTaskCategory, setNewTaskCategory] = useState<'homework' | 'habit' | 'other'>('homework');

  // 時間帯ボックス用ドロップダウン状態
  const [activeDropdownBox, setActiveDropdownBox] = useState<'morning' | 'lunch' | 'dinner' | null>(null);

  // ローカルストレージ自動保存
  useEffect(() => {
    localStorage.setItem('summer_tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    localStorage.setItem('summer_day_plans', JSON.stringify(dayPlans));
  }, [dayPlans]);

  // カレンダーの日付生成
  const weekDates = [];
  for (let i = 0; i < 7; i++) {
    const nextDate = new Date(currentWeekStart);
    nextDate.setDate(currentWeekStart.getDate() + i);
    weekDates.push(nextDate);
  }

  const changeWeek = (offset: number) => {
    const newStart = new Date(currentWeekStart);
    newStart.setDate(currentWeekStart.getDate() + offset * 7);
    setCurrentWeekStart(newStart);
  };

  // 選択日を前後に1日ずらす（今日のチェック画面用）
  const offsetSelectedDate = (days: number) => {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() + days);
    setSelectedDate(current.toISOString().split('T')[0]);
  };

  const formatDateLabelParent = (date: Date) => {
    const dayNames = ['日', '月', '火', '水', '木', '金', '土'];
    return `${date.getMonth() + 1}月${date.getDate()}日(${dayNames[date.getDay()]})`;
  };

  const getDayPlan = (dateStr: string): DayPlan => {
    const plan = dayPlans.find(p => p.date === dateStr);
    return plan || { date: dateStr, morning: [], lunch: [], dinner: [] };
  };

  const updateDayPlan = (updatedPlan: DayPlan) => {
    setDayPlans(prev => {
      const filtered = prev.filter(p => p.date !== updatedPlan.date);
      return [...filtered, updatedPlan];
    });
  };

  const addTaskToMeal = (taskId: string, dateStr: string, meal: 'morning' | 'lunch' | 'dinner') => {
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
    updateDayPlan(updated);
  };

  const updateTaskPages = (dateStr: string, meal: 'morning' | 'lunch' | 'dinner', instanceId: string, pagesValue: string) => {
    const plan = getDayPlan(dateStr);
    const updated = {
      ...plan,
      [meal]: plan[meal].map(inst => 
        inst.id === instanceId ? { ...inst, pages: pagesValue } : inst
      )
    };
    updateDayPlan(updated);
  };

  const handleUnitChange = (dateStr: string, meal: 'morning' | 'lunch' | 'dinner', instanceId: string, currentVal: string | undefined, newUnit: UnitType) => {
    const numMatch = currentVal ? currentVal.match(/\d+/) : null;
    const num = numMatch ? numMatch[0] : '1';
    const newVal = `${num}${newUnit}`;
    updateTaskPages(dateStr, meal, instanceId, newVal);
  };

  const isCustomValue = (val: string | undefined, unit: UnitType): boolean => {
    if (!val) return false;
    const options = getQuickOptions(unit);
    return !options.includes(val);
  };

  // 日付の全タスク（朝・昼・夜）をコピー
  const copyCurrentDayPlan = (dateStr: string) => {
    const plan = getDayPlan(dateStr);
    setCopiedPlan({
      morning: plan.morning,
      lunch: plan.lunch,
      dinner: plan.dinner
    });
  };

  // コピーされた予定から新しいインスタンスIDを生成して特定の日に貼り付け
  const pasteToDayPlan = (dateStr: string) => {
    if (!copiedPlan) return;

    const cloneInstances = (instances: DailyTaskInstance[]) => {
      return instances.map(inst => ({
        ...inst,
        id: Math.random().toString(36).substring(2, 9),
        completed: false // コピペ時は未完了にする
      }));
    };

    const updated: DayPlan = {
      date: dateStr,
      morning: cloneInstances(copiedPlan.morning),
      lunch: cloneInstances(copiedPlan.lunch),
      dinner: cloneInstances(copiedPlan.dinner)
    };

    updateDayPlan(updated);
  };

  // コピーされた予定をその週の月〜金の平日に一括で貼り付け
  const pasteToWeekdays = () => {
    if (!copiedPlan) return;

    setDayPlans(prev => {
      const weekdaysStrs = [0, 1, 2, 3, 4].map(i => {
        const d = new Date(currentWeekStart);
        d.setDate(currentWeekStart.getDate() + i);
        return d.toISOString().split('T')[0];
      });

      const cloneInstances = (instances: DailyTaskInstance[]) => {
        return instances.map(inst => ({
          ...inst,
          id: Math.random().toString(36).substring(2, 9),
          completed: false
        }));
      };

      const filtered = prev.filter(p => !weekdaysStrs.includes(p.date));

      const newPlans = weekdaysStrs.map(dateStr => ({
        date: dateStr,
        morning: cloneInstances(copiedPlan.morning),
        lunch: cloneInstances(copiedPlan.lunch),
        dinner: cloneInstances(copiedPlan.dinner)
      }));

      return [...filtered, ...newPlans];
    });
  };

  const toggleTaskCompletion = (dateStr: string, meal: 'morning' | 'lunch' | 'dinner', instanceId: string) => {
    const plan = getDayPlan(dateStr);
    const updated = {
      ...plan,
      [meal]: plan[meal].map(inst => 
        inst.id === instanceId ? { ...inst, completed: !inst.completed } : inst
      )
    };
    updateDayPlan(updated);
  };

  const removeTaskFromMeal = (e: React.MouseEvent, dateStr: string, meal: 'morning' | 'lunch' | 'dinner', instanceId: string) => {
    e.stopPropagation();
    const plan = getDayPlan(dateStr);
    const updated = {
      ...plan,
      [meal]: plan[meal].filter(inst => inst.id !== instanceId)
    };
    updateDayPlan(updated);
  };

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskName.trim()) return;
    const newTask: Task = {
      id: Math.random().toString(36).substring(2, 9),
      name: newTaskName,
      icon: newTaskIcon,
      category: newTaskCategory
    };
    setTasks(prev => [...prev, newTask]);
    setNewTaskName('');
    setShowAddTaskModal(false);
  };

  const handleDeleteStockTask = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setTasks(prev => prev.filter(t => t.id !== id));
  };

  const dropdownRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setActiveDropdownBox(null);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const selectedPlan = getDayPlan(selectedDate);

  // 時間帯ボックスのレンダリングヘルパー (チェック画面と計画画面で再利用)
  const renderMealBox = (meal: 'morning' | 'lunch' | 'dinner', mode: 'check' | 'plan') => {
    const plan = selectedPlan[meal];
    const mealLabel = meal === 'morning' ? '朝食後' : meal === 'lunch' ? '昼食後' : '夕食後';
    const mealIcon = meal === 'morning' 
      ? <Soup className="w-5 h-5 text-amber-600" /> 
      : meal === 'lunch' 
        ? <Coffee className="w-5 h-5 text-teal-600" /> 
        : <Moon className="w-5 h-5 text-indigo-600" />;
    
    const mealClass = meal === 'morning' ? 'meal-box-morning' : meal === 'lunch' ? 'meal-box-lunch' : 'meal-box-dinner';

    return (
      <div key={meal} className={`p-5 rounded-2xl transition-all shadow-sm ${mealClass}`}>
        {/* ボックスヘッダー */}
        <div className="flex justify-between items-center mb-3">
          <div className="flex items-center gap-2">
            {mealIcon}
            <span className="font-bold text-sm text-stone-700">{mealLabel}</span>
          </div>
          
          {/* 計画モードの時だけ「追加」ドロップダウンを表示 */}
          {mode === 'plan' && (
            <div className="relative no-print">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveDropdownBox(activeDropdownBox === meal ? null : meal);
                }}
                className="action-btn-add"
              >
                <Plus className="w-3 h-3" />
                追加
              </button>

              <AnimatePresence>
                {activeDropdownBox === meal && (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    className="absolute right-0 mt-1.5 w-60 bg-white border border-stone-200 rounded-xl shadow-lg z-20 py-1.5 max-h-60 overflow-y-auto"
                  >
                    <div className="px-3 py-1 text-[10px] font-bold text-stone-400 border-b border-stone-100 mb-1">
                      タスクを選択して追加
                    </div>
                    {tasks.map(task => (
                      <button
                        key={task.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          addTaskToMeal(task.id, selectedDate, meal);
                          setActiveDropdownBox(null);
                        }}
                        className="w-full px-3 py-2 text-left text-xs font-semibold hover:bg-stone-50 transition-colors flex items-center gap-2 text-stone-700"
                      >
                        {getIcon(task.icon, "w-3.5 h-3.5 text-stone-500")}
                        {task.name}
                      </button>
                    ))}
                    {tasks.length === 0 && (
                      <div className="px-3 py-3 text-center text-xs text-stone-400 italic">
                        登録タスクがありません。「タスク設定」から作成してください
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* タスク一覧 */}
        <div className="flex flex-col gap-3 min-h-[50px]">
          {plan.length === 0 ? (
            <div className="text-xs text-stone-400 flex items-center justify-center w-full py-4 border border-dashed border-stone-200/40 rounded-xl bg-white/40 font-medium">
              {mode === 'plan' ? '右上の「追加」から登録してください。' : '予定されているタスクはありません。'}
            </div>
          ) : (
            plan.map(inst => {
              const originalTask = tasks.find(t => t.id === inst.taskId);
              if (!originalTask) return null;

              return (
                <div
                  key={inst.id}
                  onClick={() => mode === 'check' && toggleTaskCompletion(selectedDate, meal, inst.id)}
                  className={`task-instance-card transition-all ${
                    mode === 'check' ? 'cursor-pointer active:scale-98' : 'cursor-default'
                  } ${
                    inst.completed && mode === 'check'
                      ? 'completed' 
                      : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {mode === 'check' ? (
                        <span className={`w-6 h-6 rounded-full flex items-center justify-center border text-white transition-all ${
                          inst.completed ? 'bg-teal-600 border-teal-600' : 'border-stone-300 bg-stone-50'
                        }`}>
                          {inst.completed && <Check className="w-4 h-4" />}
                        </span>
                      ) : (
                        <span className="text-stone-500 flex items-center justify-center bg-stone-50 border border-stone-200 rounded-lg p-1">
                          {getIcon(originalTask.icon, "w-4 h-4")}
                        </span>
                      )}
                      <span className={`text-sm font-semibold flex items-center gap-1.5 ${inst.completed && mode === 'check' ? 'line-through text-stone-400' : 'text-stone-800'}`}>
                        {originalTask.name}
                        {inst.pages && (
                          <span className="text-xs text-teal-600 font-bold bg-teal-50 px-1.5 py-0.5 rounded border border-teal-100 flex-shrink-0">
                            {inst.pages}
                          </span>
                        )}
                      </span>
                    </div>
                    
                    {/* 計画モードの時だけ削除バツボタンを表示 */}
                    {mode === 'plan' && (
                      <button
                        onClick={(e) => removeTaskFromMeal(e, selectedDate, meal, inst.id)}
                        className="p-1 rounded-md text-stone-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                        title="予定から削除"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* 計画モードの時、すべてのタスクに対してページ/量指定UIを表示 */}
                  {mode === 'plan' && (() => {
                    const currentUnit = detectUnit(inst.pages);
                    const quickOptions = getQuickOptions(currentUnit);
                    const customActive = isCustomValue(inst.pages, currentUnit);

                    return (
                      <div className="mt-2.5 pt-2 border-t border-stone-100 flex flex-wrap items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                        <select
                          value={currentUnit}
                          onChange={(e) => handleUnitChange(selectedDate, meal, inst.id, inst.pages, e.target.value as UnitType)}
                          className="px-1.5 py-0.5 text-[10px] border border-stone-200 rounded bg-stone-50 text-stone-700 font-bold focus:ring-1 focus:ring-stone-400 focus:border-stone-400"
                        >
                          {UNITS.map(u => (
                            <option key={u} value={u}>{u}</option>
                          ))}
                        </select>
                        
                        {quickOptions.map(optionVal => (
                          <button
                            key={optionVal}
                            type="button"
                            onClick={() => updateTaskPages(selectedDate, meal, inst.id, inst.pages === optionVal ? '' : optionVal)}
                            className={`quick-value-btn ${inst.pages === optionVal ? 'selected' : ''}`}
                          >
                            {optionVal}
                          </button>
                        ))}
                        
                        {/* 自由入力用インプット */}
                        <input
                          type="text"
                          placeholder="自由入力 (例: 10問以上)"
                          value={customActive ? (inst.pages || '') : ''}
                          onChange={(e) => updateTaskPages(selectedDate, meal, inst.id, e.target.value)}
                          className={`px-2 py-0.5 text-[10px] border rounded transition-all w-28 font-medium ${
                            customActive 
                              ? 'border-teal-500 bg-white ring-1 ring-teal-500 text-stone-900' 
                              : 'border-stone-200 bg-stone-50/50 hover:bg-white text-stone-700 focus:bg-white focus:ring-1 focus:ring-stone-400 focus:border-stone-400'
                          }`}
                        />
                      </div>
                    );
                  })()}
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col font-sans" style={{ backgroundColor: 'var(--bg-primary)' }}>
      
      {/* ========================================================================= */}
      {/* 画面ヘッダー (どのタブでも共通) */}
      {/* ========================================================================= */}
      <header className="no-print border-b border-stone-200 px-6 py-4 flex justify-between items-center bg-white sticky top-0 z-10 card-shadow">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white" style={{ backgroundColor: 'var(--brand-primary)' }}>
            <Sparkles className="w-5 h-5 text-teal-400" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-stone-900">子ども生活管理</h1>
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* メインビューエリア (各タブの出し分け) */}
      {/* ========================================================================= */}
      <main className="no-print flex-1 max-w-2xl w-full mx-auto p-4 pb-24 flex flex-col gap-6">
        
        {/* 1. 【チェック】今日のチェック画面 */}
        {activeTab === 'today' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex flex-col gap-5"
          >
            {/* 日付切り替えヘッダー */}
            <div className="bg-white p-4 rounded-2xl border border-stone-200 card-shadow flex items-center justify-between">
              <button
                onClick={() => offsetSelectedDate(-1)}
                className="date-nav-btn"
                title="前の日"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="font-bold text-base text-stone-800">
                {formatDateLabelParent(new Date(selectedDate))}
              </span>
              <button
                onClick={() => offsetSelectedDate(1)}
                className="date-nav-btn"
                title="次の日"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* 3食ボックス（チェック専用） */}
            <div className="flex flex-col gap-4">
              {(['morning', 'lunch', 'dinner'] as const).map(meal => renderMealBox(meal, 'check'))}
            </div>
          </motion.div>
        )}

        {/* 2. 【計画作成】週の計画画面 */}
        {activeTab === 'plan' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex flex-col gap-5"
          >
            {/* カレンダー週表示と印刷ボタン */}
            <div className="bg-white p-4 rounded-2xl border border-stone-200 card-shadow flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <button
                  onClick={() => changeWeek(-1)}
                  className="date-nav-btn"
                  title="前の週"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <span className="font-bold text-sm text-stone-700">
                  {formatDateLabelParent(weekDates[0])} 〜 {formatDateLabelParent(weekDates[6])}
                </span>
                <button
                  onClick={() => changeWeek(1)}
                  className="date-nav-btn"
                  title="次の週"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* カレンダーの曜日選択スライダー */}
            <div className="grid grid-cols-7 gap-1.5">
              {weekDates.map(date => {
                const dateStr = date.toISOString().split('T')[0];
                const isSelected = selectedDate === dateStr;
                const hasPlans = getDayPlan(dateStr).morning.length > 0 || 
                                 getDayPlan(dateStr).lunch.length > 0 || 
                                 getDayPlan(dateStr).dinner.length > 0;
                const isToday = new Date().toISOString().split('T')[0] === dateStr;
                const dayOfWeek = date.getDay();
                const dayLabel = ['日', '月', '火', '水', '木', '金', '土'][dayOfWeek];
                const dayColorClass = dayOfWeek === 6 
                  ? 'text-blue-600' 
                  : dayOfWeek === 0 
                    ? 'text-red-600' 
                    : 'text-stone-800';

                return (
                  <button
                    key={dateStr}
                    onClick={() => {
                      setSelectedDate(dateStr);
                      setActiveDropdownBox(null);
                    }}
                    className={`date-select-btn relative ${
                      isSelected ? 'selected' : ''
                    } ${isToday && !isSelected ? 'ring-2 ring-stone-400 ring-offset-1' : ''}`}
                  >
                    <span className={`text-[9px] opacity-75 font-semibold ${isSelected ? 'text-stone-700' : 'text-stone-500'}`}>
                      {dayLabel}
                    </span>
                    <span className={`text-base font-bold mt-0.5 ${dayColorClass}`}>{date.getDate()}</span>
                    {hasPlans && (
                      <span className={`has-plans-dot ${isSelected ? 'selected' : ''}`} />
                    )}
                  </button>
                );
              })}
            </div>

            {/* コピペ操作パネル */}
            <div className="bg-stone-50/60 border border-stone-200/60 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm my-1">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-stone-100 flex items-center justify-center text-stone-600 flex-shrink-0">
                  <Clipboard className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <h4 className="text-xs font-bold text-stone-700">予定のコピー・貼り付け</h4>
                </div>
              </div>
              
              <div className="flex flex-wrap gap-2 w-full md:w-auto justify-end">
                <button
                  type="button"
                  onClick={() => copyCurrentDayPlan(selectedDate)}
                  className="clipboard-btn clipboard-btn-copy"
                >
                  <Copy className="w-3.5 h-3.5 text-stone-500" />
                  予定をコピー
                </button>
                {copiedPlan && (
                  <>
                    <button
                      type="button"
                      onClick={() => pasteToDayPlan(selectedDate)}
                      className="clipboard-btn clipboard-btn-paste"
                    >
                      <Clipboard className="w-3.5 h-3.5 text-stone-300" />
                      この日に貼り付け
                    </button>
                    <button
                      type="button"
                      onClick={pasteToWeekdays}
                      className="clipboard-btn clipboard-btn-weekdays"
                      title="表示中の週の月曜から金曜の予定を上書きします"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-teal-600" />
                      平日に一括貼り付け
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* 3食ボックス（計画追加・削除が可能） */}
            <div className="flex flex-col gap-4" ref={dropdownRef}>
              {(['morning', 'lunch', 'dinner'] as const).map(meal => renderMealBox(meal, 'plan'))}
            </div>
          </motion.div>
        )}

        {/* 3. 【タスク設定】タスク登録・マスタ管理画面 */}
        {activeTab === 'tasks' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex flex-col gap-4"
          >
            <div className="bg-white p-4 rounded-2xl border border-stone-200 card-shadow flex justify-between items-center">
              <div>
                <h2 className="text-md font-bold text-stone-800">登録タスク一覧</h2>
                <p className="text-xs text-stone-500">宿題や習慣などのタスク素材</p>
              </div>
              <button
                onClick={() => setShowAddTaskModal(true)}
                className="action-btn-add-large"
                title="新しいタスクを作成"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>

            {/* タスク一覧 */}
            <div className="flex flex-col gap-2">
              {tasks.map(task => (
                <div
                  key={task.id}
                  className="task-item-card"
                >
                  <div className="task-item-content">
                    <span className={`task-item-icon-container ${task.category === 'homework' ? 'bg-amber-100 text-amber-700' : 'bg-teal-100 text-teal-700'}`}>
                      {getIcon(task.icon, "w-4 h-4")}
                    </span>
                    <div className="task-item-text-group">
                      <span className="task-item-name">{task.name}</span>
                      <span className="task-item-category">
                        {task.category === 'homework' ? 'しゅくだい' : task.category === 'habit' ? 'せいかつ習慣' : 'その他'}
                      </span>
                    </div>
                  </div>
                  
                  <button
                    onClick={(e) => handleDeleteStockTask(task.id, e)}
                    className="p-2 rounded-lg text-stone-400 hover:text-red-500 hover:bg-red-50 transition-colors active:scale-95"
                    title="タスクを削除"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}

              {tasks.length === 0 && (
                <div className="text-center py-10 bg-white border border-dashed border-stone-200 rounded-xl text-stone-400 italic text-xs">
                  タスクが登録されていません。下のボタンから追加してください。
                </div>
              )}
            </div>


          </motion.div>
        )}

        <div className="bottom-nav-placeholder" />
      </main>

      {/* ========================================================================= */}
      {/* 下部ナビゲーションバー (親用) */}
      {/* ========================================================================= */}
      <nav className="no-print bottom-nav">
        <button 
          onClick={() => setActiveTab('today')}
          className={`nav-button ${activeTab === 'today' ? 'active' : ''}`}
        >
          <div className="nav-icon-wrapper">
            <CheckSquare className="w-5 h-5" />
          </div>
          今日のチェック
        </button>
        
        <button 
          onClick={() => setActiveTab('plan')}
          className={`nav-button ${activeTab === 'plan' ? 'active' : ''}`}
        >
          <div className="nav-icon-wrapper">
            <Calendar className="w-5 h-5" />
          </div>
          週の計画作成
        </button>
        
        <button 
          onClick={() => setActiveTab('tasks')}
          className={`nav-button ${activeTab === 'tasks' ? 'active' : ''}`}
        >
          <div className="nav-icon-wrapper">
            <Settings className="w-5 h-5" />
          </div>
          タスク設定
        </button>
      </nav>

      {/* 新規タスク追加モーダル */}
      <AnimatePresence>
        {showAddTaskModal && (
          <div className="modal-overlay">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="modal-content"
            >
              <div className="flex justify-between items-center border-b border-stone-100 pb-3">
                <h3 className="text-md font-bold text-stone-800">新規タスクの登録</h3>
                <button
                  onClick={() => setShowAddTaskModal(false)}
                  className="p-1.5 rounded-lg text-stone-400 hover:bg-stone-50 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleCreateTask} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-stone-600">タスク名</label>
                  <input
                    type="text"
                    value={newTaskName}
                    onChange={(e) => setNewTaskName(e.target.value)}
                    placeholder="例: 算数ドリル"
                    maxLength={15}
                    className="px-4 py-3 border border-stone-200 rounded-xl text-sm"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-stone-600">カテゴリー</label>
                  <select
                    value={newTaskCategory}
                    onChange={(e) => setNewTaskCategory(e.target.value as any)}
                    className="px-4 py-3 border border-stone-200 rounded-xl text-sm bg-white"
                  >
                    <option value="homework">宿題（ドリル・音読など）</option>
                    <option value="habit">生活習慣（アサガオ・ラジオ体操など）</option>
                    <option value="other">その他</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-stone-600">アイコン</label>
                  <div className="icon-select-grid">
                    {ICON_OPTIONS.map(option => (
                      <button
                        key={option.name}
                        type="button"
                        onClick={() => setNewTaskIcon(option.name)}
                        className={`icon-select-button ${newTaskIcon === option.name ? 'active' : ''}`}
                      >
                        {getIcon(option.name, "w-5 h-5 text-stone-700")}
                        <span className="text-[10px] mt-1 text-stone-500">{option.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  className="modal-submit-btn"
                >
                  登録する
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>


    </div>
  );
};
