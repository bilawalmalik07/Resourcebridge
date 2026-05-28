import React, { useState } from 'react';
import API from './api';
import { useLanguage } from './LanguageContext';
import { FileText, Eye, EyeOff } from 'lucide-react';

export default function Login({ setToken }) {
  const { t, toggle } = useLanguage();
  const [isSignUp, setIsSignUp] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isSignUp) {
        await API.post('/api/register', {
          username,
          email: email,
          password,
        });
        setIsSignUp(false);
        alert(t.accountCreated);
      } else {
        const params = new URLSearchParams();
        params.append('username', username);
        params.append('password', password);
        const response = await API.post('/api/login', params);
        localStorage.setItem('token', response.data.access_token);
        setToken(response.data.access_token);
      }
    } catch (err) {
      setError(err.response?.data?.detail || t.authFailed);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 px-4">
      <div className="max-w-md w-full">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-700 rounded-2xl mb-4 shadow-lg">
            <FileText size={24} className="text-white" />
          </div>
          <h1 className="text-3xl font-black text-stone-900 tracking-tight">{t.appName}</h1>
          <p className="text-stone-500 mt-1 text-sm">{t.tagline}</p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl p-8 border border-stone-100">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-stone-800">
              {isSignUp ? t.signUp : t.signIn}
            </h2>
            <button
              onClick={toggle}
              className="text-xs font-semibold text-stone-400 hover:text-blue-600 border border-stone-200 px-3 py-1 rounded-lg transition"
            >
              {t.language}
            </button>
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm mb-5 border border-red-100">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Username — type="text" so no @ required */}
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1.5">
                Username
              </label>
              <input
                type="text"
                required
                placeholder={isSignUp ? "Choose a username" : "Enter your username"}
                className="w-full px-4 py-3 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-stone-50 text-sm transition"
                value={username}
                onChange={e => setUsername(e.target.value)}
              />
              {!isSignUp && (
                <p className="text-xs text-stone-400 mt-1.5">Use your username, not your email address.</p>
              )}
            </div>

            {/* Email — only shown on sign up, fully optional */}
            {isSignUp && (
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  placeholder="your@email.com"
                  className="w-full px-4 py-3 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-stone-50 text-sm transition"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>
            )}

            {/* Password with eye toggle */}
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1.5">
                {t.passwordLabel}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Enter your password"
                  className="w-full px-4 py-3 pr-11 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-stone-50 text-sm transition"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-blue-600 transition p-1"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-700 hover:bg-blue-800 text-white font-semibold rounded-xl transition shadow-md text-sm disabled:opacity-60 cursor-pointer"
            >
              {loading
                ? (isSignUp ? t.creatingAccount : t.signingIn)
                : (isSignUp ? t.signUp : t.signIn)}
            </button>
          </form>

          <div className="mt-5 text-center">
            <button
              onClick={() => { setIsSignUp(!isSignUp); setError(''); setEmail(''); }}
              className="text-sm text-blue-600 hover:underline cursor-pointer"
            >
              {isSignUp ? t.switchToSignIn : t.switchToSignUp}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}