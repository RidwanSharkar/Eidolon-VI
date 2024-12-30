import { useCallback } from 'react';
import { Group, Vector3 } from 'three';
import { useHealing } from '@/Unit/useHealing';

interface CrusaderAuraProps {
  parentRef: React.RefObject<Group>;
  onHealthChange: (health: number) => void;
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

export const useCrusaderAura = ({ 
  onHealthChange,
  parentRef,
  setDamageNumbers,
  nextDamageNumberId,
  currentHealth,
  maxHealth
}: CrusaderAuraProps) => {
  const HEAL_AMOUNT = 12;
  const HEAL_CHANCE = 0.15;

  const { processHealing } = useHealing({
    currentHealth,
    maxHealth,
    onHealthChange,
    setDamageNumbers,
    nextDamageNumberId,
    healAmount: HEAL_AMOUNT
  });

  const processHealingChance = useCallback(() => {
    if (!parentRef.current) return;
    
    if (Math.random() < HEAL_CHANCE) {
      processHealing(HEAL_AMOUNT, parentRef.current.position.clone().add(new Vector3(0, 2, 0)));
    }
  }, [processHealing, parentRef, HEAL_CHANCE, HEAL_AMOUNT]);

  return {
    processHealingChance,
  };
}; 