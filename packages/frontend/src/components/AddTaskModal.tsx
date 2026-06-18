import React, { useState } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getIcon, ICON_OPTIONS } from '../utils/icons';

interface AddTaskModalProps {
  showAddTaskModal: boolean;
  setShowAddTaskModal: (show: boolean) => void;
  handleCreateTask: (name: string, icon: string, category: 'homework' | 'habit' | 'other') => void;
}

export const AddTaskModal: React.FC<AddTaskModalProps> = ({
  showAddTaskModal,
  setShowAddTaskModal,
  handleCreateTask,
}) => {
  const [newTaskName, setNewTaskName] = useState('');
  const [newTaskIcon, setNewTaskIcon] = useState('pencil');
  const [newTaskCategory, setNewTaskCategory] = useState<'homework' | 'habit' | 'other'>('homework');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskName.trim()) return;
    handleCreateTask(newTaskName, newTaskIcon, newTaskCategory);
    setNewTaskName('');
    setShowAddTaskModal(false);
  };

  return (
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

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
  );
};
