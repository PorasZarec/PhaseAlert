import React, { useState, useEffect, useRef } from "react";
import { Search, Users, User, Send, Menu, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "../../services/supabaseClient"; // Ensure path is correct
import { useMessages } from "../../hooks/useMessages"; // Ensure path is correct
import MessageBubble from "../shared/MessageBubble"; // Importing the separate component

const InboxManagement = () => {
  const [activeTab, setActiveTab] = useState("community");
  const [selectedResident, setSelectedResident] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  const scrollRef = useRef(null);

  // Get Current User Session
  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setCurrentUser(user);
    };
    getUser();
  }, []);

  // Fetch Resident List (Profiles)
  const { data: residentList = [], isLoading: isLoadingResidents } = useQuery({
    queryKey: ["residents_list"],
    queryFn: async () => {
      // Adjust 'profiles' to your actual table name if different
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, address_block, address_lot, avatar_url, role")
        .neq("id", currentUser?.id || "") // Don't show myself in the list
        .order("full_name");

      if (error) throw error;
      return data;
    },
    enabled: !!currentUser, // Only fetch when we know who is logged in
  });

  // If activeTab is 'direct', otherUserId is the selected resident's ID if 'community', otherUserId is null.
  const {
    messages,
    isLoading: isLoadingMessages,
    sendMessage,
    isSending,
  } = useMessages(activeTab, currentUser?.id, selectedResident?.id);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoadingMessages]);

  const handleSend = async () => {
    if (!newMessage.trim() || !currentUser) return;

    try {
      await sendMessage({
        content: newMessage,
        receiverId: activeTab === "direct" ? selectedResident?.id : null,
      });
      setNewMessage("");
    } catch (error) {
      console.error("Failed to send", error);
    }
  };

  const handleSelectResident = (resident) => {
    setActiveTab("direct");
    setSelectedResident(resident);
    setIsSidebarOpen(false);
  };

  const handleCommunityClick = () => {
    setActiveTab("community");
    setSelectedResident(null);
    setIsSidebarOpen(false);
  };

  // Filter residents based on search
  const filteredResidents = residentList.filter(
    (r) =>
      r.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.address_block?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex h-[calc(100vh-140px)] lg:h-[calc(100vh-140px)] bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden font-sans relative">
      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-amber-900/30 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <div
        className={`
        w-80 bg-gray-50 border-r border-gray-200 flex flex-col
        fixed lg:relative inset-y-0 left-0 z-40 transform transition-transform duration-300 ease-in-out
        ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }
        lg:w-80
      `}
      >
        <button
          onClick={() => setIsSidebarOpen(false)}
          className="lg:hidden absolute top-4 right-4 p-2 rounded-lg hover:bg-gray-200 transition-colors z-10"
        >
          <X size={20} className="text-gray-600" />
        </button>

        <div className="p-4 border-b border-gray-200">
          <h2 className="font-bold text-gray-800 text-lg mb-4">Inbox</h2>

          {/* Community Tab Button */}
          <button
            onClick={handleCommunityClick}
            className={`w-full flex items-center gap-3 p-3 rounded-lg text-sm font-medium transition-all mb-4
              ${
                activeTab === "community"
                  ? "bg-orange-500 text-white shadow-md"
                  : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-100"
              }`}
          >
            <Users size={18} /> Community Wall
          </button>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search residents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 text-sm rounded-lg 
                          focus:ring-2 focus:ring-amber-500 focus:border-amber-500 
                          outline-none transition duration-200"
            />
          </div>
        </div>

        {/* Resident List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          <p className="px-2 text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 mt-2">
            Direct Messages
          </p>

          {isLoadingResidents ? (
            <div className="p-4 text-center text-gray-400 text-xs">
              Loading contacts...
            </div>
          ) : (
            filteredResidents.map((resident) => (
              <button
                key={resident.id}
                onClick={() => handleSelectResident(resident)}
                className={`w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left min-h-[48px]
                  ${
                    selectedResident?.id === resident.id &&
                    activeTab === "direct"
                      ? "bg-blue-100 text-blue-900 border-l-4 border-blue-500"
                      : "hover:bg-gray-100 text-gray-700"
                  }`}
              >
                {/* Avatar / Initial */}
                <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden shrink-0">
                  {resident.avatar_url ? (
                    <img
                      src={resident.avatar_url}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-gray-600 font-bold text-sm">
                      {resident.full_name
                        ? resident.full_name[0].toUpperCase()
                        : "U"}
                    </span>
                  )}
                </div>

                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">
                    {resident.full_name || "Unnamed User"}
                  </p>
                  <p className="text-xs text-gray-400 truncate">
                    BLK {resident.address_block || "N/A"} Lot{" "}
                    {resident.address_lot || "N/A"}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* CHAT AREA */}
      <div className="flex-1 flex flex-col bg-white min-w-0 w-full">
        {/* Header */}
        <div className="h-14 lg:h-16 border-b border-gray-100 px-3 lg:px-6 flex items-center justify-between shrink-0">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors -ml-2"
          >
            <Menu size={20} className="text-gray-600" />
          </button>

          <div className="flex items-center gap-2 lg:gap-3 flex-1 lg:flex-initial">
            {activeTab === "community" ? (
              <>
                <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                  <Users size={16} className="lg:w-5 lg:h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-800 text-sm lg:text-base">
                    Community Chat
                  </h3>
                  <p className="text-[10px] lg:text-xs text-gray-500">
                    Public visibility
                  </p>
                </div>
              </>
            ) : selectedResident ? (
              <>
                <div className="w-8 h-8 lg:w-10 lg:h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                  <User size={16} className="lg:w-5 lg:h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-gray-800 text-sm lg:text-base">
                    {selectedResident.full_name}
                  </h3>
                  <p className="text-[10px] lg:text-xs text-gray-500">
                    BLK {selectedResident.address_block || "N/A"} LOT{" "}
                    {selectedResident.address_lot || "N/A"}
                  </p>
                </div>
              </>
            ) : (
              <div className="text-gray-400 text-sm lg:text-base">
                Select a resident to chat
              </div>
            )}
          </div>
        </div>

        {/* Messages List */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-3 lg:p-6 space-y-2 bg-gray-50/30"
        >
          {isLoadingMessages ? (
            <div className="flex justify-center p-10">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center text-gray-400 mt-10 text-sm">
              {activeTab === "community"
                ? "No community messages yet. Start the conversation!"
                : "No messages yet. Say hello!"}
            </div>
          ) : (
            messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                currentUserId={currentUser?.id}
              />
            ))
          )}
        </div>

        {/* Input Area */}
        <div className="p-3 lg:p-4 border-t border-gray-100 bg-white shrink-0">
          <div className="flex gap-2 lg:gap-3 relative">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              disabled={activeTab === "direct" && !selectedResident}
              placeholder={
                activeTab === "direct" && !selectedResident
                  ? "Select a contact first"
                  : "Type your message..."
              }
              className="flex-1 bg-gray-100 border border-transparent focus:bg-white focus:border-orange-300 rounded-full px-4 lg:px-5 py-2.5 lg:py-3 outline-none transition-all text-sm lg:text-base"
            />
            <button
              onClick={handleSend}
              disabled={
                !newMessage.trim() ||
                isSending ||
                (activeTab === "direct" && !selectedResident)
              }
              className="absolute right-1 top-1 bottom-1 aspect-square rounded-full bg-orange-500 text-white disabled:bg-gray-300 lg:p-3 shadow-lg disabled:opacity-50 disabled:shadow-none transition-all flex items-center justify-center min-w-[33px] min-h-[30px]"
            >
              {isSending ? (
                <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />
              ) : (
                <Send size={18} className="lg:w-5 lg:h-5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InboxManagement;
