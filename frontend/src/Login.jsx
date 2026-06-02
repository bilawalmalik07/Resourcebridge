import React, { useState } from 'react';
import API from './api';
import { useLanguage } from './LanguageContext';
import { FileText, Eye, EyeOff } from 'lucide-react';

const validatePassword = (p) => {
  if (p.length < 8) return 'Password must be at least 8 characters.';
  if (/\s/.test(p)) return 'Password cannot contain spaces.';
  return null;
};

const validateUsername = (u) => {
  if (u.length < 8) return 'Username must be at least 8 characters.';
  if (/\s/.test(u)) return 'Username cannot contain spaces.';
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>/?]/.test(u)) return 'Username must include at least one symbol (e.g. _ ! @).';
  return null;
};

export default function Login({ setToken, darkMode, toggleDark }) {
  const { t, toggle } = useLanguage();
  const [isSignUp, setIsSignUp] = useState(false);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [verifyStep, setVerifyStep] = useState(false);
  const [pendingEmail, setPendingEmail] = useState('');
  const [codeInput, setCodeInput] = useState('');
  const [codeError, setCodeError] = useState('');
  const [codeLoading, setCodeLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isSignUp) {
        const uErr = validateUsername(username);
        if (uErr) { setUsernameError(uErr); setLoading(false); return; }
        const pErr = validatePassword(password);
        if (pErr) { setPasswordError(pErr); setLoading(false); return; }
        await API.post('/api/send-verification', { username, email, password });
        setPendingEmail(email);
        setVerifyStep(true);
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

  const handleVerifyCode = async () => {
    if (!codeInput.trim()) return;
    setCodeLoading(true);
    setCodeError('');
    try {
      await API.post('/api/verify-and-register', { email: pendingEmail, code: codeInput.trim() });
      setVerifyStep(false);
      setIsSignUp(false);
      setCodeInput('');
      setPendingEmail('');
      setSuccessMsg(t.accountCreated);
    } catch (err) {
      setCodeError(err.response?.data?.detail || 'Invalid code. Please try again.');
    } finally {
      setCodeLoading(false);
    }
  };

  if (verifyStep) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-stone-950 px-4">
        <div className="max-w-md w-full">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-700 rounded-2xl mb-4 shadow-lg">
              <FileText size={24} className="text-white" />
            </div>
            <h1 className="text-3xl font-black text-stone-900 dark:text-white tracking-tight">{t.appName}</h1>
          </div>
          <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-xl p-8 border border-stone-100 dark:border-stone-800">
            <h2 className="text-xl font-bold text-stone-800 dark:text-white mb-1">Check your email</h2>
            <p className="text-sm text-stone-500 dark:text-stone-400 mb-6">
              We sent a 6-digit code to <span className="font-semibold text-stone-700 dark:text-stone-200">{pendingEmail}</span>. Enter it below to confirm your account.
            </p>
            {codeError && (
              <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm mb-4 border border-red-100">{codeError}</div>
            )}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-stone-700 dark:text-stone-300 mb-1.5">Verification Code</label>
              <input
                type="text"
                maxLength={6}
                placeholder="000000"
                className="w-full px-4 py-4 border-2 border-stone-200 dark:border-stone-700 rounded-xl focus:outline-none focus:border-blue-500 bg-stone-50 dark:bg-stone-800 dark:text-stone-100 text-2xl font-bold text-center tracking-widest transition"
                value={codeInput}
                onChange={e => { setCodeInput(e.target.value.replace(/\D/g, '')); setCodeError(''); }}
                onKeyDown={e => e.key === 'Enter' && handleVerifyCode()}
                autoFocus
              />
              <p className="text-xs text-stone-400 mt-1.5 text-center">Code expires in 10 minutes</p>
            </div>
            <button
              onClick={handleVerifyCode}
              disabled={codeLoading || codeInput.length !== 6}
              className="w-full py-3 bg-blue-700 hover:bg-blue-800 text-white font-semibold rounded-xl transition shadow-md text-sm disabled:opacity-60"
            >
              {codeLoading ? 'Verifying...' : 'Confirm & Create Account'}
            </button>
            <button
              onClick={() => { setVerifyStep(false); setCodeInput(''); setCodeError(''); }}
              className="w-full mt-3 py-2 text-sm text-stone-400 hover:text-stone-600 transition"
            >
              ← Go back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-stone-950 px-4">

      {/* ── Success Modal ── */}
      {successMsg && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-2xl p-6 w-full max-w-sm border border-stone-100 dark:border-stone-800 text-center">
            <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <FileText size={22} className="text-blue-700" />
            </div>
            <h3 className="font-bold text-stone-900 dark:text-white text-lg mb-2">Account Created!</h3>
            <p className="text-stone-500 dark:text-stone-400 text-sm mb-6">{successMsg}</p>
            <button
              onClick={() => setSuccessMsg('')}
              className="w-full py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-semibold rounded-xl transition shadow-sm text-sm"
            >
              Sign In
            </button>
          </div>
        </div>
      )}

      <div className="max-w-md w-full">

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-700 rounded-2xl mb-4 shadow-lg">
            <FileText size={24} className="text-white" />
          </div>
          <h1 className="text-3xl font-black text-stone-900 dark:text-white tracking-tight">{t.appName}</h1>
          <p className="text-stone-500 dark:text-stone-400 mt-1 text-sm">{t.tagline}</p>
        </div>

        <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-xl p-8 border border-stone-100 dark:border-stone-800">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-stone-800 dark:text-white">
              {isSignUp ? t.signUp : t.signIn}
            </h2>
            <button
              onClick={toggleDark}
              className="flex items-center justify-center text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition px-2 py-1 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 border border-stone-200 dark:border-stone-700"
            >
              {darkMode ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
              )}
            </button>
            <button
              onClick={toggle}
              className="text-xs font-semibold text-stone-400 dark:text-stone-500 hover:text-blue-600 border border-stone-200 dark:border-stone-700 px-3 py-1 rounded-lg transition dark:hover:bg-stone-800"
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
              <label className="block text-sm font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                Username
              </label>
              <input
                type="text"
                required
                placeholder="Choose a username"
                className="w-full px-4 py-3 border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-stone-50 dark:bg-stone-800 dark:text-stone-100 text-sm transition"
                value={username}
                onChange={e => { setUsername(e.target.value); if (isSignUp) setUsernameError(''); }}
              />
              {isSignUp && (
                <p className={`text-xs mt-1.5 font-medium ${usernameError ? 'text-red-500' : 'text-stone-400'}`}>
                  {usernameError || 'Min 8 chars · no spaces · include a symbol (e.g. _ ! @)'}
                </p>
              )}
            </div>

            {/* Email — only shown on sign up, fully optional */}
            {isSignUp && (
              <div>
                <label className="block text-sm font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                  Email Address
                </label>
                <input
                  type="email"
                  placeholder="your@email.com"
                  className="w-full px-4 py-3 border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-stone-50 dark:bg-stone-800 dark:text-stone-100 text-sm transition"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>
            )}

            {/* Password with eye toggle */}
            <div>
              <label className="block text-sm font-semibold text-stone-700 dark:text-stone-300 mb-1.5">
                {t.passwordLabel}
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Enter your password"
                  className="w-full px-4 py-3 pr-11 border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-stone-50 dark:bg-stone-800 dark:text-stone-100 text-sm transition"
                  value={password}
                  onChange={e => { setPassword(e.target.value); if (isSignUp) setPasswordError(''); }}
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
              {isSignUp && (
                <p className={`text-xs mt-1.5 font-medium ${passwordError ? 'text-red-500' : 'text-stone-400'}`}>
                  {passwordError || 'Min 8 characters · no spaces'}
                </p>
              )}
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
              onClick={() => { setIsSignUp(!isSignUp); setError(''); setEmail(''); setUsernameError(''); setPasswordError(''); }}
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