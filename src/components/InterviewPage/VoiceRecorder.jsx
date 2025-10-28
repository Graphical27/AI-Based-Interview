import React, { useState, useRef, useEffect } from 'react';
import './VoiceRecorder.css';

const VoiceRecorder = ({ onSpeechResult, isRecording, setIsRecording, setIsListening, disabled = false }) => {
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
    <div className="voice-recorder">
      <div className="recorder-controls">
        <button
          onClick={toggleRecording}
          className={`record-button ${isRecording ? 'recording' : ''}`}
          disabled={!recognition || disabled}
          title={isRecording ? 'Stop Recording' : 'Start Recording'}
        >
          {isRecording ? (
            <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
              <rect x="6" y="6" width="12" height="12" rx="2"/>
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
              <path d="M12 2c-1.1 0-2 .9-2 2v6c0 1.1.9 2 2 2s2-.9 2-2V4c0-1.1-.9-2-2-2zm5.3 6.7c-.4-.4-1-.4-1.4 0-.4.4-.4 1 0 1.4C17.2 11.4 18 12.7 18 14c0 3.3-2.7 6-6 6s-6-2.7-6-6c0-1.3.8-2.6 2.1-3.9.4-.4.4-1 0-1.4-.4-.4-1-.4-1.4 0C5.2 10.2 4 12 4 14c0 4.4 3.6 8 8 8s8-3.6 8-8c0-2-1.2-3.8-2.7-5.3z"/>
            </svg>
          )}
        </button>
        
        <div className="record-status">
          {isRecording && (
            <div className="pulse-animation">
              <span>Recording...</span>
            </div>
          )}
        </div>
      </div>

      {/* Live Transcript Display */}
      {transcript && (
        <div className="live-transcript">
          <div className="transcript-header">
            <span>Live Transcript:</span>
          </div>
          <div className="transcript-text">
            {transcript}
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="recorder-error">
          <span>{error}</span>
        </div>
      )}

      {/* Recording Instructions */}
      <div className="recording-instructions">
        <p>
          {!recognition
            ? 'Voice input not available in this browser'
            : disabled
              ? 'Voice input pauses while the AI is speaking or after the interview wraps up.'
              : 'Optional: Click the microphone to speak your answer, or simply type below'}
        </p>
        {recognition && (
          <div className="voice-benefits">
            <span className="benefit-item">🎤 Natural conversation flow</span>
            <span className="benefit-item">⚡ Hands-free responses</span>
            <span className="benefit-item">🗣️ Practice speaking skills</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default VoiceRecorder;