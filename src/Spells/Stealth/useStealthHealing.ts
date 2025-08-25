import { useCallback, useState } from 'react';
import { Vector3 } from 'three';
import { useHealing } from '@/Unit/useHealing';
import { WeaponSubclass } from '@/Weapons/weapons';

interface UseStealthHealingProps {
  currentHealth: number;
  maxHealth: number;
  onHealthChange: (health: number) => void;
  currentSubclass?: WeaponSubclass;
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
  currentSubclass,
  setDamageNumbers,
  nextDamageNumberId
}: UseStealthHealingProps) => {
  const STEALTH_KILL_HEAL_AMOUNT = 5;
  const BACKSTAB_KILL_HEAL_AMOUNT = 7;
  const DAMAGE_PER_KILL = 11;

  // Track stealth kill count for Assassin subclass
  const [stealthKillCount, setStealthKillCount] = useState(0);

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
    
    // Increment kill counter for Assassin subclass
    if (currentSubclass === WeaponSubclass.ASSASSIN) {
      setStealthKillCount(prev => prev + 1);
    }
  }, [processHealing, currentSubclass]);

  // Calculate bonus damage for Assassin subclass
  const getStealthBonusDamage = useCallback(() => {
    if (currentSubclass === WeaponSubclass.ASSASSIN) {
      return stealthKillCount * DAMAGE_PER_KILL;
    }
    return 0;
  }, [currentSubclass, stealthKillCount]);

  // Reset stealth kill count
  const resetStealthKillCount = useCallback(() => {
    setStealthKillCount(0);
  }, []);

  return {
    handleStealthKillHeal,
    getStealthBonusDamage,
    resetStealthKillCount,
    stealthKillCount
  };
}; 