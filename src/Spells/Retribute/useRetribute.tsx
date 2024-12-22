import { useState, useRef, useCallback } from 'react';

interface UseRetributeProps {
  maxHealth: number;
  onHealthChange: (newHealth: number | ((current: number) => number)) => void;
  duration: number;
  onHeal: (amount: number, isHealing: boolean) => void;
  onComplete: () => void;
}

export const useRetribute = ({ maxHealth, onHealthChange, duration, onHeal, onComplete }: UseRetributeProps) => {
  const [isRetributing, setIsRetributing] = useState(false);
  const healingInterval = useRef<NodeJS.Timeout | null>(null);
  const totalHealingRef = useRef(0);
  const progressRef = useRef(0);

  const stopRetribute = useCallback(() => {
    if (healingInterval.current) {
      clearInterval(healingInterval.current);
      healingInterval.current = null;
    }
    setIsRetributing(false);
    onComplete();
  }, [onComplete]);

  const startRetribute = useCallback(() => {
    setIsRetributing(true);
    totalHealingRef.current = 0;
    progressRef.current = 0;

    if (healingInterval.current) {
      clearInterval(healingInterval.current);
    }

    healingInterval.current = setInterval(() => {
      if (totalHealingRef.current >= 500) {
        stopRetribute();
        return;
      }

      const healAmount = 5;
      onHealthChange((currentHealth: number) => {
        const newHealth = Math.min(currentHealth + healAmount, maxHealth);
        return newHealth;
      });
      
      totalHealingRef.current += healAmount;
      onHeal(healAmount, true);
    }, 5); 

    setTimeout(() => {
      stopRetribute();
    }, duration * 1000);
  }, [stopRetribute, maxHealth, onHealthChange, duration, onHeal]);

  return {
    isRetributing,
    startRetribute,
    stopRetribute
  };
};