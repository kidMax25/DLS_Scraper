// src/lib/auth.ts
import Cookies from 'js-cookie';

export async function fetchUser() {
  try {
    const res = await fetch('/api/user', { 
      method: 'GET', 
      credentials: 'include' 
    });
    
    if (!res.ok) {
      return null;
    }
    
    return await res.json();
  } catch (error) {
    console.error('Error fetching user:', error);
    return null;
  }
}

export function isAuthenticated() {
  return Boolean(Cookies.get('access_token'));
}

// Function to handle logout
export async function logout() {
  try {
    await fetch('/api/auth', { 
      method: 'DELETE',
      credentials: 'include'
    });
    return true;
  } catch (error) {
    console.error('Logout error:', error);
    return false;
  }
}