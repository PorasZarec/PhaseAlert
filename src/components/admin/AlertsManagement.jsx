import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabaseClient';
import { toast } from 'sonner';
import Modal from '../shared/Modal'; 
import ImageUpload from '../shared/ImageUpload';
import NewsCard from '../shared/NewsCard'; 
import { 
  Plus, Search, Trash2, Edit2, ChevronDown
} from 'lucide-react';

import { CATEGORIES, COMMON_TITLES } from '../../data/HelperData';

const AlertsManagement = () => {
  const [alerts, setAlerts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Default to "All" (Capitalized)
  const [filter, setFilter] = useState("All");

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentAlert, setCurrentAlert] = useState(null);
  
  const [formData, setFormData] = useState({
    title: '',
    category: 'News',
    body: '',
    is_urgent: false,
    image_url: '',
    expires_at: ''
  });

  const [dropdownOpen, setDropdownOpen] = useState(false);

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('alerts')
        .select(`*, profiles:author_id (full_name)`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAlerts(data || []);
    } catch (error) {
      console.error('Error fetching alerts:', error);
      toast.error('Failed to load alerts');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const finalExpiresAt = formData.expires_at ? new Date(formData.expires_at).toISOString() : null;

      const payload = {
        title: formData.title,
        category: formData.category,
        body: formData.body,
        is_urgent: formData.is_urgent,
        image_url: formData.image_url, 
        expires_at: finalExpiresAt,
        author_id: user.id
      };

      if (currentAlert) {
        delete payload.author_id; 
        const { error } = await supabase.from('alerts').update(payload).eq('id', currentAlert.id);
        if (error) throw error;
        toast.success("Alert updated");
      } else {
        const { error } = await supabase.from('alerts').insert([payload]);
        if (error) throw error;
        toast.success("Alert created");
      }
      setIsModalOpen(false);
      fetchAlerts();
    } catch (error) {
      console.error(error);
      toast.error("Error saving: " + error.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this alert?")) return;
    try {
      const { error } = await supabase.from('alerts').delete().eq('id', id);
      if (error) throw error;
      toast.success("Alert deleted");
      fetchAlerts();
    } catch (error) {
      console.error(error);
      toast.error("Could not delete");
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const openModal = (alert = null) => {
    if (alert) {
      setCurrentAlert(alert);
      setFormData({
        title: alert.title,
        category: alert.category,
        body: alert.body,
        is_urgent: alert.is_urgent,
        image_url: alert.image_url || '',
        expires_at: alert.expires_at ? new Date(alert.expires_at).toISOString().slice(0, 16) : ''
      });
    } else {
      setCurrentAlert(null);
      setFormData({
        title: '',
        category: 'News',
        body: '',
        is_urgent: false,
        image_url: '',
        expires_at: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleImageUploaded = (url) => {
    setFormData(prev => ({ ...prev, image_url: url }));
  };

  // --- REFACTORED FILTER LOGIC ---
  const filteredAlerts = alerts.filter(alert => {
    const matchesSearch = alert.title.toLowerCase().includes(searchQuery.toLowerCase());
    
    let matchesFilter = true;
    if (filter === 'All') {
        matchesFilter = true;
    } else if (filter === 'Urgent') {
        matchesFilter = alert.is_urgent === true;
    } else {
        // Direct exact match (e.g., "News" === "News")
        matchesFilter = alert.category === filter;
    }

    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        
        {/* Categories Pills */}
        <div className="flex gap-2 w-full md:w-auto overflow-x-auto rounded-xl p-2 bg-gray-50">
          {CATEGORIES.map(({ key, label }) => (
            <button 
                key={key} 
                onClick={() => setFilter(key)} 
                className={`px-4 py-2 font-medium rounded-md text-sm whitespace-nowrap transition-all 
                ${filter === key ? 'bg-amber-100 text-amber-700 shadow-sm ring-1 ring-amber-200' : 'text-gray-500 hover:bg-white'}`}
            >
                {label}
            </button>
          ))}
        </div>

        <div className="flex gap-3 w-full md:w-auto">
          <div className="relative flex-grow md:flex-grow-0">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
             <input type="text" placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 outline-none w-full" />
          </div>
          <button onClick={() => openModal()} className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shrink-0">
            <Plus className="w-4 h-4" /><span>Create Alert</span>
          </button>
        </div>
      </div>

      {/* Grid using Reusable NewsCard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAlerts.map((alert) => (
          <NewsCard 
            key={alert.id} 
            alert={alert}
            footer={
              <div className="flex justify-between items-center w-full">
                  <span className="text-gray-400 text-xs">By {alert.profiles?.full_name || "Admin"}</span>
                  <div className="flex gap-1">
                      <button onClick={() => openModal(alert)} className="p-1.5 hover:bg-gray-100 rounded-md text-blue-600 transition-colors">
                          <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(alert.id)} className="p-1.5 hover:bg-gray-100 rounded-md text-red-600 transition-colors">
                          <Trash2 className="w-4 h-4" />
                      </button>
                  </div>
              </div>
            }
          />
        ))}
        {filteredAlerts.length === 0 && (
             <div className="col-span-full text-center py-10 text-gray-400">
                 No alerts found matching your criteria.
             </div>
        )}
      </div>

      {/* Modal Form */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={currentAlert ? "Edit Alert" : "Create New Alert"}>
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Alert Title</label>          
                <div className="relative w-full">
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="Enter or select a title"
                    className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 p-1"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                  {dropdownOpen && (
                    <ul className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg mt-1 shadow-lg max-h-40 overflow-y-auto">
                      {COMMON_TITLES.map((t) => (
                        <li key={t} onClick={() => { setFormData((prev) => ({ ...prev, title: t })); setDropdownOpen(false); }} className="p-2 hover:bg-amber-50 cursor-pointer text-sm">
                          {t}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
            </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select 
                name="category"
                value={formData.category} 
                onChange={handleChange} 
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none bg-white text-sm"
              >
                <option value="News">News</option>
                <option value="Event">Event</option>
                <option value="Advisory">Advisory</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Expires At (Optional)</label>
              <input type="datetime-local" name="expires_at" value={formData.expires_at} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none text-sm" />
            </div>
          </div>

          <div className="flex items-center gap-2 p-3 border border-red-100 bg-red-50 rounded-lg">
             <input type="checkbox" id="urgent-check" checked={formData.is_urgent} onChange={(e) => setFormData(p => ({...p, is_urgent: e.target.checked}))} className="w-4 h-4 text-red-600 rounded focus:ring-red-500" />
             <label htmlFor="urgent-check" className="text-sm font-medium text-red-800 cursor-pointer">Mark as Urgent / Emergency</label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Details</label>
            <textarea required rows={4} name="body" value={formData.body} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none resize-none text-sm" placeholder="Type details..." />
          </div>

          <ImageUpload onUploadComplete={handleImageUploaded} initialImage={formData.image_url} />

          <button type="submit" className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg transition-colors shadow-sm">
            {currentAlert ? "Save Changes" : "Post Alert"}
          </button>
        </form>
      </Modal>
    </div>
  );
};

export default AlertsManagement;