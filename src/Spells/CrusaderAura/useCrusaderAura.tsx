import { useCallback, useState } from 'react';
import { Group, Vector3 } from 'three';
import { useHealing } from '@/unit/useHealing';

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
  const HEAL_AMOUNT = 3;
  const HEAL_CHANCE = 0.25;
  const [showHealingEffect, setShowHealingEffect] = useState(false);

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
      setShowHealingEffect(true);
    }
  }, [processHealing, parentRef, HEAL_CHANCE, HEAL_AMOUNT]);

  return {
    processHealingChance,
    showHealingEffect,
    setShowHealingEffect
  };
}; 