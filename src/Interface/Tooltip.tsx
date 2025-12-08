import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import styles from './Tooltip.module.css';

interface TooltipProps {
  content: {
    title: string;
    description: string;
    cooldown?: string;
    unlockLevel?: number;
    isLocked?: boolean;
  };
  visible: boolean;
  x: number;
  y: number;
}

export default function Tooltip({ content, visible, x, y }: TooltipProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!visible || !mounted) return null;

  const tooltipContent = (
    <div 
      className={styles.tooltip} 
      style={{ 
        left: `${x}px`, 
        top: `${y}px` 
      }}
    >
      <h3>{content.title}</h3>
      {content.description.split('\n').map((line, i) => (
        <p key={i}>{line}</p>
      ))}
      {content.cooldown && content.cooldown !== 'Always Active' && (
        <p className={styles.cooldown}>Cooldown: {content.cooldown}</p>
      )}
      {content.cooldown === 'Always Active' && (
        <p className={styles.passive}>Passive</p>
      )}
      {content.isLocked && content.unlockLevel && (
        <p className={styles.locked}>Unlocks at Level {content.unlockLevel}</p>
      )}
    </div>
  );

  // Use portal to render tooltip at document body level
  return createPortal(tooltipContent, document.body);
} 