import React, { useContext } from 'react';
import { ThemeContext } from '../../contexts/ThemeContext';

const TypingAnimation = () => {
  const { theme } = useContext(ThemeContext);
  
  return (
    <div className={`flex items-center gap-3 px-4 py-2 rounded-full ${theme.glassPanel} border ${theme.border}`}>
      <div className="flex gap-1">
        <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${theme.accent} animate-bounce`}></div>
        <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${theme.accent} animate-bounce delay-100`}></div>
        <div className={`w-2 h-2 rounded-full bg-gradient-to-r ${theme.accent} animate-bounce delay-200`}></div>
      </div>
      <span className={`text-xs font-medium ${theme.textMuted} animate-pulse`}>AI is thinking...</span>
    </div>
  );
};

export default TypingAnimation;