import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Task } from '@my-app/shared';
import { getIcon } from '../utils/icons';

interface TaskSettingsProps {
  tasks: Task[];
  handleDeleteStockTask: (id: string, e: React.MouseEvent) => void;
  setShowAddTaskModal: (show: boolean) => void;
}

export const TaskSettings: React.FC<TaskSettingsProps> = ({
  tasks,
  handleDeleteStockTask,
  setShowAddTaskModal,
}) => {
  return (
    <div className="flex flex-col gap-4">
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
    </div>
  );
};
