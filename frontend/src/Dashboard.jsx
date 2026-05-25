import React, { useState, useEffect } from 'react';
import API from './api';
import { FileText, Search, Upload, LogOut, Globe, Sparkles } from 'lucide-react';

export default function Dashboard({ onLogout }) {
  const [documents, setDocuments] = useState([]);
  const [search, setSearch] = useState('');
  const [fileUrl, setFileUrl] = useState('');
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [uploading, setUploading] = useState(false);

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
    if (!fileUrl) return;
    setUploading(true);
    try {
      // Connects directly to Render OCR text-extraction + Gemini processing logic
      const res = await API.post('/documents/process', { file_url: fileUrl });
      setDocuments([res.data, ...documents]);
      setFileUrl('');
    } catch (err) {
      alert('Error processing file framework.');
    } finally {
      setUploading(false);
    }
  };

  const filteredDocs = documents.filter(doc => 
    doc.ocr_text?.toLowerCase().includes(search.toLowerCase()) ||
    doc.ai_summary?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header Navigation */}
      <nav className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="bg-blue-600 px-3 py-1.5 rounded-xl text-white font-bold text-xl shadow-md">RB</div>
          <span className="text-xl font-bold text-slate-800">ResourceBridge</span>
        </div>
        <button onClick={onLogout} className="flex items-center space-x-2 text-slate-500 hover:text-red-600 transition px-3 py-2 rounded-lg hover:bg-slate-50 cursor-pointer">
          <LogOut size={18} />
          <span className="text-sm font-medium">Log Out</span>
        </button>
      </nav>

      <div className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Interface Action Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* File Processing Form */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center space-x-2">
              <Upload size={18} className="text-blue-600" />
              <span>Process New Family Document</span>
            </h3>
            <form onSubmit={handleUpload} className="flex gap-3">
              <input
                type="url"
                required
                placeholder="Paste secure document URL (PDF or Image link)..."
                className="flex-1 px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                value={fileUrl}
                onChange={(e) => setFileUrl(e.target.value)}
              />
              <button type="submit" disabled={uploading} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl font-medium transition text-sm flex items-center space-x-2 shadow-sm cursor-pointer disabled:opacity-50">
                {uploading ? 'Processing...' : 'Upload & Analyze'}
              </button>
            </form>
          </div>

          {/* Search Bar Component */}
          <div className="relative">
            <Search className="absolute left-4 top-3.5 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Search across your encrypted document vault..."
              className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm shadow-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Searchable Dashboard Grid Layout */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {filteredDocs.map((doc) => (
              <div 
                key={doc.id}
                onClick={() => setSelectedDoc(doc)}
                className={`p-5 bg-white border rounded-2xl cursor-pointer hover:shadow-md transition shadow-sm ${selectedDoc?.id === doc.id ? 'border-blue-500 ring-2 ring-blue-500/10' : 'border-slate-200'}`}
              >
                <div className="flex items-start justify-between">
                  <div className="bg-blue-50 p-3 rounded-xl text-blue-600"><FileText size={22} /></div>
                  <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full">{doc.category || 'General'}</span>
                </div>
                <h4 className="font-bold text-slate-800 mt-4 line-clamp-1">Document #{doc.id}</h4>
                <p className="text-xs text-slate-400 mt-1">Uploaded: {new Date(doc.created_at).toLocaleDateString()}</p>
                <p className="text-sm text-slate-500 mt-3 line-clamp-2">{doc.ai_summary || 'Click to read plain-language breakdown...'}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Intelligence Split-Screen Card Display */}
        <div className="lg:col-span-1">
          {selectedDoc ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6 sticky top-8">
              <div className="border-b border-slate-100 pb-4">
                <div className="flex items-center space-x-2 text-blue-600 mb-1">
                  <Sparkles size={18} /> 
                  <span className="text-xs font-bold uppercase tracking-wider">AI Intelligence Summary</span>
                </div>
                <h3 className="text-xl font-bold text-slate-800">Document #{selectedDoc.id} Summary</h3>
                <p className="text-xs text-slate-400 mt-0.5">Category: {selectedDoc.category || 'General'}</p>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-bold text-slate-700 flex items-center space-x-2 mb-1">
                    <FileText size={16} className="text-slate-400" />
                    <span>Plain-Language Explanation</span>
                  </h4>
                  <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100">{selectedDoc.ai_summary}</p>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-slate-700 flex items-center space-x-2 mb-1">
                    <Globe size={16} className="text-slate-400" />
                    <span>Bilingual Translation Assistant</span>
                  </h4>
                  <p className="text-sm text-slate-600 leading-relaxed bg-blue-50/40 p-4 rounded-xl border border-blue-100/40">{selectedDoc.translation || 'No translation requested.'}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-dashed border-slate-200 rounded-2xl p-8 text-center text-slate-400 flex flex-col items-center justify-center min-h-[300px] shadow-sm">
              <FileText size={40} className="mb-3 text-slate-300" />
              <p className="text-sm font-medium text-slate-500">Select any document from the vault dashboard to review its AI analysis instantly.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}