import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../services/supabaseClient';
import MessageBubble from '../shared/MessageBubble';
import { useMessages } from '../../hooks/useMessages';
import { Search, Users, User, Send, MessageSquare } from 'lucide-react';

const InboxManagement = () => {
  const [activeTab, setActiveTab] = useState('community'); 
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedResident, setSelectedResident] = useState(null);
  const [residentList, setResidentList] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [newMessage, setNewMessage] = useState('');

  const scrollRef = useRef(null);

  useEffect(() => {
    const setup = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      console.log("Current Admin User:", user); // DEBUG CHECK
      setCurrentUser(user);

      const { data } = await supabase
        .from('profiles')
        .select('*')
        .neq('role', 'admin')
        .order('full_name');
      setResidentList(data || []);
    };
    setup();
  }, []);

  const { messages, isLoading, sendMessage, isSending } = useMessages(
    activeTab, 
    currentUser?.id, 
    selectedResident?.id
  );

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const handleSend = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    sendMessage({ 
        content: newMessage, 
        receiverId: activeTab === 'community' ? null : selectedResident?.id 
    }, {
        onSuccess: () => setNewMessage('')
    });
  };

  const filteredResidents = residentList.filter(r => 
    r.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex h-[calc(100vh-140px)] bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden font-sans">
      
      {/* SIDEBAR */}
      <div className="w-80 bg-gray-50 border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-200">
            <h2 className="font-bold text-gray-800 text-lg mb-4">Inbox</h2>
            <button
                onClick={() => { setActiveTab('community'); setSelectedResident(null); }}
                className={`w-full flex items-center gap-3 p-3 rounded-lg text-sm font-medium transition-all mb-4
                    ${activeTab === 'community' ? 'bg-orange-500 text-white shadow-md' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-100'}`}
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
                    className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
            </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
            <p className="px-2 text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 mt-2">Direct Messages</p>
            {filteredResidents.map(resident => (
                <button
                    key={resident.id}
                    onClick={() => { setActiveTab('direct'); setSelectedResident(resident); }}
                    className={`w-full flex items-center gap-3 p-2 rounded-lg transition-colors text-left
                        ${selectedResident?.id === resident.id && activeTab === 'direct'
                            ? 'bg-blue-100 text-blue-900 border-l-4 border-blue-500' 
                            : 'hover:bg-gray-100 text-gray-700'}`}
                >
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold text-xs shrink-0">
                        {resident.full_name ? resident.full_name[0] : 'U'}
                    </div>
                    <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{resident.full_name}</p>
                    </div>
                </button>
            ))}
        </div>
      </div>

      {/* CHAT AREA */}
      <div className="flex-1 flex flex-col bg-white min-w-0">
        <div className="h-16 border-b border-gray-100 px-6 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
                {activeTab === 'community' ? (
                    <>
                        <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-600"><Users size={20} /></div>
                        <div>
                            <h3 className="font-bold text-gray-800">Community Chat</h3>
                            <p className="text-xs text-gray-500">Public visibility</p>
                        </div>
                    </>
                ) : selectedResident ? (
                    <>
                         <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600"><User size={20} /></div>
                        <div>
                            <h3 className="font-bold text-gray-800">{selectedResident.full_name}</h3>
                            <p className="text-xs text-gray-500">Blk {selectedResident.address_block}</p>
                        </div>
                    </>
                ) : (
                    <div className="text-gray-400">Select a resident to start messaging</div>
                )}
            </div>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-2 bg-gray-50/30">
            {isLoading ? (
                <div className="flex justify-center p-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div></div>
            ) : messages.length === 0 ? (
                <div className="text-center text-gray-400 mt-10">No messages found.</div>
            ) : (
                messages.map(msg => (
                    <MessageBubble key={msg.id} message={msg} currentUserId={currentUser?.id} />
                ))
            )}
        </div>

        {/* Input Area (Fixed Layout) */}
        <div className="p-4 border-t border-gray-100 bg-white shrink-0">
            <form onSubmit={handleSend} className="flex gap-3 relative">
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    disabled={activeTab === 'direct' && !selectedResident}
                    placeholder="Type your message..."
                    className="flex-1 bg-gray-100 border border-transparent focus:bg-white focus:border-blue-300 rounded-full px-5 py-3 outline-none transition-all"
                />
                <button
                    type="submit"
                    disabled={!newMessage.trim() || isSending || (activeTab === 'direct' && !selectedResident)}
                    className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-3 shadow-lg disabled:opacity-50 disabled:shadow-none transition-all flex items-center justify-center"
                >
                    <Send size={20} />
                </button>
            </form>
        </div>
      </div>
    </div>
  );
};

export default InboxManagement;