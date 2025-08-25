// src/Unit/useDivineShield.ts

import { useState, useRef, useCallback, useEffect } from 'react';
import { WeaponType, WeaponSubclass } from '@/Weapons/weapons';

interface DivineShieldState {
  isActive: boolean;
  currentShield: number;
  maxShield: number;
  rechargeProgress: number;
  isRecharging: boolean;
}

interface UseDivineShieldReturn {
  shieldState: DivineShieldState;
  takeDamage: (damage: number) => number; // Returns actual damage taken after shield
  forceRecharge: () => void;
  resetShield: () => void;
  restoreFromAegis: () => void; // New function for Aegis shield restoration
}

export const useDivineShield = (
  currentWeapon: WeaponType,
  currentSubclass?: WeaponSubclass
): UseDivineShieldReturn => {
  const SHIELD_AMOUNT = 50;
  const RECHARGE_TIME = 10000; // 10 seconds in milliseconds
  
  const [shieldState, setShieldState] = useState<DivineShieldState>({
    isActive: false,
    currentShield: 0,
    maxShield: SHIELD_AMOUNT,
    rechargeProgress: 0,
    isRecharging: false
  });

  const rechargeStartTime = useRef<number | null>(null);
  const rechargeInterval = useRef<NodeJS.Timeout | null>(null);

  // Check if Divine Shield should be active (inherent to Divinity subclass)
  const shouldHaveShield = currentWeapon === WeaponType.SWORD && 
                          currentSubclass === WeaponSubclass.DIVINITY;

  // Initialize shield when conditions are met
  useEffect(() => {
    if (shouldHaveShield && !shieldState.isActive && !shieldState.isRecharging) {
      setShieldState(prev => ({
        ...prev,
        isActive: true,
        currentShield: SHIELD_AMOUNT,
        rechargeProgress: 0
      }));
    } else if (!shouldHaveShield && (shieldState.isActive || shieldState.isRecharging)) {
      // Clear shield if conditions no longer met
      setShieldState({
        isActive: false,
        currentShield: 0,
        maxShield: SHIELD_AMOUNT,
        rechargeProgress: 0,
        isRecharging: false
      });
      if (rechargeInterval.current) {
        clearInterval(rechargeInterval.current);
        rechargeInterval.current = null;
      }
    }
  }, [shouldHaveShield, shieldState.isActive, shieldState.isRecharging]);

  const startRecharge = useCallback(() => {
    if (!shouldHaveShield) return;

    setShieldState(prev => ({
      ...prev,
      isActive: false,
      isRecharging: true,
      rechargeProgress: 0
    }));

    rechargeStartTime.current = Date.now();

    rechargeInterval.current = setInterval(() => {
      const now = Date.now();
      const elapsed = now - (rechargeStartTime.current || now);
      const progress = Math.min(elapsed / RECHARGE_TIME, 1);

      setShieldState(prev => ({
        ...prev,
        rechargeProgress: progress
      }));

      if (progress >= 1) {
        // Shield fully recharged
        setShieldState(prev => ({
          ...prev,
          isActive: true,
          currentShield: SHIELD_AMOUNT,
          isRecharging: false,
          rechargeProgress: 0
        }));

        if (rechargeInterval.current) {
          clearInterval(rechargeInterval.current);
          rechargeInterval.current = null;
        }
      }
    }, 100); // Update every 100ms for smooth progress
  }, [shouldHaveShield, RECHARGE_TIME, SHIELD_AMOUNT]);

  const takeDamage = useCallback((damage: number): number => {
    if (!shouldHaveShield || !shieldState.isActive || shieldState.currentShield <= 0) {
      return damage; // No shield protection
    }

    const shieldDamage = Math.min(damage, shieldState.currentShield);
    const remainingDamage = damage - shieldDamage;
    const newShieldAmount = shieldState.currentShield - shieldDamage;

    setShieldState(prev => {
      if (newShieldAmount <= 0) {
        // Shield broken, start recharge
        setTimeout(startRecharge, 50); // Small delay to ensure state updates
        return {
          ...prev,
          isActive: false,
          currentShield: 0,
          isRecharging: false // Will be set to true by startRecharge
        };
      }

      return {
        ...prev,
        currentShield: newShieldAmount
      };
    });

    return remainingDamage;
  }, [shouldHaveShield, shieldState.isActive, shieldState.currentShield, startRecharge]);

  const forceRecharge = useCallback(() => {
    if (shouldHaveShield && !shieldState.isActive && !shieldState.isRecharging) {
      startRecharge();
    }
  }, [shouldHaveShield, shieldState.isActive, shieldState.isRecharging, startRecharge]);

  const resetShield = useCallback(() => {
    if (rechargeInterval.current) {
      clearInterval(rechargeInterval.current);
      rechargeInterval.current = null;
    }

    if (shouldHaveShield) {
      setShieldState({
        isActive: true,
        currentShield: SHIELD_AMOUNT,
        maxShield: SHIELD_AMOUNT,
        rechargeProgress: 0,
        isRecharging: false
      });
    } else {
      setShieldState({
        isActive: false,
        currentShield: 0,
        maxShield: SHIELD_AMOUNT,
        rechargeProgress: 0,
        isRecharging: false
      });
    }
  }, [shouldHaveShield, SHIELD_AMOUNT]);

  const restoreFromAegis = useCallback(() => {
    if (!shouldHaveShield) return;

    // Clear any ongoing recharge
    if (rechargeInterval.current) {
      clearInterval(rechargeInterval.current);
      rechargeInterval.current = null;
    }

    setShieldState(prev => {
      // If shield was broken (not active and recharging), restore to 20
      if (!prev.isActive && prev.isRecharging) {
        return {
          ...prev,
          isActive: true,
          currentShield: 20,
          isRecharging: false,
          rechargeProgress: 0
        };
      }
      // If shield is active, add 20 to current amount (capped at max)
      else if (prev.isActive) {
        return {
          ...prev,
          currentShield: Math.min(SHIELD_AMOUNT, prev.currentShield + 20)
        };
      }
      // If shield should be active but isn't (edge case), restore to 20
      else {
        return {
          ...prev,
          isActive: true,
          currentShield: 20,
          isRecharging: false,
          rechargeProgress: 0
        };
      }
    });
  }, [shouldHaveShield, SHIELD_AMOUNT]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (rechargeInterval.current) {
        clearInterval(rechargeInterval.current);
      }
    };
  }, []);

  return {
    shieldState,
    takeDamage,
    forceRecharge,
    resetShield,
    restoreFromAegis
  };
};