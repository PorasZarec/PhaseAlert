import React, { useState, useEffect } from "react";
import API_URL from "../configs/apiConfig"; // Ensure this path is correct
import {
  LogOut,
  User,
  Bell
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import DSRM_LOGO from "../assets/DSRM.png";
import BottomNav from "../components/resident/BottomNav";
import CommunityNewsTab from "../components/resident/CommunityNewsTab";
import MappingTab from "../components/resident/MappingTab";
import CreateReportTab from "../components/resident/CreateReportTab";
import MessagingTab from "../components/resident/MessagingTab";
import SettingsTab from "../components/resident/SettingsTab";

// --- HELPER: Safely get user details from Supabase object ---
const getUserDisplayInfo = (user) => {
  if (!user) return { name: "Guest", initials: "?", avatar: null, email: "" };

  // Supabase often stores name in user_metadata
  const meta = user.user_metadata || {};
  const name = meta.full_name || meta.name || user.email?.split('@')[0] || "Resident";
  const avatar = meta.avatar_url || user.avatar || null; // Check both metadata and direct property
  
  // Generate Initials
  const parts = name.split(" ");
  let initials = parts[0][0].toUpperCase();
  if (parts.length > 1) {
    initials += parts[parts.length - 1][0].toUpperCase();
  }

  return { name, initials, avatar, email: user.email };
};

const ResidentDashboard = () => {
  const { user, logout } = useAuth();
  
  // Process user data once for display
  const userInfo = getUserDisplayInfo(user);

  // State
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("news");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-24"> 
      {/* pb-24 ensures content isn't hidden behind the bottom nav */}

      {/* Header */}
      <header className="bg-white shadow-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Left: Branding & Profile */}
            <div className="flex items-center gap-4">
              {/* Profile Toggle */}
              <div className="relative">
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center gap-2 focus:outline-none"
                >
                  <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center overflow-hidden border border-orange-200">
                    {userInfo.avatar ? (
                       <img src={userInfo.avatar} alt="User" className="w-full h-full object-cover" />
                    ) : (
                       <img src={DSRM_LOGO} alt="DSRM" className="w-full h-full object-cover p-1" />
                    )}
                  </div>
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-bold text-gray-900 leading-none">{userInfo.name}</p>
                    <p className="text-xs text-gray-500 mt-1">Resident</p>
                  </div>
                </button>

                {/* Dropdown Menu */}
                {isProfileOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-40 cursor-default" 
                      onClick={() => setIsProfileOpen(false)} 
                    />
                    <div className="absolute left-0 mt-3 w-72 bg-white rounded-2xl shadow-xl border border-gray-100 py-2 z-50 overflow-hidden animate-in fade-in slide-in-from-top-5 duration-200">
                      
                      {/* Dropdown Header */}
                      <div className="px-5 py-4 bg-gray-50 border-b border-gray-100">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md">
                            {userInfo.avatar ? (
                              <img src={userInfo.avatar} alt="Profile" className="w-full h-full rounded-full object-cover" />
                            ) : (
                              userInfo.initials
                            )}
                          </div>
                          <div className="overflow-hidden">
                            <p className="text-sm font-bold text-gray-900 truncate">{userInfo.name}</p>
                            <p className="text-xs text-gray-500 truncate">{userInfo.email}</p>
                          </div>
                        </div>
                      </div>

                      {/* Menu Items */}
                      <div className="py-2">
                        <button className="w-full text-left px-5 py-3 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors">
                          <User className="w-4 h-4 text-gray-400" />
                          My Account
                        </button>
                        <button className="w-full text-left px-5 py-3 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-3 transition-colors">
                          <Bell className="w-4 h-4 text-gray-400" />
                          Notifications
                        </button>
                      </div>

                      <div className="border-t border-gray-100 my-1"></div>
                      
                      <button
                        onClick={() => {
                          handleLogout();
                          setIsProfileOpen(false);
                        }}
                        className="w-full text-left px-5 py-3 text-sm text-red-600 hover:bg-red-50 flex items-center gap-3 transition-colors font-medium"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Right: Branding Text (Desktop) or Actions */}
            <div className="flex items-center">
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-600 to-red-600">
                Phase Alert
              </span>
            </div>

          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {/* Dynamic Content based on Active Tab */}

        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
            <p className="text-sm text-gray-500 mt-3">Syncing data...</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* News Tab Content */}
            {activeTab === 'news' && (
              <CommunityNewsTab 
                activeTab={activeTab}
                loading={loading}
              />
            )}
            
            {/* Map Tab Content */}
            {activeTab === 'map' && (
              <MappingTab 
                activeTab={activeTab}
                loading={loading}
              />
            )}

            {/* Create Tab Content */}
            {activeTab === 'create' && (
              <CreateReportTab 
                activeTab={activeTab}
                loading={loading}
              />
            )}

            {/* Message Tab Content */}
            {activeTab === 'messages' && (
              <MessagingTab 
                activeTab={activeTab}
                loading={loading}
              />
            )}

            {/* Settings Tab Content */}
            {activeTab === 'settings' && (
              <SettingsTab 
                activeTab={activeTab}
                loading={loading}
              />
            )}
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 border border-red-100 text-red-700 rounded-xl text-sm">
            {error}
          </div>
        )}
          
      </main>

      {/* Bottom Navigation */}
      <BottomNav 
        setActiveTab={setActiveTab}
        activeTab={activeTab}
      />

    </div>
  );
};

export default ResidentDashboard;