import axios from 'axios';
import { signOut } from 'next-auth/react';

const api = axios.create({
  baseURL: '',
  withCredentials: true,
  xsrfCookieName: 'XSRF-TOKEN',
  xsrfHeaderName: 'X-XSRF-TOKEN',
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
});

let signingOut = false;

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login') && !signingOut) {
        signingOut = true;
        // Clear the stale NextAuth session (so the app reflects logged-out
        // state instead of a dead session) and land on the login page.
        signOut({ callbackUrl: '/login' });
      }
    }
    return Promise.reject(error);
  }
);

export const fetcher = (url: string) => api.get(url).then((res) => res.data);

export default api;
