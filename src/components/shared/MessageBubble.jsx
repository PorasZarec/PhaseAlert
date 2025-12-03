import React from 'react';

const MessageBubble = ({ message, currentUserId }) => {
  const isMe = message.sender_id === currentUserId;
  
  // Safe navigation (?) is crucial here as the join might occasionally fail or be null
  const isAdminSender = message.sender?.role === 'admin';
  const senderName = message.sender?.full_name || 'Unknown User';
  const isResidentSender = message.sender?.role === 'resident';

  // Format date safely
  const formatTime = (dateString) => {
    try {
      return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return '';
    }
  };

  return (
    <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} mb-3 animate-in slide-in-from-bottom-2`}>
      
      {/* Name Label (Show for others) */}
      {!isMe && (
        <span className="text-[10px] text-gray-500 font-semibold ml-2 mb-1 flex items-center gap-1">
          {senderName}
          {isAdminSender && (
            <span className="bg-blue-100 text-blue-700 px-1.5 rounded text-[9px] font-bold">ADMIN</span>
          )}
          {isResidentSender && (
            <span className="bg-cyan-100 text-cyan-700 px-1.5 rounded text-[9px] font-bold">RESIDENT</span>
          )}
        </span>
      )}

      <div 
        className={`max-w-[85%] md:max-w-[70%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm break-words whitespace-pre-wrap
        ${isMe 
            ? 'bg-gradient-to-br from-orange-500 to-amber-600 text-white rounded-br-none' 
            : 'bg-white border border-gray-100 text-gray-800 rounded-bl-none'
        }
        ${!isMe && isAdminSender ? 'border-blue-200 bg-blue-50/50' : ''} 
        `}
      >
        {message.content}
      </div>
      
      {/* Time */}
      <span className={`text-[9px] text-gray-400 mt-1 px-1 ${isMe ? 'text-right' : 'text-left'}`}>
        {formatTime(message.created_at)}
      </span>
    </div>
  );
};

export default MessageBubble;