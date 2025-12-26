import React, { useState } from 'react';
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
  const [isMinimized, setIsMinimized] = useState(false);

  const toggleMinimized = () => {
    setIsMinimized(!isMinimized);
  };

  return (
    <div className={`${styles.runeCounter} ${isMinimized ? styles.minimized : ''}`} onClick={toggleMinimized}>
      {isMinimized && (
        <div className={styles.runeIcon}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 2L15.09 8.26L22 9L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9L8.91 8.26L12 2Z"
              fill="currentColor"
            />
          </svg>
        </div>
      )}
      <div className={styles.runeInfo}>
        {isMinimized ? (
          <div className={styles.minimizedContent}>
            Crit Runes: {criticalRuneCount + critDamageRuneCount}
          </div>
        ) : (
          <>
            <div className={styles.runeCount}>
              Runes: {criticalRuneCount + critDamageRuneCount}
            </div>
            <div className={styles.critChance}>
              Crit Chance: {(criticalChance * 100).toFixed(1)}%
            </div>
            <div className={styles.critDamage}>
              Crit Damage: {(criticalDamageMultiplier * 100).toFixed(0)}%
            </div>
            <div className={styles.controls}>
              <div className={styles.controlGroup}>
                <div className={styles.controlTitle}>CONTROLS</div>
                <div className={styles.controlKeys}>WASD - Move</div>
                <div className={styles.controlKeys}>Double-tap WASD - Vault</div>
                <div className={styles.controlKeys}>Left Click (Hold) - Auto Attack</div>
                <div className={styles.controlKeys}>Right-click (Hold) - Rotate Camera</div>
                <div className={styles.controlKeys}>Hold Shift - Lock Rotation</div>
              </div>
            </div>
          </>
        )}
      </div>
      <div className={styles.toggleIcon}>
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
          <path
            d={isMinimized ? "M19 9l-7 7-7-7" : "M5 15l7-7 7 7"}
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </div>
  );
}
