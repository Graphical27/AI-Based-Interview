import React, { useContext } from 'react';
import { ThemeContext } from '../../contexts/ThemeContext';

const ChatInterface = ({ 
  messages, 
  messagesEndRef
}) => {
  const { theme } = useContext(ThemeContext);
  
  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden">
      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-4 opacity-60">
            <div className={`w-20 h-20 rounded-full bg-gradient-to-br ${theme.orb1} flex items-center justify-center text-2xl font-bold shadow-lg animate-pulse`}>AI</div>
            <h3 className={`text-xl font-semibold ${theme.text}`}>Interview Starting...</h3>
            <p className={`max-w-md ${theme.textMuted}`}>Your personalized AI interview is about to begin. The AI will ask progressively challenging questions based on your profile.</p>
          </div>
        )}
        
        {messages.map((message) => (
          <div key={message.id} className={`flex gap-4 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold shrink-0 shadow-lg ${
              message.role === 'ai' 
                ? `bg-gradient-to-br ${theme.orb1} text-white` 
                : `bg-gradient-to-br ${theme.orb2} text-white`
            }`}>
              {message.role === 'ai' ? 'AI' : 'YOU'}
            </div>
            
            <div className={`flex flex-col max-w-[80%] ${message.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div className={`px-5 py-3 rounded-2xl shadow-sm ${
                message.role === 'ai' 
                  ? `${theme.glassPanel} border ${theme.border} rounded-tl-none` 
                  : `bg-gradient-to-r ${theme.accent} text-white rounded-tr-none`
              }`}>
                <p className="whitespace-pre-wrap leading-relaxed text-lg">{message.message}</p>
              </div>
              <span className={`text-xs mt-1 px-1 ${theme.textMuted}`}>
                {formatTime(message.timestamp)}
              </span>
            </div>
          </div>
        ))}
        
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
};

export default ChatInterface;