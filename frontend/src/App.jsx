import React, { useState } from 'react';
import Login from './Login';
import Dashboard from './Dashboard';

export default function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '');

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken('');
  };

  if (!token) {
    return <Login setToken={setToken} />;
  }

  return <Dashboard onLogout={handleLogout} />;
}