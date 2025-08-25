// src/unit/useDamageNumbers.tsx
import { Vector3 } from 'three';
import { useState, useRef } from 'react';

export interface DamageNumber {
  id: number;
  damage: number;
  position: Vector3;
  isCritical: boolean;
  isLightning?: boolean;
  isHealing?: boolean;
  isBlizzard?: boolean;
  isBoneclaw?: boolean;
  isSmite?: boolean;
  isSword?: boolean;
  isSabres?: boolean;
  isOathstrike?: boolean;
  isFirebeam?: boolean;
  isOrbShield?: boolean;
  isChainLightning?: boolean;
  isFireball?: boolean;
  isSummon?: boolean;
  isStealthStrike?: boolean;
  isCrossentropyBolt?: boolean;
  isPyroclast?: boolean;
  isEagleEye?: boolean;
  isBreach?: boolean;
  isBowLightning?: boolean;
  isBarrage?: boolean;
  isGlacialShard?: boolean;
  isAegis?: boolean;
  isDivineStorm?: boolean;
  isHolyBurn?: boolean;
  isGuidedBolt?: boolean;
  isColossusStrike?: boolean;
  isColossusLightning?: boolean;
  isFirestorm?: boolean;
  isElementalBowPowershot?: boolean;
  isElementalQuickShot?: boolean;
  isPoisonDoT?: boolean;
  isRaze?: boolean;
  isSoulReaper?: boolean;
  isLavaLash?: boolean;
  isDragonBreath?: boolean;
  isLegionEmpoweredScythe?: boolean;
}

export function useDamageNumbers() {
  const [damageNumbers, setDamageNumbers] = useState<DamageNumber[]>([]);
  const nextDamageNumberId = useRef(0);

  const handleDamageNumberComplete = (id: number) => {
    setDamageNumbers(prev => prev.filter(num => num.id !== id));
  };

  return {
    damageNumbers,
    setDamageNumbers,
    nextDamageNumberId,
    handleDamageNumberComplete
  };
}
