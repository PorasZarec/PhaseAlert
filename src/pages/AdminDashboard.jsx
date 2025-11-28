import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "../services/supabaseClient"; 
import { useAuth } from "../contexts/AuthContext";
import { toast } from "sonner";

// Icons
import {
  FileClock,
  ChartColumnBig,
  LogOut,
  Menu,
  Users,
  Search,
  Plus,
  Edit2,
  Trash2,
  MessagesSquare,
  Megaphone,
  MapPin
} from "lucide-react";
import UserManagement from "../components/admin/UserManagement";

const AdminDashboard = () => {
  const { user: currentUser, logout } = useAuth(); 
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeModule, setActiveModule] = useState("analytics");
  const [activeTab, setActiveTab] = useState("resident"); 

  // Data State
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const handleLogout = async () => {
    try {
      await logout();
      toast.info("Logged out successfully");
    } catch (error) {
      toast.error("Error logging out");
      console.error(error);
    }
  };

  const getAuthHeaders = useCallback(() => {
    const token = currentUser.token;
    if (!token) {
      logout(); 
      return {};
    }
    return {
      headers: {
        "x-auth-token": token,
      },
    };
  }, [currentUser.token, logout]);

  // 1. FETCH DATA FROM SUPABASE
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      // select(*) will automatically pull the new 'phone' column if you added it to DB
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setUsers(data || []);
      
    } catch (error) {
      console.error("Error fetching users:", error.message);
      toast.error("Could not load users. Check database policies.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveUser = async (userData, isEditMode) => {
    setIsLoading(true);
    try {
      // --- FIX: TRIM WHITESPACE ---
      // This prevents "kim@gmail.com " (with space) from causing an error
      const cleanedEmail = userData.email ? userData.email.trim() : "";

      if (isEditMode) {
        // [Existing Update Logic - Keep this as is]
        const { error } = await supabase
          .from('profiles')
          .update({
            full_name: userData.full_name,
            role: userData.role,
            address_block: userData.address_block,
            address_lot: userData.address_lot,
            phone: userData.phone
          })
          .eq('id', userData.id);
  
        if (error) throw error;
        toast.success("User updated successfully");

      } else {
        // --- NEW: CREATE USER VIA EDGE FUNCTION ---
        
        if (!cleanedEmail) throw new Error("Email is required");

        // Call the Edge Function we just deployed
        const { data, error } = await supabase.functions.invoke('create-user', {
          body: {
            email: cleanedEmail,
            password: userData.password,
            full_name: userData.full_name,
            role: userData.role,
            phone: userData.phone
          }
        });

        // Check if the function returned an error
        if (error) throw error;
        if (data && data.error) throw new Error(data.error);
        
        toast.success("User created successfully!");
        // Note: You remain logged in as Admin! 🎉
      }
  
      fetchUsers(); // Refresh list
    } catch (error) {
      console.error(error);
      toast.error("Error saving user: " + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // 2. FILTER LOGIC
  const filteredUsers = users.filter((u) => {
    const matchesTab = activeTab === "all" ? true : u.role === activeTab;
    const matchesSearch = u.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          u.phone?.includes(searchQuery); // Search by phone too
    return matchesTab && matchesSearch;
  });

  // 3. DELETE LOGIC
  const handleDeleteUser = async (userId) => {
    if(!window.confirm("Are you sure you want to delete this user?")) return;

    const { error } = await supabase.from('profiles').delete().eq('id', userId);

    if (error) {
      toast.error("Error deleting user");
    } else {
      toast.success("User deleted successfully");
      fetchUsers(); 
    }
  };

  const handleSidebarClick = (moduleName) => {
    setActiveModule(moduleName);
    setSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
      
      {/* --- SIDEBAR --- */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-20 bg-white border-b border-gray-200 shadow-md 
        transform transition-transform duration-300 lg:translate-x-0 
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        flex flex-col items-center py-4 space-y-4`}
      >
        <div className="flex flex-col items-center space-y-4">
          <img src="/DSRM.png" alt="DSRM Logo" className="w-12 h-12" />
        </div>

        <hr className="w-10 border-gray-200" />

        <nav className="flex flex-col items-center space-y-2 flex-grow w-full px-2">
          {/* Analytics Nav */}
          <NavButton 
            active={activeModule === "analytics"} 
            onClick={() => handleSidebarClick("analytics")}
            icon={<ChartColumnBig className="w-6 h-6" />}
            label="Analytics"
          />
          
          {/* Users Nav */}
          <NavButton 
            active={activeModule === "users"} 
            onClick={() => handleSidebarClick("users")}
            icon={<Users className="w-6 h-6" />}
            label="Residents"
          />

          {/* Inbox Nav */}
          <NavButton 
            active={activeModule === "inbox"} 
            onClick={() => handleSidebarClick("inbox")}
            icon={<MessagesSquare  className="w-6 h-6" />}
            label="Inbox"
          />

          {/* Alerts Nav */}
          <NavButton 
            active={activeModule === "alerts"} 
            onClick={() => handleSidebarClick("alerts")}
            icon={<Megaphone className="w-6 h-6" />}
            label="Alerts"
          />

          {/* Map/Reports Nav */}
          <NavButton 
            active={activeModule === "map"} 
            onClick={() => handleSidebarClick("map")}
            icon={<MapPin className="w-6 h-6" />}
            label="Village Map"
          />
        </nav>

        <div className="flex flex-col items-center space-y-2 mb-4">
          <button
            onClick={handleLogout} 
            className="group flex justify-center items-center w-12 h-12 rounded-xl border border-gray-300 hover:bg-red-500 hover:border-red-500 transition-colors"
            title="Logout"
          >
            <LogOut className="w-6 h-6 text-gray-400 group-hover:text-white" />
          </button>
        </div>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <div className="lg:ml-20 transition-all duration-300">
        
        {/* Header */}
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-200">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-4">
              <button onClick={() => setSidebarOpen(true)} className="lg:hidden">
                <Menu className="w-6 h-6" />
              </button>
              <h1 className="text-xl font-bold text-gray-800">
                {activeModule === "analytics" && "Dashboard Overview"}
                {activeModule === "users" && "Resident Management"}
                {activeModule === "inbox" && "Inbox & Messages"}
                {activeModule === "alerts" && "Alerts & Announcements"}
                {activeModule === "map" && "Village Map & Alerts"}
              </h1>
            </div>
            <div className="flex items-center gap-2">
               <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-amber-600 font-bold">
                 A
               </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="p-4 md:p-6">
          
          {/* ANALYTICS VIEW */}
          {activeModule === "analytics" && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
               <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                  <h3 className="text-gray-500 text-sm font-medium">Total Residents</h3>
                  <p className="text-3xl font-bold text-gray-800 mt-2">{users.filter(u => u.role === 'resident').length}</p>
               </div>
            </div>
          )}

          {/* MANAGE USERS VIEW */}
          {activeModule === "users" && (
            <UserManagement 
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              isLoading={isLoading}
              filteredUsers={filteredUsers}
              handleDeleteUser={handleDeleteUser}
              handleSaveUser={handleSaveUser}
            />
          )}

          {/* INBOX VIEW */}
          {activeModule === "inbox" && (
             <div className="bg-white p-10 rounded-xl shadow-sm text-center">
                <h2 className="text-lg font-semibold text-gray-700">Inbox Component Goes Here</h2>
             </div>
          )}

          {/* ALERTS VIEW */}
          {activeModule === "alerts" && (
             <div className="bg-white p-10 rounded-xl shadow-sm text-center">
                <h2 className="text-lg font-semibold text-gray-700">Alert Component Goes Here</h2>
             </div>
          )}

          {/* MAP VIEW */}
          {activeModule === "map" && (
             <div className="bg-white p-10 rounded-xl shadow-sm text-center">
                <h2 className="text-lg font-semibold text-gray-700">Google Map Component Goes Here</h2>
                <p className="text-gray-500">You will integrate the @react-google-maps/api logic here.</p>
             </div>
          )}

        </div>
      </div>

      {/* Overlay for mobile sidebar */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-amber-900/30 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

// Helper Components for cleaner code
const NavButton = ({ active, onClick, icon, label }) => (
  <>
  <a onClick={onClick} href="#"
    className={`relative group flex justify-center items-center w-12 h-12 rounded-xl transition-colors
    ${active ? "bg-orange-600 shadow-lg shadow-orange-500/30 text-white" : "border border-gray-400 text-gray-400 hover:bg-orange-600/90 hover:text-white"}`}
  >
    {icon}
    {/* Tooltip */}
    <span className="absolute left-full ml-5 px-3 py-1.5 bg-orange-600/90 rounded-md text-sm font-medium text-white whitespace-nowrap invisible opacity-0 scale-95 group-hover:visible group-hover:opacity-100 group-hover:scale-100 transition-all z-50">
      {label}
    </span>
  </a>
  <span className="text-[10px] font-bold text-gray-600 mt-1 mb-2">{label}</span>
  </>
);

const TabButton = ({ active, onClick, label }) => (
  <button
    onClick={onClick}
    className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all
      ${active ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
  >
    {label}
  </button>
);

export default AdminDashboard;