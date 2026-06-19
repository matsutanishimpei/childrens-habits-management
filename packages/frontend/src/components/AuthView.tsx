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
    <div className="auth-container">
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="auth-card"
      >
        {/* アプリロゴ・ヘッダー */}
        <div>
          <div className="auth-logo-container">
            <img src="/title-icon.png" alt="ハビっと" className="auth-logo-img" />
          </div>
          <h1 className="auth-title">
            ハビっと
          </h1>
          <p className="auth-subtitle">
            {isLogin ? '登録済みの家庭名と合言葉でログインします' : '新しい家庭名と合言葉でアカウントを作成します'}
          </p>
        </div>

        {/* ログイン・新規登録切り替えタブ */}
        <div className="auth-tabs">
          <button
            type="button"
            onClick={() => {
              setIsLogin(true);
              setError(null);
            }}
            className={`auth-tab-btn ${isLogin ? 'active' : ''}`}
          >
            ログイン
          </button>
          <button
            type="button"
            onClick={() => {
              setIsLogin(false);
              setError(null);
            }}
            className={`auth-tab-btn ${!isLogin ? 'active' : ''}`}
          >
            新規登録
          </button>
        </div>

        {/* フォーム */}
        <form onSubmit={handleSubmit} className="auth-form">
          {error && (
            <div className="auth-error">
              {error}
            </div>
          )}

          <div className="auth-input-group">
            <label className="auth-label" htmlFor="familyName">
              家庭名
            </label>
            <input
              id="familyName"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="例: 佐藤家"
              disabled={submitting}
              className="auth-input"
            />
          </div>

          <div className="auth-input-group">
            <label className="auth-label" htmlFor="passcode">
              合言葉 (パスワード)
            </label>
            <div className="auth-input-password-wrapper">
              <input
                id="passcode"
                type="password"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                placeholder={isLogin ? "合言葉を入力" : "推奨: 誕生日＋生まれた時の体重 (例: 08153120)"}
                disabled={submitting}
                className="auth-input auth-input-password"
              />
              <KeyRound className="auth-input-icon" />
            </div>
            {!isLogin && (
              <p className="text-[10px] leading-relaxed mt-1" style={{ color: 'var(--text-secondary)' }}>
                💡 <strong>忘れない合言葉のコツ</strong><br />
                お子さまの誕生日（4桁）＋生まれたときの体重（4桁）の組み合わせ（計8桁）などがおすすめです！
              </p>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="auth-submit-btn"
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
