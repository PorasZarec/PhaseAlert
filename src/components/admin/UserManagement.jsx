import React, { useState, useEffect } from "react";
import {
  Search,
  Trash2,
  Plus,
  Edit2,
  MapPin,
  Mail,
  Phone,
  User,
  UserRoundPlus,
  UserRoundCog,
  MapPinOff,
} from "lucide-react";
import Modal from "../shared/Modal";
import { useUsers } from "../../hooks/useUsers";
import TabButton from "../shared/TabButton";
import ConfirmationDialog from "../shared/ConfirmationDialog";
import { supabase } from '../../services/supabaseClient';
import { toast } from 'sonner';

const UserManagement = () => {
  const { users, isLoading, createUser, updateUser, deleteUser, isDeleting, isUpdating, isCreating } = useUsers();

  // Locate the User ID from the session
  const [sessionUserId, setSessionUserId] = useState(null);

  // Local UI State
  const [activeTab, setActiveTab] = useState("resident");
  const [searchQuery, setSearchQuery] = useState("");

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  // Dialog State
  const [dialogOpen, setDialogOpen] = useState(false);
  const [confirmationAction, setConfirmationAction] = useState(null); // 'delete' or 'reset'
  const [targetId, setTargetId] = useState(null);

  const [formData, setFormData] = useState({
    email: "",
    full_name: "",
    role: "resident",
    address_block: "",
    address_lot: "",
    phone: "",
    password: "",
  });

  // --- FILTER LOGIC ---
  const filteredUsers = users.filter((u) => {
    const matchesTab = activeTab === "all" ? true : u.role === activeTab;
    const matchesSearch =
      u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.phone?.includes(searchQuery);
    return matchesTab && matchesSearch;
  });

  // --- HANDLERS ---
  const openAddModal = () => {
    setCurrentUser(null);
    setFormData({
      email: "",
      full_name: "",
      role: "resident",
      address_block: "",
      address_lot: "",
      phone: "",
      password: "",
    });
    setIsModalOpen(true);
  };

  const openEditModal = (user) => {
    setCurrentUser(user);
    setFormData({
      email: user.email || "",
      full_name: user.full_name || "",
      role: user.role || "resident",
      address_block: user.address_block || "",
      address_lot: user.address_lot || "",
      phone: user.phone || "",
      password: "", // Reset password field for security
    });
    setIsModalOpen(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // --- FRONTEND VALIDATION ---
  const validateForm = () => {
    // 1. Check Email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error("Please enter a valid email address.");
      return false;
    }

    // 2. Check Password (Only for new users)
    if (!currentUser) {
       if (!formData.password || formData.password.length < 6) {
         toast.error("Password must be at least 6 characters.");
         return false;
       }
    }

    return true;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    // 1. Run Validation
    if (!validateForm()) return;

    // 2. Prepare Data (Handle '0' vs Empty String)
    const payload = {
      ...formData,
      address_block: formData.address_block === "" ? null : formData.address_block,
      address_lot: formData.address_lot === "" ? null : formData.address_lot,
      id: currentUser?.id,
    };

    // 3. Submit (Single Call Logic)
    if (currentUser) {
      updateUser(payload, {
        onSuccess: () => setIsModalOpen(false),
      });
    } else {
      createUser(payload, {
        onSuccess: () => setIsModalOpen(false),
      });
    }
  };

  // --- DIALOG HANDLERS ---
  const handleDeleteClick = (userId) => {
    if (userId === sessionUserId) {
      toast.error("You cannot delete your own account.");
      return;
    }

    const userToDelete = users.find(u => u.id === userId);
    if (userToDelete?.role === 'admin') {
      const adminCount = users.filter(u => u.role === 'admin').length;
      if (adminCount <= 1) {
        toast.error("System must have at least one administrator.");
        return;
      }
    }

    setTargetId(userId);
    setConfirmationAction("delete");
    setDialogOpen(true);
  };

  const handleResetLocationClick = () => {
    if (!currentUser) return;
    setTargetId(currentUser.id);
    setConfirmationAction("reset");
    setDialogOpen(true);
  };

  const handleConfirmAction = () => {
    if (confirmationAction === "delete") {
      deleteUser(targetId, {
        onSuccess: () => setDialogOpen(false),
        onError: () => setDialogOpen(false)
      });
    } else if (confirmationAction === "reset") {
      updateUser({
        ...formData,
        id: targetId,
        latitude: null,
        longitude: null
      }, {
        onSuccess: () => {
          setDialogOpen(false);
          setCurrentUser(prev => ({ ...prev, latitude: null, longitude: null }));
        },
        onError: () => setDialogOpen(false)
      });
    }
  };

  useEffect(() => {
    const getSession = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setSessionUserId(user?.id);
    };
    getSession();
  }, []);

  const getDialogContent = () => {
    if (confirmationAction === "reset") {
      return {
        title: "Reset Map Location",
        desc: "Are you sure you want to remove this user's pin from the map? They will appear as 'Unmapped' until a new location is set.",
        btn: "Remove Location"
      };
    }
    return {
      title: "Delete User",
      desc: "Are you sure you want to delete this user? This action cannot be undone and will remove all their data.",
      btn: "Delete User"
    };
  };

  const dialogContent = getDialogContent();
  const isBusy = isLoading || isCreating || isUpdating || isDeleting;

  return (
    <div className="space-y-4">
      {/* --- Top Bar --- */}
      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          <div className="flex gap-1 bg-gray-100 p-1 rounded-lg min-w-max">
            <TabButton active={activeTab === "resident"} onClick={() => setActiveTab("resident")} label="Residents" />
            <TabButton active={activeTab === "admin"} onClick={() => setActiveTab("admin")} label="Admins" />
            <TabButton active={activeTab === "all"} onClick={() => setActiveTab("all")} label="All Users" />
          </div>
        </div>

        <div className="flex w-full md:w-auto gap-3">
          <div className="relative flex-grow md:flex-grow-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search..."
              className="w-full pl-9 pr-4 py-2 border border-gray-200 text-sm rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition duration-200"
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
        {isLoading && (
          <div className="p-12 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
          </div>
        )}

        {!isLoading && filteredUsers.length === 0 && (
          <div className="p-12 text-center text-gray-500">
            No users found matching your search.
          </div>
        )}

        {/* DESKTOP TABLE */}
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
                        <MapPin className="w-3 h-3 text-gray-400" />
                        {u.address_block ? `Blk ${u.address_block} Lot ${u.address_lot}` : "-"}
                      </div>
                      <div className="flex items-center gap-2 text-xs">
                        <Phone className="w-3 h-3 text-gray-400" />
                        {u.phone || "-"}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <ActionButton onClick={() => openEditModal(u)} icon={<Edit2 className="w-4 h-4" />} color="text-blue-500 bg-blue-50 hover:bg-blue-200" />
                        <ActionButton
                            onClick={() => handleDeleteClick(u.id)}
                            disabled={u.id === sessionUserId}
                            icon={<Trash2 className="w-4 h-4" />}
                            color={u.id === sessionUserId ? "text-gray-300 bg-gray-100 cursor-not-allowed" : "text-red-500 bg-red-50 hover:bg-red-200"}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* MOBILE CARDS */}
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
                                <ActionButton onClick={() => openEditModal(u)} icon={<Edit2 className="w-4 h-4" />} color="text-blue-500 bg-blue-50 hover:bg-blue-200" />
                                <ActionButton onClick={() => handleDeleteClick(u.id)} disabled={u.id === sessionUserId} icon={<Trash2 className="w-4 h-4" />} color={u.id === sessionUserId ? "text-gray-300 bg-gray-100 cursor-not-allowed" : "text-red-500 bg-red-50 hover:bg-red-200"} />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                            <div className="flex items-center gap-2">
                                <Mail className="w-3.5 h-3.5 text-gray-400" />
                                <span className="truncate">{u.email}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <MapPin className="w-3.5 h-3.5 text-gray-400" />
                                <span>{u.address_block ? `B:${u.address_block} L:${u.address_lot}` : "N/A"}</span>
                            </div>
                            <div className="col-span-2 flex items-center gap-2">
                                <Phone className="w-3.5 h-3.5 text-gray-400" />
                                <span>{u.phone || "No Phone"}</span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        )}
      </div>

      {/* --- FORM MODAL --- */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={currentUser ? "Edit User" : "Add New User"}>
        <form onSubmit={handleSubmit} className="space-y-4">

          <div className="space-y-2 ">
            <label className="text-sm font-medium text-gray-700">Full Name</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input name="full_name" required value={formData.full_name} onChange={handleChange} className="w-full pl-9 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition duration-200" placeholder="John Doe" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Email Address</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input name="email" type="email" required disabled={!!currentUser} value={formData.email} onChange={handleChange} className="w-full pl-9 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition duration-200 disabled:bg-gray-100" placeholder="john@example.com" />
            </div>
          </div>

          {!currentUser && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Password</label>
              <input name="password" type="password" required value={formData.password} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition duration-200" placeholder="Min. 6 characters" />
              <p className="text-xs text-gray-400">Must be at least 6 characters</p>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Phone Number</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input name="phone" type="text" value={formData.phone} onChange={handleChange} className="w-full pl-9 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition duration-200" placeholder="0912 345 6789" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Block</label>
              <input name="address_block" type="number" value={formData.address_block} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition duration-200" placeholder="0" />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Lot</label>
              <input name="address_lot" type="number" value={formData.address_lot} onChange={handleChange} className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition duration-200" placeholder="0" />
            </div>
          </div>

          {currentUser && currentUser.latitude && (
             <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-between">
                <div className="text-xs text-gray-600">
                  <span className="font-bold block text-gray-800">Has Map Location</span>
                  Lat: {currentUser.latitude.toFixed(5)}, Lng: {currentUser.longitude.toFixed(5)}
                </div>
                <button
                  type="button"
                  onClick={handleResetLocationClick}
                  className="flex items-center gap-1 text-xs text-red-600 hover:text-red-800 font-medium px-2 py-1 hover:bg-red-50 rounded transition"
                >
                  <MapPinOff className="w-3 h-3" /> Reset Location
                </button>
             </div>
          )}

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Role</label>
            <div className="relative">
              {formData.role === "admin" ? (
                <UserRoundCog className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              ) : (
                <UserRoundPlus className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              )}
              <select name="role" value={formData.role} onChange={handleChange} className="w-full pl-9 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition duration-200 bg-white">
                <option value="resident">Resident</option>
                <option value="admin">Admin</option>
              </select>
            </div>
          </div>

          <div className="pt-4 flex gap-3">
            <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors">Cancel</button>
            <button type="submit" disabled={isBusy} className="flex-1 py-2 bg-amber-600 text-white rounded-lg hover:bg-amber-700 transition-colors font-medium disabled:opacity-70 disabled:cursor-not-allowed">
              {isBusy ? "Processing..." : (currentUser ? "Save Changes" : "Create User")}
            </button>
          </div>
        </form>
      </Modal>

      {/* --- CONFIRMATION DIALOG --- */}
      <ConfirmationDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onConfirm={handleConfirmAction}
        title={dialogContent.title}
        description={dialogContent.desc}
        continueText={isDeleting || isUpdating ? "Processing..." : dialogContent.btn}
        variant="destructive"
        isLoading={isDeleting || isUpdating}
      />
    </div>
  );
};

// Helper Components
const Avatar = ({ name }) => (
  <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-sm shrink-0">
    {name ? name.charAt(0).toUpperCase() : "?"}
  </div>
);

const RoleBadge = ({ role }) => (
  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium capitalize ${role === "admin" ? "bg-blue-100 text-blue-800" : "bg-green-100 text-green-800"}`}>
    {role}
  </span>
);

const ActionButton = ({ onClick, icon, color, disabled }) => (
  <button onClick={onClick} disabled={disabled} className={`p-2 rounded-lg transition-colors ${color}`}>
    {icon}
  </button>
);

export default UserManagement;
