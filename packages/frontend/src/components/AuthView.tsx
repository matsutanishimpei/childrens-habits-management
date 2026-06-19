import React, { useState } from 'react';
import { Sparkles, KeyRound, ArrowRightLeft } from 'lucide-react';
import { motion } from 'framer-motion';

interface AuthViewProps {
  onLogin: (name: string, passcode: string) => Promise<{ success: boolean; error?: string }>;
  onRegister: (name: string, passcode: string) => Promise<{ success: boolean; error?: string }>;
}

export const AuthView: React.FC<AuthViewProps> = ({ onLogin, onRegister }) => {
  const [isLogin, setIsLogin] = useState<boolean>(true);
  const [name, setName] = useState<string>('');
  const [passcode, setPasscode] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !passcode.trim()) {
      setError('家庭名と合言葉の両方を入力してください。');
      return;
    }
    if (passcode.length < 4) {
      setError('合言葉は4文字以上で入力してください。');
      return;
    }

    setError(null);
    setSubmitting(true);

    try {
      const handler = isLogin ? onLogin : onRegister;
      const result = await handler(name.trim(), passcode.trim());
      if (!result.success) {
        setError(result.error || 'エラーが発生しました。');
      }
    } catch (err) {
      setError('通信エラーが発生しました。時間を置いて再度お試しください。');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50/50 p-4 font-sans">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md bg-white p-8 rounded-3xl border border-stone-200 card-shadow text-center flex flex-col gap-6"
      >
        {/* アプリロゴ・ヘッダー */}
        <div className="flex flex-col items-center gap-2">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white bg-stone-800">
            <Sparkles className="w-6 h-6 text-teal-400" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-stone-900 mt-2">
            子どもたちの習慣管理
          </h1>
          <p className="text-xs text-stone-500">
            {isLogin ? '登録済みの家庭名と合言葉でログインします' : '新しい家庭名と合言葉でアカウントを作成します'}
          </p>
        </div>

        {/* ログイン・新規登録切り替えタブ */}
        <div className="flex bg-stone-100 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => {
              setIsLogin(true);
              setError(null);
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all duration-200 ${
              isLogin ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            ログイン
          </button>
          <button
            type="button"
            onClick={() => {
              setIsLogin(false);
              setError(null);
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all duration-200 ${
              !isLogin ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-800'
            }`}
          >
            新規登録
          </button>
        </div>

        {/* フォーム */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4 text-left">
          {error && (
            <div className="p-3.5 bg-red-50 border border-red-100 rounded-xl text-xs font-medium text-red-600">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-stone-600" htmlFor="familyName">
              家庭名
            </label>
            <input
              id="familyName"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例: 佐藤家"
              disabled={submitting}
              className="w-full px-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:border-stone-400 text-sm placeholder-stone-400 bg-stone-50 focus:bg-white transition-all"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-bold text-stone-600" htmlFor="passcode">
              合言葉 (パスワード)
            </label>
            <div className="relative">
              <input
                id="passcode"
                type="password"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder="4文字以上の合言葉"
                disabled={submitting}
                className="w-full pl-10 pr-4 py-3 rounded-xl border border-stone-200 focus:outline-none focus:border-stone-400 text-sm placeholder-stone-400 bg-stone-50 focus:bg-white transition-all"
              />
              <KeyRound className="absolute left-3.5 top-3.5 w-4 h-4 text-stone-400" />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full mt-2 py-3 rounded-xl bg-stone-800 hover:bg-stone-700 text-white text-sm font-bold shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
          >
            {submitting ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : isLogin ? (
              'ログインする'
            ) : (
              '登録して始める'
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
};
