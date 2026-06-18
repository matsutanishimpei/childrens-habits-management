import React, { useState } from 'react';
import { Plus, Trash2, Users, X } from 'lucide-react';
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
  const [showForm, setShowForm] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChildName.trim()) return;
    handleCreateChild(newChildName);
    setNewChildName('');
    setShowForm(false);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* ヘッダー: タスク設定と同じレイアウト */}
      <div className="bg-white p-4 rounded-2xl border border-stone-200 card-shadow flex justify-between items-center">
        <div>
          <h2 className="text-md font-bold text-stone-800">子ども設定</h2>
          <p className="text-xs text-stone-500">新しく子どもを登録したり、削除します</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="action-btn-add-large"
          title="新しい子どもを登録"
        >
          {showForm ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
        </button>
      </div>

      {/* 追加フォーム（トグル表示） */}
      {showForm && (
        <form onSubmit={handleSubmit} className="flex gap-2.5">
          <input
            type="text"
            value={newChildName}
            onChange={(e) => setNewChildName(e.target.value)}
            placeholder="子どもの名前 (例: たろう)"
            maxLength={10}
            className="flex-1 px-4 py-2.5 border border-stone-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-stone-400 focus:ring-offset-2 transition-all"
            autoFocus
            required
          />
          <button
            type="submit"
            className="px-5 py-2.5 bg-stone-800 hover:bg-stone-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            登録
          </button>
        </form>
      )}

      {/* 子ども一覧 */}
      <div className="flex flex-col gap-2">
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

        {childrenList.length === 0 && (
          <div className="text-center py-10 bg-white border border-dashed border-stone-200 rounded-xl text-stone-400 italic text-xs">
            子どもが登録されていません。上のボタンから追加してください。
          </div>
        )}
      </div>
    </div>
  );
};
