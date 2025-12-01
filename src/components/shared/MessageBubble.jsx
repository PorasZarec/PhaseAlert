import React from 'react';

const MessageBubble = ({ message, currentUserId }) => {
  const isMe = message.sender_id === currentUserId;
  const isAdminSender = message.sender?.role === 'admin';

  // Fallback name if RLS blocks the profile fetch, though our hook fixes this
  const senderName = message.sender?.full_name || 'Unknown User';

  return (
    <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} mb-3 animate-in slide-in-from-bottom-2`}>
      
      {/* Name Label (Show for others) */}
      {!isMe && (
        <span className="text-[10px] text-black-500 font-semibold ml-2 mb-1 flex items-center gap-1">
          {senderName}
          {isAdminSender && (
            <span className="bg-blue-100 text-blue-700 px-1.5 rounded text-[9px] font-bold">ADMIN</span>
          )}
        </span>
      )}

      <div 
        className={`max-w-[85%] md:max-w-[70%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm break-words
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
        {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
      </span>
    </div>
  );
};

export default MessageBubble;