import React, { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../../services/supabaseClient'; 
import MessageBubble from './../shared/MessageBubble'; 

const InboxManagement = () => {
  const [activeTab, setActiveTab] = useState('community'); 
  const [selectedResident, setSelectedResident] = useState(null); 
  const [residentList, setResidentList] = useState([]); 
  const [currentUserId, setCurrentUserId] = useState(null);
  
  // Messaging States
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Pagination States
  const [page, setPage] = useState(0); 
  const [hasMore, setHasMore] = useState(true); 
  const MESSAGES_PER_BATCH = 20;

  // Refs
  const scrollContainerRef = useRef(null);
  const previousScrollHeightRef = useRef(0); 
  const inputRef = useRef(null);

  // 1. Initial Setup: Get User & Residents
  useEffect(() => {
    const setup = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setCurrentUserId(user.id);

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .neq('role', 'admin');
      setResidentList(data || []);
    };
    setup();
  }, []);

  // 2. Reset Context when switching tabs/users
  useEffect(() => {
    setMessages([]);
    setPage(0);
    setHasMore(true);
    // Scroll to bottom after reset
    setTimeout(() => {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
      }
    }, 100);
  }, [activeTab, selectedResident?.id]); 

  // 3. Fetch Messages (Batching) - FIXED QUERY
  useEffect(() => {
    const fetchMessages = async () => {
      if (!currentUserId) return;
      if (activeTab === 'direct' && !selectedResident) return;
      
      setIsLoading(true);

      const from = page * MESSAGES_PER_BATCH;
      const to = from + MESSAGES_PER_BATCH - 1;

      // --- FIX IS HERE ---
      // We specify 'profiles!fk_messages_sender' to tell Supabase exactly which relationship to use
      let query = supabase
        .from('messages')
        .select(`*, sender:profiles!fk_messages_sender(full_name, avatar_url)`)
        .order('created_at', { ascending: false }) 
        .range(from, to);

      if (activeTab === 'community') {
        query = query.is('receiver_id', null);
      } else if (activeTab === 'direct' && selectedResident) {
        query = query.or(`and(sender_id.eq.${currentUserId},receiver_id.eq.${selectedResident.id}),and(sender_id.eq.${selectedResident.id},receiver_id.eq.${currentUserId})`);
      }

      const { data, error } = await query;
      
      if (error) {
        console.error("Error fetching messages:", error);
        setIsLoading(false);
        return;
      }
      
      if (data) {
        if (data.length < MESSAGES_PER_BATCH) {
          setHasMore(false);
        }

        // Reverse to show Oldest -> Newest
        const orderedMessages = data.reverse();

        setMessages((prev) => {
          if (page === 0) return orderedMessages;
          return [...orderedMessages, ...prev];
        });
      }
      setIsLoading(false);
    };

    fetchMessages();
  }, [page, activeTab, selectedResident?.id, currentUserId]); 

  // 4. Realtime Subscription
  useEffect(() => {
    if (!currentUserId) return;

    const channel = supabase
      .channel('realtime:messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, async (payload) => {
         
         const incomingMsg = payload.new;

         const { data: senderData } = await supabase
            .from('profiles')
            .select('full_name, avatar_url')
            .eq('id', incomingMsg.sender_id)
            .single();

         const newMsg = { ...incomingMsg, sender: senderData };

         let shouldShow = false;

         if (activeTab === 'community' && !newMsg.receiver_id) {
           shouldShow = true;
         }

         if (activeTab === 'direct' && selectedResident) {
           const isFromThem = newMsg.sender_id === selectedResident.id && newMsg.receiver_id === currentUserId;
           const isToThem = newMsg.sender_id === currentUserId && newMsg.receiver_id === selectedResident.id;
           if (isFromThem || isToThem) shouldShow = true;
         }

         if (shouldShow) {
            setMessages((prev) => [...prev, newMsg]);
            
            setTimeout(() => {
                if (scrollContainerRef.current) {
                    scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
                }
            }, 100);
         }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [activeTab, selectedResident?.id, currentUserId]);

  // 5. Handle Scroll (Load More Logic)
  const handleScroll = () => {
    const container = scrollContainerRef.current;
    if (!container) return;

    if (container.scrollTop === 0 && hasMore && !isLoading) {
        previousScrollHeightRef.current = container.scrollHeight;
        setPage((prev) => prev + 1);
    }
  };

  // 6. Adjust Scroll Position after Loading Old Messages
  useEffect(() => {
    if (page > 0 && scrollContainerRef.current) {
        const newScrollHeight = scrollContainerRef.current.scrollHeight;
        const heightDifference = newScrollHeight - previousScrollHeightRef.current;
        scrollContainerRef.current.scrollTop = heightDifference;
    } else if (page === 0 && scrollContainerRef.current && messages.length > 0) {
        scrollContainerRef.current.scrollTop = scrollContainerRef.current.scrollHeight;
    }
  }, [messages, page]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !currentUserId) return;
    
    const messageContent = newMessage.trim();
    setNewMessage('');

    const payload = {
      content: messageContent,
      sender_id: currentUserId,
      receiver_id: activeTab === 'community' ? null : selectedResident?.id, 
    };

    const { error } = await supabase.from('messages').insert([payload]);
    
    if (error) {
        console.error("Error sending message:", error);
        setNewMessage(messageContent); 
    } else {
        // Successfully sent, ensure input is ready
        if (inputRef.current) {
            inputRef.current.focus();
        }
    }
  };

  return (
    <div className="flex h-[80vh] gap-4 font-sans text-gray-800">
      {/* SIDEBAR */}
      <div className="w-1/4 bg-white border border-orange-200 p-4 rounded-xl shadow-sm flex flex-col">
        <h2 className="font-bold text-orange-600 mb-6 text-xl tracking-tight">Inbox</h2>
        <button 
          onClick={() => { setActiveTab('community'); setSelectedResident(null); }}
          className={`w-full text-left p-3 rounded-lg mb-4 font-medium transition-colors duration-200 
            ${activeTab === 'community' ? 'bg-orange-500 text-white shadow-md' : 'hover:bg-orange-50 text-gray-600'}`}
        >
          📢 Community Chat
        </button>
        <div className="flex-1 overflow-y-auto">
          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Residents</h3>
          <div className="space-y-1">
            {residentList.map(resident => (
                <button
                key={resident.id}
                onClick={() => {
                    setActiveTab('direct');
                    setSelectedResident(resident);
                }}
                className={`w-full text-left p-3 rounded-lg flex items-center gap-3 transition-colors duration-200
                    ${selectedResident?.id === resident.id && activeTab === 'direct' 
                    ? 'bg-orange-100 text-orange-800 border-l-4 border-orange-500' : 'hover:bg-gray-50'}`}
                >
                <div className="w-8 h-8 rounded-full bg-amber-200 flex items-center justify-center text-amber-700 font-bold text-xs">
                    {resident.full_name ? resident.full_name[0] : 'U'}
                </div>
                <span className="truncate">{resident.full_name || 'Resident'}</span>
                </button>
            ))}
          </div>
        </div>
      </div>

      {/* CHAT AREA */}
      <div className="flex-1 bg-white border border-gray-200 rounded-xl shadow-sm flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
          <h2 className="font-bold text-lg text-gray-700">
            {activeTab === 'community' ? '🏘️ Community Wall' : `💬 ${selectedResident?.full_name || 'Select a user'}`}
          </h2>
          {activeTab === 'community' && <span className="text-xs bg-orange-100 text-orange-600 px-2 py-1 rounded-full">Public</span>}
        </div>

        {/* Messages List (Scrollable) */}
        <div 
            ref={scrollContainerRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto p-6 bg-gray-50/50"
        >
          {isLoading && page === 0 && (
             <div className="text-center text-xs text-gray-400 py-2">Loading messages...</div>
          )}

          {isLoading && page > 0 && (
             <div className="text-center text-xs text-gray-400 py-2">Loading history...</div>
          )}

          {!isLoading && messages.length === 0 && (
             <div className="text-center text-gray-400 mt-10">No messages yet. Start the conversation!</div>
          )}
          
          {messages.map((msg) => (
             <MessageBubble key={msg.id} message={msg} currentUserId={currentUserId} />
          ))}
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-gray-100 bg-white">
           <div className="flex gap-3">
                <input 
                    ref={inputRef}
                    type="text" 
                    className="flex-1 bg-gray-100 border-transparent focus:bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-200 rounded-full px-4 py-3 outline-none transition-all" 
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    disabled={activeTab === 'direct' && !selectedResident}
                    onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage();
                        }
                    }}
                />
                <button 
                    onClick={handleSendMessage} 
                    disabled={!newMessage.trim() || (activeTab === 'direct' && !selectedResident)}
                    className="bg-orange-500 hover:bg-orange-600 disabled:bg-gray-300 text-white px-6 py-2 rounded-full font-medium transition-colors shadow-md flex items-center gap-2"
                >
                    Send 🚀
                </button>
           </div>
        </div>
      </div>
    </div>
  )
}

export default InboxManagement