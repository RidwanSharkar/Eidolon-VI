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

    // Prevent browser commands
    const preventBrowserCommands = (e: KeyboardEvent) => {
      // Prevent save dialog (Ctrl/Cmd + S)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
      }
      
      // Prevent find dialog (Ctrl/Cmd + F)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'f') {
        e.preventDefault();
      }
      
      // Prevent print dialog (Ctrl/Cmd + P)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'p') {
        e.preventDefault();
      }
      
      // Prevent new window/tab (Ctrl/Cmd + N)
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'n') {
        e.preventDefault();
      } 
      
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
        e.preventDefault();
      }
    };

    // Prevent context menu
    const preventContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleBlur);
    window.addEventListener('focus', handleFocus);
    document.addEventListener('keydown', preventBrowserCommands);
    document.addEventListener('contextmenu', preventContextMenu);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleBlur);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('keydown', preventBrowserCommands);
      document.removeEventListener('contextmenu', preventContextMenu);
    };
  }, []);

  return (
    <GameStateContext.Provider value={{ isPaused }}>
      {children}
    </GameStateContext.Provider>
  );
}

export const useGameState = () => useContext(GameStateContext);
