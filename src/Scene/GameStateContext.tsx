import React, { createContext, useContext, useState, useEffect } from 'react';
import { Vector3 } from 'three';
import { setGlobalCriticalRuneCount, setGlobalCritDamageRuneCount } from '@/Weapons/damage';

interface CriticalRune {
  id: string;
  position: Vector3;
}

interface CritDamageRune {
  id: string;
  position: Vector3;
}

interface GameStateContextType {
  isPaused: boolean;
  criticalRuneCount: number;
  critDamageRuneCount: number;
  criticalChance: number;
  criticalDamageMultiplier: number;
  criticalRunes: CriticalRune[];
  critDamageRunes: CritDamageRune[];
  addCriticalRune: (position: Vector3) => void;
  addCritDamageRune: (position: Vector3) => void;
  pickupCriticalRune: (runeId: string) => void;
  pickupCritDamageRune: (runeId: string) => void;
  resetRunes: () => void;
}

const GameStateContext = createContext<GameStateContextType>({ 
  isPaused: false,
  criticalRuneCount: 0,
  critDamageRuneCount: 0,
  criticalChance: 0.11,
  criticalDamageMultiplier: 2.0,
  criticalRunes: [],
  critDamageRunes: [],
  addCriticalRune: () => {},
  addCritDamageRune: () => {},
  pickupCriticalRune: () => {},
  pickupCritDamageRune: () => {},
  resetRunes: () => {}
});

export function GameStateProvider({ children }: { children: React.ReactNode }) {
  const [isPaused, setIsPaused] = useState(false);
  const [criticalRuneCount, setCriticalRuneCount] = useState(0);
  const [critDamageRuneCount, setCritDamageRuneCount] = useState(0);
  const [criticalRunes, setCriticalRunes] = useState<CriticalRune[]>([]);
  const [critDamageRunes, setCritDamageRunes] = useState<CritDamageRune[]>([]);
  
  // Calculate critical chance based on rune count (11% base + 3% per rune)
  const criticalChance = 0.11 + (criticalRuneCount * 0.03);
  
  // Calculate critical damage multiplier based on rune count (2.0x base + 0.2x per rune)
  const criticalDamageMultiplier = 2.0 + (critDamageRuneCount * 0.15);
  
  const addCriticalRune = (position: Vector3) => {
    const newRune: CriticalRune = {
      id: `crit-rune-${Date.now()}-${Math.random()}`,
      position: position.clone()
    };
    setCriticalRunes(prev => {
      const updated = [...prev, newRune];
      return updated;
    });
  };
  
  const addCritDamageRune = (position: Vector3) => {
    const newRune: CritDamageRune = {
      id: `critdmg-rune-${Date.now()}-${Math.random()}`,
      position: position.clone()
    };
    setCritDamageRunes(prev => {
      const updated = [...prev, newRune];
      return updated;
    });
  };
  
  const pickupCriticalRune = (runeId: string) => {
    setCriticalRunes(prev => prev.filter(rune => rune.id !== runeId));
    setCriticalRuneCount(prev => {
      const newCount = prev + 1;
      const newCritChance = 0.11 + (newCount * 0.03);
      console.log(`📈 Critical Rune Count: ${newCount}, New Crit Chance: ${(newCritChance * 100).toFixed(1)}%`);
      return newCount;
    });
  };
  
  const pickupCritDamageRune = (runeId: string) => {
    setCritDamageRunes(prev => prev.filter(rune => rune.id !== runeId));
    setCritDamageRuneCount(prev => {
      const newCount = prev + 1;
      const newCritDamageMultiplier = 2.0 + (newCount * 0.2);
      console.log(`📈 CritDamage Rune Count: ${newCount}, New Crit Damage Multiplier: ${newCritDamageMultiplier.toFixed(1)}x`);
      return newCount;
    });
  };
  
  const resetRunes = () => {
    setCriticalRuneCount(0);
    setCritDamageRuneCount(0);
    setCriticalRunes([]);
    setCritDamageRunes([]);
  };
  
  // Update global rune counts whenever local counts change
  useEffect(() => {
    setGlobalCriticalRuneCount(criticalRuneCount);
  }, [criticalRuneCount]);
  
  useEffect(() => {
    setGlobalCritDamageRuneCount(critDamageRuneCount);
  }, [critDamageRuneCount]);

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
        <GameStateContext.Provider value={{
      isPaused,
      criticalRuneCount, 
      critDamageRuneCount,
      criticalChance,
      criticalDamageMultiplier,
      criticalRunes,
      critDamageRunes,
      addCriticalRune, 
      addCritDamageRune,
      pickupCriticalRune, 
      pickupCritDamageRune,
      resetRunes
    }}>
      {children}
    </GameStateContext.Provider>
  );
}

export const useGameState = () => useContext(GameStateContext);
