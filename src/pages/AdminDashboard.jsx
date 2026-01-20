import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "sonner";
import {
  ChartColumnBig, LogOut, Menu, Users, MessagesSquare, Megaphone, MapPin,
} from "lucide-react";

import UserManagement from "../components/admin/UserManagement";
import AlertsManagement from "../components/admin/AlertsManagement";
import InboxManagement from "../components/admin/InboxManagement";
import MapManagement from "../components/admin/MapManagement";
import AnalyticsPreview from "../components/admin/AnalyticsPreview";
import { GoogleMapsLoader } from "../components/shared/GoogleMapsLoader"; // IMPORT THIS

const AdminDashboard = () => {
  const { user: currentUser, logout } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // FIX: Use activeModule consistently. Default to "analytics"
  const [activeModule, setActiveModule] = useState(() => {
    return localStorage.getItem("adminActiveTab") || "analytics";
  });

  useEffect(() => {
    localStorage.setItem("adminActiveTab", activeModule);
  }, [activeModule]);

  const handleLogout = async () => {
    try {
      await logout();
      toast.info("Logged out successfully");
    } catch (error) {
      toast.error("Error logging out");
      console.error(error);
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
          <NavButton active={activeModule === "analytics"} onClick={() => handleSidebarClick("analytics")} icon={<ChartColumnBig className="w-6 h-6" />} label="Analytics" />
          <NavButton active={activeModule === "users"} onClick={() => handleSidebarClick("users")} icon={<Users className="w-6 h-6" />} label="Residents" />
          <NavButton active={activeModule === "inbox"} onClick={() => handleSidebarClick("inbox")} icon={<MessagesSquare className="w-6 h-6" />} label="Inbox" />
          <NavButton active={activeModule === "alerts"} onClick={() => handleSidebarClick("alerts")} icon={<Megaphone className="w-6 h-6" />} label="Alerts" />
          <NavButton active={activeModule === "map"} onClick={() => handleSidebarClick("map")} icon={<MapPin className="w-6 h-6" />} label="Village Map" />
        </nav>
        <div className="flex flex-col items-center space-y-2 mb-4">
          <button onClick={handleLogout} className="group flex justify-center items-center w-12 h-12 rounded-xl border border-gray-300 hover:bg-red-500 hover:border-red-500 transition-colors" title="Logout">
            <LogOut className="w-6 h-6 text-gray-400 group-hover:text-white" />
          </button>
        </div>
      </aside>

      {/* --- MAIN CONTENT --- */}
      <div className="lg:ml-20 transition-all duration-300">
        <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-200">
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-4">
              <button onClick={() => setSidebarOpen(true)} className="lg:hidden"><Menu className="w-6 h-6" /></button>
              <h1 className="lg:text-xl font-bold text-gray-800 sm:text-2xl">
                {activeModule === "analytics" && "Dashboard Overview"}
                {activeModule === "users" && "Resident Management"}
                {activeModule === "inbox" && "Inbox & Messages"}
                {activeModule === "alerts" && "Alerts & Announcements"}
                {activeModule === "map" && "Village Mapping"}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-amber-600 font-bold">A</div>
            </div>
          </div>
        </header>

        <div className="p-4 md:p-6">
          {activeModule === "analytics" && <AnalyticsPreview />}
          {activeModule === "users" && <UserManagement />}
          {activeModule === "inbox" && <InboxManagement />}
          {activeModule === "alerts" && <AlertsManagement />}

          {/* WRAP THE MAP COMPONENT */}
          {activeModule === "map" && (
            <GoogleMapsLoader>
              <MapManagement />
            </GoogleMapsLoader>
          )}
        </div>
      </div>

      {sidebarOpen && <div className="fixed inset-0 bg-amber-900/30 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}
    </div>
  );
};

const NavButton = ({ active, onClick, icon, label }) => (
  <>
    <a onClick={onClick} href="#" className={`relative group flex justify-center items-center w-12 h-12 rounded-xl transition-colors ${active ? "bg-orange-600 shadow-lg shadow-orange-500/30 text-white" : "border border-gray-400 text-gray-400 hover:bg-orange-600/90 hover:text-white"}`}>
      {icon}
      <span className="absolute left-full ml-5 px-3 py-1.5 bg-orange-600/90 rounded-md text-sm font-medium text-white whitespace-nowrap invisible opacity-0 scale-95 group-hover:visible group-hover:opacity-100 group-hover:scale-100 transition-all z-50">{label}</span>
    </a>
    <span className="text-[10px] font-bold text-gray-600 mt-1 mb-2">{label}</span>
  </>
);

export default AdminDashboard;
