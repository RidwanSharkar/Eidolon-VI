import React from 'react';
import styles from './LevelUpNotification.module.css';

interface LevelUpNotificationProps {
  level: number;
}

export default function LevelUpNotification({  }: LevelUpNotificationProps) {
  return (
    <div className={styles.levelUpContainer}>
      <div className={styles.levelUpContent}>
        <h2>Level Up!</h2>
        <p> Your essence grows stronger </p>
        <p>Hungrier Rivals take notice</p>
      </div>
    </div>
  );
} 