import React, { useState, useEffect, useRef } from 'react';
import API from './api';
import { useLanguage } from './LanguageContext';
import {
  FileText, Search, Upload, LogOut, Globe, Sparkles,
  AlertTriangle, Trash2, ExternalLink, CheckCircle,
  Clock, ChevronDown, X, Printer, Shield, ShieldOff,
  ListTodo, Bell, Plus, Circle, CircleCheck, BellRing
} from 'lucide-react';

// Decode username from JWT so localStorage is scoped per user
const getUserKey = (key) => {
  try {
    const token = localStorage.getItem('token');
    if (!token) return key;
    const payload = JSON.parse(atob(token.split('.')[1]));
    const user = payload.sub || 'guest';
    return `${user}:${key}`;
  } catch { return key; }
};

const CATEGORIES = ['immigration', 'school', 'housing', 'employment', 'healthcare', 'benefits', 'emergency', 'Uncategorized'];

const PRIORITY_STYLES = {
  high: 'bg-red-50 text-red-700 border-red-200',
  medium: 'bg-amber-50 text-amber-700 border-amber-200',
  low: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

export default function Dashboard({ onLogout, darkMode, toggleDark }) {
  const { t, toggle, lang } = useLanguage();

  const [documents, setDocuments] = useState([]);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [emergencyOnly, setEmergencyOnly] = useState(false);
  const [activeTab, setActiveTab] = useState('documents'); // 'documents' | 'emergency'
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Uncategorized');
  const [isEmergency, setIsEmergency] = useState(false);
  const [showUploadPanel, setShowUploadPanel] = useState(false);
  const [emergencyPacket, setEmergencyPacket] = useState(null);
  const [loadingPacket, setLoadingPacket] = useState(false);
  const [noEmergencyModal, setNoEmergencyModal] = useState(false);
  // Emergency tab state
  const [emergencyDocs, setEmergencyDocs] = useState([]);
  const [selectedPacketIds, setSelectedPacketIds] = useState([]);
  const [emergencyCategoryFilter, setEmergencyCategoryFilter] = useState('All');
  const [packetGenerated, setPacketGenerated] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);

  // To-Do list state (persisted to localStorage per user)
  const [showTodo, setShowTodo] = useState(false);
  const [todos, setTodos] = useState(() => {
    try { return JSON.parse(localStorage.getItem(getUserKey('rb_todos')) || '[]'); } catch { return []; }
  });
  const [todoInput, setTodoInput] = useState('');

  const saveTodos = (updated) => {
    setTodos(updated);
    localStorage.setItem(getUserKey('rb_todos'), JSON.stringify(updated));
  };
  const addTodo = () => {
    const text = todoInput.trim();
    if (!text) return;
    saveTodos([{ id: Date.now(), text, done: false }, ...todos]);
    setTodoInput('');
  };
  const toggleTodo = (id) => saveTodos(todos.map(t => t.id === id ? { ...t, done: !t.done } : t));
  const deleteTodo = (id) => saveTodos(todos.filter(t => t.id !== id));

  // Reminders state (API-backed)
  const [showReminders, setShowReminders] = useState(false);
  const [reminders, setReminders] = useState([]);
  const [reminderText, setReminderText] = useState('');
  const [reminderDate, setReminderDate] = useState('');
  const [reminderTime, setReminderTime] = useState('');

  const fetchReminders = async () => {
    try {
      const res = await API.get('/api/reminders');
      setReminders(res.data);
    } catch (err) { console.error('Error fetching reminders:', err); }
  };

  const addReminder = async () => {
    const text = reminderText.trim();
    if (!text || !reminderDate || !reminderTime) return;
    const localDate = new Date(`${reminderDate}T${reminderTime}:00`);
    const remind_at = localDate.toISOString();
    try {
      const res = await API.post('/api/reminders', { text, remind_at });
      setReminders(prev => [...prev, res.data]);
      setReminderText(''); setReminderDate(''); setReminderTime('');
    } catch (err) { console.error('Error adding reminder:', err); }
  };

  const deleteReminder = async (id) => {
    try {
      await API.delete(`/api/reminders/${id}`);
      setReminders(prev => prev.filter(r => r.id !== id));
    } catch (err) { console.error('Error deleting reminder:', err); }
  };

  const formatReminderDate = (remind_at) => {
    const d = new Date(remind_at);
    return d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' }) +
      ' · ' + d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
  };
  const isOverdue = (remind_at) => new Date(remind_at) < new Date();

  const fileInputRef = useRef();

  useEffect(() => { fetchDocuments(); }, [categoryFilter, emergencyOnly]);
  useEffect(() => { fetchReminders(); }, []);

  const fetchDocuments = async () => {
    try {
      const params = new URLSearchParams();
      if (categoryFilter !== 'All') params.append('category', categoryFilter);
      if (emergencyOnly) params.append('emergency_only', 'true');
      const res = await API.get(`/api/documents?${params}`);
      setDocuments(res.data);
    } catch (err) {
      console.error('Error fetching documents:', err);
    }
  };


  const handleViewOriginal = async (doc) => {
    const url = doc.file_url || '';
    const ext = url.split('?')[0].split('.').pop().toLowerCase();
    const officeExts = ['docx', 'doc', 'xlsx', 'xls', 'pptx', 'ppt'];
    if (officeExts.includes(ext)) {
      // Google Docs viewer renders Office files inline on all devices
      const viewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`;
      window.open(viewerUrl, '_blank', 'noopener,noreferrer');
      return;
    }
    // PDF and images open natively — use signed URL if available
    try {
      const res = await API.get(`/api/documents/${doc.id}/view-url`);
      window.open(res.data.url, '_blank', 'noopener,noreferrer');
    } catch {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    const file = fileInputRef.current?.files?.[0];
    if (!file || !title) return;

    setUploading(true);
    setUploadError('');

    try {
      const formData = new FormData();
      formData.append('file', file);
      const uploadRes = await API.post('/api/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const docRes = await API.post('/api/documents', {
        title,
        file_url: uploadRes.data.file_url,
        original_filename: uploadRes.data.original_filename,
        ai_result: uploadRes.data.ai_result,
        category,
        is_emergency: isEmergency,
      });

      setDocuments(prev => [docRes.data, ...prev]);
      setTitle('');
      setCategory('Uncategorized');
      setIsEmergency(false);
      setShowUploadPanel(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      setUploadError(err.response?.data?.detail || t.uploadError);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = (doc) => {
    setDeleteConfirm(doc);
  };

  const confirmDelete = async () => {
    const doc = deleteConfirm;
    setDeleteConfirm(null);
    try {
      await API.delete(`/api/documents/${doc.id}`);
      setDocuments(prev => prev.filter(d => d.id !== doc.id));
      if (selectedDoc?.id === doc.id) setSelectedDoc(null);
    } catch (err) {
      console.error('Error deleting document:', err);
    }
  };

  const handleBulkDelete = async () => {
    try {
      await Promise.all(selectedIds.map(id => API.delete(`/api/documents/${id}`)));
      setDocuments(prev => prev.filter(d => !selectedIds.includes(d.id)));
      if (selectedDoc && selectedIds.includes(selectedDoc.id)) setSelectedDoc(null);
      setSelectedIds([]);
      setSelectMode(false);
    } catch (err) {
      console.error('Bulk delete error:', err);
    }
  };

  const handleToggleEmergency = async (doc) => {
    try {
      const res = await API.patch(`/api/documents/${doc.id}/emergency`, {
        is_emergency: !doc.is_emergency,
      });
      const updated = res.data;
      setDocuments(prev => prev.map(d => d.id === updated.id ? updated : d));
      setSelectedDoc(updated);
    } catch (err) {
      console.error('Error toggling emergency:', err);
    }
  };

  // Fetch all emergency docs when switching to emergency tab
  const fetchEmergencyDocs = async () => {
    try {
      const res = await API.get('/api/documents?emergency_only=true');
      setEmergencyDocs(res.data);
      setSelectedPacketIds(res.data.map(d => d.id)); // default: all selected
    } catch (err) {
      console.error('Error fetching emergency docs:', err);
    }
  };

  const togglePacketSelection = (id) => {
    setSelectedPacketIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleGeneratePacket = () => {
    if (selectedPacketIds.length === 0) {
      setNoEmergencyModal(true);
      return;
    }
    setPacketGenerated(true);
  };

  const handlePrintPacket = () => {
    const selectedDocs = emergencyDocs.filter(d =>
      selectedPacketIds.includes(d.id) &&
      d.ai_summary &&
      !d.ai_summary.toLowerCase().includes('could not reach')
    );
    if (selectedDocs.length === 0) {
      setNoEmergencyModal(true);
      return;
    }
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>ResourceBridge Emergency Packet</title>
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { font-family: Arial, sans-serif; padding: 32px; color: #1c1917; background: white; }
            h1 { font-size: 22px; font-weight: 900; text-align: center; margin-bottom: 4px; }
            .date { text-align: center; color: #78716c; font-size: 13px; margin-bottom: 28px; }
            .doc-card { border: 1px solid #fecaca; border-radius: 12px; padding: 20px; margin-bottom: 20px; page-break-inside: avoid; }
            .doc-title { font-size: 16px; font-weight: 700; margin-bottom: 2px; }
            .doc-meta { font-size: 12px; color: #a8a29e; margin-bottom: 12px; }
            .summary { font-size: 13px; color: #44403c; background: #f8f7f4; border-radius: 8px; padding: 14px; margin-bottom: 12px; line-height: 1.6; }
            .action-item { display: flex; gap: 8px; font-size: 12px; padding: 8px 10px; border-radius: 6px; border: 1px solid #e7e5e4; margin-bottom: 6px; }
            .high { background: #fef2f2; border-color: #fecaca; color: #b91c1c; }
            .medium { background: #fffbeb; border-color: #fde68a; color: #92400e; }
            .low { background: #f0fdf4; border-color: #bbf7d0; color: #166534; }
            .task { font-weight: 600; }
            .deadline { opacity: 0.7; margin-left: 8px; }
            .view-link { display: inline-block; margin-top: 10px; font-size: 12px; color: #1d4ed8; text-decoration: none; }
          </style>
        </head>
        <body>
          <h1>ResourceBridge Emergency Packet</h1>
          <p class="date">${new Date().toLocaleDateString()}</p>
          ${selectedDocs.map(doc => `
            <div class="doc-card">
              <div class="doc-title">${doc.title}</div>
              <div class="doc-meta">${doc.category || ''} · ${doc.created_at ? new Date(doc.created_at).toLocaleDateString() : ''}</div>
              <div class="summary">${lang === 'es' && doc.ai_summary_es ? doc.ai_summary_es : doc.ai_summary || ''}</div>
              ${(doc.action_items || []).map(item => `
                <div class="action-item ${item.priority || 'low'}">
                  <span class="task">${item.task}</span>
                  ${item.deadline ? `<span class="deadline">· ${item.deadline}</span>` : ''}
                </div>
              `).join('')}
              <a class="view-link" href="${(() => {
                const ext = doc.file_url.split('?')[0].split('.').pop().toLowerCase();
                const officeExts = ['docx','doc','xlsx','xls','pptx','ppt'];
                return officeExts.includes(ext)
                  ? 'https://docs.google.com/viewer?url=' + encodeURIComponent(doc.file_url) + '&embedded=true'
                  : doc.file_url;
              })()}" target="_blank">View Original File →</a>
            </div>
          `).join('')}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  const filteredEmergencyDocs = emergencyDocs.filter(doc =>
    emergencyCategoryFilter === 'All' || doc.category === emergencyCategoryFilter
  );

  const filteredDocs = documents.filter(doc => {
    const q = search.toLowerCase();
    return (
      doc.title?.toLowerCase().includes(q) ||
      doc.ai_summary?.toLowerCase().includes(q) ||
      doc.ocr_text?.toLowerCase().includes(q)
    );
  });

  const formatDate = (d) => d ? new Date(d).toLocaleDateString() : '—';
  const getCategoryLabel = (cat) => t[cat] || cat;

  const getSummary = (doc) => lang === 'es' && doc.ai_summary_es ? doc.ai_summary_es : doc.ai_summary;

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 font-sans">
      {/* Header */}
      <nav className="bg-white dark:bg-stone-900 border-b border-stone-200 dark:border-stone-800 px-4 sm:px-6 py-4 flex items-center justify-between sticky top-0 z-40 shadow-sm">
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 bg-blue-700 rounded-xl flex items-center justify-center shadow">
            <FileText size={17} className="text-white" />
          </div>
          <span className="text-lg font-black text-stone-900 dark:text-white tracking-tight">{t.appName}</span>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={toggle}
            className="text-xs font-semibold text-stone-500 dark:text-stone-400 border border-stone-200 dark:border-stone-700 px-3 py-1.5 rounded-lg hover:bg-stone-50 dark:hover:bg-stone-800 transition"
          >
            {t.language}
          </button>
          <button
            onClick={() => setShowTodo(true)}
            className="hidden sm:flex items-center space-x-1.5 bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-200 border border-stone-200 dark:border-stone-700 text-sm font-semibold px-4 py-2 rounded-xl hover:bg-stone-50 dark:hover:bg-stone-700 transition shadow-sm relative"
          >
            <ListTodo size={15} />
            <span>To-Do</span>
            {todos.filter(t => !t.done).length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-blue-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {todos.filter(t => !t.done).length}
              </span>
            )}
          </button>
          <button
            onClick={() => setShowReminders(true)}
            className="hidden sm:flex items-center space-x-1.5 bg-white dark:bg-stone-800 text-stone-700 dark:text-stone-200 border border-stone-200 dark:border-stone-700 text-sm font-semibold px-4 py-2 rounded-xl hover:bg-stone-50 dark:hover:bg-stone-700 transition shadow-sm relative"
          >
            <Bell size={15} />
            <span>Reminders</span>
            {reminders.filter(r => !isOverdue(r.remind_at) === false || true).length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-amber-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {reminders.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setShowUploadPanel(true)}
            className="hidden sm:flex items-center space-x-1.5 bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-blue-800 transition shadow-sm"
          >
            <Upload size={15} />
            <span>{t.uploadDocument}</span>
          </button>
          <button
            onClick={() => setShowTodo(true)}
            className="sm:hidden relative flex items-center justify-center text-stone-500 dark:text-stone-400 hover:text-blue-700 transition px-2 py-2 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800"
          >
            <ListTodo size={18} />
            {todos.filter(t => !t.done).length > 0 && (
              <span className="absolute top-0.5 right-0.5 w-3.5 h-3.5 bg-blue-600 text-white text-[8px] font-bold rounded-full flex items-center justify-center">
                {todos.filter(t => !t.done).length}
              </span>
            )}
          </button>
          <button
            onClick={() => setShowReminders(true)}
            className="sm:hidden relative flex items-center justify-center text-stone-500 dark:text-stone-400 hover:text-amber-600 transition px-2 py-2 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800"
          >
            <Bell size={18} />
            {reminders.length > 0 && (
              <span className="absolute top-0.5 right-0.5 w-3.5 h-3.5 bg-amber-500 text-white text-[8px] font-bold rounded-full flex items-center justify-center">
                {reminders.length}
              </span>
            )}
          </button>
          <button
            onClick={toggleDark}
            className="flex items-center justify-center text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition px-2 py-2 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800"
            title={darkMode ? 'Light mode' : 'Dark mode'}
          >
            {darkMode ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41"/></svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>
            )}
          </button>
          <button
            onClick={onLogout}
            className="flex items-center space-x-1.5 text-stone-400 hover:text-red-600 transition px-2 py-2 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800"
          >
            <LogOut size={17} />
          </button>
        </div>
      </nav>

      {/* Upload Panel Modal */}
      {showUploadPanel && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowUploadPanel(false)}>
          <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-stone-800 dark:text-white text-lg">{t.uploadTitle}</h3>
              <button onClick={() => setShowUploadPanel(false)} className="text-stone-400 hover:text-stone-600"><X size={20} /></button>
            </div>

            {uploadError && (
              <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm mb-4 border border-red-100">{uploadError}</div>
            )}

            <form onSubmit={handleFileUpload} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-stone-700 dark:text-stone-300 mb-1">{t.docTitle}</label>
                <input
                  type="text"
                  required
                  placeholder={t.docTitlePlaceholder}
                  className="w-full px-4 py-3 border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-stone-50 dark:bg-stone-800 dark:text-stone-100"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-stone-700 dark:text-stone-300 mb-1">{t.category}</label>
                <select
                  className="w-full px-4 py-3 border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-stone-50 dark:bg-stone-800 dark:text-stone-100"
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                >
                  {CATEGORIES.map(c => (
                    <option key={c} value={c}>{getCategoryLabel(c)}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-stone-700 dark:text-stone-300 mb-1">File (PDF or Image)</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  required
                  accept=".pdf,.png,.jpg,.jpeg,.webp,.gif,.doc,.docx,.py"
                  className="w-full text-sm text-stone-500 dark:text-stone-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                />
              </div>

              <label className="flex items-center space-x-3 cursor-pointer p-3 rounded-xl border border-stone-200 dark:border-stone-700 hover:bg-stone-50 dark:hover:bg-stone-800">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded accent-red-600"
                  checked={isEmergency}
                  onChange={e => setIsEmergency(e.target.checked)}
                />
                <div className="flex items-center space-x-2 text-sm">
                  <AlertTriangle size={15} className="text-red-500" />
                  <span className="font-medium text-stone-700 dark:text-stone-300">{t.markEmergency}</span>
                </div>
              </label>

              <button
                type="submit"
                disabled={uploading}
                className="w-full py-3 bg-blue-700 hover:bg-blue-800 text-white font-semibold rounded-xl transition shadow-md text-sm disabled:opacity-60 cursor-pointer"
              >
                {uploading ? t.processing : t.uploadBtn}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── Delete Confirm Modal ── */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-2xl p-6 w-full max-w-sm border border-stone-100 dark:border-stone-800">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <Trash2 size={18} className="text-red-500" />
              </div>
              <div>
                <h3 className="font-bold text-stone-900 dark:text-white dark:text-white text-base">Delete document?</h3>
                <p className="text-stone-500 dark:text-stone-400 text-sm mt-0.5 line-clamp-1">"{deleteConfirm.title}"</p>
              </div>
            </div>
            <p className="text-sm text-stone-500 dark:text-stone-400 dark:text-stone-400 mb-6">This action cannot be undone.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2.5 border border-stone-200 dark:border-stone-700 rounded-xl text-sm font-semibold text-stone-600 dark:text-stone-300 hover:bg-stone-50 dark:hover:bg-stone-800 transition"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-semibold transition shadow-sm"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── No Emergency Selection Modal ── */}
      {noEmergencyModal && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-2xl p-6 w-full max-w-sm border border-stone-100 dark:border-stone-800">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                <AlertTriangle size={18} className="text-blue-600" />
              </div>
              <div>
                <h3 className="font-bold text-stone-900 dark:text-white dark:text-white text-base">No documents selected</h3>
                <p className="text-stone-500 text-sm mt-0.5">Please select at least one valid document to include in the packet.</p>
              </div>
            </div>
            <button
              onClick={() => setNoEmergencyModal(false)}
              className="w-full py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-semibold rounded-xl transition shadow-sm text-sm"
            >
              OK
            </button>
          </div>
        </div>
      )}

      {/* ── To-Do List Modal ── */}
      {showTodo && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowTodo(false)}>
          <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-2xl w-full max-w-md flex flex-col max-h-[85vh]" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-stone-100 dark:border-stone-800">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 bg-blue-50 rounded-xl flex items-center justify-center">
                  <ListTodo size={18} className="text-blue-700" />
                </div>
                <div>
                  <h3 className="font-bold text-stone-900 dark:text-white dark:text-white text-base">To-Do List</h3>
                  <p className="text-xs text-stone-400 dark:text-stone-500">{todos.filter(t => !t.done).length} remaining</p>
                </div>
              </div>
              <button onClick={() => setShowTodo(false)} className="text-stone-400 hover:text-stone-600 p-1 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition"><X size={18} /></button>
            </div>
            {/* Add input */}
            <div className="px-6 py-4 border-b border-stone-100 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/50">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add a new task..."
                  className="flex-1 px-4 py-2.5 border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white dark:bg-stone-800 dark:text-stone-100"
                  value={todoInput}
                  onChange={e => setTodoInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addTodo()}
                />
                <button
                  onClick={addTodo}
                  disabled={!todoInput.trim()}
                  className="px-4 py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-xl text-sm font-semibold transition disabled:opacity-40 flex items-center space-x-1"
                >
                  <Plus size={15} />
                </button>
              </div>
            </div>
            {/* List */}
            <div className="overflow-y-auto flex-1 px-6 py-4 space-y-2">
              {todos.length === 0 && (
                <div className="text-center py-10 text-stone-400">
                  <ListTodo size={36} className="mx-auto mb-2 text-stone-200" />
                  <p className="text-sm font-medium">No tasks yet</p>
                  <p className="text-xs mt-1">Add something above to get started</p>
                </div>
              )}
              {/* Pending */}
              {todos.filter(t => !t.done).map(todo => (
                <div key={todo.id} className="flex items-center gap-3 p-3 rounded-xl border border-stone-100 dark:border-stone-800 hover:border-blue-100 hover:bg-blue-50/30 dark:hover:bg-blue-950/30 group transition">
                  <button onClick={() => toggleTodo(todo.id)} className="flex-shrink-0 text-stone-300 hover:text-blue-600 transition">
                    <Circle size={18} />
                  </button>
                  <span className="flex-1 text-sm text-stone-700 dark:text-stone-300">{todo.text}</span>
                  <button onClick={() => deleteTodo(todo.id)} className="opacity-100 text-stone-300 hover:text-red-500 transition flex-shrink-0">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
              {/* Done */}
              {todos.filter(t => t.done).length > 0 && (
                <>
                  <p className="text-xs font-bold text-stone-400 uppercase tracking-wider pt-2 pb-1">Completed</p>
                  {todos.filter(t => t.done).map(todo => (
                    <div key={todo.id} className="flex items-center gap-3 p-3 rounded-xl border border-stone-100 dark:border-stone-800 group opacity-60">
                      <button onClick={() => toggleTodo(todo.id)} className="flex-shrink-0 text-emerald-500 hover:text-stone-400 transition">
                        <CircleCheck size={18} />
                      </button>
                      <span className="flex-1 text-sm text-stone-500 dark:text-stone-400 dark:text-stone-500 line-through">{todo.text}</span>
                      <button onClick={() => deleteTodo(todo.id)} className="opacity-100 text-stone-300 hover:text-red-500 transition flex-shrink-0">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </>
              )}
            </div>
            {todos.filter(t => t.done).length > 0 && (
              <div className="px-6 py-3 border-t border-stone-100 dark:border-stone-800">
                <button onClick={() => saveTodos(todos.filter(t => !t.done))} className="text-xs text-stone-400 dark:text-stone-500 hover:text-red-500 transition font-medium">
                  Clear completed
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Reminders Modal ── */}
      {showReminders && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowReminders(false)}>
          <div className="bg-white dark:bg-stone-900 rounded-2xl shadow-2xl w-full max-w-md flex flex-col max-h-[85vh]" onClick={e => e.stopPropagation()}>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-stone-100 dark:border-stone-800">
              <div className="flex items-center space-x-3">
                <div className="w-9 h-9 bg-amber-50 rounded-xl flex items-center justify-center">
                  <BellRing size={18} className="text-amber-600" />
                </div>
                <div>
                  <h3 className="font-bold text-stone-900 dark:text-white dark:text-white text-base">Reminders</h3>
                  <p className="text-xs text-stone-400 dark:text-stone-500">{reminders.length} reminder{reminders.length !== 1 ? 's' : ''}</p>
                </div>
              </div>
              <button onClick={() => setShowReminders(false)} className="text-stone-400 hover:text-stone-600 p-1 rounded-lg hover:bg-stone-100 dark:hover:bg-stone-800 transition"><X size={18} /></button>
            </div>
            {/* Add form */}
            <div className="px-6 py-4 border-b border-stone-100 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/50 space-y-3">
              <input
                type="text"
                placeholder="What do you need to remember?"
                className="w-full px-4 py-2.5 border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 text-sm bg-white dark:bg-stone-800 dark:text-stone-100"
                value={reminderText}
                onChange={e => setReminderText(e.target.value)}
              />
              <div className="flex gap-2">
                <input
                  type="date"
                  className="flex-1 px-3 py-2.5 border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 text-sm bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300"
                  style={{ colorScheme: 'light' }}
                  value={reminderDate}
                  onChange={e => setReminderDate(e.target.value)}
                />
                <input
                  type="time"
                  className="flex-1 px-3 py-2.5 border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-400 text-sm bg-white dark:bg-stone-800 text-stone-600 dark:text-stone-300"
                  style={{ colorScheme: 'light' }}
                  value={reminderTime}
                  onChange={e => setReminderTime(e.target.value)}
                />
              </div>
              <button
                onClick={addReminder}
                disabled={!reminderText.trim() || !reminderDate || !reminderTime}
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-sm font-semibold transition disabled:opacity-40 flex items-center justify-center space-x-2"
              >
                <Plus size={15} />
                <span>Add Reminder</span>
              </button>
            </div>
            {/* List */}
            <div className="overflow-y-auto flex-1 px-6 py-4 space-y-2">
              {reminders.length === 0 && (
                <div className="text-center py-10 text-stone-400">
                  <Bell size={36} className="mx-auto mb-2 text-stone-200" />
                  <p className="text-sm font-medium">No reminders yet</p>
                  <p className="text-xs mt-1">Set a date and time above</p>
                </div>
              )}
              {[...reminders].sort((a, b) => new Date(a.remind_at) - new Date(b.remind_at)).map(r => {
                const overdue = isOverdue(r.remind_at);
                return (
                  <div key={r.id} className={`flex items-start gap-3 p-3.5 rounded-xl border group transition ${overdue ? 'border-red-100 bg-red-50/40 dark:border-red-900 dark:bg-red-950/40' : 'border-stone-100 dark:border-stone-800 hover:border-amber-100 hover:bg-amber-50/30 dark:hover:bg-amber-950/30'}`}>
                    <div className={`mt-0.5 flex-shrink-0 w-7 h-7 rounded-lg flex items-center justify-center ${overdue ? 'bg-red-100' : 'bg-amber-50'}`}>
                      <Bell size={13} className={overdue ? 'text-red-500' : 'text-amber-500'} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-stone-800 dark:text-stone-200 font-medium leading-snug">{r.text}</p>
                      <p className={`text-xs mt-0.5 font-medium ${overdue ? 'text-red-500' : 'text-stone-400'}`}>
                        {r.sent ? '✓ Email sent · ' : overdue ? '⚠ Overdue · ' : ''}{formatReminderDate(r.remind_at)}
                      </p>
                    </div>
                    <button onClick={() => deleteReminder(r.id)} className="opacity-100 text-stone-300 hover:text-red-500 transition flex-shrink-0 mt-0.5">
                      <Trash2 size={14} />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-6">

        {/* Tabs */}
        <div className="flex space-x-1 bg-stone-100 dark:bg-stone-800 p-1 rounded-xl w-fit mb-6">
          {['documents', 'emergency'].map(tab => (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); if (tab === 'emergency') { fetchEmergencyDocs(); setPacketGenerated(false); } }}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition ${activeTab === tab ? 'bg-white dark:bg-stone-700 shadow text-stone-900 dark:text-white' : 'text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200'}`}
            >
              {tab === 'documents' ? t.myDocuments : (
                <span className="flex items-center space-x-1.5">
                  <AlertTriangle size={14} className="text-red-500" />
                  <span>{t.emergencyTab}</span>
                </span>
              )}
            </button>
          ))}
        </div>

        {/* ── Documents Tab ── */}
        {activeTab === 'documents' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-5">

              {/* Search + Filters */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-4 top-3.5 text-stone-400" size={16} />
                  <input
                    type="text"
                    placeholder={t.searchPlaceholder}
                    className="w-full pl-11 pr-4 py-3 bg-white dark:bg-stone-900 dark:text-stone-100 border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm shadow-sm"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                </div>
                <select
                  className="px-4 py-3 bg-white dark:bg-stone-900 dark:text-stone-300 border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-none text-sm shadow-sm text-stone-600"
                  value={categoryFilter}
                  onChange={e => setCategoryFilter(e.target.value)}
                >
                  <option value="All">{t.allCategories}</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{getCategoryLabel(c)}</option>)}
                </select>
                <button
                  onClick={() => setShowUploadPanel(true)}
                  className="sm:hidden flex items-center justify-center space-x-2 bg-blue-700 text-white text-sm font-semibold px-4 py-3 rounded-xl"
                >
                  <Upload size={15} />
                  <span>{t.uploadDocument}</span>
                </button>
              </div>

              {/* Document Grid */}
              {/* Select mode toolbar */}
              {filteredDocs.length > 0 && (
                <div className="flex items-center justify-between mb-3">
                  <button
                    onClick={() => { setSelectMode(s => !s); setSelectedIds([]); }}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-lg border transition ${selectMode ? 'bg-red-50 text-red-600 border-red-200' : 'bg-stone-100 text-stone-600 border-stone-200 hover:border-stone-300'}`}
                  >
                    {selectMode ? 'Cancel' : 'Select'}
                  </button>
                  {selectMode && (
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setSelectedIds(selectedIds.length === filteredDocs.length ? [] : filteredDocs.map(d => d.id))}
                        className="text-xs text-blue-600 hover:underline font-semibold"
                      >
                        {selectedIds.length === filteredDocs.length ? 'Deselect All' : 'Select All'}
                      </button>
                      <button
                        onClick={handleBulkDelete}
                        disabled={selectedIds.length === 0}
                        className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition disabled:opacity-40"
                      >
                        <Trash2 size={12} />
                        Delete ({selectedIds.length})
                      </button>
                    </div>
                  )}
                </div>
              )}

              {filteredDocs.length === 0 ? (
                <div className="text-center py-20 text-stone-400 dark:text-stone-600">
                  <FileText size={44} className="mx-auto mb-3 text-stone-300" />
                  <p className="font-medium text-stone-500 dark:text-stone-400">{t.noDocuments}</p>
                  <p className="text-sm mt-1">{t.noDocumentsHint}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {filteredDocs.map(doc => {
                    const isChecked = selectedIds.includes(doc.id);
                    return (
                    <div
                      key={doc.id}
                      onClick={() => {
                        if (selectMode) {
                          setSelectedIds(prev => isChecked ? prev.filter(id => id !== doc.id) : [...prev, doc.id]);
                        } else {
                          setSelectedDoc(doc);
                        }
                      }}
                      className={`p-5 bg-white dark:bg-stone-900 border rounded-2xl cursor-pointer hover:shadow-md transition shadow-sm relative group ${
                        selectMode && isChecked ? 'border-red-400 ring-2 ring-red-400/20 bg-red-50 dark:bg-red-950' :
                        !selectMode && selectedDoc?.id === doc.id ? 'border-blue-500 ring-2 ring-blue-500/10' : 'border-stone-200 dark:border-stone-700'
                      }`}
                    >
                      {selectMode && (
                        <div className={`absolute top-3 left-3 w-5 h-5 rounded-md border-2 flex items-center justify-center transition ${isChecked ? 'bg-red-600 border-red-600' : 'border-stone-300 bg-white'}`}>
                          {isChecked && (
                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                      )}
                      {doc.is_emergency && (
                        <div className="absolute top-3 right-3">
                          <AlertTriangle size={15} className="text-red-500" />
                        </div>
                      )}
                      <div className="flex items-start justify-between">
                        <div className={`bg-blue-50 p-2.5 rounded-xl text-blue-600 ${selectMode ? 'ml-6' : ''}`}><FileText size={20} /></div>
                        <span className="text-xs font-semibold px-2.5 py-1 bg-stone-100 text-stone-600 rounded-full mr-5">
                          {getCategoryLabel(doc.category)}
                        </span>
                      </div>
                      <h4 className="font-bold text-stone-800 dark:text-white mt-4 line-clamp-1 text-sm">{doc.title}</h4>
                      <p className="text-xs text-stone-400 dark:text-stone-500 mt-1">{t.uploaded}: {formatDate(doc.created_at)}</p>
                      <p className="text-sm text-stone-500 dark:text-stone-400 dark:text-stone-400 mt-2 line-clamp-2 leading-relaxed">
                        {getSummary(doc) || 'Click to view AI analysis...'}
                      </p>
                    </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Detail Panel — bottom sheet on mobile/tablet, sidebar on desktop */}

            {/* Mobile/Tablet: Bottom Sheet */}
            {selectedDoc && (
              <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end">
                {/* Backdrop */}
                <div
                  className="absolute inset-0 bg-black/40"
                  onClick={() => setSelectedDoc(null)}
                />
                {/* Sheet */}
                <div className="relative bg-white rounded-t-3xl shadow-2xl max-h-[85vh] flex flex-col">
                  {/* Drag handle */}
                  <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
                    <div className="w-10 h-1 bg-stone-300 rounded-full" />
                  </div>
                  {/* Panel Header */}
                  <div className="px-5 pt-2 pb-4 border-b border-stone-100 bg-stone-50 flex-shrink-0">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-1.5 text-blue-600 mb-1">
                          <Sparkles size={13} />
                          <span className="text-xs font-bold uppercase tracking-wider">{t.aiSummary}</span>
                        </div>
                        <h3 className="font-bold text-stone-900 dark:text-white dark:text-white text-base leading-tight truncate">{selectedDoc.title}</h3>
                        <p className="text-xs text-stone-400 dark:text-stone-500 dark:text-stone-500 mt-0.5">{getCategoryLabel(selectedDoc.category)}</p>
                      </div>
                      <button
                        onClick={() => setSelectedDoc(null)}
                        className="text-stone-400 hover:text-stone-600 ml-2 flex-shrink-0"
                      >
                        <X size={18} />
                      </button>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={() => handleViewOriginal(selectedDoc)}
                        className="flex items-center space-x-1.5 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-100 px-3 py-2 rounded-lg hover:bg-blue-100 transition"
                      >
                        <ExternalLink size={13} />
                        <span>{t.viewOriginal}</span>
                      </button>
                      <button
                        onClick={() => handleDelete(selectedDoc)}
                        className="flex items-center space-x-1.5 text-xs font-semibold text-red-600 bg-red-50 border border-red-100 px-3 py-2 rounded-lg hover:bg-red-100 transition"
                      >
                        <Trash2 size={13} />
                        <span>{t.deleteDoc}</span>
                      </button>
                      <button
                        onClick={() => handleToggleEmergency(selectedDoc)}
                        className={`flex items-center space-x-1.5 text-xs font-semibold px-3 py-2 rounded-lg border transition ${selectedDoc.is_emergency ? 'text-amber-700 bg-amber-50 border-amber-200 hover:bg-amber-100' : 'text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100'}`}
                      >
                        {selectedDoc.is_emergency ? <ShieldOff size={13} /> : <Shield size={13} />}
                        <span>{selectedDoc.is_emergency ? 'Remove Emergency' : 'Mark Emergency'}</span>
                      </button>
                    </div>
                  </div>
                  {/* Scrollable content */}
                  <div className="p-5 space-y-5 overflow-y-auto flex-1">
                    <div>
                      <h4 className="text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-2 flex items-center space-x-1">
                        <Globe size={13} />
                        <span>{t.plainLanguage}</span>
                      </h4>
                      <p className="text-sm text-stone-700 dark:text-stone-300 leading-relaxed bg-stone-50 dark:bg-stone-800 p-4 rounded-xl border border-stone-100 dark:border-stone-700">
                        {getSummary(selectedDoc) || '—'}
                      </p>
                    </div>
                    {selectedDoc.action_items && selectedDoc.action_items.length > 0 && (
                      <div>
                        <h4 className="text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-2 flex items-center space-x-1">
                          <CheckCircle size={13} />
                          <span>{t.actionItems}</span>
                        </h4>
                        <div className="space-y-2">
                          {selectedDoc.action_items.map((item, i) => (
                            <div key={i} className={`p-3 rounded-xl border text-xs ${PRIORITY_STYLES[item.priority] || PRIORITY_STYLES.low}`}>
                              <div className="flex items-start justify-between gap-2">
                                <p className="font-semibold leading-snug">{item.task}</p>
                                <span className="text-xs font-bold uppercase tracking-wide flex-shrink-0">
                                  {t[`${item.priority}Priority`] || item.priority}
                                </span>
                              </div>
                              {item.deadline && (
                                <div className="flex items-center space-x-1 mt-1.5 opacity-80">
                                  <Clock size={11} />
                                  <span>{t.deadline}: {item.deadline}</span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    <div>
                      <h4 className="text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-2 flex items-center space-x-1">
                        <FileText size={13} />
                        <span>{t.extractedText}</span>
                      </h4>
                      <pre className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed bg-stone-50 dark:bg-stone-800 p-4 rounded-xl border border-stone-100 dark:border-stone-700 max-h-48 overflow-y-auto whitespace-pre-wrap font-mono">
                        {selectedDoc.ocr_text || '—'}
                      </pre>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Desktop: Sidebar (unchanged) */}
            <div className="hidden lg:block lg:col-span-1">
              {selectedDoc ? (
                <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm sticky top-20 overflow-hidden">
                  {/* Panel Header */}
                  <div className="p-5 border-b border-stone-100 dark:border-stone-800 bg-stone-50 dark:bg-stone-800/50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-1.5 text-blue-600 mb-1">
                          <Sparkles size={13} />
                          <span className="text-xs font-bold uppercase tracking-wider">{t.aiSummary}</span>
                        </div>
                        <h3 className="font-bold text-stone-900 dark:text-white dark:text-white text-base leading-tight truncate">{selectedDoc.title}</h3>
                        <p className="text-xs text-stone-400 dark:text-stone-500 dark:text-stone-500 mt-0.5">{getCategoryLabel(selectedDoc.category)}</p>
                      </div>
                      <button
                        onClick={() => setSelectedDoc(null)}
                        className="text-stone-400 hover:text-stone-600 ml-2 flex-shrink-0"
                      >
                        <X size={18} />
                      </button>
                    </div>
                    {/* Action buttons */}
                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={() => handleViewOriginal(selectedDoc)}
                        className="flex items-center space-x-1.5 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-100 px-3 py-2 rounded-lg hover:bg-blue-100 transition"
                      >
                        <ExternalLink size={13} />
                        <span>{t.viewOriginal}</span>
                      </button>
                      <button
                        onClick={() => handleDelete(selectedDoc)}
                        className="flex items-center space-x-1.5 text-xs font-semibold text-red-600 bg-red-50 border border-red-100 px-3 py-2 rounded-lg hover:bg-red-100 transition"
                      >
                        <Trash2 size={13} />
                        <span>{t.deleteDoc}</span>
                      </button>
                      <button
                        onClick={() => handleToggleEmergency(selectedDoc)}
                        className={`flex items-center space-x-1.5 text-xs font-semibold px-3 py-2 rounded-lg border transition ${selectedDoc.is_emergency ? 'text-amber-700 bg-amber-50 border-amber-200 hover:bg-amber-100' : 'text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100'}`}
                      >
                        {selectedDoc.is_emergency ? <ShieldOff size={13} /> : <Shield size={13} />}
                        <span>{selectedDoc.is_emergency ? 'Remove Emergency' : 'Mark Emergency'}</span>
                      </button>
                    </div>
                  </div>

                  <div className="p-5 space-y-5 max-h-[65vh] overflow-y-auto">
                    {/* Summary */}
                    <div>
                      <h4 className="text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-2 flex items-center space-x-1">
                        <Globe size={13} />
                        <span>{t.plainLanguage}</span>
                      </h4>
                      <p className="text-sm text-stone-700 dark:text-stone-300 leading-relaxed bg-stone-50 dark:bg-stone-800 p-4 rounded-xl border border-stone-100 dark:border-stone-700">
                        {getSummary(selectedDoc) || '—'}
                      </p>
                    </div>

                    {/* Action Items */}
                    {selectedDoc.action_items && selectedDoc.action_items.length > 0 && (
                      <div>
                        <h4 className="text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-2 flex items-center space-x-1">
                          <CheckCircle size={13} />
                          <span>{t.actionItems}</span>
                        </h4>
                        <div className="space-y-2">
                          {selectedDoc.action_items.map((item, i) => (
                            <div
                              key={i}
                              className={`p-3 rounded-xl border text-xs ${PRIORITY_STYLES[item.priority] || PRIORITY_STYLES.low}`}
                            >
                              <div className="flex items-start justify-between gap-2">
                                <p className="font-semibold leading-snug">{item.task}</p>
                                <span className="text-xs font-bold uppercase tracking-wide flex-shrink-0">
                                  {t[`${item.priority}Priority`] || item.priority}
                                </span>
                              </div>
                              {item.deadline && (
                                <div className="flex items-center space-x-1 mt-1.5 opacity-80">
                                  <Clock size={11} />
                                  <span>{t.deadline}: {item.deadline}</span>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Extracted Text */}
                    <div>
                      <h4 className="text-xs font-bold text-stone-500 dark:text-stone-400 uppercase tracking-wider mb-2 flex items-center space-x-1">
                        <FileText size={13} />
                        <span>{t.extractedText}</span>
                      </h4>
                      <pre className="text-xs text-stone-500 dark:text-stone-400 leading-relaxed bg-stone-50 dark:bg-stone-800 p-4 rounded-xl border border-stone-100 dark:border-stone-700 max-h-48 overflow-y-auto whitespace-pre-wrap font-mono">
                        {selectedDoc.ocr_text || '—'}
                      </pre>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white dark:bg-stone-900 border border-dashed border-stone-200 dark:border-stone-700 rounded-2xl p-10 text-center flex flex-col items-center justify-center min-h-[280px]">
                  <FileText size={40} className="mb-3 text-stone-200" />
                  <p className="text-sm text-stone-400 dark:text-stone-500 font-medium">{t.selectDoc}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Emergency Tab ── */}
        {activeTab === 'emergency' && (
          <div className="max-w-3xl">

            {/* Print-only header */}
            <div className="hidden print:block text-center mb-8">
              <h1 className="text-2xl font-bold">ResourceBridge Emergency Packet</h1>
              <p className="text-sm text-gray-500">{new Date().toLocaleDateString()}</p>
            </div>

            {/* Controls — hidden when printing */}
            <div className="print:hidden">
              <div className="bg-white dark:bg-stone-900 rounded-2xl border border-stone-200 dark:border-stone-800 shadow-sm p-6 mb-5">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
                    <AlertTriangle size={20} className="text-red-500" />
                  </div>
                  <div>
                    <h2 className="font-bold text-stone-900 dark:text-white">{t.emergencyTitle}</h2>
                    <p className="text-sm text-stone-500 dark:text-stone-400">Select the documents you want in the packet, then generate.</p>
                  </div>
                </div>

                {/* Category filter */}
                <div className="flex flex-wrap items-center gap-2 mb-4">
                  {['All', ...CATEGORIES].map(cat => (
                    <button
                      key={cat}
                      onClick={() => setEmergencyCategoryFilter(cat)}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition ${
                        emergencyCategoryFilter === cat
                          ? 'bg-red-600 text-white border-red-600'
                          : 'bg-white text-stone-600 border-stone-200 hover:border-red-300 hover:text-red-600'
                      }`}
                    >
                      {cat === 'All' ? 'All Categories' : getCategoryLabel(cat)}
                    </button>
                  ))}
                </div>

                {/* Select all / none */}
                {filteredEmergencyDocs.length > 0 && (
                  <div className="flex items-center gap-3 mb-1">
                    <button
                      onClick={() => setSelectedPacketIds(filteredEmergencyDocs.map(d => d.id))}
                      className="text-xs text-blue-600 hover:underline font-semibold"
                    >
                      Select All
                    </button>
                    <span className="text-stone-300">·</span>
                    <button
                      onClick={() => setSelectedPacketIds([])}
                      className="text-xs text-stone-400 dark:text-stone-500 hover:underline font-semibold"
                    >
                      Deselect All
                    </button>
                    <span className="ml-auto text-xs text-stone-400 dark:text-stone-500">
                      {selectedPacketIds.filter(id => filteredEmergencyDocs.find(d => d.id === id)).length} of {filteredEmergencyDocs.length} selected
                    </span>
                  </div>
                )}
              </div>

              {/* Document selection cards */}
              {filteredEmergencyDocs.length === 0 ? (
                <div className="text-center py-16 text-stone-400">
                  <AlertTriangle size={40} className="mx-auto mb-3 text-stone-200" />
                  <p className="font-medium text-stone-500 dark:text-stone-400">{t.noEmergencyDocs}</p>
                  <p className="text-sm mt-1 max-w-sm mx-auto">{t.noEmergencyHint}</p>
                </div>
              ) : (
                <div className="space-y-3 mb-5">
                  {filteredEmergencyDocs.map(doc => {
                    const isChecked = selectedPacketIds.includes(doc.id);
                    return (
                      <div
                        key={doc.id}
                        onClick={() => togglePacketSelection(doc.id)}
                        className={`flex items-start gap-4 p-4 rounded-2xl border cursor-pointer transition ${
                          isChecked
                            ? 'bg-red-50 dark:bg-red-950/50 border-red-300 shadow-sm'
                            : 'bg-white dark:bg-stone-900 border-stone-200 dark:border-stone-700 hover:border-red-200'
                        }`}
                      >
                        {/* Checkbox */}
                        <div className={`flex-shrink-0 mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center transition ${
                          isChecked ? 'bg-red-600 border-red-600' : 'border-stone-300 bg-white'
                        }`}>
                          {isChecked && (
                            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2">
                            <h4 className="font-bold text-stone-800 dark:text-white text-sm truncate">{doc.title}</h4>
                            <span className="text-xs font-semibold px-2 py-0.5 bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-300 rounded-full flex-shrink-0">
                              {getCategoryLabel(doc.category)}
                            </span>
                          </div>
                          <p className="text-xs text-stone-400 dark:text-stone-500 dark:text-stone-500 mt-0.5">{formatDate(doc.created_at)}</p>
                          <p className="text-xs text-stone-500 mt-1 line-clamp-2 leading-relaxed">
                            {lang === 'es' && doc.ai_summary_es ? doc.ai_summary_es : doc.ai_summary}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Generate button */}
              {filteredEmergencyDocs.length > 0 && (
                <button
                  onClick={handleGeneratePacket}
                  disabled={selectedPacketIds.length === 0}
                  className="flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-3 rounded-xl transition shadow-sm text-sm disabled:opacity-40"
                >
                  <Printer size={16} />
                  <span>Generate Packet ({selectedPacketIds.filter(id => filteredEmergencyDocs.find(d => d.id === id)).length} docs)</span>
                </button>
              )}
            </div>

            {/* Generated packet — shown after clicking Generate, and visible when printing */}
            {packetGenerated && (
              <div className="mt-6 space-y-4" id="emergency-packet">
                <div className="flex items-center justify-between print:hidden mb-2">
                  <h3 className="font-bold text-stone-800 dark:text-white">Your Packet Preview</h3>
                  <button
                    onClick={() => setPacketGenerated(false)}
                    className="text-xs text-stone-400 dark:text-stone-500 hover:text-stone-600"
                  >
                    ← Edit selection
                  </button>
                </div>

                {emergencyDocs
                  .filter(d => selectedPacketIds.includes(d.id))
                  .map((doc, i) => (
                    <div key={i} className="bg-white dark:bg-stone-900 rounded-2xl border border-red-100 dark:border-red-900/50 shadow-sm p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-bold text-stone-900 dark:text-white">{doc.title}</h3>
                          <span className="text-xs text-stone-400 dark:text-stone-500">{getCategoryLabel(doc.category)} · {formatDate(doc.created_at)}</span>
                        </div>
                        <button
                          onClick={() => handleViewOriginal(doc)}
                          className="text-xs text-blue-600 flex items-center space-x-1 hover:underline print:hidden"
                        >
                          <ExternalLink size={12} />
                          <span>{t.viewOriginal}</span>
                        </button>
                      </div>
                      <div className="text-sm text-stone-600 dark:text-stone-300 bg-stone-50 dark:bg-stone-800 p-4 rounded-xl border border-stone-100 dark:border-stone-700 mb-3 leading-relaxed">
                        {lang === 'es' && doc.ai_summary_es ? doc.ai_summary_es : doc.ai_summary}
                      </div>
                      {doc.action_items?.length > 0 && (
                        <div className="space-y-1.5">
                          {doc.action_items.map((item, j) => (
                            <div key={j} className={`flex items-start space-x-2 text-xs p-2 rounded-lg border ${PRIORITY_STYLES[item.priority] || PRIORITY_STYLES.low}`}>
                              <CheckCircle size={12} className="mt-0.5 flex-shrink-0" />
                              <div>
                                <span className="font-semibold">{item.task}</span>
                                {item.deadline && <span className="ml-2 opacity-70">· {item.deadline}</span>}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                }

                <button
                  onClick={handlePrintPacket}
                  className="flex items-center space-x-2 text-sm font-semibold text-stone-700 border border-stone-200 px-5 py-2.5 rounded-xl hover:bg-stone-50 transition print:hidden"
                >
                  <Printer size={15} />
                  <span>{t.printPacket}</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}