import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../services/supabaseClient';
import MessageBubble from '../shared/MessageBubble';
import { MessageSquare, ShieldAlert, Send, Users } from 'lucide-react';

const MessagingTab = () => {
  const [activeTab, setActiveTab] = useState('community'); // 'community' | 'admin'
  const [currentUser, setCurrentUser] = useState(null);
  const [adminProfile, setAdminProfile] = useState(null);
  
  // Messaging States
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Refs for scrolling and input
  const scrollContainerRef = useRef(null);
  const inputRef = useRef(null);

  // 1. Initial Setup: Get Current User & Find the Admin
  useEffect(() => {
    const setup = async () => {
      // Get current authenticated user
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setCurrentUser(user);

      // Find the Admin Profile (assuming role 'admin')
      const { data: adminData } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'admin')
        .limit(1)
        .single();
      
      if (adminData) {
        setAdminProfile(adminData);
      }
    };
    setup();
  }, []);

  // 2. Fetch Messages when Tab Changes
  useEffect(() => {
    const fetchMessages = async () => {
      if (!currentUser) return;
      setIsLoading(true);

      let query = supabase
        .from('messages')
        .select(`*, sender:profiles!fk_messages_sender(full_name, avatar_url)`)
        .order('created_at', { ascending: false })
        .limit(50); // Fetch last 50 messages

      if (activeTab === 'community') {
        // Community: receiver_id is NULL
        query = query.is('receiver_id', null);
      } else if (activeTab === 'admin') {
        if (!adminProfile) {
            setIsLoading(false);
            return;
        }
        
        // Logic: (Sender is Me AND Receiver is Admin) OR (Sender is Admin AND Receiver is Me)
        query = query.or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${adminProfile.id}),and(sender_id.eq.${adminProfile.id},receiver_id.eq.${currentUser.id})`);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching messages:", error);
      } else {
        // Reverse because we fetched descending (newest first) but want to display ascending (oldest at top)
        setMessages(data ? data.reverse() : []);
      }
      setIsLoading(false);
    };

    fetchMessages();
  }, [activeTab, currentUser, adminProfile]);

  // 3. Auto-scroll to bottom on new messages
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  // 4. Realtime Subscription
  useEffect(() => {
    if (!currentUser) return;

    const channel = supabase
      .channel('resident_messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, async (payload) => {
        const incomingMsg = payload.new;

        // Fetch sender details for the UI
        const { data: senderData } = await supabase
            .from('profiles')
            .select('full_name, avatar_url')
            .eq('id', incomingMsg.sender_id)
            .single();

        const fullMsg = { ...incomingMsg, sender: senderData };

        // Decide whether to add this message to the current view
        let shouldAdd = false;

        if (activeTab === 'community' && !fullMsg.receiver_id) {
            shouldAdd = true;
        } else if (activeTab === 'admin' && adminProfile) {
            // Check if it's part of the conversation with Admin
            const isFromAdminToMe = fullMsg.sender_id === adminProfile.id && fullMsg.receiver_id === currentUser.id;
            const isFromMeToAdmin = fullMsg.sender_id === currentUser.id && fullMsg.receiver_id === adminProfile.id;
            if (isFromAdminToMe || isFromMeToAdmin) shouldAdd = true;
        }

        if (shouldAdd) {
            setMessages((prev) => [...prev, fullMsg]);
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [activeTab, currentUser, adminProfile]);

  // 5. Send Message Handler
  const handleSendMessage = async () => {
    if (!newMessage.trim() || !currentUser) return;
    
    const text = newMessage.trim();
    setNewMessage(''); // Clear input immediately for better UX

    const payload = {
      content: text,
      sender_id: currentUser.id,
      receiver_id: activeTab === 'community' ? null : adminProfile?.id,
    };

    const { error } = await supabase.from('messages').insert([payload]);
    
    if (error) {
      console.error("Error sending message:", error);
      setNewMessage(text); // Restore text if failed
      alert("Failed to send message. Please try again.");
    } else {
        setTimeout(() => inputRef.current?.focus(), 10);
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-[75vh] bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden font-sans">
      
      {/* --- NAVIGATION SIDEBAR / TOP BAR --- */}
      {/* On Desktop (md+), this is a sidebar. On Mobile, it's a top bar. */}
      <div className="w-full md:w-64 bg-gray-50 border-b md:border-b-0 md:border-r border-gray-200 p-2 md:p-4 flex flex-row md:flex-col gap-2 shrink-0">
        
        {/* Header - Hidden on small mobile to save space, visible on MD */}
        <div className="hidden md:block mb-4">
            <h2 className="font-bold text-gray-700 text-lg">Messages</h2>
            <p className="text-xs text-gray-500">Stay connected</p>
        </div>

        {/* Tab: Community */}
        <button
          onClick={() => setActiveTab('community')}
          className={`flex-1 md:flex-none flex items-center justify-center md:justify-start gap-2 p-3 rounded-lg text-sm font-medium transition-all duration-200
            ${activeTab === 'community' 
              ? 'bg-orange-500 text-white shadow-md' 
              : 'bg-white md:bg-transparent text-gray-600 hover:bg-orange-50'}`}
        >
          <Users size={18} />
          <span className="hidden sm:inline">Community</span>
          <span className="sm:hidden">Chat</span>
        </button>

        {/* Tab: Admin Support */}
        <button
          onClick={() => setActiveTab('admin')}
          className={`flex-1 md:flex-none flex items-center justify-center md:justify-start gap-2 p-3 rounded-lg text-sm font-medium transition-all duration-200
            ${activeTab === 'admin' 
              ? 'bg-blue-600 text-white shadow-md' 
              : 'bg-white md:bg-transparent text-gray-600 hover:bg-blue-50'}`}
        >
          <ShieldAlert size={18} />
          <span className="hidden sm:inline">Admin Support</span>
          <span className="sm:hidden">Admin</span>
        </button>
      </div>

      {/* --- CHAT AREA --- */}
      <div className="flex-1 flex flex-col min-w-0 bg-gray-50/30">
        
        {/* Chat Header */}
        <div className="h-14 border-b border-gray-100 bg-white px-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            {activeTab === 'community' ? (
                <>
                    <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center text-orange-600">
                        <Users size={16} />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-800 text-sm">Community Chat</h3>
                        <p className="text-[10px] text-gray-500">Public & visible to all residents</p>
                    </div>
                </>
            ) : (
                <>
                     <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                        <ShieldAlert size={16} />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-800 text-sm">Admin Support</h3>
                        <p className="text-[10px] text-gray-500">Private line to management</p>
                    </div>
                </>
            )}
          </div>
        </div>

        {/* Messages List */}
        <div 
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto p-4 space-y-1 scroll-smooth"
        >
          {isLoading ? (
            <div className="flex justify-center items-center h-full">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-300"></div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 opacity-60">
                <MessageSquare size={48} className="mb-2" />
                <p className="text-sm">No messages yet. Say hello!</p>
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
        <div className="p-3 md:p-4 bg-white border-t border-gray-100 shrink-0">
            <div className="flex gap-2 relative">
                <input
                    ref={inputRef}
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                        }
                    }}
                    placeholder={activeTab === 'community' ? "Type a message to everyone..." : "Message the admin..."}
                    className="flex-1 bg-gray-100 text-gray-800 text-sm rounded-full pl-4 pr-12 py-3 outline-none focus:ring-2 focus:ring-orange-200 focus:bg-white transition-all border border-transparent focus:border-orange-300"
                    disabled={activeTab === 'admin' && !adminProfile}
                />
                
                <button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || (activeTab === 'admin' && !adminProfile)}
                    className={`absolute right-1 top-1 bottom-1 aspect-square rounded-full flex items-center justify-center transition-all
                        ${!newMessage.trim() 
                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                            : 'bg-gradient-to-tr from-orange-500 to-amber-500 text-white shadow-md hover:scale-105 active:scale-95'
                        }`}
                >
                    <Send size={18} />
                </button>
            </div>
            {activeTab === 'admin' && !adminProfile && (
                <p className="text-xs text-red-500 mt-2 text-center">
                    Admin contact is currently unavailable.
                </p>
            )}
        </div>

      </div>
    </div>
  );
};

export default MessagingTab;