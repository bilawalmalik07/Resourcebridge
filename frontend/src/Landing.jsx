import React from 'react';
import { useLanguage } from './LanguageContext';
import { Shield, Globe, Zap, AlertTriangle, ArrowRight, FileText, ListTodo, Bell } from 'lucide-react';

export default function Landing({ onGetStarted }) {
  const { t, toggle, lang } = useLanguage();

  const features = [
    { icon: Zap, title: t.feature1Title, desc: t.feature1Desc, color: 'text-amber-500', bg: 'bg-amber-50' },
    { icon: Globe, title: t.feature2Title, desc: t.feature2Desc, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    { icon: ListTodo, title: t.feature5Title, desc: t.feature5Desc, color: 'text-purple-500', bg: 'bg-purple-50' },
    { icon: Bell, title: t.feature6Title, desc: t.feature6Desc, color: 'text-sky-500', bg: 'bg-sky-50' },
    { icon: AlertTriangle, title: t.feature3Title, desc: t.feature3Desc, color: 'text-red-500', bg: 'bg-red-50' },
    { icon: Shield, title: t.feature4Title, desc: t.feature4Desc, color: 'text-blue-500', bg: 'bg-blue-50' },
  ];

  return (
    <div className="min-h-screen bg-stone-50 font-sans">
      {/* Nav */}
      <nav className="fixed top-0 w-full z-50 bg-stone-50/90 backdrop-blur border-b border-stone-200">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-700 rounded-lg flex items-center justify-center">
              <FileText size={16} className="text-white" />
            </div>
            <span className="font-bold text-stone-900 text-lg tracking-tight">{t.appName}</span>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={toggle}
              className="text-sm font-medium text-stone-500 hover:text-stone-800 border border-stone-300 px-3 py-1.5 rounded-lg transition hover:bg-stone-100"
            >
              {t.language}
            </button>
            <button
              onClick={onGetStarted}
              className="text-sm font-semibold text-blue-700 hover:text-blue-800 transition"
            >
              {t.signIn}
            </button>
            <button
              onClick={onGetStarted}
              className="text-sm font-semibold bg-blue-700 text-white px-4 py-2 rounded-lg hover:bg-blue-800 transition shadow-sm"
            >
              {t.signUp}
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
          <h1 className="text-5xl sm:text-6xl font-black text-stone-900 leading-tight tracking-tight mb-6 whitespace-pre-line">
            {t.heroTitle}
          </h1>
          <p className="text-xl text-stone-500 max-w-2xl mx-auto leading-relaxed mb-10">
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
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 px-6 bg-white border-y border-stone-200">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {features.map(({ icon: Icon, title, desc, color, bg }) => (
              <div key={title} className="p-7 rounded-2xl border border-stone-100 bg-stone-50 hover:shadow-md transition">
                <div className={`w-12 h-12 ${bg} rounded-xl flex items-center justify-center mb-4`}>
                  <Icon size={22} className={color} />
                </div>
                <h3 className="font-bold text-stone-900 text-lg mb-2">{title}</h3>
                <p className="text-stone-500 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-4xl font-black text-stone-900 mb-4 tracking-tight">{t.ctaTitle}</h2>
          <p className="text-stone-500 mb-8 text-lg">{t.ctaSubtitle}</p>
          <button
            onClick={onGetStarted}
            className="bg-blue-700 text-white font-semibold px-8 py-4 rounded-xl hover:bg-blue-800 transition shadow-lg text-base"
          >
            {t.createAccount}
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-stone-200 py-8 px-6 text-center text-stone-400 text-sm">
        <p>© 2026 ResourceBridge — Technology for Community Stability</p>
      </footer>
    </div>
  );
}