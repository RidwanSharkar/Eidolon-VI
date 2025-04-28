// src/unit/useAbilityKeys.ts
import { useEffect, useRef, useCallback } from 'react';
import { Vector3, Group } from 'three';
import { WeaponType, WeaponInfo, AbilityType } from '../Weapons/weapons';
import { ReanimateRef } from '../Spells/Reanimate/Reanimate';
import { OrbShieldRef } from '../Spells/Avalanche/OrbShield';

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
  setActiveEffects: (callback: (prev: Array<{
    id: number;
    type: string;
    position: Vector3;
    direction: Vector3;
    duration?: number;
    startTime?: number;
    summonId?: number;
  }>) => Array<{
    id: number;
    type: string;
    position: Vector3;
    direction: Vector3;
    duration?: number;
    startTime?: number;
    summonId?: number;
  }>) => void;
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
  setIsWhirlwinding: (value: boolean) => void;
  whirlwindStartTime: React.MutableRefObject<number | null>;
  isWhirlwinding: boolean;
  fireballCharges: Array<{
    id: number;
    available: boolean;
    cooldownStartTime: number | null;
  }>;
  activateStealth: () => void;
  shootQuickShot: () => void;
  setIsVaulting: (value: boolean) => void;
  isVaulting: boolean;
  startPyroclastCharge: () => void;
  releasePyroclastCharge: () => void;
  isPyroclastActive: boolean;
  fireClusterShots: () => boolean;
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
  setIsWhirlwinding,
  whirlwindStartTime,
  isWhirlwinding,
  fireballCharges,
  activateStealth,
  shootQuickShot,
  setIsVaulting,
  isVaulting,
  isPyroclastActive,
  startPyroclastCharge,
  releasePyroclastCharge,
  fireClusterShots,
}: UseAbilityKeysProps) {
  // Ref to track the last Q usage time
  const lastQUsageTime = useRef(0);

  // Ref to track if game is over
  const isGameOver = useRef(false);

  // DEBOUNCE
  const lastAttackTime = useRef(0);
  const ATTACK_DEBOUNCE = currentWeapon === WeaponType.SCYTHE ? 125 : 250; // ms

  // Shared attack logic function - simplify to match the working version
  const tryAttack = useCallback(() => {
    const now = Date.now();
    if (now - lastAttackTime.current < ATTACK_DEBOUNCE) return false;
    
    const qAbility = abilities[currentWeapon].q;
    if (qAbility.currentCooldown <= 0 && !isSwinging) {
      lastAttackTime.current = now;
      lastQUsageTime.current = now;
      setIsSwinging(true);
      onAbilityUse(currentWeapon, 'q');
      return true;
    }
    return false;
  }, [abilities, currentWeapon, isSwinging, onAbilityUse, setIsSwinging, ATTACK_DEBOUNCE]);

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
      if (isGameOver.current) return;
      
      const key = e.key.toLowerCase();

      if (key in keys.current && keys.current[key]) return;

      if (key in keys.current) {
        keys.current[key] = true;
      }

      if (key === 'q') {
        if (currentWeapon === WeaponType.BOW) {
          shootQuickShot();
        } else if (!keys.current['mouse0'] && !isSwinging) {  // Add isSwinging check
          tryAttack();
        }
      }

      if (key === 'e') {
        const eAbility = abilities[currentWeapon].e;
        if (eAbility.currentCooldown <= 0) {
          switch (currentWeapon) {
            case WeaponType.SWORD:
              if (!isSmiting) {
                const timeSinceLastQ = Date.now() - lastQUsageTime.current;
                if (timeSinceLastQ < 450) {
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
              }
              break;

            case WeaponType.BOW:
              if (!isBowCharging) {
                setIsBowCharging(true);
                setBowChargeStartTime(Date.now());
              }
              break;

            case WeaponType.SABRES:
              if (eAbility.currentCooldown <= 0) {
                activateStealth();
                onAbilityUse(currentWeapon, 'e');
              }
              break;

            case WeaponType.SCYTHE:
              shootFireball();
              onAbilityUse(currentWeapon, 'e');
              break;

            case WeaponType.SPEAR:
              if (!isWhirlwinding) {
                const hasAvailableCharges = fireballCharges.some(charge => charge.available);
                if (hasAvailableCharges) {
                  setIsWhirlwinding(true);
                  whirlwindStartTime.current = Date.now();
                } else {
                }
              }
              break;
          }
        }
      }

      if (key === '1') {
        const passiveAbility = abilities[currentWeapon].passive;
        if (passiveAbility.isUnlocked) {
          if (currentWeapon === WeaponType.SCYTHE) {
            castReanimate();
          } else if (currentWeapon === WeaponType.SABRES && startFirebeam && stopFirebeam) {
            startFirebeam();
            onAbilityUse(currentWeapon, 'passive');
          }
        }
      }

      if (key === '2') {
        const activeAbility = abilities[currentWeapon].active;
        if (activeAbility.isUnlocked && activeAbility.currentCooldown <= 0) {
          if (currentWeapon === WeaponType.SCYTHE) {
            const summonId = Date.now();
            
            setActiveEffects(prev => {
              // Prevent multiple summons by checking if one already exists
              if (prev.some(effect => effect.type === 'summon')) {
                return prev;
              }

              return [
                ...prev,
                {
                  id: summonId,
                  type: 'summon',  // main effect that controls the totem
                  position: groupRef.current!.position.clone(),
                  direction: new Vector3(0, 0, 1).applyQuaternion(groupRef.current!.quaternion),
                  onComplete: () => {
                  },
                  onStartCooldown: () => {
                  }
                }
              ];
            });
            onAbilityUse(currentWeapon, 'active');
          } else if (currentWeapon === WeaponType.BOW) {
            if (fireClusterShots()) {
              onAbilityUse(currentWeapon, 'active');
            }
          }
        }
      }

      // R ability handling
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
              // Blizzard effect
              setActiveEffects(prev => [...prev, {
                id: Math.random(),
                type: 'blizzard',
                position: groupRef.current!.position.clone(),
                direction: new Vector3(0, 0, 0) // unit origin
              }]);
              onAbilityUse(currentWeapon, 'r');
              break;
            case WeaponType.SCYTHE:
              // Dragon Claw effect
              setActiveEffects(prev => [...prev, {
                id: Math.random(),
                type: 'boneclaw',
                position: groupRef.current!.position.clone(),
                direction: new Vector3(0, 0, 1).applyQuaternion(groupRef.current!.quaternion)
              }]);
              onAbilityUse(currentWeapon, 'r');
              break;
            case WeaponType.BOW:
              if (!isVaulting) {
                setIsVaulting(true);
                onAbilityUse(currentWeapon, 'r');
              }
              break;
            case WeaponType.SPEAR:
              if (!isPyroclastActive) {
                startPyroclastCharge();
              }
              break;
          }
        }
      }

      if (!isSwinging && currentWeapon === WeaponType.BOW) {
        if (e.key.toLowerCase() === 'q') {
          shootQuickShot();
          onAbilityUse(WeaponType.BOW, 'q');
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (isGameOver.current) return;
      
      const key = e.key.toLowerCase();

      if (key in keys.current) {
        keys.current[key as keyof typeof keys.current] = false;
      }

      // Only handle bow charge release for BOW weapon type
      if (key === 'e' && currentWeapon === WeaponType.BOW && isBowCharging) {
        releaseBowShot(bowChargeProgress);
      }

      // Handle whirlwind cancellation for SPEAR
      if (key === 'e' && currentWeapon === WeaponType.SPEAR && isWhirlwinding) {
        setIsWhirlwinding(false);
        whirlwindStartTime.current = null;
        onAbilityUse(currentWeapon, 'e');
      }

      if (key === 'r' && currentWeapon === WeaponType.SPEAR && isPyroclastActive) {
        releasePyroclastCharge();
        onAbilityUse(currentWeapon, 'r');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [
    isVaulting,
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
    orbShieldRef,
    setIsWhirlwinding,
    whirlwindStartTime,
    isWhirlwinding,
    fireballCharges,
    activateStealth,
    shootQuickShot,
    setIsVaulting,
    isPyroclastActive,
    startPyroclastCharge,
    releasePyroclastCharge,
    fireClusterShots,
  ]);

  // Mouse event handlers to check game over state
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

  // Near the top with other refs
  const attackDebounceRef = useRef(ATTACK_DEBOUNCE);

  // Update the ref when ATTACK_DEBOUNCE changes
  useEffect(() => {
    attackDebounceRef.current = ATTACK_DEBOUNCE;
  }, [ATTACK_DEBOUNCE]);

  // Attack interval - update to use the simpler pattern
  useEffect(() => {
    const attackInterval = setInterval(() => {
      if (isGameOver.current || !keys.current || isSwinging) return;
      
      if (keys.current['mouse0']) {
        tryAttack();
      }
    }, 50);

    return () => clearInterval(attackInterval);
  }, [tryAttack, keys, isSwinging]);

  useEffect(() => {
    const handleGameOver = () => {
      isGameOver.current = true;

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