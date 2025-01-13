// src/unit/useAbilityKeys.ts
import { useEffect, useRef, useCallback } from 'react';
import { Vector3, Group } from 'three';
import { WeaponType, WeaponInfo, AbilityType } from '../Weapons/weapons';
import { ReanimateRef } from '../Spells/Reanimate/Reanimate';
import { OrbShieldRef } from '../Spells/OrbShield/OrbShield';

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
  onAbilityUse: (weapon: WeaponType, abilityType: AbilityType) => void;
  shootFireball: () => void;
  releaseBowShot: (progress: number) => void;
  startFirebeam?: () => NodeJS.Timeout | undefined;
  stopFirebeam?: (damageInterval?: NodeJS.Timeout) => void;
  castReanimate: () => void;
  reanimateRef: React.RefObject<ReanimateRef>;
  health: number;
  maxHealth: number;
  onHealthChange?: (health: number) => void;
  activateOathstrike: () => { position: Vector3; direction: Vector3; onComplete: () => void } | null;
  setIsOathstriking: (value: boolean) => void;
  orbShieldRef: React.RefObject<OrbShieldRef>;
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
  shootFireball,
  releaseBowShot,
  startFirebeam,
  stopFirebeam,
  castReanimate,
  health,
  maxHealth,
  onHealthChange,
  activateOathstrike,
  setIsOathstriking,
  orbShieldRef,
}: UseAbilityKeysProps) {
  // Add a ref to track the last Q usage time
  const lastQUsageTime = useRef(0);

  // Add ref to track if game is over
  const isGameOver = useRef(false);

  // Add at the top of useAbilityKeys
  const lastAttackTime = useRef(0);
  const ATTACK_DEBOUNCE = 250; // ms

  // Shared attack logic function
  const tryAttack = useCallback(() => {
    const now = Date.now();
    if (now - lastAttackTime.current < ATTACK_DEBOUNCE) return;
    
    const qAbility = abilities[currentWeapon].q;
    if (qAbility.currentCooldown <= 0 && !isSwinging) {
      lastAttackTime.current = now;
      lastQUsageTime.current = now;
      setIsSwinging(true);
      onAbilityUse(currentWeapon, 'q');
    }
  }, [abilities, currentWeapon, isSwinging, onAbilityUse, setIsSwinging]);

  // Update isGameOver when health reaches 0
  useEffect(() => {
    if (health <= 0) {
      isGameOver.current = true;
    } else {
      isGameOver.current = false;
    }
  }, [health]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isGameOver.current) return; // Early return if game is over
      
      const key = e.key.toLowerCase();

      // Prevent repeated keydown events while holding
      if (key in keys.current && keys.current[key]) return;

      if (key in keys.current) {
        keys.current[key] = true;
      }


      if (key === 'q') {
        tryAttack();
      }

      if (key === 'e') {
        const eAbility = abilities[currentWeapon].e;
        if (eAbility.currentCooldown <= 0) {
          if (currentWeapon === WeaponType.SWORD && !isSmiting) {
            // Check time since last Q usage for Sword
            const timeSinceLastQ = Date.now() - lastQUsageTime.current;
            if (timeSinceLastQ < 625) { // SMITE BUG TEMP FIX 
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

            startFirebeam();
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

      if (key === '1') {
        const passiveAbility = abilities[currentWeapon].passive;
        if (passiveAbility.isUnlocked) {
          if (currentWeapon === WeaponType.SCYTHE) {
            castReanimate();
          } else if (currentWeapon === WeaponType.SABRES && startFirebeam && stopFirebeam) {
            // Start firebeam and store the interval
            startFirebeam();
            onAbilityUse(currentWeapon, 'passive');
          }
        }
      }

      if (key === '2') {
        const activeAbility = abilities[currentWeapon].active;
        if (
          activeAbility.isUnlocked && 
          activeAbility.currentCooldown <= 0
        ) {
          if (currentWeapon === WeaponType.SABRES) {
            onAbilityUse(currentWeapon, 'active');
          } else if (currentWeapon === WeaponType.SCYTHE) {
            setActiveEffects(prev => [...prev, {
              id: Math.random(),
              type: 'summon',
              position: groupRef.current!.position.clone(),
              direction: new Vector3(0, 0, 1).applyQuaternion(groupRef.current!.quaternion),
              onComplete: () => {
                console.log('Summon completed');
              },
              onStartCooldown: () => {
                console.log('Starting cooldown');
                onAbilityUse(currentWeapon, 'active');
              }
            }]);
            onAbilityUse(currentWeapon, 'active');
          }
        }
      }

      // Add R ability handling
      if (key === 'r') {
        const rAbility = abilities[currentWeapon].r;
        if (rAbility.isUnlocked && rAbility.currentCooldown <= 0) {
          switch (currentWeapon) {
            case WeaponType.SWORD:
              const result = activateOathstrike();
              if (result) {
                setIsOathstriking(true);
                setActiveEffects(prev => [...prev, {
                  id: Math.random(),
                  type: 'oathstrike',
                  position: result.position,
                  direction: result.direction
                }]);
                onAbilityUse(currentWeapon, 'r');
              }
              break;
            case WeaponType.SABRES:
            case WeaponType.SABRES2:
              // Add blizzard effect
              setActiveEffects(prev => [...prev, {
                id: Math.random(),
                type: 'blizzard',
                position: groupRef.current!.position.clone(),
                direction: new Vector3(0, 0, 0) // unit origin
              }]);
              onAbilityUse(currentWeapon, 'r');
              break;
            case WeaponType.SCYTHE:
              // Add boneclaw effect
              setActiveEffects(prev => [...prev, {
                id: Math.random(),
                type: 'boneclaw',
                position: groupRef.current!.position.clone(),
                direction: new Vector3(0, 0, 1).applyQuaternion(groupRef.current!.quaternion)
              }]);
              onAbilityUse(currentWeapon, 'r');
              break;
          }
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (isGameOver.current) return; // Early return if game is over
      
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
    tryAttack,
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
    shootFireball,
    releaseBowShot,
    nextSmiteId,
    setBowChargeStartTime,
    startFirebeam,
    stopFirebeam,
    castReanimate,
    health,
    maxHealth,
    onHealthChange,
    setIsOathstriking,
    activateOathstrike,
    orbShieldRef
  ]);

  // Modify the mouse event handlers to check game over state
  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (isGameOver.current) return; // Ignore mouse events if game is over
      if (e.button === 0) {
        keys.current['mouse0'] = true;
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (isGameOver.current) return; // Ignore mouse events if game is over
      if (e.button === 0) {
        keys.current['mouse0'] = false;
      }
    };

    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [keys]);

  // Modify the attack interval to properly respect game over state
  useEffect(() => {
    const attackInterval = setInterval(() => {
      if (isGameOver.current || !keys.current) return;
      
      // Only check for mouse0, since 'q' is handled by keydown event
      if (keys.current['mouse0']) {
        tryAttack();
      }
    }, 50);

    return () => clearInterval(attackInterval);
  }, [tryAttack, keys, abilities, currentWeapon, isSwinging, onAbilityUse]);

  useEffect(() => {
    const handleGameOver = () => {
      isGameOver.current = true;
      // Clear any ongoing abilities or effects

    };

    const handleGameReset = () => {
      isGameOver.current = false;
    };

    window.addEventListener('gameOver', handleGameOver);
    window.addEventListener('gameReset', handleGameReset);

    return () => {
      window.removeEventListener('gameOver', handleGameOver);
      window.removeEventListener('gameReset', handleGameReset);
    };
  }, []);

}