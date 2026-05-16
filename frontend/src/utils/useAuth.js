import { useState, useEffect } from 'react';
import { getAuth } from './storage';

export function useAuth() {
  const [auth, setAuthState] = useState(() => getAuth());

  useEffect(() => {
    const handleAuthChange = () => {
      setAuthState(getAuth());
    };
    window.addEventListener('auth_changed', handleAuthChange);
    return () => window.removeEventListener('auth_changed', handleAuthChange);
  }, []);

  return auth;
}
