import React, { useEffect, useState } from 'react';
import { Bell, X } from 'lucide-react';

interface NotificationToastProps {
  title: string;
  description?: string;
  onClick: () => void;
  onClose: () => void;
  duration?: number;
}

const NotificationToast: React.FC<NotificationToastProps> = ({ 
  title, 
  description, 
  onClick, 
  onClose, 
  duration = 6000 
}) => {
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    // Sound logic
    const playSound = () => {
      const audio = new Audio('/notification.mp3');
      audio.volume = 0.5;
      audio.play().catch(() => {});
    };

    let played = false;
    const tryPlay = () => {
      if (!played) {
        playSound();
        played = true;
      }
    };

    // Try to play immediately (often fails without interaction)
    tryPlay();
    
    // Add interaction listeners for browsers that block auto-play
    window.addEventListener('pointerdown', tryPlay, { once: true });
    window.addEventListener('keydown', tryPlay, { once: true });

    // Progress bar animation
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      setProgress(remaining);
      if (remaining <= 0) clearInterval(interval);
    }, 50);

    const timer = setTimeout(onClose, duration);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
      window.removeEventListener('pointerdown', tryPlay);
      window.removeEventListener('keydown', tryPlay);
    };
  }, [onClose, duration]);

  return (
    <>
      <style>{`
        @keyframes toast-slide-in {
          from { transform: translateX(120%) scale(0.9); opacity: 0; }
          to { transform: translateX(0) scale(1); opacity: 1; }
        }
        .premium-toast {
          animation: toast-slide-in 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          backdrop-filter: blur(12px) saturate(180%);
          -webkit-backdrop-filter: blur(12px) saturate(180%);
          background-color: rgba(255, 255, 255, 0.8);
          border: 1px solid rgba(255, 255, 255, 0.3);
        }
        .premium-toast:hover {
          background-color: rgba(255, 255, 255, 0.9);
          transform: translateY(-2px);
          box-shadow: 0 12px 40px rgba(0,0,0,0.12);
        }
      `}</style>
      
      <div
        className="premium-toast"
        style={{
          position: 'fixed',
          top: 24,
          right: 24,
          zIndex: 9999,
          boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
          borderRadius: '16px',
          padding: '16px',
          minWidth: '320px',
          maxWidth: '400px',
          display: 'flex',
          gap: '14px',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          overflow: 'hidden'
        }}
        onClick={onClick}
        role="alert"
      >
        <div style={{ 
          backgroundColor: '#148ABB', 
          color: 'white', 
          width: '40px', 
          height: '40px', 
          borderRadius: '12px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          flexShrink: 0,
          boxShadow: '0 4px 12px rgba(20, 138, 187, 0.3)'
        }}>
          <Bell size={20} />
        </div>

        <div style={{ flex: 1, paddingTop: '2px' }}>
          <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '15px', lineHeight: '1.2' }}>{title}</div>
          {description && (
            <div style={{ marginTop: '4px', color: '#475569', fontSize: '13px', lineHeight: '1.4' }}>
              {description}
            </div>
          )}
        </div>

        <button
          onClick={e => {
            e.stopPropagation();
            onClose();
          }}
          style={{
            background: '#f1f5f9',
            border: 'none',
            color: '#64748b',
            width: '28px',
            height: '28px',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
          aria-label="Close notification"
        >
          <X size={16} />
        </button>

        {/* Progress Bar */}
        <div style={{ 
          position: 'absolute', 
          bottom: 0, 
          left: 0, 
          height: '4px', 
          backgroundColor: '#148ABB', 
          width: `${progress}%`,
          opacity: 0.6,
          transition: 'width 0.05s linear'
        }} />
      </div>
    </>
  );
};

export default NotificationToast;
