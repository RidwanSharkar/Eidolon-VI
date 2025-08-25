// src/Spells/BowPowershot/useBowPowershot.ts
import { useState, useCallback, useRef } from 'react';
import { Vector3 } from 'three';
import { WeaponSubclass } from '@/Weapons/weapons';
import { SynchronizedEffect } from '@/Multiplayer/MultiplayerContext';

export interface BowPowershotEffect {
  id: number;
  position: Vector3;
  direction: Vector3;
  subclass: WeaponSubclass;
  isElementalShotsUnlocked: boolean;
  isPerfectShot: boolean;
  startTime: number;
}

interface UseBowPowershotProps {
  sendEffect?: (effect: Omit<SynchronizedEffect, 'id' | 'startTime'>) => void;
  isInRoom?: boolean;
  isPlayer?: boolean;
}

export const useBowPowershot = ({ sendEffect, isInRoom, isPlayer }: UseBowPowershotProps = {}) => {
  const [activeEffects, setActiveEffects] = useState<BowPowershotEffect[]>([]);
  const nextEffectId = useRef(1);

  const createPowershotEffect = useCallback((
    position: Vector3,
    direction: Vector3,
    subclass: WeaponSubclass,
    isElementalShotsUnlocked: boolean,
    isPerfectShot: boolean = false
  ) => {
    const effectId = nextEffectId.current++;
    
    const newEffect: BowPowershotEffect = {
      id: effectId,
      position: position.clone(),
      direction: direction.clone().normalize(),
      subclass,
      isElementalShotsUnlocked,
      isPerfectShot,
      startTime: Date.now()
    };

    setActiveEffects(prev => [...prev, newEffect]);
    
    // Send effect to other players in multiplayer
    if (isInRoom && isPlayer && sendEffect) {
      sendEffect({
        type: 'bowPowershot',
        position: position.clone(),
        direction: direction.clone().normalize(),
        duration: isPerfectShot ? 200 : 166, // Match BowPowershot component duration
        subclass: subclass,
        isElementalShot: isElementalShotsUnlocked,
        isPerfectShot: isPerfectShot
      });
    }
    
    return effectId;
  }, [sendEffect, isInRoom, isPlayer]);

  const removeEffect = useCallback((effectId: number) => {
    setActiveEffects(prev => prev.filter(effect => effect.id !== effectId));
  }, []);

  const clearAllEffects = useCallback(() => {
    setActiveEffects([]);
  }, []);

  return {
    activeEffects,
    createPowershotEffect,
    removeEffect,
    clearAllEffects
  };
};
