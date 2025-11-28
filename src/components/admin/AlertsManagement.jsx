import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabaseClient';
import { toast } from 'sonner';
import Modal from '../shared/Modal'; 
import ImageUpload from '../shared/ImageUpload';
import { 
  Plus, Search, Trash2, Edit2, Megaphone, 
  AlertTriangle, Calendar, Clock, ChevronDown, CircleAlert
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

  const [open, setDropdownOpen] = useState(false); // For title dropdown

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
      
      // Clean up the date: Supabase dislikes empty strings for timestamps. Set to NULL if empty.
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
        delete payload.author_id; // Don't update author on edit
        const { error } = await supabase
          .from('alerts')
          .update(payload)
          .eq('id', currentAlert.id);
        if (error) throw error;
        toast.success("Alert updated");
      } else {
        const { error } = await supabase
          .from('alerts')
          .insert([payload]);
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

  const setOpen = (value) => {
    setDropdownOpen(value);
  }

  const openModal = (alert = null) => {
    if (alert) {
      setCurrentAlert(alert);
      setFormData({
        title: alert.title,
        category: alert.category,
        body: alert.body,
        is_urgent: alert.is_urgent,
        image_url: alert.image_url || '',
        // Convert ISO string back to local datetime-local format (YYYY-MM-DDTHH:MM)
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

  // Callback for our Reusable Image Component
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
        <div className="flex gap-2 bg-gray-100 p-1 rounded-lg">
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

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAlerts.map((alert) => (
          <div key={alert.id} className={`bg-white rounded-xl shadow-sm border overflow-hidden hover:shadow-md transition-shadow flex flex-col 
            ${alert.is_urgent ? 'border-red-200 ring-1 ring-red-100' : 
              alert.category === 'Event' ? 'bg-blue-100/50 border-blue-200' :
              alert.category === 'News' ? 'bg-amber-100/50 border-amber-200' :
              alert.category === 'Advisory' ? 'bg-cyan-100/50 border-cyan-200' :
              'border-gray-200'}`
            }>

              <div className={`px-5 py-4 flex justify-between items-start border-b 
                ${alert.is_urgent ? 'bg-red-50/50 border-red-100' :
                  alert.category === 'Event' ? 'bg-blue-100/50 border-blue-200' : 
                  alert.category === 'News' ? 'bg-amber-100/50 border-amber-200' : 
                  alert.category === 'Advisory' ? 'bg-cyan-100/50 border-cyan-200' : 
                'bg-blue-100 text-blue-600'}`
              }>
                <div className="flex gap-3">
                  <div className={`p-2 rounded-lg shrink-0 
                    ${alert.is_urgent ? 'bg-red-100 text-red-600' :
                    alert.category === 'Event' ? 'bg-blue-100 text-blue-600' :
                    alert.category === 'News' ? 'bg-orange-100 text-orange-600' :
                    alert.category === 'Advisory' ? 'bg-cyan-100 text-cyan-600' :
                    'bg-blue-100 text-blue-600'}`
                  }>
                    {alert.is_urgent ? <AlertTriangle className="w-5 h-5" /> :
                      alert.category === 'Event' ? <Calendar className="w-5 h-5" /> :
                      alert.category === 'News' ? <Megaphone className="w-5 h-5" /> :
                      alert.category === 'Advisory' ? <CircleAlert className="w-5 h-5" /> :
                      <Megaphone className="w-5 h-5" />
                    }
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-800 line-clamp-1">{alert.title}</h3>
                    <p className="text-xs text-gray-500 capitalize">{alert.category} • {new Date(alert.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
             </div>
             <div className="p-5 flex-grow">
                 {alert.image_url && <img src={alert.image_url} alt="Alert" className="w-full h-40 object-cover rounded-lg mb-3 bg-gray-100" />}
                 <p className="text-gray-600 text-sm line-clamp-4 whitespace-pre-line">{alert.body}</p>
                 {alert.expires_at && (
                    <div className="mt-3 flex items-center gap-1.5 text-xs text-amber-600 bg-amber-50 w-fit px-2 py-1 rounded-md">
                        <Clock className="w-3 h-3" /> Expires: {new Date(alert.expires_at).toLocaleDateString()}
                    </div>
                 )}
             </div>
             <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 flex justify-between items-center text-xs">
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
          </div>
        ))}
      </div>

      {/* Modal Form */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={currentAlert ? "Edit Alert" : "Create New Alert"}>
        <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Alert Title</label>          
              {/* 1. Quick Select Dropdown */}
                <div className="relative w-full">
                  {/* Text Field */}
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="Enter or select a title"
                    className="w-full p-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none"
                  />

                  {/* Dropdown Button */}
                  <button
                    type="button"
                    onClick={() => setOpen(!open)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>

                  {/* Dropdown List */}
                  {open && (
                    <ul className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg mt-1 shadow">
                      {COMMON_TITLES.map((t) => (
                        <li
                          key={t}
                          onClick={() => {
                            setFormData((prev) => ({ ...prev, title: t }));
                            setOpen(false);
                          }}
                          className="p-2 hover:bg-gray-100 cursor-pointer text-sm"
                        >
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
            
            {/* Expires At Field */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Expires At (Optional)</label>
              <input 
                  type="datetime-local"
                  value={formData.expires_at}
                  onChange={(e) => setFormData(p => ({...p, expires_at: e.target.value}))}
                  // Force light mode styles for the calendar picker so it's visible
                  className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 outline-none [color-scheme:light]"
              />
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

          {/* Reusable Image Upload Component */}
          <ImageUpload 
            onUploadComplete={handleImageUploaded} 
            initialImage={formData.image_url} 
          />

          <button type="submit" className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg transition-colors">{currentAlert ? "Save Changes" : "Post Alert"}</button>
        </form>
      </Modal>
    </div>
  );
};

export default AlertsManagement;