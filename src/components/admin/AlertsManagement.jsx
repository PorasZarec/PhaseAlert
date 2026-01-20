import React, { useState } from "react";
import { supabase } from "../../services/supabaseClient";
import { useAlerts } from "../../hooks/useAlerts";
import Modal from "../shared/Modal";
import NewsCard from "../shared/NewsCard";
import { Plus, Search, Trash2, Edit2, ChevronDown } from "lucide-react";
import { CATEGORIES, ALERT_TYPES } from "../../data/HelperData";
import TabButton from "../shared/TabButton";
import ConfirmationDialog from "../shared/ConfirmationDialog";

const AlertsManagement = () => {
  const {
    alerts,
    createAlert,
    updateAlert,
    deleteAlert,
    isDeleting
  } = useAlerts();

  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentAlert, setCurrentAlert] = useState(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [selectedAlertId, setSelectedAlertId] = useState(null);

  const initialFormState = {
    title: "",
    category: "News",
    body: "",
    is_urgent: false,
    image_url: "",
    expires_at: "",
  };
  const [formData, setFormData] = useState(initialFormState);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { data: { user } } = await supabase.auth.getUser();
    const finalExpiresAt = formData.expires_at ? new Date(formData.expires_at).toISOString() : null;

    const payload = {
      title: formData.title,
      category: formData.category,
      body: formData.body,
      is_urgent: formData.is_urgent,
      image_url: formData.image_url,
      expires_at: finalExpiresAt,
    };

    try {
      if (currentAlert) {
        await updateAlert({ id: currentAlert.id, updates: payload });
      } else {
        await createAlert({ ...payload, author_id: user.id });
      }
      handleCloseModal();
    } catch (error) {
      console.error("Form submission error", error);
    }
  };

  const handleDelete = (id) => {
    setSelectedAlertId(id);
    setDialogOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCurrentAlert(null);
    setFormData(initialFormState);
  };

  const handleConfirmDelete = async () => {
    try {
      await deleteAlert(selectedAlertId);
      setDialogOpen(false);
    } catch (error) {
      console.error("Delete error", error);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const filteredAlerts = alerts.filter((alert) => {
    let matchesCategory = true;
    if (activeCategory === "Urgent") matchesCategory = alert.is_urgent === true;
    else if (activeCategory !== "All") matchesCategory = alert.category === activeCategory;

    const matchesSearch =
      alert.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      alert.body?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch && matchesCategory;
  });

  const openModal = (alert = null) => {
    if (alert) {
      setCurrentAlert(alert);
      setFormData({
        title: alert.title,
        category: alert.category,
        body: alert.body,
        is_urgent: alert.is_urgent,
        image_url: alert.image_url || "",
        expires_at: alert.expires_at ? new Date(alert.expires_at).toISOString().slice(0, 16) : "",
      });
    } else {
      setCurrentAlert(null);
      setFormData(initialFormState);
    }
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-gray-200">
        <div className="flex gap-2 w-full md:w-auto overflow-x-auto rounded-xl p-2 bg-gray-50">
          {CATEGORIES.map(({ key, label }) => (
            <TabButton key={key} label={label} active={activeCategory === key} onClick={() => setActiveCategory(key)} />
          ))}
        </div>

        <div className="flex gap-3 w-full md:w-auto">
          <div className="relative flex-grow md:flex-grow-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 outline-none w-full"
            />
          </div>
          <button
            onClick={() => openModal()}
            className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Create Alert</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAlerts.map((alert) => (
          <NewsCard
            key={alert.id}
            alert={alert}
            footer={
              <div className="flex justify-between items-center w-full">
                <span className="text-gray-400 text-xs">By {alert.profiles?.full_name || "Admin"}</span>
                <div className="flex gap-1">
                  <button onClick={() => openModal(alert)} className="p-1.5 hover:bg-gray-100 rounded-md text-blue-600">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(alert.id)} className="p-1.5 hover:bg-gray-100 rounded-md text-red-600">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            }
          />
        ))}
        {filteredAlerts.length === 0 && (
          <div className="col-span-full text-center py-10 text-gray-400">No alerts found matching your criteria.</div>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title={currentAlert ? "Edit Alert" : "Create New Alert"}>
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
              <button type="button" onClick={() => setDropdownOpen(!dropdownOpen)} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 p-1">
                <ChevronDown className="w-4 h-4" />
              </button>
              {dropdownOpen && (
                <ul className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg mt-1 shadow-lg max-h-40 overflow-y-auto">
                  {ALERT_TYPES.map((t) => (
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
              <select name="category" value={formData.category} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 bg-white text-sm">
                <option value="News">News</option>
                <option value="Event">Event</option>
                <option value="Advisory">Advisory</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Expires At (Optional)</label>
              <input type="datetime-local" name="expires_at" value={formData.expires_at} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 text-sm" />
            </div>
          </div>

          <div className="flex items-center gap-2 p-3 border border-red-100 bg-red-50 rounded-lg">
            <input type="checkbox" id="urgent-check" checked={formData.is_urgent} onChange={(e) => setFormData((p) => ({ ...p, is_urgent: e.target.checked }))} className="w-4 h-4 text-red-600 rounded focus:ring-red-500" />
            <label htmlFor="urgent-check" className="text-sm font-medium text-red-800 cursor-pointer">Mark as Urgent / Emergency</label>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Details</label>
            <textarea required rows={4} name="body" value={formData.body} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 resize-none text-sm" placeholder="Type details..." />
          </div>

          <button type="submit" className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg transition-colors shadow-sm">
            {currentAlert ? "Save Changes" : "Post Alert"}
          </button>
        </form>
      </Modal>

      <ConfirmationDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onConfirm={handleConfirmDelete}
        title="Delete Announcement"
        description="Are you sure you want to delete this announcement? This action cannot be undone."
        continueText={isDeleting ? "Deleting..." : "Delete"}
        variant="destructive"
        isLoading={isDeleting}
      />
    </div>
  );
};

export default AlertsManagement;
