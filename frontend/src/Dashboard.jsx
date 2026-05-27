import React, { useState, useEffect, useRef } from 'react';
import API from './api';
import { useLanguage } from './LanguageContext';
import {
  FileText, Search, Upload, LogOut, Globe, Sparkles,
  AlertTriangle, Trash2, ExternalLink, CheckCircle,
  Clock, ChevronDown, X, Printer, Shield, ShieldOff
} from 'lucide-react';

const CATEGORIES = ['immigration', 'school', 'housing', 'employment', 'healthcare', 'benefits', 'emergency', 'Uncategorized'];

const PRIORITY_STYLES = {
  high: 'bg-red-50 text-red-700 border-red-200',
  medium: 'bg-amber-50 text-amber-700 border-amber-200',
  low: 'bg-emerald-50 text-emerald-700 border-emerald-200',
};

export default function Dashboard({ onLogout }) {
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
  const fileInputRef = useRef();

  useEffect(() => { fetchDocuments(); }, [categoryFilter, emergencyOnly]);

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

  const handleFileUpload = async (e) => {
    e.preventDefault();
    const file = fileInputRef.current?.files?.[0];
    if (!file || !title) return;

    setUploading(true);
    setUploadError('');

    try {
      // Step 1: Upload file to Cloudinary via backend
      const formData = new FormData();
      formData.append('file', file);
      const uploadRes = await API.post('/api/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      // Step 2: Create document record with returned URL + trigger AI pipeline
      const docRes = await API.post('/api/documents', {
        title,
        file_url: uploadRes.data.file_url,
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

  const handleDelete = async (docId) => {
    if (!window.confirm('Delete this document?')) return;
    try {
      await API.delete(`/api/documents/${docId}`);
      setDocuments(prev => prev.filter(d => d.id !== docId));
      if (selectedDoc?.id === docId) setSelectedDoc(null);
    } catch (err) {
      console.error('Error deleting document:', err);
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

  const handleGeneratePacket = async () => {
    setLoadingPacket(true);
    try {
      const res = await API.get('/api/emergency-packet');
      setEmergencyPacket(res.data);
    } catch (err) {
      alert(err.response?.data?.detail || 'Error generating packet.');
    } finally {
      setLoadingPacket(false);
    }
  };

  const handlePrintPacket = () => {
    window.print();
  };

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

  // Summary to show based on language
  const getSummary = (doc) => lang === 'es' && doc.ai_summary_es ? doc.ai_summary_es : doc.ai_summary;

  return (
    <div className="min-h-screen bg-stone-50 font-sans">
      {/* Header */}
      <nav className="bg-white border-b border-stone-200 px-4 sm:px-6 py-4 flex items-center justify-between sticky top-0 z-40 shadow-sm">
        <div className="flex items-center space-x-2.5">
          <div className="w-9 h-9 bg-blue-700 rounded-xl flex items-center justify-center shadow">
            <FileText size={17} className="text-white" />
          </div>
          <span className="text-lg font-black text-stone-900 tracking-tight">{t.appName}</span>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={toggle}
            className="text-xs font-semibold text-stone-500 border border-stone-200 px-3 py-1.5 rounded-lg hover:bg-stone-50 transition"
          >
            {t.language}
          </button>
          <button
            onClick={() => setShowUploadPanel(true)}
            className="hidden sm:flex items-center space-x-1.5 bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-blue-800 transition shadow-sm"
          >
            <Upload size={15} />
            <span>{t.uploadDocument}</span>
          </button>
          <button
            onClick={onLogout}
            className="flex items-center space-x-1.5 text-stone-400 hover:text-red-600 transition px-2 py-2 rounded-lg hover:bg-stone-100"
          >
            <LogOut size={17} />
          </button>
        </div>
      </nav>

      {/* Upload Panel Modal */}
      {showUploadPanel && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowUploadPanel(false)}>
          <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-stone-800 text-lg">{t.uploadTitle}</h3>
              <button onClick={() => setShowUploadPanel(false)} className="text-stone-400 hover:text-stone-600"><X size={20} /></button>
            </div>

            {uploadError && (
              <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm mb-4 border border-red-100">{uploadError}</div>
            )}

            <form onSubmit={handleFileUpload} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-1">{t.docTitle}</label>
                <input
                  type="text"
                  required
                  placeholder={t.docTitlePlaceholder}
                  className="w-full px-4 py-3 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-stone-50"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-1">{t.category}</label>
                <select
                  className="w-full px-4 py-3 border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-stone-50"
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                >
                  {CATEGORIES.map(c => (
                    <option key={c} value={c}>{getCategoryLabel(c)}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-stone-700 mb-1">File (PDF or Image)</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  required
                  accept=".pdf,.png,.jpg,.jpeg,.webp,.gif,.doc,.docx,.py"
                  className="w-full text-sm text-stone-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                />
              </div>

              <label className="flex items-center space-x-3 cursor-pointer p-3 rounded-xl border border-stone-200 hover:bg-stone-50">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded accent-red-600"
                  checked={isEmergency}
                  onChange={e => setIsEmergency(e.target.checked)}
                />
                <div className="flex items-center space-x-2 text-sm">
                  <AlertTriangle size={15} className="text-red-500" />
                  <span className="font-medium text-stone-700">{t.markEmergency}</span>
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

      <div className="max-w-7xl mx-auto px-4 py-6">

        {/* Tabs */}
        <div className="flex space-x-1 bg-stone-100 p-1 rounded-xl w-fit mb-6">
          {['documents', 'emergency'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition ${activeTab === tab ? 'bg-white shadow text-stone-900' : 'text-stone-500 hover:text-stone-700'}`}
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
                    className="w-full pl-11 pr-4 py-3 bg-white border border-stone-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm shadow-sm"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                </div>
                <select
                  className="px-4 py-3 bg-white border border-stone-200 rounded-xl focus:outline-none text-sm shadow-sm text-stone-600"
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
              {filteredDocs.length === 0 ? (
                <div className="text-center py-20 text-stone-400">
                  <FileText size={44} className="mx-auto mb-3 text-stone-300" />
                  <p className="font-medium text-stone-500">{t.noDocuments}</p>
                  <p className="text-sm mt-1">{t.noDocumentsHint}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {filteredDocs.map(doc => (
                    <div
                      key={doc.id}
                      onClick={() => setSelectedDoc(doc)}
                      className={`p-5 bg-white border rounded-2xl cursor-pointer hover:shadow-md transition shadow-sm relative group ${selectedDoc?.id === doc.id ? 'border-blue-500 ring-2 ring-blue-500/10' : 'border-stone-200'}`}
                    >
                      {doc.is_emergency && (
                        <div className="absolute top-3 right-3">
                          <AlertTriangle size={15} className="text-red-500" />
                        </div>
                      )}
                      <div className="flex items-start justify-between">
                        <div className="bg-blue-50 p-2.5 rounded-xl text-blue-600"><FileText size={20} /></div>
                        <span className="text-xs font-semibold px-2.5 py-1 bg-stone-100 text-stone-600 rounded-full mr-5">
                          {getCategoryLabel(doc.category)}
                        </span>
                      </div>
                      <h4 className="font-bold text-stone-800 mt-4 line-clamp-1 text-sm">{doc.title}</h4>
                      <p className="text-xs text-stone-400 mt-1">{t.uploaded}: {formatDate(doc.created_at)}</p>
                      <p className="text-sm text-stone-500 mt-2 line-clamp-2 leading-relaxed">
                        {getSummary(doc) || 'Click to view AI analysis...'}
                      </p>
                    </div>
                  ))}
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
                        <h3 className="font-bold text-stone-900 text-base leading-tight truncate">{selectedDoc.title}</h3>
                        <p className="text-xs text-stone-400 mt-0.5">{getCategoryLabel(selectedDoc.category)}</p>
                      </div>
                      <button
                        onClick={() => setSelectedDoc(null)}
                        className="text-stone-400 hover:text-stone-600 ml-2 flex-shrink-0"
                      >
                        <X size={18} />
                      </button>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <a
                        href={selectedDoc.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-1.5 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-100 px-3 py-2 rounded-lg hover:bg-blue-100 transition"
                      >
                        <ExternalLink size={13} />
                        <span>{t.viewOriginal}</span>
                      </a>
                      <button
                        onClick={() => handleDelete(selectedDoc.id)}
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
                      <h4 className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-2 flex items-center space-x-1">
                        <Globe size={13} />
                        <span>{t.plainLanguage}</span>
                      </h4>
                      <p className="text-sm text-stone-700 leading-relaxed bg-stone-50 p-4 rounded-xl border border-stone-100">
                        {getSummary(selectedDoc) || '—'}
                      </p>
                    </div>
                    {selectedDoc.action_items && selectedDoc.action_items.length > 0 && (
                      <div>
                        <h4 className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-2 flex items-center space-x-1">
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
                      <h4 className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-2 flex items-center space-x-1">
                        <FileText size={13} />
                        <span>{t.extractedText}</span>
                      </h4>
                      <pre className="text-xs text-stone-500 leading-relaxed bg-stone-50 p-4 rounded-xl border border-stone-100 max-h-48 overflow-y-auto whitespace-pre-wrap font-mono">
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
                <div className="bg-white rounded-2xl border border-stone-200 shadow-sm sticky top-20 overflow-hidden">
                  {/* Panel Header */}
                  <div className="p-5 border-b border-stone-100 bg-stone-50">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-1.5 text-blue-600 mb-1">
                          <Sparkles size={13} />
                          <span className="text-xs font-bold uppercase tracking-wider">{t.aiSummary}</span>
                        </div>
                        <h3 className="font-bold text-stone-900 text-base leading-tight truncate">{selectedDoc.title}</h3>
                        <p className="text-xs text-stone-400 mt-0.5">{getCategoryLabel(selectedDoc.category)}</p>
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
                      <a
                        href={selectedDoc.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center space-x-1.5 text-xs font-semibold text-blue-700 bg-blue-50 border border-blue-100 px-3 py-2 rounded-lg hover:bg-blue-100 transition"
                      >
                        <ExternalLink size={13} />
                        <span>{t.viewOriginal}</span>
                      </a>
                      <button
                        onClick={() => handleDelete(selectedDoc.id)}
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
                      <h4 className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-2 flex items-center space-x-1">
                        <Globe size={13} />
                        <span>{t.plainLanguage}</span>
                      </h4>
                      <p className="text-sm text-stone-700 leading-relaxed bg-stone-50 p-4 rounded-xl border border-stone-100">
                        {getSummary(selectedDoc) || '—'}
                      </p>
                    </div>

                    {/* Action Items */}
                    {selectedDoc.action_items && selectedDoc.action_items.length > 0 && (
                      <div>
                        <h4 className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-2 flex items-center space-x-1">
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
                      <h4 className="text-xs font-bold text-stone-500 uppercase tracking-wider mb-2 flex items-center space-x-1">
                        <FileText size={13} />
                        <span>{t.extractedText}</span>
                      </h4>
                      <pre className="text-xs text-stone-500 leading-relaxed bg-stone-50 p-4 rounded-xl border border-stone-100 max-h-48 overflow-y-auto whitespace-pre-wrap font-mono">
                        {selectedDoc.ocr_text || '—'}
                      </pre>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-white border border-dashed border-stone-200 rounded-2xl p-10 text-center flex flex-col items-center justify-center min-h-[280px]">
                  <FileText size={40} className="mb-3 text-stone-200" />
                  <p className="text-sm text-stone-400 font-medium">{t.selectDoc}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Emergency Tab ── */}
        {activeTab === 'emergency' && (
          <div className="max-w-3xl">
            <div className="bg-white rounded-2xl border border-stone-200 shadow-sm p-6 mb-6">
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
                  <AlertTriangle size={20} className="text-red-500" />
                </div>
                <div>
                  <h2 className="font-bold text-stone-900">{t.emergencyTitle}</h2>
                  <p className="text-sm text-stone-500">{t.emergencySubtitle}</p>
                </div>
              </div>
              <button
                onClick={handleGeneratePacket}
                disabled={loadingPacket}
                className="mt-4 flex items-center space-x-2 bg-red-600 hover:bg-red-700 text-white font-semibold px-6 py-3 rounded-xl transition shadow-sm text-sm disabled:opacity-60"
              >
                <Printer size={16} />
                <span>{loadingPacket ? t.processing : t.generatePacket}</span>
              </button>
            </div>

            {emergencyPacket ? (
              <div className="space-y-4 print:block" id="emergency-packet">
                <div className="hidden print:block text-center mb-6">
                  <h1 className="text-2xl font-bold">ResourceBridge Emergency Packet</h1>
                  <p className="text-sm text-gray-500">{emergencyPacket.owner_email} — {new Date().toLocaleDateString()}</p>
                </div>
                {emergencyPacket.documents.map((doc, i) => (
                  <div key={i} className="bg-white rounded-2xl border border-red-100 shadow-sm p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-bold text-stone-900">{doc.title}</h3>
                        <span className="text-xs text-stone-400">{getCategoryLabel(doc.category)} · {formatDate(doc.uploaded)}</span>
                      </div>
                      <a
                        href={doc.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 flex items-center space-x-1 hover:underline print:hidden"
                      >
                        <ExternalLink size={12} />
                        <span>{t.viewOriginal}</span>
                      </a>
                    </div>
                    <div className="text-sm text-stone-600 bg-stone-50 p-4 rounded-xl border border-stone-100 mb-3 leading-relaxed">
                      {lang === 'es' && doc.summary_es ? doc.summary_es : doc.summary}
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
                ))}
                <button
                  onClick={handlePrintPacket}
                  className="flex items-center space-x-2 text-sm font-semibold text-stone-700 border border-stone-200 px-5 py-2.5 rounded-xl hover:bg-stone-50 transition print:hidden"
                >
                  <Printer size={15} />
                  <span>{t.printPacket}</span>
                </button>
              </div>
            ) : (
              <div className="text-center py-16 text-stone-400">
                <AlertTriangle size={40} className="mx-auto mb-3 text-stone-200" />
                <p className="font-medium text-stone-500">{t.noEmergencyDocs}</p>
                <p className="text-sm mt-1 max-w-sm mx-auto">{t.noEmergencyHint}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}