import React, { useEffect, useState } from 'react';
import styles from './Behavior.module.css';

interface GameOverMessage {
  title: string;
  subtitle: string;
}

interface GameOverContentProps {
  onReset: () => void;
  killCount: number;
}

const GAME_OVER_MESSAGES: GameOverMessage[] = [
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

function GameOverContent({ onReset, killCount }: GameOverContentProps) {
  // Randomly select a message
  const message = GAME_OVER_MESSAGES[Math.floor(Math.random() * GAME_OVER_MESSAGES.length)];

  return (
    <>
      <h1 className={styles.gameOverTitle}>{message.title}</h1>
      <p className={styles.gameOverSubtitle}>{message.subtitle}</p>
      <button className={styles.retryButton} onClick={onReset}>
        RETRY
      </button>
      <div className={styles.killCounter}>
        Skeletons Defeated: {killCount}
      </div>
    </>
  );
}

interface BehaviorProps {
  playerHealth: number;
  onReset: () => void;
  killCount: number;
  onEnemiesDefeated: () => void;
  maxSkeletons?: number;
}

export default function Behavior({
  playerHealth,
  onReset,
  killCount,
  onEnemiesDefeated,
  maxSkeletons = 15
}: BehaviorProps) {
  const [isGameOver, setIsGameOver] = useState(false);

  // Handle player death
  useEffect(() => {
    if (playerHealth <= 0 && !isGameOver) {
      setIsGameOver(true);
    }
  }, [playerHealth, isGameOver]);

  // Notify when all skeletons are defeated
  useEffect(() => {
    if (!isGameOver && killCount >= maxSkeletons) {
      console.log("Level complete! Kill count:", killCount, "MAX_SKELETONS:", maxSkeletons);
      onEnemiesDefeated();
    }
  }, [isGameOver, killCount, maxSkeletons, onEnemiesDefeated]);

  return (
    <>
      {playerHealth <= 0 && (
        <div className={styles.gameOverContainer}>
          <GameOverContent onReset={onReset} killCount={killCount} />
        </div>
      )}
    </>
  );
} 