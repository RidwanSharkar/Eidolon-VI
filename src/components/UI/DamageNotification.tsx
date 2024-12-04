import React, { useEffect, useState } from 'react';
import styles from './DamageNotification.module.css';

interface DamageNotificationProps {
  damage: number;
  index: number;
  onComplete: () => void;
  timestamp: number;
}

export default function DamageNotification({ 
  damage, 
  index, 
  onComplete,
  timestamp 
}: DamageNotificationProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const displayTimer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onComplete, 300);
    }, 1000);

    const cleanupTimer = setTimeout(() => {
      onComplete();
    }, 2000);

    return () => {
      clearTimeout(displayTimer);
      clearTimeout(cleanupTimer);
    };
  }, [onComplete]);

  const age = Date.now() - timestamp;
  const opacity = Math.max(0, 1 - (age / 1000));

  return (
    <div 
      className={`${styles.notification} ${isVisible ? styles.visible : styles.hidden}`}
      style={{ 
        transform: `translateY(${-20 - (index * 25)}px)`,
        opacity
      }}
    >
      -{damage}
    </div>
  );
} 