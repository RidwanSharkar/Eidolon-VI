import React, { createContext, useContext, useState, useEffect } from 'react';

interface GameStateContextType {
  isPaused: boolean;
}

const GameStateContext = createContext<GameStateContextType>({ isPaused: false });

export function GameStateProvider({ children }: { children: React.ReactNode }) {
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsPaused(document.hidden);
    };

    const handleBlur = () => {
      setIsPaused(true);
    };

    const handleFocus = () => {
      setIsPaused(false);
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
    };
  }, []);

  return (
    <GameStateContext.Provider value={{ isPaused }}>
      {children}
    </GameStateContext.Provider>
  );
}

export const useGameState = () => useContext(GameStateContext);
