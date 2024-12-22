import { useEffect, useRef } from 'react';
import { Vector3, Group } from 'three';
import { WeaponType, WeaponInfo } from '../Weapons/weapons';
import { ReanimateRef } from '@/Spells/Passive/Reanimate';

export const HEALTH_BOOST = 100; // Define the health boost constant

interface UseAbilityKeysProps {
  keys: React.MutableRefObject<Record<string, boolean>>;
  groupRef: React.RefObject<Group>;
  currentWeapon: WeaponType;
  abilities: WeaponInfo;
  isSwinging: boolean;
  isSmiting: boolean;
  isBowCharging: boolean;
  bowChargeProgress: number;
  nextSmiteId: React.MutableRefObject<number>;
  setIsSwinging: (value: boolean) => void;
  setIsSmiting: (value: boolean) => void;
  setIsBowCharging: (value: boolean) => void;
  setBowChargeStartTime: (value: number | null) => void;
  setSmiteEffects: (callback: (prev: Array<{ id: number; position: Vector3 }>) => Array<{ id: number; position: Vector3 }>) => void;
  setActiveEffects: (callback: (prev: Array<{ id: number; type: string; position: Vector3; direction: Vector3 }>) => Array<{ id: number; type: string; position: Vector3; direction: Vector3 }>) => void;
  onAbilityUse: (weapon: WeaponType, abilityKey: 'q' | 'e' | 'r') => void;
  startRetribute: () => void;
  shootFireball: () => void;
  releaseBowShot: (progress: number) => void;
  startFirebeam?: () => NodeJS.Timeout | undefined;
  stopFirebeam?: (damageInterval?: NodeJS.Timeout) => void;
  castReanimate: () => void;
  reanimateRef: React.RefObject<ReanimateRef>;
  health: number;
  maxHealth: number;
  onHealthChange?: (health: number) => void;
}

export function useAbilityKeys({
  keys,
  groupRef,
  currentWeapon,
  abilities,
  isSwinging,
  isSmiting,
  isBowCharging,
  bowChargeProgress,
  nextSmiteId,
  setIsSwinging,
  setIsSmiting,
  setIsBowCharging,
  setBowChargeStartTime,
  setSmiteEffects,
  setActiveEffects,
  onAbilityUse,
  startRetribute,
  shootFireball,
  releaseBowShot,
  startFirebeam,
  stopFirebeam,
  castReanimate,
  health,
  maxHealth,
  onHealthChange
}: UseAbilityKeysProps) {
  // Track firebeam interval
  const firebeamIntervalRef = useRef<NodeJS.Timeout | null | undefined>(null);
  const isDivineShieldActiveRef = useRef(false);
  // Add a ref to track the last Q usage time
  const lastQUsageTime = useRef(0);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();

      // Prevent repeated keydown events while holding
      if (key in keys.current && keys.current[key]) return;

      if (key in keys.current) {
        keys.current[key] = true;
      }

      // Handle Divine Shield toggle (2 key)
      if (key === '2' && currentWeapon === WeaponType.SWORD && abilities[WeaponType.SWORD].passive.isUnlocked) {
        isDivineShieldActiveRef.current = !isDivineShieldActiveRef.current;
        if (isDivineShieldActiveRef.current) {
          onHealthChange?.(health + HEALTH_BOOST);
        } else {
          if (health > maxHealth) {
            onHealthChange?.(maxHealth);
          }
        }
      }

      if (key === 'q') {
        const qAbility = abilities[currentWeapon].q;
        if (qAbility.currentCooldown <= 0 && !isSwinging) {
          lastQUsageTime.current = Date.now(); // Track when Q was used
          setIsSwinging(true);
          onAbilityUse(currentWeapon, 'q');
        }
      }

      if (key === 'e') {
        const eAbility = abilities[currentWeapon].e;
        if (eAbility.currentCooldown <= 0) {
          if (currentWeapon === WeaponType.SWORD && !isSmiting) {
            // Check time since last Q usage for Sword
            const timeSinceLastQ = Date.now() - lastQUsageTime.current;
            if (timeSinceLastQ < 1000) { // SMITE BUG TEMP FIX 
              console.log('Cannot use Smite so soon after a normal attack');
              return;
            }

            setIsSmiting(true);
            setIsSwinging(true);
            const targetPos = groupRef.current!.position.clone();
            targetPos.add(new Vector3(0, 0, 3.5).applyQuaternion(groupRef.current!.quaternion));
            setSmiteEffects(prev => [...prev, { 
              id: nextSmiteId.current++, 
              position: targetPos 
            }]);
            onAbilityUse(currentWeapon, 'e');
          } else if ((currentWeapon === WeaponType.SABRES2 || currentWeapon === WeaponType.STAFF) && startFirebeam && stopFirebeam) {
            // Start firebeam and store the interval
            firebeamIntervalRef.current = startFirebeam() as NodeJS.Timeout | null;
            onAbilityUse(currentWeapon, 'e');
          } else if (currentWeapon === WeaponType.SABRES && !isBowCharging) {
            setIsBowCharging(true);
            setBowChargeStartTime(Date.now());
          } else if (currentWeapon === WeaponType.SCYTHE) {
            shootFireball();
            onAbilityUse(currentWeapon, 'e');
          }
        }
      }

      if (key === '1' && abilities[currentWeapon].passive.isUnlocked) {
        castReanimate();
      }

      // Add R ability handling
      if (key === 'r') {
        const rAbility = abilities[currentWeapon].r;
        if (rAbility.isUnlocked && rAbility.currentCooldown <= 0) {
          onAbilityUse(currentWeapon, 'r');
          
          // Handle each weapon's unique R ability
          switch (currentWeapon) {
            case WeaponType.SCYTHE:
              // Add boneclaw effect
              const direction = new Vector3(0, 0, 1).applyQuaternion(groupRef.current!.quaternion);
              setActiveEffects(prev => [...prev, {
                id: Math.random(),
                type: 'boneclaw',
                position: groupRef.current!.position.clone(),
                direction: direction
              }]);
              break;

            case WeaponType.SWORD:
              startRetribute();
              break;

            case WeaponType.SABRES:
            case WeaponType.SABRES2:
              // Add blizzard effect
              setActiveEffects(prev => [...prev, {
                id: Math.random(),
                type: 'blizzard',
                position: groupRef.current!.position.clone(),
                direction: new Vector3(0, 0, 0) // Blizzard doesn't need direction
              }]);
              break;
          }
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();

      if (key in keys.current) {
        keys.current[key as keyof typeof keys.current] = false;
      }

      if (key === 'e' && isBowCharging) {
        releaseBowShot(bowChargeProgress);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [
    keys,
    groupRef,
    currentWeapon,
    abilities,
    isSwinging,
    isSmiting,
    isBowCharging,
    bowChargeProgress,
    setIsSwinging,
    setIsSmiting,
    setIsBowCharging,
    setSmiteEffects,
    setActiveEffects,
    onAbilityUse,
    startRetribute,
    shootFireball,
    releaseBowShot,
    nextSmiteId,
    setBowChargeStartTime,
    startFirebeam,
    stopFirebeam,
    castReanimate,
    health,
    maxHealth,
    onHealthChange
  ]);

  return {
    isDivineShieldActive: isDivineShieldActiveRef.current
  };
}