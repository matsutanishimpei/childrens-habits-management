import React, { useState } from 'react';
import { Plus, Trash2, Users } from 'lucide-react';
import { Child } from '@my-app/shared';

interface ChildSettingsProps {
  childrenList: Child[];
  handleCreateChild: (name: string) => void;
  handleDeleteChild: (id: string) => void;
}

export const ChildSettings: React.FC<ChildSettingsProps> = ({
  childrenList,
  handleCreateChild,
  handleDeleteChild,
}) => {
  const [newChildName, setNewChildName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChildName.trim()) return;
    handleCreateChild(newChildName);
    setNewChildName('');
  };

  return (
    <div className="flex flex-col gap-5">
      {/* 子ども追加フォーム */}
      <div className="bg-white p-5 rounded-2xl border border-stone-200 card-shadow flex flex-col gap-4">
        <div>
          <h2 className="text-md font-bold text-stone-800">子ども設定</h2>
          <p className="text-xs text-stone-500">新しく子どもを登録したり、削除します</p>
        </div>
        
        <form onSubmit={handleSubmit} className="flex gap-2.5">
          <input
            type="text"
            value={newChildName}
            onChange={(e) => setNewChildName(e.target.value)}
            placeholder="子どもの名前 (例: たろう)"
            maxLength={10}
            className="flex-1 px-4 py-2.5 border border-stone-200 rounded-xl text-sm"
            required
          />
          <button
            type="submit"
            className="px-4 py-2.5 bg-stone-800 hover:bg-stone-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            登録
          </button>
        </form>
      </div>

      {/* 子ども一覧 */}
      <div className="flex flex-col gap-2.5">
        {childrenList.map((child) => (
          <div
            key={child.id}
            className="task-item-card"
          >
            <div className="task-item-content">
              <span className="task-item-icon-container bg-stone-100 text-stone-700">
                <Users className="w-4 h-4" />
              </span>
              <div className="task-item-text-group">
                <span className="task-item-name">{child.name}</span>
                <span className="task-item-category">子ども</span>
              </div>
            </div>
            
            {childrenList.length > 1 ? (
              <button
                onClick={() => handleDeleteChild(child.id)}
                className="p-2 rounded-lg text-stone-400 hover:text-red-500 hover:bg-red-50 transition-colors active:scale-95"
                title="子どもを削除"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            ) : (
              <span className="p-2 text-stone-300 italic text-[10px]" title="最後の子どもは削除できません">
                削除不可
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
