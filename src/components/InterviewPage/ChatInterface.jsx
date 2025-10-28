import React from 'react';
import './ChatInterface.css';

const ChatInterface = ({ 
  messages, 
  currentMessage, 
  setCurrentMessage, 
  onSendMessage, 
  messagesEndRef,
  disabled = false,
  completionReason = ''
}) => {
  
  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (disabled || !currentMessage.trim()) {
      return;
    }
    Promise.resolve(onSendMessage(currentMessage.trim())).catch(() => {
      // Errors handled upstream; swallow promise rejection to avoid console noise
    });
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <div className="chat-interface">
      {/* Messages Container */}
      <div className="messages-container">
        {messages.length === 0 && (
          <div className="welcome-message">
            <div className="ai-avatar large">AI</div>
            <h3>Interview Starting...</h3>
            <p>Your personalized AI interview is about to begin. The AI will ask progressively challenging questions based on your profile.</p>
          </div>
        )}
        
        {messages.map((message) => (
          <div key={message.id} className={`message ${message.role}-message`}>
            <div className={`${message.role}-avatar`}>
              {message.role === 'ai' ? 'AI' : 'YOU'}
            </div>
            <div className="message-content">
              <div className={`message-bubble ${message.role}-bubble`}>
                <p>{message.message}</p>
              </div>
              <div className="message-time">
                {formatTime(message.timestamp)}
              </div>
            </div>
          </div>
        ))}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input Section */}
      <form onSubmit={handleSubmit} className="message-input-form">
        <div className="input-container">
          <textarea
            value={currentMessage}
            onChange={(e) => setCurrentMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={disabled
              ? completionReason === 'user-quit'
                ? 'You ended this interview. Head back to the job board to start again.'
                : completionReason === 'time-expired'
                  ? 'Time is up. Review the transcript or close the session when ready.'
                  : 'Interview complete. No further responses are required.'
              : 'Type your response here... You can type or use the microphone above to speak your answer.'
            }
            className="message-input"
            rows="3"
            disabled={disabled}
          />
          <button 
            type="submit" 
            className="send-button"
            disabled={!currentMessage.trim() || disabled}
            title="Send Message (Enter)"
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
              <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
            </svg>
          </button>
        </div>
        <div className="input-help-text">
          <span className="input-tip">
            💡 <strong>Tip:</strong> You can type here anytime, even if you prefer not to use the microphone. Press <kbd>Enter</kbd> to send, or <kbd>Shift+Enter</kbd> for new line.
          </span>
        </div>
      </form>
    </div>
  );
};

export default ChatInterface;