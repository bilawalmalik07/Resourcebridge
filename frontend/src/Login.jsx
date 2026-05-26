import React, { useState } from 'react';
import API from './api';
import { useLanguage } from './LanguageContext';
import { FileText } from 'lucide-react';

export default function Login({ setToken }) {
  const { t, toggle, lang } = useLanguage();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isSignUp) {
        await API.post('/api/register', { email, password });
        setIsSignUp(false);
        alert(t.accountCreated);
      } else {
        const params = new URLSearchParams();
        params.append('username', email);
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
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1.5">{t.emailLabel}</label>
              <input
                type="email"
                required
                className="w-full px-4 py-3 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-stone-50 text-sm transition"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-stone-700 mb-1.5">{t.passwordLabel}</label>
              <input
                type="password"
                required
                className="w-full px-4 py-3 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-stone-50 text-sm transition"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-blue-700 hover:bg-blue-800 text-white font-semibold rounded-xl transition shadow-md text-sm disabled:opacity-60 cursor-pointer"
            >
              {loading ? (isSignUp ? t.creatingAccount : t.signingIn) : (isSignUp ? t.signUp : t.signIn)}
            </button>
          </form>

          <div className="mt-5 text-center">
            <button
              onClick={() => { setIsSignUp(!isSignUp); setError(''); }}
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