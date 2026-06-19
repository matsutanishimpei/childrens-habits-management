/**
 * Date オブジェクトをローカルのタイムゾーンで 'YYYY-MM-DD' 形式の文字列に変換します。
 * toISOString().split('T')[0] は UTC に変換されるため、日本時間(UTC+9)などの環境で日付が前日にずれる問題を回避します。
 */
export const toLocalISOString = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};
