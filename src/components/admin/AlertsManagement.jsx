import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabaseClient';
import { toast } from 'sonner';
import Modal from '../shared/Modal'; 
import ImageUpload from '../shared/ImageUpload';
import NewsCard from '../shared/NewsCard'; // Importing the reusable card
import { 
  Plus, Search, Trash2, Edit2, ChevronDown
} from 'lucide-react';

const COMMON_TITLES = [
  "Water Interruption Advisory",
  "Power Outage Scheduled",
  "Garbage Collection Schedule",
  "Emergency Storm Warning",
  "Community Assembly"
];

const AlertsManagement = () => {
  const [alerts, setAlerts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState("all");

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

  const [open, setDropdownOpen] = useState(false);

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

  // ... (Keep handleSubmit, handleDelete, handleChange logic same as your original file)
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

  const filteredAlerts = alerts.filter(alert => {
    const matchesSearch = alert.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter === 'all' ? true : filter === 'urgent' ? alert.is_urgent : alert.category.toLowerCase() === filter;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">
      {/* Top Bar */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <div className="flex gap-2 bg-gray-100 p-1 rounded-lg overflow-x-auto">
          {['all', 'urgent', 'news', 'event', 'advisory'].map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={`px-4 py-2 font-medium rounded-md capitalize transition-all ${filter === f ? 'bg-white shadow-sm text-amber-600' : 'text-gray-500 hover:text-gray-700'}`}>{f}</button>
          ))}
        </div>
        <div className="flex gap-3 w-full md:w-auto ">
          <div className="relative flex-grow md:flex-grow-0">
             <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
             <input type="text" placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 outline-none w-full" />
          </div>
          <button onClick={() => openModal()} className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors "><Plus className="w-4 h-4" /><span>Create Alert</span></button>
        </div>
      </div>

      {/* Grid using Reusable NewsCard */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAlerts.map((alert) => (
          <NewsCard 
            key={alert.id} 
            alert={alert}
            // Passing Custom Admin Footer
            footer={
              <div className="flex justify-between items-center w-full">
                  <span className="text-gray-400">By {alert.profiles?.full_name || "Admin"}</span>
                  <div className="flex gap-2">
                      <button onClick={() => openModal(alert)} className="p-1.5 hover:bg-white rounded-md text-blue-600 transition-colors border border-transparent hover:border-gray-200 shadow-sm">
                          <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(alert.id)} className="p-1.5 hover:bg-white rounded-md text-red-600 transition-colors border border-transparent hover:border-gray-200 shadow-sm">
                          <Trash2 className="w-4 h-4" />
                      </button>
                  </div>
              </div>
            }
          />
        ))}
      </div>

      {/* Modal Form */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={currentAlert ? "Edit Alert" : "Create New Alert"}>
        <form onSubmit={handleSubmit} className="space-y-4">
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
                    onClick={() => setDropdownOpen(!open)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                  {open && (
                    <ul className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg mt-1 shadow">
                      {COMMON_TITLES.map((t) => (
                        <li key={t} onClick={() => { setFormData((prev) => ({ ...prev, title: t })); setDropdownOpen(false); }} className="p-2 hover:bg-gray-100 cursor-pointer text-sm">
                          {t}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select value={formData.category} onChange={(e) => setFormData(p => ({...p, category: e.target.value}))} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none bg-white">
                <option value="News">News</option>
                <option value="Event">Event</option>
                <option value="Advisory">Advisory</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Expires At (Optional)</label>
              <input type="datetime-local" value={formData.expires_at} onChange={(e) => setFormData(p => ({...p, expires_at: e.target.value}))} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none [color-scheme:light]" />
            </div>
          </div>

          <div className="flex items-center gap-2 p-3 border border-red-100 bg-red-50 rounded-lg">
             <input type="checkbox" id="urgent-check" checked={formData.is_urgent} onChange={(e) => setFormData(p => ({...p, is_urgent: e.target.checked}))} className="w-4 h-4 text-red-600 rounded focus:ring-red-500" />
             <label htmlFor="urgent-check" className="text-sm font-medium text-red-800 cursor-pointer">Mark as Urgent / Emergency</label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Details</label>
            <textarea required rows={4} value={formData.body} onChange={(e) => setFormData(p => ({...p, body: e.target.value}))} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none resize-none" placeholder="Type details..." />
          </div>

          <ImageUpload onUploadComplete={handleImageUploaded} initialImage={formData.image_url} />

          <button type="submit" className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg transition-colors">{currentAlert ? "Save Changes" : "Post Alert"}</button>
        </form>
      </Modal>
    </div>
  );
};

export default AlertsManagement;