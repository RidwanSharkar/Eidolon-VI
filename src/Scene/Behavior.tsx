import React, { useEffect, useState } from 'react';
import styles from './Behavior.module.css';

export interface GameOverMessage {
  title: string;
  subtitle: string;
}

export const GAME_OVER_MESSAGES: GameOverMessage[] = [
  { title: "The Darkness Claims Another", subtitle: "Your soul joins the eternal dance..." },
  { title: "Fallen to Shadow", subtitle: "The necropolis grows stronger..." },
  { title: "Death's Embrace", subtitle: "The bones welcome their kin..." },
  { title: "The Last Stand", subtitle: "Your light fades into the abyss..." },
  { title: "Eternal Rest", subtitle: "The skeleton army claims victory..." },
  { title: "Denied Ascension", subtitle: "The dragons turn their backs on another unworthy soul..." },
  { title: "Draconic Disappointment", subtitle: "Your flames were not strong enough to join their ranks..." },
  { title: "Failed Wyrm", subtitle: "The ancient dragons scoff at your weakness..." },
  { title: "Wingless One", subtitle: "You'll never know the freedom of dragon flight..." },
  { title: "Mortal Chains", subtitle: "Forever bound to walk while dragons soar above..." },
  { title: "Lost Heritage", subtitle: "The dragon blood within you grows cold..." },
  { title: "Fading Ember", subtitle: "Your draconic spark extinguishes in darkness..." },
  { title: "Rejected by Fire", subtitle: "The dragon's flame finds you unworthy..." }
];

interface BehaviorProps {
  playerHealth: number;
  onReset: () => void;
  killCount: number;
  onEnemiesDefeated: () => void;
  maxSkeletons?: number;
}

export default function Behavior({
  playerHealth,
  killCount,
}: BehaviorProps) {
  const [isGameOver, setIsGameOver] = useState(false);
  const [gameOverMessage, setGameOverMessage] = useState<GameOverMessage | null>(null);

  useEffect(() => {
    if (playerHealth <= 0 && !isGameOver) {
      const randomMessage = GAME_OVER_MESSAGES[Math.floor(Math.random() * GAME_OVER_MESSAGES.length)];
      setGameOverMessage(randomMessage);
      setIsGameOver(true);
      window.dispatchEvent(new CustomEvent('gameOver'));
    }
  }, [playerHealth, isGameOver]);

  const handleReset = () => {
    // Perform a full page refresh
    window.location.reload();
  };

  return (
    <>
      {isGameOver && gameOverMessage && (
        <div 
          className={styles.gameOverContainer}
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          <h1 className={styles.gameOverTitle}>{gameOverMessage.title}</h1>
          <p className={styles.gameOverSubtitle}>{gameOverMessage.subtitle}</p>
          <button 
            className={styles.retryButton}
            onClick={handleReset}
          >
            RETRY
          </button>
          <div className={styles.killCounter}>
            Skeletons Defeated: {killCount}
          </div>
        </div>
      )}
    </>
  );
} 