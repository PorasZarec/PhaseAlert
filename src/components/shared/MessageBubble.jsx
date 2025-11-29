import React from 'react';

// This component expects:
// - message: the message object from Supabase
// - currentUserId: the ID of the person currently logged in (to determine Left vs Right)
const MessageBubble = ({ message, currentUserId }) => {
  // Check if the message was sent by the current logged-in user
  const isMe = message.sender_id === currentUserId;

  return (
    <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} mb-4`}>
      <div 
        className={`max-w-[70%] p-3 rounded-2xl shadow-sm text-sm break-words
        ${isMe 
            ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-br-none' 
            : 'bg-white border border-gray-200 text-gray-700 rounded-bl-none'
        }`}
      >
        {/* Only show sender name if it's NOT me */}
        {!isMe && (
          <p className="text-[10px] font-bold text-orange-400 mb-1">
            {message.sender?.full_name || 'Unknown'}
          </p>
        )}
        <p>{message.content}</p>
      </div>
      
      {/* Time Stamp */}
      <span className="text-[10px] text-gray-400 mt-1 px-1">
        {new Date(message.created_at).toLocaleTimeString([], {
          hour: '2-digit', 
          minute: '2-digit'
        })}
      </span>
    </div>
  );
};

export default MessageBubble;