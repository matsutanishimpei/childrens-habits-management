import React from 'react';
import { 
  Soup, Coffee, Moon, Plus, Check, X 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Task, DailyTaskInstance, DayPlan } from '@my-app/shared';
import { getIcon } from '../utils/icons';
import { UNITS, UnitType, detectUnit, getQuickOptions, isCustomValue } from '../hooks/useApp';

interface MealBoxProps {
  meal: 'morning' | 'lunch' | 'dinner';
  mode: 'check' | 'plan';
  selectedDate: string;
  tasks: Task[];
  dayPlan: DayPlan;
  activeDropdownBox: 'morning' | 'lunch' | 'dinner' | null;
  setActiveDropdownBox: (box: 'morning' | 'lunch' | 'dinner' | null) => void;
  addTaskToMeal: (taskId: string, dateStr: string, meal: 'morning' | 'lunch' | 'dinner') => void;
  removeTaskFromMeal: (dateStr: string, meal: 'morning' | 'lunch' | 'dinner', instanceId: string) => void;
  toggleTaskCompletion: (dateStr: string, meal: 'morning' | 'lunch' | 'dinner', instanceId: string) => void;
  updateTaskPages: (dateStr: string, meal: 'morning' | 'lunch' | 'dinner', instanceId: string, pagesValue: string) => void;
  handleUnitChange: (dateStr: string, meal: 'morning' | 'lunch' | 'dinner', instanceId: string, currentVal: string | undefined, newUnit: UnitType) => void;
}

export const MealBox: React.FC<MealBoxProps> = ({
  meal,
  mode,
  selectedDate,
  tasks,
  dayPlan,
  activeDropdownBox,
  setActiveDropdownBox,
  addTaskToMeal,
  removeTaskFromMeal,
  toggleTaskCompletion,
  updateTaskPages,
  handleUnitChange
}) => {
  const plan = dayPlan[meal] || [];
  const mealLabel = meal === 'morning' ? '朝食後' : meal === 'lunch' ? '昼食後' : '夕食後';
  const mealIcon = meal === 'morning' 
    ? <Soup className="w-5 h-5 text-amber-600" /> 
    : meal === 'lunch' 
      ? <Coffee className="w-5 h-5 text-teal-600" /> 
      : <Moon className="w-5 h-5 text-indigo-600" />;
  
  const mealClass = meal === 'morning' ? 'meal-box-morning' : meal === 'lunch' ? 'meal-box-lunch' : 'meal-box-dinner';

  return (
    <div className={`p-5 rounded-2xl transition-all shadow-sm ${mealClass}`}>
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
                      onClick={(e) => {
                        e.stopPropagation();
                        removeTaskFromMeal(selectedDate, meal, inst.id);
                      }}
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
