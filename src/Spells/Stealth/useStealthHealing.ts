import { useCallback } from 'react';
import { Vector3 } from 'three';
import { useHealing } from '@/Unit/useHealing';

interface UseStealthHealingProps {
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
}

export const useStealthHealing = ({
  currentHealth,
  maxHealth,
  onHealthChange,
  setDamageNumbers,
  nextDamageNumberId
}: UseStealthHealingProps) => {
  const STEALTH_KILL_HEAL_AMOUNT = 5;
  const BACKSTAB_KILL_HEAL_AMOUNT = 7;

  const { processHealing } = useHealing({
    currentHealth,
    maxHealth,
    onHealthChange,
    setDamageNumbers,
    nextDamageNumberId,
    healAmount: BACKSTAB_KILL_HEAL_AMOUNT // Use higher amount as default
  });

  const handleStealthKillHeal = useCallback((position: Vector3, isBackstab: boolean = false) => {
    const healAmount = isBackstab ? BACKSTAB_KILL_HEAL_AMOUNT : STEALTH_KILL_HEAL_AMOUNT;
    processHealing(healAmount, position.clone().add(new Vector3(0, 2, 0)));
  }, [processHealing]);

  return {
    handleStealthKillHeal
  };
}; 