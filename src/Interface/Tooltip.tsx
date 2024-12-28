import React from 'react';
import styles from './Tooltip.module.css';

interface TooltipProps {
  content: {
    title: string;
    description: string;
  };
  visible: boolean;
  x: number;
  y: number;
}

export default function Tooltip({ content, visible, x, y }: TooltipProps) {
  if (!visible) return null;

  return (
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
    </div>
  );
} 