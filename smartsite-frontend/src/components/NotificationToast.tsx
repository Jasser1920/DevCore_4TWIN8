import React, { useEffect } from 'react';

interface NotificationToastProps {
  message: string;
  onClick: () => void;
  onClose: () => void;
  duration?: number;
}

const NotificationToast: React.FC<NotificationToastProps> = ({ message, onClick, onClose, duration = 5000 }) => {

  useEffect(() => {
    // Only play sound if user has interacted with the page
    const playSound = () => {
      const audio = new Audio('/notification.mp3');
      audio.play().catch(() => {});
    };
    let played = false;
    const tryPlay = () => {
      if (!played) {
        playSound();
        played = true;
        window.removeEventListener('pointerdown', tryPlay);
        window.removeEventListener('keydown', tryPlay);
      }
    };
    window.addEventListener('pointerdown', tryPlay);
    window.addEventListener('keydown', tryPlay);
    // If already interacted, play immediately
    if (document.readyState === 'complete' && window.performance && performance.now() > 0) {
      setTimeout(tryPlay, 0);
    }
    // Auto-dismiss
    const timer = setTimeout(onClose, duration);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('pointerdown', tryPlay);
      window.removeEventListener('keydown', tryPlay);
    };
  }, [onClose, duration]);

  return (
    <div
      style={{
        position: 'fixed',
        top: 24,
        right: 24,
        zIndex: 9999,
        background: '#fff',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        borderRadius: 8,
        padding: '16px 24px',
        minWidth: 280,
        display: 'flex',
        alignItems: 'center',
        cursor: 'pointer',
        fontWeight: 500,
      }}
      onClick={onClick}
      role="alert"
      aria-live="assertive"
    >
      <span style={{ flex: 1 }}>{message}</span>
      <button
        onClick={e => {
          e.stopPropagation();
          onClose();
        }}
        style={{
          background: 'none',
          border: 'none',
          fontSize: 18,
          marginLeft: 16,
          cursor: 'pointer',
        }}
        aria-label="Close notification"
      >
        ×
      </button>
    </div>
  );
};

export default NotificationToast;
