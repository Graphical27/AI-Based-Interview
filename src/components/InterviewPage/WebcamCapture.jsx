import React, { useRef, useEffect, useState, useContext } from 'react';
import { ThemeContext } from '../../contexts/ThemeContext';

const WebcamCapture = () => {
  const { theme } = useContext(ThemeContext);
  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    startWebcam();
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startWebcam = async () => {
    try {
      setIsLoading(true);
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'user'
        },
        audio: false
      });
      
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setError('');
      setIsLoading(false);
    } catch (err) {
      console.error('Error accessing webcam:', err);
      setError('Unable to access webcam. Please check permissions.');
      setIsLoading(false);
    }
  };

  const stopWebcam = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  return (
    <div className="flex flex-col h-full relative">
      {/* Video Feed */}
      <div className="flex-1 relative bg-black/40 overflow-hidden">
        {isLoading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-10">
            <div className={`w-8 h-8 border-2 border-t-transparent ${theme.accentText} rounded-full animate-spin`}></div>
            <p className={`text-sm ${theme.textMuted}`}>Starting webcam...</p>
          </div>
        )}
        
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center z-10">
            <div className="text-4xl opacity-50">📷</div>
            <p className="text-red-400 text-sm">{error}</p>
            <button 
              onClick={startWebcam} 
              className={`px-4 py-2 rounded-lg text-sm font-medium ${theme.glassPanel} border ${theme.border} hover:bg-white/10 transition-colors`}
            >
              Try Again
            </button>
          </div>
        )}
        
        {!error && (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className={`w-full h-full object-cover transition-opacity duration-500 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
          />
        )}
        
        {stream && !isLoading && (
          <div className="absolute top-4 right-4 flex items-center gap-2 px-2 py-1 rounded-md bg-black/50 backdrop-blur-sm border border-white/10">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
            <span className="text-[10px] font-bold tracking-wider text-white">LIVE</span>
          </div>
        )}
      </div>

      {/* Controls Overlay (Optional - can be removed if controls are elsewhere) */}
      <div className="absolute top-4 left-4 z-20">
        {stream ? (
          <button 
            onClick={stopWebcam} 
            className="p-2 rounded-lg bg-black/50 backdrop-blur-sm border border-white/10 hover:bg-red-500/20 hover:border-red-500/50 transition-all group"
            title="Stop Camera"
          >
            <svg className="w-4 h-4 text-white group-hover:text-red-400" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
            </svg>
          </button>
        ) : (
          <button 
            onClick={startWebcam} 
            className={`p-2 rounded-lg bg-black/50 backdrop-blur-sm border border-white/10 hover:bg-green-500/20 hover:border-green-500/50 transition-all group`}
            title="Start Camera"
          >
            <svg className="w-4 h-4 text-white group-hover:text-green-400" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"/>
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

export default WebcamCapture;