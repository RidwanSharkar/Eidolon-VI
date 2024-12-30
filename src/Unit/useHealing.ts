import { useCallback } from 'react';
import { Vector3 } from 'three';

interface UseHealingProps {
  currentHealth: number;
  maxHealth: number;
  onHealthChange: (health: number) => void;
  setDamageNumbers?: React.Dispatch<React.SetStateAction<Array<{
    id: number;
    damage: number;
    position: Vector3;
    isCritical: boolean;
    isHealing?: boolean;
  }>>>; 
  nextDamageNumberId?: React.MutableRefObject<number>;
  healAmount?: number;
}

export const useHealing = ({
  currentHealth,
  maxHealth,
  onHealthChange,
  setDamageNumbers,
  nextDamageNumberId,
  healAmount = 10
}: UseHealingProps) => {
  const processHealing = useCallback((amount: number = healAmount, position: Vector3) => {
    // Calculate how much healing can actually be applied
    const actualHealAmount = Math.min(
      amount,
      maxHealth - currentHealth
    );
    
    if (actualHealAmount > 0) {
      // Pass the delta amount
      onHealthChange(actualHealAmount);

      // Add healing number if we have the necessary props
      if (setDamageNumbers && nextDamageNumberId) {
        setDamageNumbers(prev => [...prev, {
          id: nextDamageNumberId.current++,
          damage: actualHealAmount,
          position: position,
          isCritical: false,
          isHealing: true
        }]);
      }
    }
  }, [currentHealth, maxHealth, onHealthChange, setDamageNumbers, nextDamageNumberId, healAmount]);

  return {
    processHealing
  };
};