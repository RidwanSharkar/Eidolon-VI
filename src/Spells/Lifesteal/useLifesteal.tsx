import { useCallback } from 'react';
import { Group, Vector3 } from 'three';
import { useHealing } from '@/Unit/useHealing';

interface LifestealProps {
  parentRef: React.RefObject<Group>;
  onHealthChange?: (health: number) => void;
  currentHealth: number;
  maxHealth: number;
  setDamageNumbers: React.Dispatch<React.SetStateAction<Array<{
    id: number;
    damage: number;
    position: Vector3;
    isCritical: boolean;
    isHealing?: boolean;
  }>>>;
  nextDamageNumberId: React.MutableRefObject<number>;
}

export const useLifesteal = ({ 
  onHealthChange,
  parentRef,
  setDamageNumbers,
  nextDamageNumberId,
  currentHealth,
  maxHealth
}: LifestealProps) => {
  const LIFESTEAL_PERCENTAGE = 0.05; // 5% lifesteal

  const { processHealing } = useHealing({
    currentHealth,
    maxHealth,
    onHealthChange: onHealthChange || (() => {}), // Provide default empty function
    setDamageNumbers,
    nextDamageNumberId,
    healAmount: 0 // Will be calculated dynamically
  });

  const processLifesteal = useCallback((damageDealt: number) => {
    if (!parentRef.current) return;
    
    // Calculate lifesteal amount (5% of damage dealt)
    const lifestealAmount = Math.floor(damageDealt * LIFESTEAL_PERCENTAGE);
    
    if (lifestealAmount > 0) {
      processHealing(lifestealAmount, parentRef.current.position.clone().add(new Vector3(0, 2, 0)));
    }
  }, [processHealing, parentRef, LIFESTEAL_PERCENTAGE]);

  return {
    processLifesteal
  };
}; 