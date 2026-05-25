import React, { useState, useEffect } from 'react';
import API from './api';
import { FileText, Search, Upload, LogOut, Globe, Sparkles } from 'lucide-react';

const CATEGORIES = [
  'immigration', 'school', 'housing', 'employment',
  'healthcare', 'benefits', 'emergency', 'Uncategorized'
];

export default function Dashboard({ onLogout }) {
  const [documents, setDocuments] = useState([]);
  const [search, setSearch] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  // FIX: Added title and category state — the original hardcoded title as
  // "Uploaded Document" and never sent a category, which wasn't useful
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Uncategorized');
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const res = await API.get('/documents');
      setDocuments(res.data);
    } catch (err) {
      console.error('Error fetching documents:', err);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!fileUrl || !title) return;
    setUploading(true);
    setError('');
    try {
      const res = await API.post('/documents', {
        title,
        file_url: fileUrl,
        category,
      });
      setDocuments([res.data, ...documents]);
      setFileUrl('');
      setTitle('');
      setCategory('Uncategorized');
    } catch (err) {
      setError(err.response?.data?.detail || 'Error processing document. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const filteredDocs = documents.filter(doc =>
    doc.title?.toLowerCase().includes(search.toLowerCase()) ||
    doc.ocr_text?.toLowerCase().includes(search.toLowerCase()) ||
    doc.ai_summary?.toLowerCase().includes(search.toLowerCase())
  );

  // FIX: Safe date formatter — the original called new Date(doc.created_at).toLocaleDateString()
  // directly, which crashes if created_at is undefined (it was missing from the model)
  const formatDate = (dateStr) => {
    if (!dateStr) return 'Unknown date';
    return new Date(dateStr).toLocaleDateString();
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <nav className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="bg-blue-600 px-3 py-1.5 rounded-xl text-white font-bold text-xl shadow-md">RB</div>
          <span className="text-xl font-bold text-slate-800">ResourceBridge</span>
        </div>
        <button
          onClick={onLogout}
          className="flex items-center space-x-2 text-slate-500 hover:text-red-600 transition px-3 py-2 rounded-lg hover:bg-slate-50 cursor-pointer"
        >
          <LogOut size={18} />
          <span className="text-sm font-medium">Log Out</span>
        </button>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left / Main Column */}
        <div className="lg:col-span-2 space-y-6">

          {/* Upload Form */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center space-x-2">
              <Upload size={18} className="text-blue-600" />
              <span>Process New Family Document</span>
            </h3>

            {error && (
              <div className="mb-4 bg-red-50 text-red-600 p-3 rounded-lg text-sm border border-red-100">
                {error}
              </div>
            )}

            {/* FIX: Expanded form to include title and category inputs.
                The original only had a URL field, which meant all documents were
                saved with the title "Uploaded Document" and no category. */}
            <form onSubmit={handleUpload} className="space-y-3">
              <div className="flex gap-3">
                <input
                  type="text"
                  required
                  placeholder="Document title (e.g. Lease Agreement 2024)"
                  className="flex-1 px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
                <select
                  className="px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white text-slate-600"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  {CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex gap-3">
                <input
                  type="url"
                  required
                  placeholder="Paste public document URL (PDF or image link)..."
                  className="flex-1 px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                  value={fileUrl}
                  onChange={(e) => setFileUrl(e.target.value)}
                />
                <button
                  type="submit"
                  disabled={uploading}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium transition text-sm flex items-center space-x-2 shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {uploading ? 'Processing...' : 'Upload & Analyze'}
                </button>
              </div>
            </form>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-4 top-3.5 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search across your document vault..."
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm shadow-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Document Grid */}
          {filteredDocs.length === 0 ? (
            <div className="text-center text-slate-400 py-16">
              <FileText size={40} className="mx-auto mb-3 text-slate-300" />
              <p className="text-sm">No documents yet. Upload your first document above.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredDocs.map((doc) => (
                <div
                  key={doc.id}
                  onClick={() => setSelectedDoc(doc)}
                  className={`p-5 bg-white border rounded-2xl cursor-pointer hover:shadow-md transition shadow-sm ${selectedDoc?.id === doc.id ? 'border-blue-500 ring-2 ring-blue-500/10' : 'border-slate-200'}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="bg-blue-50 p-3 rounded-xl text-blue-600"><FileText size={22} /></div>
                    <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full">
                      {doc.category || 'General'}
                    </span>
                  </div>
                  {/* FIX: Show the actual document title instead of "Document #id" */}
                  <h4 className="font-bold text-slate-800 mt-4 line-clamp-1">{doc.title}</h4>
                  {/* FIX: formatDate() safely handles undefined created_at */}
                  <p className="text-xs text-slate-400 mt-1">Uploaded: {formatDate(doc.created_at)}</p>
                  <p className="text-sm text-slate-500 mt-3 line-clamp-2">
                    {doc.ai_summary || 'Click to read plain-language breakdown...'}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Column — Detail Panel */}
        <div className="lg:col-span-1">
          {selectedDoc ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6 sticky top-8">
              <div className="border-b border-slate-100 pb-4">
                <div className="flex items-center space-x-2 text-blue-600 mb-1">
                  <Sparkles size={18} />
                  <span className="text-xs font-bold uppercase tracking-wider">AI Intelligence Summary</span>
                </div>
                <h3 className="text-xl font-bold text-slate-800">{selectedDoc.title}</h3>
                <p className="text-xs text-slate-400 mt-0.5">Category: {selectedDoc.category || 'General'}</p>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-bold text-slate-700 flex items-center space-x-2 mb-1">
                    <Sparkles size={16} className="text-slate-400" />
                    <span>Plain-Language Explanation</span>
                  </h4>
                  <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">
                    {selectedDoc.ai_summary || 'No summary available.'}
                  </p>
                </div>

                {/* FIX: Changed selectedDoc.translation → selectedDoc.ocr_text
                    "translation" doesn't exist in the schema. The raw extracted text
                    is stored in ocr_text, which is the correct field to display here. */}
                <div>
                  <h4 className="text-sm font-bold text-slate-700 flex items-center space-x-2 mb-1">
                    <Globe size={16} className="text-slate-400" />
                    <span>Extracted Document Text</span>
                  </h4>
                  <p className="text-sm text-slate-600 leading-relaxed bg-blue-50/40 p-4 rounded-xl border border-blue-100/40 max-h-64 overflow-y-auto whitespace-pre-wrap">
                    {selectedDoc.ocr_text || 'No extracted text available.'}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-dashed border-slate-200 rounded-2xl p-8 text-center text-slate-400 flex flex-col items-center justify-center min-h-[300px] shadow-sm">
              <FileText size={40} className="mb-3 text-slate-300" />
              <p className="text-sm font-medium text-slate-500">
                Select any document to review its AI analysis.
              </p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
