import React from 'react';
import { DayPlan } from '@my-app/shared';
import { toLocalISOString } from '../utils/date';

interface CalendarSliderProps {
  weekDates: Date[];
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  getDayPlan: (dateStr: string) => DayPlan;
  setActiveDropdownBox: (box: 'morning' | 'lunch' | 'dinner' | null) => void;
}

export const CalendarSlider: React.FC<CalendarSliderProps> = ({
  weekDates,
  selectedDate,
  setSelectedDate,
  getDayPlan,
  setActiveDropdownBox,
}) => {
  return (
    <div className="grid grid-cols-7 gap-1.5">
      {weekDates.map(date => {
        const dateStr = toLocalISOString(date);
        const isSelected = selectedDate === dateStr;
        const plan = getDayPlan(dateStr);
        const hasPlans = (plan.morning?.length || 0) > 0 || 
                         (plan.lunch?.length || 0) > 0 || 
                         (plan.dinner?.length || 0) > 0;
        const isToday = toLocalISOString(new Date()) === dateStr;
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
  );
};
