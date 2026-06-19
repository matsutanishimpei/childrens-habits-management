/// <reference types="vite/client" />
import { hc } from 'hono/client';
import type { AppType } from '@my-app/backend';

// Use VITE_API_URL if defined (for production cross-origin deployment),
// otherwise fallback to '/' (Vite proxy in dev or same-domain).
const apiUrl = import.meta.env.VITE_API_URL || '/';
const client = hc<AppType>(apiUrl, {
  init: {
    credentials: 'include',
  },
});

export default client;
