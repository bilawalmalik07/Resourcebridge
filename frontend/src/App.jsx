import React, { useState } from 'react';
import Landing from './Landing';
import Login from './Login';
import Dashboard from './Dashboard';

// App views: 'landing' → 'auth' → 'app'
export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [view, setView] = useState(token ? 'app' : 'landing');

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
    return <Landing onGetStarted={() => setView('auth')} />;
  }

  if (view === 'auth' || !token) {
    return <Login setToken={handleSetToken} />;
  }

  return <Dashboard onLogout={handleLogout} />;
}