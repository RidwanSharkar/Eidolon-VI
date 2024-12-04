import { useEffect, useState, useCallback } from 'react';
import { Vector3 } from 'three';

// Internal helper function to generate random positions
const generateRandomPosition = () => {
  const radius = 20; // Spawn radius
  const angle = Math.random() * Math.PI * 2;
  const x = Math.cos(angle) * radius * Math.random();
  const z = Math.sin(angle) * radius * Math.random();
  return new Vector3(x, 0, z);
};

interface GameOverMessage {
  title: string;
  subtitle: string;
}

// SHIT TALKING
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

interface BehaviorProps {
  playerHealth: number;
  onReset: () => void;
  onSpawnSkeleton: (position: Vector3) => void;
  killCount: number;
}

export default function Behavior({ playerHealth, onReset, onSpawnSkeleton, killCount }: BehaviorProps) {
  const [isGameOver, setIsGameOver] = useState(false);
  const [gameOverMessage, setGameOverMessage] = useState<GameOverMessage | null>(null);
  const [skeletonCount, setSkeletonCount] = useState(0);

  // Handle spawning new skeletons
  useEffect(() => {
    const spawnInterval = setInterval(() => {
      if (!isGameOver && skeletonCount < 10) {
        const newPosition = generateRandomPosition();
        onSpawnSkeleton(newPosition);
        setSkeletonCount(prev => prev + 1);
      }
    }, 12000); // Spawn every 10 seconds

    return () => clearInterval(spawnInterval);
  }, [isGameOver, onSpawnSkeleton, skeletonCount]);

  // Handle player death
  useEffect(() => {
    if (playerHealth <= 0 && !isGameOver) {
      const randomMessage = GAME_OVER_MESSAGES[Math.floor(Math.random() * GAME_OVER_MESSAGES.length)];
      setGameOverMessage({
        title: randomMessage.title,
        subtitle: `${randomMessage.subtitle}\nSkeletons Slain: ${killCount}`
      });
      setIsGameOver(true);
    }
  }, [playerHealth, isGameOver, killCount]);

  const handleRetry = useCallback(() => {
    setIsGameOver(false);
    setGameOverMessage(null);
    setSkeletonCount(0);
    onReset();
  }, [onReset]);

  if (!isGameOver || !gameOverMessage) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      zIndex: 1000,
      color: '#fff',
      fontFamily: 'Arial, sans-serif'
    }}>
      <h1 style={{
        fontSize: '3rem',
        marginBottom: '1rem',
        color: '#ff3333',
        textShadow: '0 0 10px rgba(255, 51, 51, 0.5)'
      }}>
        {gameOverMessage.title}
      </h1>
      <p style={{
        fontSize: '1.5rem',
        marginBottom: '2rem',
        color: '#aaa',
        textAlign: 'center',
        whiteSpace: 'pre-line'
      }}>
        {gameOverMessage.subtitle}
      </p>
      <button
        onClick={handleRetry}
        style={{
          padding: '1rem 3rem',
          fontSize: '1.2rem',
          backgroundColor: '#ff3333',
          border: 'none',
          borderRadius: '5px',
          color: '#fff',
          cursor: 'pointer',
          transition: 'all 0.3s ease',
          boxShadow: '0 0 20px rgba(255, 51, 51, 0.3)'
        }}
        onMouseOver={e => {
          e.currentTarget.style.transform = 'scale(1.1)';
          e.currentTarget.style.boxShadow = '0 0 30px rgba(255, 51, 51, 0.5)';
        }}
        onMouseOut={e => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = '0 0 20px rgba(255, 51, 51, 0.3)';
        }}
      >
        RETRY
      </button>
      <div style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        color: '#fff',
        fontSize: '24px',
        fontFamily: 'Arial, sans-serif',
        zIndex: 1000,
        pointerEvents: 'none'
      }}>
        Kills: {killCount}
      </div>
    </div>
  );
} 