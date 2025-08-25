import React from 'react';
import styles from './RuneCounter.module.css';

interface RuneCounterProps {
  criticalRuneCount: number;
  critDamageRuneCount: number;
  criticalChance: number;
  criticalDamageMultiplier: number;
}

export function RuneCounter({ 
  criticalRuneCount, 
  critDamageRuneCount, 
  criticalChance, 
  criticalDamageMultiplier 
}: RuneCounterProps) {
  return (
    <div className={styles.runeCounter}>
      <div className={styles.runeIcon}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path 
            d="M12 2L15.09 8.26L22 9L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9L8.91 8.26L12 2Z" 
            fill="currentColor"
          />
        </svg>
      </div>
      <div className={styles.runeInfo}>
        <div className={styles.runeCount}>
          Runes: {criticalRuneCount + critDamageRuneCount}
        </div>
        <div className={styles.critChance}>
          Crit Chance: {(criticalChance * 100).toFixed(1)}%
        </div>
        <div className={styles.critDamage}>
          Crit Damage: {(criticalDamageMultiplier * 100).toFixed(0)}%
        </div>
      </div>
    </div>
  );
}
