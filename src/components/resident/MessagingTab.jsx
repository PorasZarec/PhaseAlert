import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../services/supabaseClient';
import MessageBubble from '../shared/MessageBubble';
import { useMessages } from '../../hooks/useMessages';
import { MessageSquare, ShieldAlert, Send, Users } from 'lucide-react';

const MessagingTab = () => {
  const [activeTab, setActiveTab] = useState('community')
  const [currentUser, setCurrentUser] = useState(null);
  const [adminId, setAdminId] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  
  const scrollRef = useRef(null);

  // Setup User
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
      
      // Find ANY admin to be the "default receiver" for support
      const { data } = await supabase.from('profiles').select('id').eq('role', 'admin').limit(1).single();
      if(data) setAdminId(data.id);
    };
    getUser();
  }, []);

  // Use TanStack Hook
  const { messages, isLoading, sendMessage, isSending } = useMessages(activeTab, currentUser?.id, null);

  // Scroll to bottom
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const receiver = activeTab === 'community' ? null : adminId;

    sendMessage({ content: newMessage, receiverId: receiver }, {
        onSuccess: () => setNewMessage('')
    });
  };

  return (
    // h-[calc(100dvh-xxx)] ensures it fits perfectly on mobile without keyboard issues
    <div className="flex flex-col lg:flex-row lg:h-[calc(100dvh-208px)] md:h-[calc(100dvh-208px)] sm:h-[calc(100dvh-208px)] h-[calc(100dvh-208px)] bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden font-sans">
      
      {/* SIDEBAR */}
      <div className="w-full md:w-64 bg-gray-50 border-b md:border-b-0 md:border-r border-gray-200 p-2 md:p-4 flex flex-row md:flex-col gap-2 shrink-0">
        <div className="hidden md:block mb-4">
            <h2 className="font-bold text-gray-700 text-lg">Messages</h2>
            <p className="text-xs text-gray-500">Stay connected</p>
        </div>

        <button
          onClick={() => setActiveTab('community')}
          className={`flex-1 md:flex-none flex items-center justify-center md:justify-start gap-2 p-3 rounded-lg text-sm font-medium transition-all
            ${activeTab === 'community' ? 'bg-orange-500 text-white shadow-md' : 'text-gray-600 hover:bg-orange-50'}`}
        >
          <Users size={18} /> <span className="sm:inline">Community</span>
        </button>

        <button
          onClick={() => setActiveTab('admin_support')}
          className={`flex-1 md:flex-none flex items-center justify-center md:justify-start gap-2 p-3 rounded-lg text-sm font-medium transition-all
            ${activeTab === 'admin_support' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 hover:bg-blue-50'}`}
        >
          <ShieldAlert size={18} />
            <span className="sm:inline">Admin
            </span>
        </button>
      </div>

      {/* CHAT AREA */}
      <div className="flex-1 flex flex-col min-w-0 bg-gray-50/30 relative overflow-hidden">
        
        {/* Header */}
        <div className="h-12 border-b border-gray-100 bg-white px-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            {activeTab === 'community' ? (
                <>
                    <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600"><Users size={16} /></div>
                    <h3 className="font-bold text-gray-800 text-sm">Community Wall</h3>
                </>
            ) : (
                <>
                     <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                      <ShieldAlert size={16} />
                     </div>
                     <h3 className="font-bold text-gray-800 text-sm">Admin Support</h3>
                </>
            )}
          </div>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-1 scroll-smooth">
          {isLoading ? (
            <div className="flex justify-center p-10"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-300"></div></div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 opacity-60">
                <MessageSquare size={48} className="mb-2" />
                <p className="text-sm">No messages yet.</p>
            </div>
          ) : (
            messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} currentUserId={currentUser?.id} />
            ))
          )}
        </div>

        {/* Input */}
        <div className="p-3 md:p-4 bg-white border-t border-gray-100 shrink-0">
            <form onSubmit={handleSend} className="flex gap-2 relative">
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder={activeTab === 'community' ? "Message everyone..." : "Ask for help..."}
                    className="flex-1 bg-gray-100 text-gray-800 text-sm rounded-full pl-4 pr-12 py-3 outline-none focus:ring-2 focus:ring-orange-200 transition-all"
                />
                <button
                    type="submit"
                    disabled={!newMessage.trim() || isSending}
                    className="absolute right-1 top-1 bottom-1 aspect-square rounded-full flex items-center justify-center bg-orange-500 text-white shadow-md disabled:bg-gray-300 transition-all"
                >
                    <Send size={18} />
                </button>
            </form>
        </div>

      </div>
    </div>
  );
};

export default MessagingTab;