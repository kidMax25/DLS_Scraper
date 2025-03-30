import Cookies from 'js-cookie';

export async function fetchUser() {
  const res = await fetch('/api/user', { method: 'GET', credentials: 'include' });
  return res.ok ? await res.json() : null;
}

export function isAuthenticated() {
  return Boolean(Cookies.get('access_token'));
}
