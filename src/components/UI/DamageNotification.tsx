import React, { useEffect, useState } from 'react';
import styles from './DamageNotification.module.css';

interface DamageNotificationProps {
  damage: number;
  index: number;
  onComplete: () => void;
}

export default function DamageNotification({ damage, index, onComplete }: DamageNotificationProps) {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onComplete, 300); // Allow time for fade out animation
    }, 1000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div 
      className={`${styles.notification} ${isVisible ? styles.visible : styles.hidden}`}
      style={{ 
        transform: `translateY(${-20 - (index * 25)}px)`
      }}
    >
      -{damage}
    </div>
  );
} 