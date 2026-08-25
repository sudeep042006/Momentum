import React, { useState, useEffect } from 'react';
import { Search, Plus, Book, Quote, Trash2, Edit3, X, FileText } from 'lucide-react';
import DashboardLayout from '../components/layout/DashboardLayout';
import Header from '../components/layout/Header';
import { getJournals, createJournal, updateJournal, deleteJournal } from '../services/journal.api';
import { SkeletonGrid } from '../components/ui/Skeleton';

export default function Journal() {
  const [journals, setJournals] = useState([]);
  const [activeTab, setActiveTab] = useState('note'); // 'note' or 'quote'
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ title: '', content: '', type: 'note' });

  useEffect(() => {
    fetchJournals();
  }, []);

  const fetchJournals = async () => {
    try {
      setIsLoading(true);
      const res = await getJournals();
      setJournals(res.data.data || []);
    } catch (error) {
      console.error('Failed to fetch journals:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (journal = null, defaultType = 'note') => {
    if (journal) {
      setEditingId(journal._id);
      setFormData({
        title: journal.title || '',
        content: journal.content || '',
        type: journal.type || 'note'
      });
    } else {
      setEditingId(null);
      setFormData({ title: '', content: '', type: defaultType });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingId(null);
    setFormData({ title: '', content: '', type: 'note' });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await updateJournal(editingId, formData);
      } else {
        await createJournal(formData);
      }
      handleCloseModal();
      fetchJournals();
    } catch (error) {
      console.error('Failed to save journal:', error);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this?')) {
      try {
        await deleteJournal(id);
        fetchJournals();
      } catch (error) {
        console.error('Failed to delete journal:', error);
      }
    }
  };

  const filteredJournals = journals.filter(j => 
    j.type === activeTab &&
    (j.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
     j.content?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <DashboardLayout>
      <Header />
      <div className="max-w-[1600px] mx-auto px-6 py-6 w-full h-full flex flex-col">
        
        {/* Top Controls: Search, Tabs, Add Button */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          
          <div className="flex bg-momentum-panel border border-momentum-border rounded-xl p-1">
            <button 
              onClick={() => setActiveTab('note')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'note' ? 'bg-momentum-green-dark text-white' : 'text-momentum-text-secondary hover:text-white'}`}
            >
              <Book size={16} /> Notes
            </button>
            <button 
              onClick={() => setActiveTab('quote')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${activeTab === 'quote' ? 'bg-momentum-green-dark text-white' : 'text-momentum-text-secondary hover:text-white'}`}
            >
              <Quote size={16} /> Quotes
            </button>
          </div>

          <div className="flex-1 w-full md:max-w-md relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-momentum-text-secondary" size={18} />
            <input 
              type="text" 
              placeholder={`Search ${activeTab}s...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-momentum-panel border border-momentum-border text-white text-sm rounded-xl pl-10 pr-4 py-2.5 focus:outline-none focus:border-momentum-green-bright transition-colors"
            />
          </div>

          <button 
            onClick={() => handleOpenModal(null, activeTab)}
            className="flex items-center gap-2 bg-momentum-green-bright text-black px-5 py-2.5 rounded-xl font-medium hover:bg-momentum-green-glow transition-colors"
          >
            <Plus size={18} /> New {activeTab === 'note' ? 'Note' : 'Quote'}
          </button>
        </div>

        {/* Content Area */}
        {isLoading ? (
          <div className="flex-1 pt-4"><SkeletonGrid count={6} /></div>
        ) : filteredJournals.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-momentum-text-secondary border-2 border-dashed border-momentum-border rounded-2xl">
            {activeTab === 'note' ? <FileText size={48} className="mb-4 opacity-50" /> : <Quote size={48} className="mb-4 opacity-50" />}
            <p>No {activeTab}s found.</p>
            {searchQuery && <p className="text-sm mt-1">Try a different search term.</p>}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-max items-start">
            {filteredJournals.map((journal) => (
              <div 
                key={journal._id} 
                className="group relative bg-momentum-panel border border-momentum-border p-6 rounded-2xl hover:border-momentum-green-dark transition-all duration-300"
              >
                {/* Actions (visible on hover) */}
                <div className="absolute top-4 right-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleOpenModal(journal)} className="text-momentum-text-secondary hover:text-white bg-momentum-bg p-1.5 rounded-lg border border-momentum-border transition-colors">
                    <Edit3 size={14} />
                  </button>
                  <button onClick={() => handleDelete(journal._id)} className="text-momentum-text-secondary hover:text-red-400 bg-momentum-bg p-1.5 rounded-lg border border-momentum-border transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
                
                {journal.type === 'quote' && (
                  <Quote className="text-momentum-green-dark/30 absolute top-6 left-6" size={32} />
                )}

                <div className={`${journal.type === 'quote' ? 'mt-8 text-center px-4' : ''}`}>
                  {journal.title && (
                    <h3 className={`text-white font-semibold mb-3 pr-16 ${journal.type === 'quote' ? 'text-lg italic font-serif' : 'text-lg'}`}>
                      {journal.title}
                    </h3>
                  )}
                  <p className={`text-momentum-text-secondary whitespace-pre-wrap leading-relaxed ${journal.type === 'quote' ? 'text-sm mt-4 uppercase tracking-wider' : 'text-sm'}`}>
                    {journal.type === 'quote' && journal.title ? `— ${journal.content}` : journal.content}
                  </p>
                </div>
                
                <div className="mt-6 text-xs text-momentum-text-secondary opacity-50 font-mono">
                  {new Date(journal.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-momentum-panel border border-momentum-border rounded-2xl w-full max-w-lg p-6 flex flex-col shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <button 
              onClick={handleCloseModal}
              className="absolute top-4 right-4 text-momentum-text-secondary hover:text-white"
            >
              <X size={20} />
            </button>
            
            <h2 className="text-xl font-semibold text-white mb-6">
              {editingId ? 'Edit' : 'Create'} {formData.type === 'note' ? 'Note' : 'Quote'}
            </h2>
            
            <form onSubmit={handleSave} className="flex flex-col gap-4">
              {/* Type Switcher in Modal */}
              {!editingId && (
                <div className="flex bg-momentum-bg border border-momentum-border rounded-lg p-1 w-max">
                  <button 
                    type="button"
                    onClick={() => setFormData({...formData, type: 'note'})}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${formData.type === 'note' ? 'bg-momentum-panel text-white' : 'text-momentum-text-secondary hover:text-white'}`}
                  >
                    Note
                  </button>
                  <button 
                    type="button"
                    onClick={() => setFormData({...formData, type: 'quote'})}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${formData.type === 'quote' ? 'bg-momentum-panel text-white' : 'text-momentum-text-secondary hover:text-white'}`}
                  >
                    Quote
                  </button>
                </div>
              )}

              {formData.type === 'quote' ? (
                <>
                  <div>
                    <label className="block text-xs font-medium text-momentum-text-secondary mb-1">Quote</label>
                    <textarea 
                      required
                      placeholder="The quote itself..."
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      className="w-full bg-momentum-bg border border-momentum-border text-white text-sm rounded-xl px-4 py-3 focus:outline-none focus:border-momentum-green-bright transition-colors italic font-serif min-h-[100px] resize-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-momentum-text-secondary mb-1">Author (optional)</label>
                    <input 
                      type="text" 
                      placeholder="Author name..."
                      value={formData.content}
                      onChange={(e) => setFormData({...formData, content: e.target.value})}
                      className="w-full bg-momentum-bg border border-momentum-border text-white text-sm rounded-xl px-4 py-3 focus:outline-none focus:border-momentum-green-bright transition-colors"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-medium text-momentum-text-secondary mb-1">Title (optional)</label>
                    <input 
                      type="text" 
                      placeholder="Note Title"
                      value={formData.title}
                      onChange={(e) => setFormData({...formData, title: e.target.value})}
                      className="w-full bg-momentum-bg border border-momentum-border text-white text-sm rounded-xl px-4 py-3 focus:outline-none focus:border-momentum-green-bright transition-colors font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-momentum-text-secondary mb-1">Content</label>
                    <textarea 
                      required
                      placeholder="Write your note here..."
                      value={formData.content}
                      onChange={(e) => setFormData({...formData, content: e.target.value})}
                      className="w-full bg-momentum-bg border border-momentum-border text-white text-sm rounded-xl px-4 py-3 focus:outline-none focus:border-momentum-green-bright transition-colors min-h-[200px] resize-none"
                    />
                  </div>
                </>
              )}

              <div className="flex justify-end gap-3 mt-4">
                <button 
                  type="button" 
                  onClick={handleCloseModal}
                  className="px-4 py-2 text-sm font-medium text-momentum-text-secondary hover:text-white transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="bg-momentum-green-bright text-black px-6 py-2 rounded-xl text-sm font-medium hover:bg-momentum-green-glow transition-colors"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
