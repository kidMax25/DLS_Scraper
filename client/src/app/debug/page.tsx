'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AuthDebugPage() {
  const router = useRouter();
  const [authState, setAuthState] = useState({
    cookieExists: false,
    cookieValue: '',
    loginStatus: 'Not attempted',
    logoutStatus: 'Not attempted',
    userFetchStatus: 'Not attempted',
    userData: null,
    error: null
  });
  
  // Check if auth cookie exists
  useEffect(() => {
    const cookies = document.cookie.split(';').map(cookie => cookie.trim());
    const authCookie = cookies.find(cookie => cookie.startsWith('access_token='));
    
    setAuthState(prev => ({
      ...prev,
      cookieExists: !!authCookie,
      cookieValue: authCookie ? authCookie.split('=')[1].substring(0, 20) + '...' : 'None'
    }));
  }, []);
  
  // Attempt login
  const attemptLogin = async () => {
    setAuthState(prev => ({ ...prev, loginStatus: 'Attempting...' }));
    
    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'simiyumaxwell27@gmail.com',
          password: 'Maxy2001'
        }),
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setAuthState(prev => ({ 
          ...prev, 
          loginStatus: 'Success',
          error: null
        }));
        
        // Check if the cookie was set after login
        setTimeout(() => {
          const cookies = document.cookie.split(';').map(cookie => cookie.trim());
          const authCookie = cookies.find(cookie => cookie.startsWith('access_token='));
          
          setAuthState(prev => ({
            ...prev,
            cookieExists: !!authCookie,
            cookieValue: authCookie ? authCookie.split('=')[1].substring(0, 20) + '...' : 'None'
          }));
        }, 500);
      } else {
        setAuthState(prev => ({ 
          ...prev, 
          loginStatus: `Failed (${response.status})`, 
          error: data.error || 'Unknown error' 
        }));
      }
    } catch (error) {
      setAuthState(prev => ({ 
        ...prev, 
        loginStatus: 'Error', 
        error: error.message 
      }));
    }
  };
  
  // Attempt logout
  const attemptLogout = async () => {
    setAuthState(prev => ({ ...prev, logoutStatus: 'Attempting...' }));
    
    try {
      const response = await fetch('/api/auth', {
        method: 'DELETE',
        credentials: 'include'
      });
      
      if (response.ok) {
        setAuthState(prev => ({ 
          ...prev, 
          logoutStatus: 'Success',
          error: null
        }));
        
        // Check if the cookie was removed after logout
        setTimeout(() => {
          const cookies = document.cookie.split(';').map(cookie => cookie.trim());
          const authCookie = cookies.find(cookie => cookie.startsWith('access_token='));
          
          setAuthState(prev => ({
            ...prev,
            cookieExists: !!authCookie,
            cookieValue: authCookie ? authCookie.split('=')[1].substring(0, 20) + '...' : 'None'
          }));
        }, 500);
      } else {
        const data = await response.json();
        setAuthState(prev => ({ 
          ...prev, 
          logoutStatus: `Failed (${response.status})`, 
          error: data.error || 'Unknown error' 
        }));
      }
    } catch (error) {
      setAuthState(prev => ({ 
        ...prev, 
        logoutStatus: 'Error', 
        error: error.message 
      }));
    }
  };
  
  // Fetch user data
  const fetchUserData = async () => {
    setAuthState(prev => ({ ...prev, userFetchStatus: 'Attempting...' }));
    
    try {
      const response = await fetch('/api/user', {
        method: 'GET',
        credentials: 'include'
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setAuthState(prev => ({ 
          ...prev, 
          userFetchStatus: 'Success',
          userData: data,
          error: null
        }));
      } else {
        setAuthState(prev => ({ 
          ...prev, 
          userFetchStatus: `Failed (${response.status})`, 
          error: data.error || 'Unknown error',
          userData: null
        }));
      }
    } catch (error) {
      setAuthState(prev => ({ 
        ...prev, 
        userFetchStatus: 'Error', 
        error: error.message,
        userData: null
      }));
    }
  };
  
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Authentication Debugging</h1>
      
      {authState.error && (
        <div className="p-4 mb-4 bg-red-100 border border-red-400 text-red-700 rounded">
          <strong>Error:</strong> {authState.error}
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="p-4 border rounded">
          <h2 className="text-xl font-bold mb-2">Auth Cookie</h2>
          <p><strong>Exists:</strong> {authState.cookieExists ? 'Yes' : 'No'}</p>
          <p><strong>Value:</strong> {authState.cookieValue}</p>
        </div>
        
        <div className="p-4 border rounded">
          <h2 className="text-xl font-bold mb-2">Operation Status</h2>
          <p><strong>Login:</strong> {authState.loginStatus}</p>
          <p><strong>Logout:</strong> {authState.logoutStatus}</p>
          <p><strong>User Fetch:</strong> {authState.userFetchStatus}</p>
        </div>
      </div>
      
      <div className="flex space-x-4 mb-6">
        <button 
          onClick={attemptLogin}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Test Login
        </button>
        
        <button 
          onClick={attemptLogout}
          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
        >
          Test Logout
        </button>
        
        <button 
          onClick={fetchUserData}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Fetch User Data
        </button>
      </div>
      
      {authState.userData && (
        <div className="p-4 border rounded">
          <h2 className="text-xl font-bold mb-2">User Data</h2>
          <pre className="bg-gray-100 p-4 rounded overflow-auto">
            {JSON.stringify(authState.userData, null, 2)}
          </pre>
        </div>
      )}
      
      <div className="mt-6">
        <button 
          onClick={() => router.push('/login')}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
        >
          Go to Login Page
        </button>
      </div>
    </div>
  );
}