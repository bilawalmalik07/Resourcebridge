import React, { useState } from 'react';
import API from './api';

export default function Login({ setToken }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (isSignUp) {
        await API.post('/register', { email, password });
        setIsSignUp(false); 
        alert('Account created successfully! Please sign in.');
      } else {
        // OAuth2 login requires URLSearchParams (Form Data)
        const formData = new URLSearchParams();
        formData.append('username', email); 
        formData.append('password', password);
        
        const response = await API.post('/login', formData, {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          }
        });
        
        // Save the token and log in
        localStorage.setItem('token', response.data.access_token);
        setToken(response.data.access_token);
      }
    } catch (err) {
      setError(err.response?.data?.detail || 'Authentication failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 border border-slate-100">
        <h2 className="text-3xl font-bold text-center text-slate-800 mb-2">ResourceBridge</h2>
        <p className="text-slate-500 text-center mb-6">
          {isSignUp ? 'Create your secure family account' : 'Sign in to access your secure documents'}
        </p>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4 border border-red-100">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
            <input
              type="email"
              required
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <input
              type="password"
              required
              className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button type="submit" className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition shadow-md cursor-pointer">
            {isSignUp ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button onClick={() => setIsSignUp(!isSignUp)} className="text-sm text-blue-600 hover:underline focus:outline-none cursor-pointer">
            {isSignUp ? 'Already have an account? Sign in' : 'Need an account? Sign up here'}
          </button>
        </div>
      </div>
    </div>
  );
}