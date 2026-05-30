import React, { useState, useEffect } from 'react';
import Landing from './Landing';
import Login from './Login';
import Dashboard from './Dashboard';

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [view, setView] = useState(token ? 'app' : 'landing');
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('rb_dark') === 'true');

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('rb_dark', darkMode);
  }, [darkMode]);

  const toggleDark = () => setDarkMode(d => !d);

  const handleSetToken = (t) => {
    setToken(t);
    setView('app');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken('');
    setView('landing');
  };

  if (view === 'landing') {
    return <Landing onGetStarted={() => setView('auth')} darkMode={darkMode} toggleDark={toggleDark} />;
  }

  if (view === 'auth' || !token) {
    return <Login setToken={handleSetToken} darkMode={darkMode} toggleDark={toggleDark} />;
  }

  return <Dashboard onLogout={handleLogout} darkMode={darkMode} toggleDark={toggleDark} />;
}