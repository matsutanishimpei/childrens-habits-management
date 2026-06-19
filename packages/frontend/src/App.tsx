import React, { useState, useRef, useEffect } from 'react';
import { 
  Sparkles, ChevronLeft, ChevronRight, CheckSquare, Calendar, Award, Settings,
  Copy, Clipboard, Users, LogOut
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useApp } from './hooks/useApp';
import { ChildSelector } from './components/ChildSelector';
import { MealBox } from './components/MealBox';
import { CalendarSlider } from './components/CalendarSlider';
import { TaskSettings } from './components/TaskSettings';
import { AddTaskModal } from './components/AddTaskModal';
import { ChildSettings } from './components/ChildSettings';
import { MonthCalendar } from './components/MonthCalendar';
import { AuthView } from './components/AuthView';

export const App = () => {
  const {
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
  } = useApp();

  const [showAddTaskModal, setShowAddTaskModal] = useState(false);
  const [activeDropdownBox, setActiveDropdownBox] = useState<'morning' | 'lunch' | 'dinner' | null>(null);

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

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-4 border-stone-800 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-bold text-stone-500">よみこみ中...</span>
        </div>
      </div>
    );
  }

  if (!family) {
    return (
      <AuthView
        onLogin={handleLogin}
        onRegister={handleRegister}
      />
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-4 border-stone-800 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-bold text-stone-500">データをロード中...</span>
        </div>
      </div>
    );
  }

  const selectedPlan = getDayPlan(selectedDate);

  // カレンダーの日付生成
  const weekDates = [];
  for (let i = 0; i < 7; i++) {
    const nextDate = new Date(currentWeekStart);
    nextDate.setDate(currentWeekStart.getDate() + i);
    weekDates.push(nextDate);
  }

  const formatDateLabelParent = (date: Date) => {
    const dayNames = ['日', '月', '火', '水', '木', '金', '土'];
    return `${date.getMonth() + 1}月${date.getDate()}日(${dayNames[date.getDay()]})`;
  };

  const renderMealBox = (meal: 'morning' | 'lunch' | 'dinner', mode: 'check' | 'plan') => {
    return (
      <MealBox
        key={meal}
        meal={meal}
        mode={mode}
        selectedDate={selectedDate}
        tasks={tasks}
        dayPlan={selectedPlan}
        activeDropdownBox={activeDropdownBox}
        setActiveDropdownBox={setActiveDropdownBox}
        addTaskToMeal={addTaskToMeal}
        removeTaskFromMeal={removeTaskFromMeal}
        toggleTaskCompletion={toggleTaskCompletion}
        updateTaskPages={updateTaskPages}
        handleUnitChange={handleUnitChange}
      />
    );
  };

  return (
    <div className="min-h-screen flex flex-col font-sans" style={{ backgroundColor: 'var(--bg-primary)' }}>
      {/* 画面ヘッダー */}
      <header className="no-print border-b border-stone-200 px-6 py-4 flex flex-col sm:flex-row gap-3 sm:gap-0 justify-between items-center bg-white sticky top-0 z-10 card-shadow">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg overflow-hidden shadow-sm ring-1 ring-stone-200 flex items-center justify-center shrink-0" style={{ backgroundColor: 'var(--brand-primary)' }}>
            <img src="/title-icon.png" alt="ハビっとのアイコン" className="w-7 h-7 object-cover" />
          </div>
          <div className="text-left">
            <h1 className="flex items-center gap-1 text-lg font-bold tracking-tight text-stone-900 leading-none">
              <span>ハビっと</span>
            </h1>
            <p className="text-[10px] text-stone-400 font-bold leading-tight mt-0.5">{family.name}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {/* 子ども選択UI */}
          <ChildSelector
            childrenList={children}
            activeChild={activeChild}
            setActiveChild={setActiveChild}
          />
          
          {/* ログアウトボタン */}
          <button
            onClick={handleLogout}
            className="date-nav-btn"
            title="ログアウト"
            style={{ marginLeft: '4px' }}
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* メインビューエリア */}
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
            <CalendarSlider
              weekDates={weekDates}
              selectedDate={selectedDate}
              setSelectedDate={setSelectedDate}
              getDayPlan={getDayPlan}
              setActiveDropdownBox={setActiveDropdownBox}
            />

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

        {/* 3. 【月カレンダー】月ごとの達成状況 */}
        {activeTab === 'calendar' && (
          <MonthCalendar
            dayPlans={dayPlans}
            getDayPlan={getDayPlan}
            onDateSelect={(dateStr) => {
              setSelectedDate(dateStr);
              setActiveTab('today');
            }}
          />
        )}

        {/* 4. 【タスク設定】タスク登録・マスタ管理画面 */}
        {activeTab === 'tasks' && (
          <TaskSettings
            tasks={tasks}
            handleDeleteStockTask={handleDeleteStockTask}
            setShowAddTaskModal={setShowAddTaskModal}
          />
        )}

        {/* 5. 【子ども設定】子ども管理画面 */}
        {activeTab === 'children' && (
          <ChildSettings
            childrenList={children}
            handleCreateChild={handleCreateChild}
            handleDeleteChild={handleDeleteChild}
          />
        )}

        <div className="bottom-nav-placeholder" />
      </main>

      {/* 下部ナビゲーションバー */}
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
          onClick={() => setActiveTab('calendar')}
          className={`nav-button ${activeTab === 'calendar' ? 'active' : ''}`}
        >
          <div className="nav-icon-wrapper">
            <Award className="w-5 h-5" />
          </div>
          できた！きろく
        </button>
        
        <button 
          onClick={() => setActiveTab('children')}
          className={`nav-button ${activeTab === 'children' ? 'active' : ''}`}
        >
          <div className="nav-icon-wrapper">
            <Users className="w-5 h-5" />
          </div>
          子ども設定
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
      <AddTaskModal
        showAddTaskModal={showAddTaskModal}
        setShowAddTaskModal={setShowAddTaskModal}
        handleCreateTask={handleCreateTask}
      />
    </div>
  );
}
