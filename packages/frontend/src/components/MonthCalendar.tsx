import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import { DayPlan } from '@my-app/shared';

interface MonthCalendarProps {
  dayPlans: DayPlan[];
  getDayPlan: (dateStr: string) => DayPlan;
  onDateSelect?: (dateStr: string) => void;
}

const DAY_LABELS = ['月', '火', '水', '木', '金', '土', '日'];

/** その日の全タスクが完了しているかを判定 */
const isDayCompleted = (plan: DayPlan): boolean => {
  const allInstances = [...plan.morning, ...plan.lunch, ...plan.dinner];
  if (allInstances.length === 0) return false;
  return allInstances.every(inst => inst.completed);
};

/** その日にタスクが1つでも存在するか */
const hasTasks = (plan: DayPlan): boolean => {
  return plan.morning.length + plan.lunch.length + plan.dinner.length > 0;
};

/** 部分的に完了しているか（一部だけ完了） */
const isPartiallyCompleted = (plan: DayPlan): boolean => {
  const allInstances = [...plan.morning, ...plan.lunch, ...plan.dinner];
  if (allInstances.length === 0) return false;
  const completedCount = allInstances.filter(inst => inst.completed).length;
  return completedCount > 0 && completedCount < allInstances.length;
};

/** 月のグリッドセルを生成 */
const buildMonthCells = (year: number, month: number) => {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startDayIndex = (firstDay.getDay() + 6) % 7; // 月曜始まり
  const prevMonthLastDay = new Date(year, month, 0).getDate();

  const cells: { day: number; inMonth: boolean; dateStr: string }[] = [];

  // 前月埋め
  for (let i = startDayIndex - 1; i >= 0; i--) {
    const d = prevMonthLastDay - i;
    const date = new Date(year, month - 1, d);
    cells.push({ day: d, inMonth: false, dateStr: date.toISOString().split('T')[0] });
  }

  // 当月
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    cells.push({ day: d, inMonth: true, dateStr: date.toISOString().split('T')[0] });
  }

  // 翌月埋め（6行 = 42セル）
  const remaining = 42 - cells.length;
  for (let i = 1; i <= remaining; i++) {
    const date = new Date(year, month + 1, i);
    cells.push({ day: i, inMonth: false, dateStr: date.toISOString().split('T')[0] });
  }

  return cells;
};

/** 単月カレンダーグリッド */
const SingleMonthGrid: React.FC<{
  year: number;
  month: number;
  dayPlans: DayPlan[];
  getDayPlan: (dateStr: string) => DayPlan;
  todayStr: string;
  onDateSelect?: (dateStr: string) => void;
}> = ({ year, month, dayPlans, getDayPlan, todayStr, onDateSelect }) => {
  const cells = buildMonthCells(year, month);
  const monthLabel = `${year}年${month + 1}月`;

  // 達成率
  const monthPrefix = `${year}-${String(month + 1).padStart(2, '0')}`;
  const monthPlans = dayPlans.filter(p => p.date.startsWith(monthPrefix));
  const daysWithTasks = monthPlans.filter(p => hasTasks(p)).length;
  const daysCompleted = monthPlans.filter(p => isDayCompleted(p)).length;

  return (
    <div className="flex flex-col gap-2">
      {/* 月タイトル + 達成サマリー */}
      <div className="flex items-center justify-between px-1">
        <span className="font-bold text-sm text-stone-800">{monthLabel}</span>
        {daysWithTasks > 0 && (
          <div className="flex items-center gap-1.5">
            <CalendarDays className="w-3.5 h-3.5 text-teal-600" />
            <span className="text-[11px] text-stone-500">
              <span className="font-bold text-stone-800">{daysCompleted}</span> / {daysWithTasks} 日達成
            </span>
          </div>
        )}
      </div>

      {/* カレンダーグリッド */}
      <div className="bg-white rounded-2xl border border-stone-200 card-shadow overflow-hidden">
        {/* 曜日ヘッダー */}
        <div className="grid grid-cols-7 border-b border-stone-100">
          {DAY_LABELS.map((label, i) => (
            <div
              key={label}
              className={`text-center py-2 text-[11px] font-bold tracking-wide ${
                i === 5 ? 'text-blue-400' : i === 6 ? 'text-red-400' : 'text-stone-400'
              }`}
            >
              {label}
            </div>
          ))}
        </div>

        {/* 日付セル */}
        <div className="grid grid-cols-7">
          {cells.map((cell, idx) => {
            const plan = getDayPlan(cell.dateStr);
            const completed = isDayCompleted(plan);
            const partial = isPartiallyCompleted(plan);
            const hasTask = hasTasks(plan);
            const isToday = cell.dateStr === todayStr;
            const colIdx = idx % 7;

            return (
              <div
                key={cell.dateStr}
                onClick={() => onDateSelect?.(cell.dateStr)}
                className={`
                  relative flex flex-col items-center justify-start pt-2 pb-3 min-h-[68px]
                  border-b border-r border-stone-50
                  transition-colors duration-150 cursor-pointer hover:bg-stone-50/50
                  ${!cell.inMonth ? 'opacity-30' : ''}
                  ${isToday ? 'bg-stone-50' : ''}
                `}
              >
                {/* 日付番号 */}
                <span
                  className={`
                    text-xs font-medium leading-none
                    ${isToday 
                      ? 'w-6 h-6 flex items-center justify-center rounded-full bg-stone-800 text-white font-bold' 
                      : colIdx === 5 
                        ? 'text-blue-400' 
                        : colIdx === 6 
                          ? 'text-red-400' 
                          : 'text-stone-600'
                    }
                  `}
                >
                  {cell.day}
                </span>

                {/* 完了マーク（余裕のあるスペース） */}
                <div className="flex-1 flex items-center justify-center min-h-[24px]">
                  {cell.inMonth && hasTask && completed ? (
                    <span className="text-lg leading-none" title="全て完了！">⭕</span>
                  ) : cell.inMonth && hasTask && partial ? (
                    <span className="text-lg leading-none opacity-60" title="一部完了">△</span>
                  ) : cell.inMonth && hasTask && !completed && !partial ? (
                    <span className="text-base leading-none text-stone-400 font-bold" title="未着手">×</span>
                  ) : (
                    <span className="text-lg leading-none" style={{ opacity: 0, userSelect: 'none' }} aria-hidden="true">⭕</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export const MonthCalendar: React.FC<MonthCalendarProps> = ({
  dayPlans,
  getDayPlan,
  onDateSelect,
}) => {
  const today = new Date();
  // 「今月」を基準に、前月+今月の2ヶ月を表示
  const [baseYear, setBaseYear] = useState(today.getFullYear());
  const [baseMonth, setBaseMonth] = useState(today.getMonth()); // 0-indexed（今月）

  const navigate = (offset: number) => {
    const d = new Date(baseYear, baseMonth + offset, 1);
    setBaseYear(d.getFullYear());
    setBaseMonth(d.getMonth());
  };

  // 前月の年月
  const prevDate = new Date(baseYear, baseMonth - 1, 1);
  const prevYear = prevDate.getFullYear();
  const prevMonth = prevDate.getMonth();

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="flex flex-col gap-5">
      {/* ナビゲーションヘッダー */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 card-shadow">
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="date-nav-btn"
            title="前の月へ"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="font-bold text-base text-stone-800">
            {prevYear === baseYear
              ? `${prevMonth + 1}月 ・ ${baseMonth + 1}月`
              : `${prevYear}年${prevMonth + 1}月 ・ ${baseYear}年${baseMonth + 1}月`
            }
          </span>
          <button
            onClick={() => navigate(1)}
            className="date-nav-btn"
            title="次の月へ"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* 前月 */}
      <SingleMonthGrid
        year={prevYear}
        month={prevMonth}
        dayPlans={dayPlans}
        getDayPlan={getDayPlan}
        todayStr={todayStr}
        onDateSelect={onDateSelect}
      />

      {/* 今月 */}
      <SingleMonthGrid
        year={baseYear}
        month={baseMonth}
        dayPlans={dayPlans}
        getDayPlan={getDayPlan}
        todayStr={todayStr}
        onDateSelect={onDateSelect}
      />

      {/* 凡例 */}
      <div className="flex items-center justify-center gap-5 py-1">
        <div className="flex items-center gap-1.5">
          <span className="text-sm leading-none">⭕</span>
          <span className="text-[10px] text-stone-400">全て完了</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-sm leading-none opacity-60">△</span>
          <span className="text-[10px] text-stone-400">一部完了</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-base leading-none text-stone-400 font-bold">×</span>
          <span className="text-[10px] text-stone-400">未着手</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] leading-none text-stone-300 bg-stone-50 px-1 py-0.5 rounded border border-stone-200">空白</span>
          <span className="text-[10px] text-stone-400">課題なし</span>
        </div>
      </div>
    </div>
  );
};
