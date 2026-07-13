/// <reference types="vite/client" />
import { hc } from 'hono/client';
import type { AppType } from '@my-app/backend';

// Use VITE_API_URL if defined (for production cross-origin deployment),
// otherwise fallback to '/' (Vite proxy in dev or same-domain).
// 本番環境（Pages の _redirects プロキシ）とローカル開発環境（Vite の proxy）の双方で
// 同一オリジンとして Cookie をやり取りするため、常に相対パス '/' を使用します。
const apiUrl = '/';
const client = hc<AppType>(apiUrl, {
  init: {
    credentials: 'include',
  },
});

export default client;
