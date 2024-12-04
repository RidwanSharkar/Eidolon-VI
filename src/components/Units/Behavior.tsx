import { useEffect, useState, useCallback } from 'react';
import { Vector3 } from 'three';

// Internal helper function to generate random positions
const generateRandomPosition = () => {
  const radius = 15; // Spawn radius
  const angle = Math.random() * Math.PI * 2;
  const x = Math.cos(angle) * radius * Math.random();
  const z = Math.sin(angle) * radius * Math.random();
  return new Vector3(x, 0, z);
};

interface GameOverMessage {
  title: string;
  subtitle: string;
}

const GAME_OVER_MESSAGES: GameOverMessage[] = [
  { title: "The Darkness Claims Another", subtitle: "Your soul joins the eternal dance..." },
  { title: "Fallen to Shadow", subtitle: "The necropolis grows stronger..." },
  { title: "Death's Embrace", subtitle: "The bones welcome their kin..." },
  { title: "The Last Stand", subtitle: "Your light fades into the abyss..." },
  { title: "Eternal Rest", subtitle: "The skeleton army claims victory..." }
];

interface BehaviorProps {
  playerHealth: number;
  onReset: () => void;
  onSpawnSkeleton: (position: Vector3) => void;
}

export default function Behavior({ playerHealth, onReset, onSpawnSkeleton }: BehaviorProps) {
  const [isGameOver, setIsGameOver] = useState(false);
  const [gameOverMessage, setGameOverMessage] = useState<GameOverMessage | null>(null);

  // Handle spawning new skeletons
  useEffect(() => {
    const spawnInterval = setInterval(() => {
      if (!isGameOver) {
        const newPosition = generateRandomPosition();
        onSpawnSkeleton(newPosition);
      }
    }, 10000); // Spawn every 10 seconds

    return () => clearInterval(spawnInterval);
  }, [isGameOver, onSpawnSkeleton]);

  // Handle player death
  useEffect(() => {
    if (playerHealth <= 0 && !isGameOver) {
      const randomMessage = GAME_OVER_MESSAGES[Math.floor(Math.random() * GAME_OVER_MESSAGES.length)];
      setGameOverMessage(randomMessage);
      setIsGameOver(true);
    }
  }, [isGameOver,playerHealth]);

  const handleRetry = useCallback(() => {
    setIsGameOver(false);
    setGameOverMessage(null);
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
        color: '#aaa'
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
    </div>
  );
} 