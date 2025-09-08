// src/Spells/Blizzard/useBlizzardShield.ts
import { useState, useCallback, useRef } from 'react';
import { WeaponType, WeaponSubclass } from '@/Weapons/weapons';

interface UseBlizzardShieldProps {
  currentWeapon?: WeaponType;
  currentSubclass?: WeaponSubclass;
}

export function useBlizzardShield({ currentWeapon, currentSubclass }: UseBlizzardShieldProps = {}) {
  const [hasShield, setHasShield] = useState(false);
  const [shieldAbsorption, setShieldAbsorption] = useState(0);
  const shieldTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const activationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const activateShield = useCallback(() => {
    // Only activate for Assassin Sabres
    if (currentWeapon !== WeaponType.SABRES || currentSubclass !== WeaponSubclass.ASSASSIN) {
      return;
    }

    // Clear any existing timeouts
    if (activationTimeoutRef.current) {
      clearTimeout(activationTimeoutRef.current);
    }
    if (shieldTimeoutRef.current) {
      clearTimeout(shieldTimeoutRef.current);
    }

    // Set 2-second delay before shield activation
    activationTimeoutRef.current = setTimeout(() => {
      setHasShield(true);
      setShieldAbsorption(25);

      // Shield expires after 5 seconds
      shieldTimeoutRef.current = setTimeout(() => {
        setHasShield(false);
        setShieldAbsorption(0);
      }, 6000);
    }, 1500);
  }, [currentWeapon, currentSubclass]);

  const absorbDamage = useCallback((damage: number): number => {
    if (!hasShield || shieldAbsorption <= 0) {
      return damage; // No shield or shield depleted
    }

    if (damage <= shieldAbsorption) {
      // Shield absorbs all damage
      const newAbsorption = shieldAbsorption - damage;
      setShieldAbsorption(newAbsorption);
      
      if (newAbsorption <= 0) {
        // Shield is depleted
        setHasShield(false);
        setShieldAbsorption(0);
        if (shieldTimeoutRef.current) {
          clearTimeout(shieldTimeoutRef.current);
        }
      }

      return 0; // No damage passes through
    } else {
      // Shield absorbs partial damage, rest passes through
      const remainingDamage = damage - shieldAbsorption;
      
      setHasShield(false);
      setShieldAbsorption(0);
      if (shieldTimeoutRef.current) {
        clearTimeout(shieldTimeoutRef.current);
      }
      
      return remainingDamage;
    }
  }, [hasShield, shieldAbsorption]);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (activationTimeoutRef.current) {
      clearTimeout(activationTimeoutRef.current);
    }
    if (shieldTimeoutRef.current) {
      clearTimeout(shieldTimeoutRef.current);
    }
    setHasShield(false);
    setShieldAbsorption(0);
  }, []);

  return {
    hasShield,
    shieldAbsorption,
    activateShield,
    absorbDamage,
    cleanup
  };
}