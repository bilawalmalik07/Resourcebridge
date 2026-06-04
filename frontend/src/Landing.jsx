import React, { useState } from 'react';
import { useLanguage } from './LanguageContext';
import { Shield, Globe, Zap, AlertTriangle, ArrowRight, FileText, ListTodo, Bell, PlayCircle } from 'lucide-react';
import API from './api';

export default function Landing({ onGetStarted, onDemoLogin, darkMode, toggleDark }) {
  const { t, toggle, lang } = useLanguage();
  const [demoLoading, setDemoLoading] = useState(false);

  const handleDemo = async () => {
    setDemoLoading(true);
    try {
      const res = await API.post('/api/demo-login');
      localStorage.setItem('token', res.data.access_token);
      onDemoLogin(res.data.access_token);
    } catch (e) {
      alert('Demo unavailable right now. Please try again.');
    } finally {
      setDemoLoading(false);
    }
  };

  const features = [
    { icon: Zap, title: t.feature1Title, desc: t.feature1Desc, color: 'text-amber-500', bg: 'bg-amber-50' },
    { icon: Globe, title: t.feature2Title, desc: t.feature2Desc, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { icon: ListTodo, title: t.feature5Title, desc: t.feature5Desc, color: 'text-purple-500', bg: 'bg-purple-50' },
    { icon: Bell, title: t.feature6Title, desc: t.feature6Desc, color: 'text-sky-500', bg: 'bg-sky-50' },
    { icon: AlertTriangle, title: t.feature3Title, desc: t.feature3Desc, color: 'text-red-500', bg: 'bg-red-50' },
    { icon: Shield, title: t.feature4Title, desc: t.feature4Desc, color: 'text-blue-500', bg: 'bg-blue-50' },
  ];

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 font-sans">
      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 bg-stone-50/90 dark:bg-stone-950/90 backdrop-blur border-b border-stone-200 dark:border-stone-800">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-700 rounded-lg flex items-center justify-center">
              <FileText size={16} className="text-white" />
            </div>
            <span className="font-bold text-stone-900 dark:text-white text-lg tracking-tight">{t.appName}</span>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={toggleDark}
              className="flex items-center justify-center text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition px-2 py-1.5 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 border border-stone-300 dark:border-stone-700"
            >
              {darkMode ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
              )}
            </button>
            <button
              onClick={toggle}
              className="text-sm font-medium text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 border border-stone-300 dark:border-stone-700 px-3 py-1.5 rounded-lg transition hover:bg-stone-100 dark:hover:bg-stone-800"
            >
              {t.language}
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center space-x-2 bg-blue-50 text-blue-700 text-xs font-semibold px-4 py-2 rounded-full mb-8 border border-blue-100">
            <Globe size={13} />
            <span>{lang === 'en' ? 'English & Spanish Support' : 'Soporte en Inglés y Español'}</span>
          </div>
          <h1 className="text-5xl sm:text-6xl font-black text-stone-900 dark:text-white leading-tight tracking-tight mb-6 whitespace-pre-line">
            {t.heroTitle}
          </h1>
          <p className="text-xl text-stone-500 dark:text-stone-400 max-w-2xl mx-auto leading-relaxed mb-10">
            {t.heroSubtitle}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={onGetStarted}
              className="flex items-center space-x-2 bg-blue-700 text-white font-semibold px-8 py-4 rounded-xl hover:bg-blue-800 transition shadow-lg text-base"
            >
              <span>{t.getStarted}</span>
              <ArrowRight size={18} />
            </button>
            <button
              onClick={handleDemo}
              disabled={demoLoading}
              className="flex items-center space-x-2 bg-white dark:bg-stone-900 text-stone-700 dark:text-stone-200 font-semibold px-8 py-4 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-800 transition shadow-lg text-base border border-stone-200 dark:border-stone-700 disabled:opacity-60"
            >
              <PlayCircle size={18} className="text-blue-600" />
              <span>{demoLoading ? 'Loading...' : (lang === 'en' ? 'Try Demo' : 'Ver Demo')}</span>
            </button>
          </div>
          <p className="text-xs text-stone-400 mt-4">
            {lang === 'en' ? 'No account needed — explore with sample documents' : 'Sin cuenta — explora con documentos de muestra'}
          </p>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-6 bg-white dark:bg-stone-900 border-y border-stone-200 dark:border-stone-800">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {features.map(({ icon: Icon, title, desc, color, bg }) => (
              <div key={title} className="p-7 rounded-2xl border border-stone-100 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/50 hover:shadow-md transition">
                <div className={`w-12 h-12 ${bg} rounded-xl flex items-center justify-center mb-4`}>
                  <Icon size={22} className={color} />
                </div>
                <h3 className="font-bold text-stone-900 dark:text-white text-lg mb-2">{title}</h3>
                <p className="text-stone-500 dark:text-stone-400 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-4xl font-black text-stone-900 dark:text-white mb-4 tracking-tight">{t.ctaTitle}</h2>
          <p className="text-stone-500 dark:text-stone-400 mb-8 text-lg">{t.ctaSubtitle}</p>
          <button
            onClick={onGetStarted}
            className="bg-blue-700 text-white font-semibold px-8 py-4 rounded-xl hover:bg-blue-800 transition shadow-lg text-base"
          >
            {t.createAccount}
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-stone-200 dark:border-stone-800 py-8 px-6 text-center text-stone-400 dark:text-stone-600 text-sm">
        <p>© 2026 ResourceBridge — Technology for Community Stability</p>
      </footer>
    </div>
  );
}