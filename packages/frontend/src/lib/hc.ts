/// <reference types="vite/client" />
import { hc } from 'hono/client';
import type { AppType } from '@my-app/backend';

// Use VITE_API_URL if defined (for production cross-origin deployment),
// otherwise fallback to '/' (Vite proxy in dev or same-domain).
const apiUrl = import.meta.env.VITE_API_URL || '/';

// APIリクエスト毎に localStorage からトークンを読み込み、ヘッダーに自動付与します
const customFetch = async (input: RequestInfo | URL, init?: RequestInit) => {
  const headers = new Headers(init?.headers);
  const token = localStorage.getItem('token');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  return fetch(input, { ...init, headers });
};

const client = hc<AppType>(apiUrl, {
  fetch: customFetch,
});

export default client;
