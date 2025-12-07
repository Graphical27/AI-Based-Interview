import React, { useState, useRef, useEffect, useContext } from 'react';
import { ThemeContext } from '../../contexts/ThemeContext';

const VoiceRecorder = ({ onSpeechResult, isRecording, setIsRecording, setIsListening, disabled = false }) => {
  const { theme } = useContext(ThemeContext);
  const [recognition, setRecognition] = useState(null);
  const [error, setError] = useState('');
  const [transcript, setTranscript] = useState('');
  const timeoutRef = useRef(null);

  useEffect(() => {
    // Check if speech recognition is supported
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognitionInstance = new SpeechRecognition();
      
      recognitionInstance.continuous = false;
      recognitionInstance.interimResults = true;
      recognitionInstance.lang = 'en-US';
      recognitionInstance.maxAlternatives = 1;

      recognitionInstance.onstart = () => {
        setIsListening(true);
        setError('');
        setTranscript('');
      };

      recognitionInstance.onresult = (event) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            finalTranscript += result[0].transcript;
          } else {
            interimTranscript += result[0].transcript;
          }
        }

        setTranscript(finalTranscript || interimTranscript);

        if (finalTranscript) {
          onSpeechResult(finalTranscript);
        }
      };

      recognitionInstance.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        setError(`Speech recognition error: ${event.error}`);
        setIsRecording(false);
        setIsListening(false);
      };

      recognitionInstance.onend = () => {
        setIsRecording(false);
        setIsListening(false);
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
      };

      setRecognition(recognitionInstance);
    } else {
      setError('Speech recognition not supported in this browser');
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [onSpeechResult, setIsRecording, setIsListening]);

  useEffect(() => {
    if (disabled && recognition && isRecording) {
      recognition.stop();
    }
  }, [disabled, recognition, isRecording]);

  const startRecording = () => {
    if (!recognition) {
      setError('Speech recognition not available');
      return;
    }

    if (disabled) {
      return;
    }

    try {
      setIsRecording(true);
      recognition.start();
      
      // Auto-stop after 30 seconds
      timeoutRef.current = setTimeout(() => {
        stopRecording();
      }, 30000);
    } catch (err) {
      console.error('Error starting recording:', err);
      setError('Failed to start recording');
      setIsRecording(false);
    }
  };

  const stopRecording = () => {
    if (recognition && isRecording) {
      recognition.stop();
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setIsRecording(false);
    setIsListening(false);
  };

  const toggleRecording = () => {
    if (disabled) {
      return;
    }
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <div className="flex flex-col items-center gap-2 relative">
      <div className="flex items-center justify-center">
        <button
          onClick={toggleRecording}
          className={`relative w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 ${
            isRecording 
              ? 'bg-red-500 shadow-[0_0_20px_rgba(239,68,68,0.5)] scale-110' 
              : disabled 
                ? 'bg-gray-700 cursor-not-allowed opacity-50' 
                : `bg-gradient-to-br ${theme.accent} hover:scale-105 shadow-lg`
          }`}
          disabled={!recognition || disabled}
          title={isRecording ? 'Stop Recording' : 'Start Recording'}
        >
          {isRecording ? (
            <svg className="w-5 h-5 text-white animate-pulse" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="6" width="12" height="12" rx="2"/>
            </svg>
          ) : (
            <svg className="w-6 h-6 text-black" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2c-1.1 0-2 .9-2 2v6c0 1.1.9 2 2 2s2-.9 2-2V4c0-1.1-.9-2-2-2zm5.3 6.7c-.4-.4-1-.4-1.4 0-.4.4-.4 1 0 1.4C17.2 11.4 18 12.7 18 14c0 3.3-2.7 6-6 6s-6-2.7-6-6c0-1.3.8-2.6 2.1-3.9.4-.4.4-1 0-1.4-.4-.4-1-.4-1.4 0C5.2 10.2 4 12 4 14c0 4.4 3.6 8 8 8s8-3.6 8-8c0-2-1.2-3.8-2.7-5.3z"/>
            </svg>
          )}
          
          {/* Ripple effect when recording */}
          {isRecording && (
            <>
              <span className="absolute inset-0 rounded-full bg-red-500 opacity-20 animate-ping"></span>
              <span className="absolute inset-0 rounded-full bg-red-500 opacity-20 animate-ping delay-150"></span>
            </>
          )}
        </button>
      </div>

      {/* Live Transcript Display - Absolute positioned */}
      {transcript && (
        <div className={`absolute bottom-full right-0 mb-4 w-64 p-3 rounded-xl ${theme.glassPanel} border ${theme.border} text-sm shadow-xl z-50 backdrop-blur-xl`}>
          <div className={`text-xs font-medium ${theme.accentText} mb-1`}>
            Live Transcript:
          </div>
          <div className={theme.text}>
            {transcript}
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="absolute bottom-full right-0 mb-4 text-xs text-red-400 bg-red-500/10 px-3 py-2 rounded-lg border border-red-500/20 whitespace-nowrap">
          {error}
        </div>
      )}
    </div>
  );
};

export default VoiceRecorder;