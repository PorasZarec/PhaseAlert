import React, { useState, useEffect } from 'react';
import { Search, Trash2, Plus, Edit2, MapPin, Mail, Phone, User, Shield, X, UserRoundPlus ,UserRoundCog   } from 'lucide-react';

const UserManagement = ({
  activeTab, 
  setActiveTab, 
  searchQuery, 
  setSearchQuery, 
  isLoading, 
  filteredUsers, 
  handleDeleteUser,
  handleSaveUser
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null); // Null = Add Mode, Object = Edit Mode
  const [formData, setFormData] = useState({
    email: '',
    full_name: '',
    role: 'resident',
    address_block: '',
    address_lot: '',
    phone: '', // <--- Added Phone State
    password: ''
  });

  // --- Handlers ---
  
  const openAddModal = () => {
    setCurrentUser(null);
    setFormData({ 
      email: '', 
      full_name: '', 
      role: 'resident', 
      address_block: '', 
      address_lot: '', 
      phone: '', // <--- Reset Phone
      password: '' 
    });
    setIsModalOpen(true);
  };

  const openEditModal = (user) => {
    setCurrentUser(user);
    setFormData({
      email: user.email || '',
      full_name: user.full_name || '',
      role: user.role || 'resident',
      address_block: user.address_block || '',
      address_lot: user.address_lot || '',
      phone: user.phone || '', // <--- Load Phone
      password: '' 
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleSaveUser({ ...formData, id: currentUser?.id }, !!currentUser);
    setIsModalOpen(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="space-y-4">
      {/* --- Top Bar: Tabs, Search, Add Button --- */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4">
        
        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-full md:w-auto overflow-x-auto">
          <TabButton active={activeTab === "resident"} onClick={() => setActiveTab("resident")} label="Residents" />
          <TabButton active={activeTab === "admin"} onClick={() => setActiveTab("admin")} label="Admins" />
          <TabButton active={activeTab === "all"} onClick={() => setActiveTab("all")} label="All" />
        </div>

        {/* Actions */}
        <div className="flex w-full md:w-auto gap-3">
          <div className="relative flex-grow md:flex-grow-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search..." 
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-amber-500 outline-none"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button 
            onClick={openAddModal}
            className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add User</span>
          </button>
        </div>
      </div>

      {/* --- CONTENT --- */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        
        {/* Loading State */}
        {isLoading && (
          <div className="p-12 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredUsers.length === 0 && (
          <div className="p-12 text-center text-gray-500">
            No users found matching your search.
          </div>
        )}

        {/* VIEW 1: DESKTOP TABLE (Hidden on Mobile) */}
        {!isLoading && filteredUsers.length > 0 && (
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-gray-50 text-gray-500 text-xs uppercase font-medium">
                <tr>
                  <th className="px-6 py-3">Name</th>
                  <th className="px-6 py-3">Role</th>
                  <th className="px-6 py-3">Details</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <Avatar name={u.full_name} />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{u.full_name || "Unnamed"}</p>
                          <p className="text-xs text-gray-500">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <RoleBadge role={u.role} />
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 space-y-1">
                      <div className="flex items-center gap-2 text-xs">
                         <MapPin className="w-3 h-3 text-gray-400"/> 
                         {u.address_block ? `Blk ${u.address_block} Lot ${u.address_lot}` : '-'}
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                         <Phone className="w-3 h-3 text-gray-400"/> 
                         {u.phone || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <ActionButton onClick={() => openEditModal(u)} icon={<Edit2 className="w-4 h-4" />} color="text-blue-500 hover:bg-blue-50" />
                        <ActionButton onClick={() => handleDeleteUser(u.id)} icon={<Trash2 className="w-4 h-4" />} color="text-red-500 hover:bg-red-50" />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* VIEW 2: MOBILE CARDS (Visible only on Mobile) */}
        {!isLoading && filteredUsers.length > 0 && (
          <div className="md:hidden divide-y divide-gray-100">
            {filteredUsers.map((u) => (
              <div key={u.id} className="p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <Avatar name={u.full_name} />
                    <div>
                      <p className="font-medium text-gray-900">{u.full_name || "Unnamed"}</p>
                      <RoleBadge role={u.role} />
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <ActionButton onClick={() => openEditModal(u)} icon={<Edit2 className="w-4 h-4" />} color="text-blue-500 hover:bg-blue-50" />
                    <ActionButton onClick={() => handleDeleteUser(u.id)} icon={<Trash2 className="w-4 h-4" />} color="text-red-500 hover:bg-red-50" />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-gray-400" />
                    <span className="truncate">{u.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-gray-400" />
                    <span>{u.address_block ? `B:${u.address_block} L:${u.address_lot}` : 'N/A'}</span>
                  </div>
                   <div className="col-span-2 flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-gray-400" />
                    <span>{u.phone || 'No Phone'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* --- REUSABLE MODAL (Embedded) --- */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={currentUser ? "Edit User" : "Add New User"}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* FULL NAME */}
          <div className="space-y-2 ">
            <label className="text-sm font-medium text-gray-700">Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                name="full_name"
                required
                value={formData.full_name}
                onChange={handleChange}
                className="w-full pl-9 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition duration-200"
                placeholder="John Doe"
              />
            </div>
          </div>

          {/* EMAIL */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                name="email"
                type="email"
                required
                disabled={!!currentUser}
                value={formData.email}
                onChange={handleChange}
                className="w-full pl-9 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition duration-200 disabled:bg-gray-100"
                placeholder="john@example.com"
              />
            </div>
            {/* HINT for Whitespace error */}
            {!currentUser && <p className="text-[10px] text-gray-400">Ensure no spaces after email</p>}
          </div>

          {/* PASSWORD */}
          {!currentUser && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Password</label>
              <input
                name="password"
                type="password"
                required
                value={formData.password}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition duration-200"
                placeholder="Min. 6 characters"
              />
            </div>
          )}
          
          {/* PHONE */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Phone Number</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                name="phone"
                type="text"
                value={formData.phone}
                onChange={handleChange}
                className="w-full pl-9 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition duration-200"
                placeholder="0912 345 6789"
              />
            </div>
          </div>

          {/* ADDRESS */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Block</label>
              <input
                name="address_block"
                value={formData.address_block}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition duration-200"
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Lot</label>
              <input
                name="address_lot"
                value={formData.address_lot}
                onChange={handleChange}
                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition duration-200"
                placeholder="0"
              />
            </div>
          </div>

          {/* ROLE */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Role</label>
            <div className="relative">

              {formData.role === "admin" ? (
                <UserRoundCog  className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              ) : (
                <UserRoundPlus className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              )}

              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full pl-9 p-2 border border-gray-300 rounded-lg 
                          focus:ring-2 focus:ring-amber-500 focus:border-amber-500 
                          outline-none transition duration-200 bg-white"
              >
                <option value="resident">Resident</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>

          <div className="pt-4 flex gap-3">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="flex-1 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-medium"
            >
              {currentUser ? 'Save Changes' : 'Create User'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

// --- Helper Components ---

const TabButton = ({ active, onClick, label }) => (
  <button
    onClick={onClick}
    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all whitespace-nowrap
      ${active ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
  >
    {label}
  </button>
);

const Avatar = ({ name }) => (
  <div className="w-9 h-9 rounded-full bg-violet-100 flex items-center justify-center text-violet-700 font-bold text-sm shrink-0">
    {name ? name.charAt(0).toUpperCase() : '?'}
  </div>
);

const RoleBadge = ({ role }) => (
  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize
    ${role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'}`}>
    {role}
  </span>
);

const ActionButton = ({ onClick, icon, color }) => (
  <button onClick={onClick} className={`p-2 rounded-lg transition-colors ${color}`}>
    {icon}
  </button>
);

// --- Embedded Modal Component to fix import error ---
const Modal = ({ isOpen, onClose, title, children }) => {
  // Prevent scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm transition-all animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800">{title}</h2>
          <button 
            onClick={onClose}
            className="p-1 rounded-md text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[80vh] overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
};

export default UserManagement;