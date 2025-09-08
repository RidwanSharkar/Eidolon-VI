// src/unit/useAbilityKeys.ts
import { useEffect, useRef, useCallback } from 'react';
import { Vector3, Group } from 'three';
import { WeaponType, WeaponSubclass, WeaponInfo, AbilityType } from '../Weapons/weapons';
import { ReanimateRef } from '../Spells/Reanimate/Reanimate';
import { OrbShieldRef } from '../Spells/Avalanche/OrbShield';
import { ORBITAL_COOLDOWN } from '../color/ChargedOrbitals';
import { SynchronizedEffect } from '../Multiplayer/MultiplayerContext';

interface UseAbilityKeysProps {
  keys: React.MutableRefObject<Record<string, boolean>>;
  groupRef: React.RefObject<Group>;
  currentWeapon: WeaponType;
  currentSubclass?: WeaponSubclass;
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
    targetPosition?: Vector3;
    targetId?: string;
  }>) => Array<{
    id: number;
    type: string;
    position: Vector3;
    direction: Vector3;
    duration?: number;
    startTime?: number;
    summonId?: number;
    targetPosition?: Vector3;
    targetId?: string;
  }>) => void;
  onAbilityUse: (weapon: WeaponType, abilityType: AbilityType) => void;
  shootFireball: () => void;
  releaseBowShot: (progress: number, isPerfectShot?: boolean) => void;
  startFirebeam?: () => boolean;
  stopFirebeam?: () => void;
  castReanimate: () => void;
  reanimateRef: React.RefObject<ReanimateRef>;
  castSoulReaper?: () => boolean;
  health: number;
  startBurstSequence?: () => void; // For Storm spear concussive blow
  shootLavaLash?: () => void; // For Pyro spear LavaLash projectile
  shootIcicle?: () => boolean; // For Frost sabres icicle projectile
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
  setFireballCharges: (callback: (prev: Array<{
    id: number;
    available: boolean;
    cooldownStartTime: number | null;
  }>) => Array<{
    id: number;
    available: boolean;
    cooldownStartTime: number | null;
  }>) => void;
  activateStealth: () => void;
  shootQuickShot: () => void;
  shootGlacialShard?: () => boolean;
  shootBarrage: () => void;
  shootViperSting: () => boolean;
  activateVault: (direction: 'south' | 'north' | 'east' | 'west') => void;
  activeVault: { isActive: boolean; direction: 'south' | 'north' | 'east' | 'west' | null };
  canVault: () => boolean;
  startPyroclastCharge: () => void;
  releasePyroclastCharge: () => void;
  isPyroclastActive: boolean;
  isBreaching: boolean;
  setIsBreaching: (value: boolean) => void;
  activateBreach: () => boolean;
  activateMeteorSwarm: () => boolean;
  setSwordComboStep: (value: 1 | 2 | 3 | ((prev: 1 | 2 | 3) => 1 | 2 | 3)) => void;
  lastSwordSwingTime: React.MutableRefObject<number>;
  setIcicleComboStep: (value: 1 | 2 | 3 | ((prev: 1 | 2 | 3) => 1 | 2 | 3)) => void;
  lastIcicleShootTime: React.MutableRefObject<number>;
  setIsFirebeaming: (value: boolean) => void;
  firebeamStartTime: React.MutableRefObject<number | null>;
  isFirebeaming: boolean;
  activateAegis?: () => boolean;
  isAegisActive: boolean;
  aegisBlockedDamage: React.MutableRefObject<number>;
  castGuidedBolts: (targetId: string) => boolean;
  lastLightningTarget: string | null;
  isDivineStorming: boolean;
  setIsDivineStorming: (value: boolean) => void;
  triggerDivineStorm: () => void;
  activateColossusStrike: () => boolean;
  onEviscerate?: () => void;
  onBoneclaw?: () => void; // Add Boneclaw trigger function
  // Venom Bow instant powershot
  hasInstantPowershot?: boolean;
  setHasInstantPowershot?: (available: boolean) => void;
  level?: number;
  // Blizzard shield activation
  activateBlizzardShield?: () => void;
  // Perfect shot window for Elemental bow
  isPerfectShotWindow?: boolean;
  // Auto-release flag to prevent duplicate bow shots
  hasAutoReleasedBowShot?: boolean;
  setHasAutoReleasedBowShot?: (value: boolean) => void;
  // Ability bow animation state
  isAbilityBowAnimation?: boolean;
  
  // ThrowSpear for Storm spear subclass
  startThrowSpearCharge?: () => void;
  releaseThrowSpearCharge?: () => void;
  isThrowSpearCharging?: boolean;
  isSpearThrown?: boolean;
  
  // Multiplayer support
  sendEffect?: (effect: Omit<SynchronizedEffect, 'id' | 'startTime'>) => void;
  isInRoom?: boolean;
  isPlayer?: boolean;
  isStunned?: boolean;
}

export function useAbilityKeys({
  keys,
  groupRef,
  currentWeapon,
  currentSubclass,
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
  castSoulReaper,
  health,
  startBurstSequence,
  shootLavaLash,
  shootIcicle,
  maxHealth,
  onHealthChange,
  activateOathstrike,
  setIsOathstriking,
  orbShieldRef,
  setIsWhirlwinding,
  whirlwindStartTime,
  isWhirlwinding,
  fireballCharges,
  setFireballCharges,
  activateStealth,
  shootQuickShot,
  shootGlacialShard,
  shootBarrage,
  shootViperSting,
  activateVault,
  activeVault,
  canVault,
  isPyroclastActive,
  startPyroclastCharge,
  releasePyroclastCharge,
  isBreaching,
  setIsBreaching,
  activateBreach,
  activateMeteorSwarm,
  setSwordComboStep,
  lastSwordSwingTime,
  setIcicleComboStep,
  lastIcicleShootTime,
  setIsFirebeaming,
  firebeamStartTime,
  isFirebeaming,
  activateAegis,
  isAegisActive,
  aegisBlockedDamage,
  castGuidedBolts,
  lastLightningTarget,
  isDivineStorming,
  setIsDivineStorming,
  triggerDivineStorm,
  activateColossusStrike,
  onEviscerate,
  onBoneclaw,
  hasInstantPowershot = false,
  setHasInstantPowershot,
  level = 1,
  activateBlizzardShield,
  isPerfectShotWindow = false,
  hasAutoReleasedBowShot = false,
  setHasAutoReleasedBowShot,
  isAbilityBowAnimation = false,
  startThrowSpearCharge,
  releaseThrowSpearCharge,
  isThrowSpearCharging = false,
  isSpearThrown = false,
  // Multiplayer parameters
  sendEffect,
  isInRoom = false,
  isPlayer = false,
  isStunned = false,
}: UseAbilityKeysProps) {
  // Basic refs
  const lastQUsageTime = useRef(0);
  const isGameOver = useRef(false);
  const attackIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Track ability key states to prevent repeats
  const abilityKeysPressed = useRef({
    '1': false,
    '2': false,
    '3': false,
    'r': false
  });

  // Double-tap detection refs
  const lastSKeyPressTime = useRef(0);
  const lastSKeyReleaseTime = useRef(0);
  const sKeyWasReleased = useRef(true);
  
  const lastWKeyPressTime = useRef(0);
  const lastWKeyReleaseTime = useRef(0);
  const wKeyWasReleased = useRef(true);
  
  const lastDKeyPressTime = useRef(0);
  const lastDKeyReleaseTime = useRef(0);
  const dKeyWasReleased = useRef(true);
  
  const lastAKeyPressTime = useRef(0);
  const lastAKeyReleaseTime = useRef(0);
  const aKeyWasReleased = useRef(true);

  const DOUBLE_TAP_THRESHOLD = 300; // 300ms window for double-tap

  // DEBOUNCE
  const lastAttackTime = useRef(0);
  let ATTACK_DEBOUNCE = currentWeapon === WeaponType.SCYTHE ? 125 : 250; // ms
  
  // Apply Assassin attack speed boost when Eviscerate is unlocked
  if (currentWeapon === WeaponType.SABRES && 
      currentSubclass === WeaponSubclass.ASSASSIN && 
      abilities[WeaponType.SABRES].active.isUnlocked) {
    const speedMultiplier = 1.5; // 50% attack speed increase when Eviscerate is unlocked
    ATTACK_DEBOUNCE = Math.floor(ATTACK_DEBOUNCE / speedMultiplier);
  }
  
  const attackDebounceRef = useRef(ATTACK_DEBOUNCE);

  // Helper function to reset sword combo for Vengeance subclass
  const resetSwordCombo = useCallback(() => {
    if (currentWeapon === WeaponType.SWORD && currentSubclass === WeaponSubclass.VENGEANCE) {
      setSwordComboStep(1);
    }
  }, [currentWeapon, currentSubclass, setSwordComboStep]);

  // Helper function to reset icicle combo for Frost subclass
  const resetIcicleCombo = useCallback(() => {
    if (currentWeapon === WeaponType.SABRES && currentSubclass === WeaponSubclass.FROST) {
      setIcicleComboStep(1);
    }
  }, [currentWeapon, currentSubclass, setIcicleComboStep]);

  // Shared attack logic function - simplify to match the working version
  const tryAttack = useCallback(() => {
    const now = Date.now();
    
    if (now - lastAttackTime.current < ATTACK_DEBOUNCE) {
      return false;
    }
    
    // Prevent using spear Q ability during whirlwind
    if (currentWeapon === WeaponType.SPEAR && isWhirlwinding) {
      return false;
    }
    
    const qAbility = abilities[currentWeapon].q;
    
    if (qAbility.currentCooldown <= 0.1 && !isSwinging) {
      lastAttackTime.current = now;
      lastQUsageTime.current = now;
      
      // Update last swing time for Vengeance sword tracking
      if (currentWeapon === WeaponType.SWORD && currentSubclass === WeaponSubclass.VENGEANCE) {
        lastSwordSwingTime.current = now;
      }
      
      // Update last icicle shoot time for Frost sabres tracking
      if (currentWeapon === WeaponType.SABRES && currentSubclass === WeaponSubclass.FROST) {
        lastIcicleShootTime.current = now;
      }
      
      // Start burst sequence for Storm spear concussive blow
      if (currentWeapon === WeaponType.SPEAR && currentSubclass === WeaponSubclass.STORM && startBurstSequence) {
        startBurstSequence();
      }
      
      // Shoot LavaLash for Pyro spear Q ability
      if (currentWeapon === WeaponType.SPEAR && currentSubclass === WeaponSubclass.PYRO && shootLavaLash) {
        shootLavaLash();
      }
      
      // Shoot Icicle for Frost sabres Q ability
      if (currentWeapon === WeaponType.SABRES && currentSubclass === WeaponSubclass.FROST && shootIcicle) {
        shootIcicle();
      }
      
      setIsSwinging(true);
      onAbilityUse(currentWeapon, 'q');
      return true;
    }
    return false;
  }, [ currentSubclass, abilities, currentWeapon, isSwinging, onAbilityUse, setIsSwinging, ATTACK_DEBOUNCE, isWhirlwinding, lastSwordSwingTime, lastIcicleShootTime, startBurstSequence, shootLavaLash, shootIcicle]);

  // Helper to stop auto-attack (called on mouse up / game over / unmount)
  const stopAutoAttack = useCallback(() => {
    if (attackIntervalRef.current) {
      clearInterval(attackIntervalRef.current);
      attackIntervalRef.current = null;
    }
  }, []);

  // Helper to begin auto-attack (called on mouse down)
  const startAutoAttack = useCallback(() => {
    if (attackIntervalRef.current !== null) return; // already running

    attackIntervalRef.current = setInterval(() => {
      if (isGameOver.current) return;

      // Prevent auto-attacking during whirlwind for Spear
      if (currentWeapon === WeaponType.SPEAR && isWhirlwinding) return;

      // Handle BOW weapons differently - use shootQuickShot instead of tryAttack
      if (currentWeapon === WeaponType.BOW) {
        // Prevent quick shot during ability animations (Barrage, Viper Sting, etc.)
        if (!isAbilityBowAnimation) {
          shootQuickShot();
        }
      } else {
        tryAttack();
      }
    }, 50);
  }, [currentWeapon, isWhirlwinding, tryAttack, shootQuickShot, isAbilityBowAnimation]);

  // Unified vault activation functions
  const handleVaultActivation = useCallback((direction: 'south' | 'north' | 'east' | 'west') => {
    if (canVault() && !activeVault.isActive) {
      activateVault(direction);
    }
  }, [canVault, activeVault.isActive, activateVault]);

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
      const key = e.key.toLowerCase();
      
      if (isGameOver.current) {
        return;
      }
      
      if (isStunned) {
        return;
      }

      // Handle double-tap S for vault BEFORE early return check
      if (key === 's') {
        const now = Date.now();
        
        // Only consider this a valid tap if the key was released since last press
        if (!sKeyWasReleased.current) {
          return; // Ignore key repeats from holding down
        }
        
        const timeSinceLastS = now - lastSKeyPressTime.current;
        const timeSinceLastRelease = now - lastSKeyReleaseTime.current;
        
        // Require both: quick succession AND key was actually released
        if (timeSinceLastS <= DOUBLE_TAP_THRESHOLD && 
            timeSinceLastRelease <= DOUBLE_TAP_THRESHOLD && 
            lastSKeyPressTime.current > 0) {
          // Double-tap detected - trigger vault
          handleVaultActivation('south');
          lastSKeyPressTime.current = 0; // Reset to prevent triple-tap issues
          lastSKeyReleaseTime.current = 0;
          sKeyWasReleased.current = true;
          return; // Return early to prevent movement from being affected
        } else {
          // Single tap - record the time
          lastSKeyPressTime.current = now;
          sKeyWasReleased.current = false; // Mark that key is now pressed
        }
      }

      // Handle double-tap W for vaultNorth BEFORE early return check
      if (key === 'w') {
        const now = Date.now();
        
        // Only consider this a valid tap if the key was released since last press
        if (!wKeyWasReleased.current) {
          return; // Ignore key repeats from holding down
        }
        
        const timeSinceLastW = now - lastWKeyPressTime.current;
        const timeSinceLastRelease = now - lastWKeyReleaseTime.current;
        
        // Require both: quick succession AND key was actually released
        if (timeSinceLastW <= DOUBLE_TAP_THRESHOLD && 
            timeSinceLastRelease <= DOUBLE_TAP_THRESHOLD && 
            lastWKeyPressTime.current > 0) {
          // Double-tap detected - trigger vaultNorth
          handleVaultActivation('north');
          lastWKeyPressTime.current = 0; // Reset to prevent triple-tap issues
          lastWKeyReleaseTime.current = 0;
          wKeyWasReleased.current = true;
          return; // Return early to prevent movement from being affected
        } else {
          // Single tap - record the time
          lastWKeyPressTime.current = now;
          wKeyWasReleased.current = false; // Mark that key is now pressed
        }
      }

      // Handle double-tap D for vaultEast BEFORE early return check
      if (key === 'd') {
        const now = Date.now();
        
        // Only consider this a valid tap if the key was released since last press
        if (!dKeyWasReleased.current) {
          return; // Ignore key repeats from holding down
        }
        
        const timeSinceLastD = now - lastDKeyPressTime.current;
        const timeSinceLastRelease = now - lastDKeyReleaseTime.current;
        
        // Require both: quick succession AND key was actually released
        if (timeSinceLastD <= DOUBLE_TAP_THRESHOLD && 
            timeSinceLastRelease <= DOUBLE_TAP_THRESHOLD && 
            lastDKeyPressTime.current > 0) {
          // Double-tap detected - trigger vaultEast
          handleVaultActivation('east');
          lastDKeyPressTime.current = 0; // Reset to prevent triple-tap issues
          lastDKeyReleaseTime.current = 0;
          dKeyWasReleased.current = true;
          return; // Return early to prevent movement from being affected
        } else {
          // Single tap - record the time
          lastDKeyPressTime.current = now;
          dKeyWasReleased.current = false; // Mark that key is now pressed
        }
      }

      // Handle double-tap A for vaultWest BEFORE early return check
      if (key === 'a') {
        const now = Date.now();
        
        // Only consider this a valid tap if the key was released since last press
        if (!aKeyWasReleased.current) {
          return; // Ignore key repeats from holding down
        }
        
        const timeSinceLastA = now - lastAKeyPressTime.current;
        const timeSinceLastRelease = now - lastAKeyReleaseTime.current;
        
        // Require both: quick succession AND key was actually released
        if (timeSinceLastA <= DOUBLE_TAP_THRESHOLD && 
            timeSinceLastRelease <= DOUBLE_TAP_THRESHOLD && 
            lastAKeyPressTime.current > 0) {
          // Double-tap detected - trigger vaultWest
          handleVaultActivation('west');
          lastAKeyPressTime.current = 0; // Reset to prevent triple-tap issues
          lastAKeyReleaseTime.current = 0;
          aKeyWasReleased.current = true;
          return; // Return early to prevent movement from being affected
        } else {
          // Single tap - record the time
          lastAKeyPressTime.current = now;
          aKeyWasReleased.current = false; // Mark that key is now pressed
        }
      }

      if (key in keys.current && keys.current[key]) return;

      if (key in keys.current) {
        keys.current[key] = true;
      }

      if (key === 'q') {
        // Prevent Q ability if Storm Spear is thrown
        if (currentWeapon === WeaponType.SPEAR && currentSubclass === WeaponSubclass.STORM && (isThrowSpearCharging || isSpearThrown)) {
          return; // Block Q ability while ThrowSpear is active
        }
        
        if (currentWeapon === WeaponType.BOW) {
          // Prevent quick shot during ability animations (Barrage, Viper Sting, etc.)
          if (!isAbilityBowAnimation) {
            shootQuickShot();
          }
        } else if (!keys.current['mouse0'] && !isSwinging && !(currentWeapon === WeaponType.SPEAR && isWhirlwinding)) {
          tryAttack();
        }
      }

      if (key === 'e') {
        // Prevent E ability if Storm Spear is thrown
        if (currentWeapon === WeaponType.SPEAR && currentSubclass === WeaponSubclass.STORM && (isThrowSpearCharging || isSpearThrown)) {
          return; // Block E ability while ThrowSpear is active
        }
        
        // Reset sword combo for Vengeance subclass when using other abilities
        resetSwordCombo();
        // Reset icicle combo for Frost subclass when using other abilities
        resetIcicleCombo();
        
        const eAbility = abilities[currentWeapon].e;
        
        if (eAbility.currentCooldown <= 0.1) {
          // Handle subclass-specific 'e' abilities
          if (currentWeapon === WeaponType.SABRES && currentSubclass === WeaponSubclass.FROST) {
            // Frost Sabres use Firebeam for 'e'
            if (!isFirebeaming && startFirebeam) {
              const firebeamStarted = startFirebeam();
              if (firebeamStarted) {
                setIsFirebeaming(true);
                firebeamStartTime.current = Date.now();
                onAbilityUse(currentWeapon, 'e');
              }
            }
            return; // Prevent default behavior
          } else if (currentWeapon === WeaponType.SPEAR && currentSubclass === WeaponSubclass.PYRO) {
            // Pyro Spear uses Pyroclast for 'e'
            if (!isPyroclastActive) {
              const availableChargesCount = fireballCharges.filter(charge => charge.available).length;
              if (availableChargesCount >= 2) {
                startPyroclastCharge();
                onAbilityUse(currentWeapon, 'e');
                
                // Send pyroclast effect to other players in multiplayer
                if (isInRoom && isPlayer && sendEffect && groupRef.current) {
                  sendEffect({
                    type: 'pyroclast',
                    position: groupRef.current.position.clone(),
                    direction: new Vector3(0, 0, 1).applyQuaternion(groupRef.current.quaternion),
                    duration: 4000, // 4 second max charge time
                    weaponType: currentWeapon,
                    subclass: currentSubclass
                  });
                }
              }
            }
            return; // Prevent default behavior
          } else {
            // Default behavior for all other weapon/subclass combinations
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
                // Prevent bow charging during ability animations (like barrage or viper sting)
                if (!isBowCharging && !isAbilityBowAnimation) {
                  // Check for instant powershot for Venom Bow
                  if (currentSubclass === WeaponSubclass.VENOM && level >= 1 && hasInstantPowershot && setHasInstantPowershot) {
                    // Fire instant powershot at full charge
                    releaseBowShot(1.0);
                    setHasInstantPowershot(false); // Consume the instant powershot
                    onAbilityUse(currentWeapon, 'e');
                  } else {
                    // Normal charging behavior
                    setIsBowCharging(true);
                    setBowChargeStartTime(Date.now());
                    // Reset auto-release flag when starting to charge
                    if (setHasAutoReleasedBowShot) {
                      setHasAutoReleasedBowShot(false);
                    }
                  }
                }
                break;

              case WeaponType.SABRES:
                // Default Assassin Sabres use Stealth for 'e'
                if (eAbility.currentCooldown <= 0.1) {
                  activateStealth();
                  onAbilityUse(currentWeapon, 'e');
                  
                  // Send stealth mist effect to other players in multiplayer
                  if (isInRoom && isPlayer && sendEffect && groupRef.current) {
                    sendEffect({
                      type: 'stealthMist',
                      position: groupRef.current.position.clone(),
                      direction: new Vector3(0, 0, 0), // Centered effect
                      duration: 5000, // 5 second stealth duration
                      weaponType: currentWeapon,
                      subclass: currentSubclass
                    });
                  }
                }
                break;

              case WeaponType.SCYTHE:
                if (currentSubclass === WeaponSubclass.ABYSSAL) {
                  // Abyssal Scythe uses Soul Reaper for 'e'
                  if (castSoulReaper && castSoulReaper()) {
                    onAbilityUse(currentWeapon, 'e');
                  }
                } else {
                  // Chaos Scythe (default) uses Entropic Bolt for 'e'
                  shootFireball();
                  onAbilityUse(currentWeapon, 'e');
                }
                break;

              case WeaponType.SPEAR:
                // Default Storm Spear uses Whirlwind for 'e'
                if (!isWhirlwinding) {
                  const hasAvailableCharges = fireballCharges.some(charge => charge.available);
                  if (hasAvailableCharges) {
                    setIsWhirlwinding(true);
                    whirlwindStartTime.current = Date.now();
                    onAbilityUse(currentWeapon, 'e');
                    
                    // Send whirlwind effect to other players in multiplayer
                    if (isInRoom && isPlayer && sendEffect && groupRef.current) {
                      sendEffect({
                        type: 'whirlwind',
                        position: groupRef.current.position.clone(),
                        direction: new Vector3(0, 0, 0), // Centered effect
                        duration: 1200, // 1.2 second duration
                        weaponType: currentWeapon,
                        subclass: currentSubclass
                      });
                    }
                  }
                }
                break;
            }
          }
        } else {
        }
      }

      if (key === '1') {
        // Prevent key repeats
        if (abilityKeysPressed.current['1']) return;
        abilityKeysPressed.current['1'] = true;

        const passiveAbility = abilities[currentWeapon].passive;
        if (passiveAbility.isUnlocked) {
          if (currentWeapon === WeaponType.SCYTHE) {
            // Scythe passive abilities - Frenzy Aura for Abyssal, unused for Chaos
            if (currentSubclass === WeaponSubclass.ABYSSAL) {
              // Abyssal Scythe - Frenzy Aura is passive (automatic), no manual activation needed
              // Do nothing - Frenzy Aura works automatically
            } else if (currentSubclass === WeaponSubclass.CHAOS) {
              // Chaos Scythe - passive ability is unused
              // Do nothing
            }
          } else if (currentWeapon === WeaponType.SABRES && currentSubclass === WeaponSubclass.FROST && !isFirebeaming) {
            // Only FROST subclass uses '1' key for Deep Freeze (manual activation)
            const hasAvailableCharges = fireballCharges.some(charge => charge.available);
            if (hasAvailableCharges) {
              setIsFirebeaming(true);
              firebeamStartTime.current = Date.now();
              onAbilityUse(currentWeapon, 'passive');
              
              // Send firebeam effect to other players in multiplayer
              if (isInRoom && isPlayer && sendEffect && groupRef.current) {
                sendEffect({
                  type: 'firebeam',
                  position: groupRef.current.position.clone(),
                  direction: new Vector3(0, 0, 1).applyQuaternion(groupRef.current.quaternion),
                  duration: 3000, // 3 second duration
                  weaponType: currentWeapon,
                  subclass: currentSubclass
                });
              }
            }
          }
          // ASSASSIN subclass Avalanche is passive (automatic) - no manual '1' key activation needed
        }
      }

      if (key === '2') {
        // Reset sword combo for Vengeance subclass when using other abilities
        resetSwordCombo();
        // Reset icicle combo for Frost subclass when using other abilities
        resetIcicleCombo();
        
        const activeAbility = abilities[currentWeapon].active;
        
        // Special case for Eviscerate: check if it's unlocked and has available charges
        if (currentWeapon === WeaponType.SABRES && currentSubclass === WeaponSubclass.ASSASSIN) {
          if (activeAbility.isUnlocked && onEviscerate) {
            // Eviscerate uses charges instead of standard cooldown
            onEviscerate();
            return; // Exit early, don't check standard cooldown
          }
        }
        
        // Standard cooldown check for other abilities
        if (activeAbility.isUnlocked && activeAbility.currentCooldown <= 0.1) {
          if (currentWeapon === WeaponType.SCYTHE) {
            if (currentSubclass === WeaponSubclass.CHAOS) {
              // Chaos Scythe - Dragon Breath (costs 2 orbs)
              const availableCharges = fireballCharges.filter(charge => charge.available);
              if (availableCharges.length >= 2) {
                // Consume 2 orb charges
                setFireballCharges(prev => prev.map((charge, index) => {
                  if (
                    index === availableCharges[0].id - 1 || 
                    index === availableCharges[1].id - 1
                  ) {
                    return {
                      ...charge,
                      available: false,
                      cooldownStartTime: Date.now()
                    };
                  }
                  return charge;
                }));

                // Start cooldown recovery for each charge individually
                for (let i = 0; i < 2; i++) {
                  if (availableCharges[i].id) {
                    setTimeout(() => {
                      setFireballCharges(prev => prev.map((c, index) => 
                        index === availableCharges[i].id - 1
                          ? { ...c, available: true, cooldownStartTime: null }
                          : c
                      ));
                    }, ORBITAL_COOLDOWN);
                  }
                }

                const dragonBreathId = Date.now();
                
                setActiveEffects(prev => [
                  ...prev,
                  {
                    id: dragonBreathId,
                    type: 'dragonbreath',
                    position: groupRef.current!.position.clone(),
                    direction: new Vector3(0, 0, 1).applyQuaternion(groupRef.current!.quaternion),
                    onComplete: () => {},
                    onStartCooldown: () => {}
                  }
                ]);
                onAbilityUse(currentWeapon, 'active');
                
                // Send dragon breath effect to other players in multiplayer
                if (isInRoom && isPlayer && sendEffect && groupRef.current) {
                  sendEffect({
                    type: 'dragonBreath',
                    position: groupRef.current.position.clone(),
                    direction: new Vector3(0, 0, 1).applyQuaternion(groupRef.current.quaternion),
                    duration: 1800, // 1.8 second duration
                    weaponType: currentWeapon,
                    subclass: currentSubclass,
                    coneAngle: Math.PI * 0.8, // 144-degree arc
                    range: 8 // 8 unit range
                  });
                }
              }
            } else if (currentSubclass === WeaponSubclass.ABYSSAL) {
              // Abyssal Scythe - Legion (costs 2 orbs)
              const availableCharges = fireballCharges.filter(charge => charge.available);
              if (availableCharges.length >= 2) {
                // Consume 2 orb charges
                setFireballCharges(prev => prev.map((charge, index) => {
                  if (
                    index === availableCharges[0].id - 1 || 
                    index === availableCharges[1].id - 1
                  ) {
                    return {
                      ...charge,
                      available: false,
                      cooldownStartTime: Date.now()
                    };
                  }
                  return charge;
                }));

                // Start cooldown recovery for each charge individually
                for (let i = 0; i < 2; i++) {
                  if (availableCharges[i].id) {
                    setTimeout(() => {
                      setFireballCharges(prev => prev.map((c, index) => 
                        index === availableCharges[i].id - 1
                          ? { ...c, available: true, cooldownStartTime: null }
                          : c
                      ));
                    }, ORBITAL_COOLDOWN);
                  }
                }

                const legionId = Date.now();
                
                setActiveEffects(prev => [
                  ...prev,
                  {
                    id: legionId,
                    type: 'legion',
                    position: groupRef.current!.position.clone(),
                    direction: new Vector3(0, 0, 1).applyQuaternion(groupRef.current!.quaternion),
                    onComplete: () => {},
                    onStartCooldown: () => {}
                  }
                ]);
                onAbilityUse(currentWeapon, 'active');
              }
            }
          } else if (currentWeapon === WeaponType.SABRES && currentSubclass === WeaponSubclass.FROST) {
            // Frost Sabres - Summon Elemental
            const elementalId = Date.now();
            
            setActiveEffects(prev => {
              // Check for existing elementals (max 1)
              const existingElementals = prev.filter(effect => effect.type === 'elemental');
              if (existingElementals.length >= 1) {
                return prev; // Can't summon more than 1 elemental
              }

              return [
                ...prev,
                {
                  id: elementalId,
                  type: 'elemental',
                  position: groupRef.current!.position.clone(),
                  direction: new Vector3(0, 0, 1).applyQuaternion(groupRef.current!.quaternion),
                  onComplete: () => {},
                  onStartCooldown: () => {}
                }
              ];
            });
            onAbilityUse(currentWeapon, 'active');
          } else if (currentWeapon === WeaponType.BOW) {
            // BOW Active Ability - Guided Bolts (Elemental subclass) or Viper Sting (Venom subclass)
            if (currentSubclass === WeaponSubclass.ELEMENTAL) {
              // Check if we have a valid target from last lightning strike
              if (lastLightningTarget) {
                const guidedBoltsActivated = castGuidedBolts(lastLightningTarget);
                if (guidedBoltsActivated) {
                  onAbilityUse(currentWeapon, 'active');
                }
              }
            } else if (currentSubclass === WeaponSubclass.VENOM) {
              // Venom subclass uses Viper Sting
              const viperStingActivated = shootViperSting();
              if (viperStingActivated) {
                onAbilityUse(currentWeapon, 'active');
              }
            }
          } else if (currentWeapon === WeaponType.SWORD && currentSubclass === WeaponSubclass.DIVINITY) {
            // Divinity Sword - Aegis
            if (!isAegisActive && activateAegis) {
              const aegisActivated = activateAegis();
              if (aegisActivated) {
                setActiveEffects(prev => [...prev, {
                  id: Math.random(),
                  type: 'aegis',
                  position: groupRef.current!.position.clone(),
                  direction: new Vector3(0, 0, 0), // No direction needed for shield
                  duration: 3000, // 3 seconds
                  startTime: Date.now()
                }]);
                onAbilityUse(currentWeapon, 'active');
                
                // Send aegis effect to other players in multiplayer
                if (isInRoom && isPlayer && sendEffect && groupRef.current) {
                  sendEffect({
                    type: 'aegis',
                    position: groupRef.current.position.clone(),
                    direction: new Vector3(0, 0, 1).applyQuaternion(groupRef.current.quaternion),
                    duration: 3000, // 3 second duration
                    weaponType: currentWeapon,
                    subclass: currentSubclass
                  });
                }
              }
            }
          } else if (currentWeapon === WeaponType.SWORD && currentSubclass === WeaponSubclass.VENGEANCE) {
            // Vengeance Sword - Colossus Strike
            if (!isSwinging && !isSmiting && !isDivineStorming) {
              const colossusActivated = activateColossusStrike();
              if (colossusActivated) {
                onAbilityUse(currentWeapon, 'active');
                
                // Send colossus strike effect to other players in multiplayer
                if (isInRoom && isPlayer && sendEffect && groupRef.current) {
                  sendEffect({
                    type: 'colossusStrike',
                    position: groupRef.current.position.clone(),
                    direction: new Vector3(0, 0, 1).applyQuaternion(groupRef.current.quaternion),
                    duration: 1500, // 1.5 second duration for lightning effect
                    weaponType: currentWeapon,
                    subclass: currentSubclass
                  });
                }
              }
            }
          } else if (currentWeapon === WeaponType.SPEAR) {
            // Both Storm and Pyro Spear subclasses use Breach for '2' key
            if (!isBreaching) {
              const breachActivated = activateBreach();
              if (breachActivated) {
                setIsBreaching(true);
                onAbilityUse(currentWeapon, 'active');
                
                // Send breach effect to other players in multiplayer
                if (isInRoom && isPlayer && sendEffect && groupRef.current) {
                  sendEffect({
                    type: 'breach',
                    position: groupRef.current.position.clone(),
                    direction: new Vector3(0, 0, 1).applyQuaternion(groupRef.current.quaternion),
                    duration: 2000, // 2 second duration
                    weaponType: currentWeapon,
                    subclass: currentSubclass
                  });
                }
              }
            }
          }
        }
      }

      if (key === '3') {
        // Prevent key repeats
        if (abilityKeysPressed.current['3']) return;
        abilityKeysPressed.current['3'] = true;

        const specialAbility = abilities[currentWeapon].special;
        if (specialAbility.isUnlocked && specialAbility.currentCooldown <= 0.1) {
          if (currentWeapon === WeaponType.SWORD) {
            if (!isAegisActive && activateAegis) {
              const aegisActivated = activateAegis();
              if (aegisActivated) {
                setActiveEffects(prev => [...prev, {
                  id: Math.random(),
                  type: 'aegis',
                  position: groupRef.current!.position.clone(),
                  direction: new Vector3(0, 0, 0), // No direction needed for shield
                  duration: 3000, // 3 seconds
                  startTime: Date.now()
                }]);
                onAbilityUse(currentWeapon, 'special');
              }
            }
          }
        }
      }

      // R ability handling
      if (key === 'r') {
        // Reset sword combo for Vengeance subclass when using other abilities
        resetSwordCombo();
        // Reset icicle combo for Frost subclass when using other abilities
        resetIcicleCombo();
        
        const rAbility = abilities[currentWeapon].r;
        
        if (rAbility.isUnlocked && rAbility.currentCooldown <= 0.1) {
          // Handle subclass-specific 'r' abilities
          if (currentWeapon === WeaponType.SCYTHE && currentSubclass === WeaponSubclass.ABYSSAL) {
            // Abyssal Scythe uses Reanimate for 'r'
            castReanimate();
            onAbilityUse(currentWeapon, 'r');
          } else if (currentWeapon === WeaponType.SCYTHE && currentSubclass === WeaponSubclass.CHAOS) {
            // Chaos Scythe uses Boneclaw/Dragon Claw (charge-based system)
            // NOTE: Boneclaw uses its own charge system and should NOT trigger any cooldown
            if (onBoneclaw) {
              onBoneclaw();
              // Send dragon claw effect to other players in multiplayer
              if (isInRoom && isPlayer && sendEffect && groupRef.current) {
                sendEffect({
                  type: 'dragonClaw',
                  position: groupRef.current.position.clone(),
                  direction: new Vector3(0, 0, 1).applyQuaternion(groupRef.current!.quaternion),
                  duration: 1000, // 1 second duration
                  weaponType: currentWeapon,
                  subclass: currentSubclass
                });
              }
            }
            // Do NOT call onAbilityUse here - Boneclaw manages its own charges
          } else if (currentWeapon === WeaponType.SWORD && currentSubclass === WeaponSubclass.VENGEANCE) {
            // Vengeance Sword uses DivineStorm for 'r'
            if (!isDivineStorming && !isSwinging) {
              // Check if we have at least 2 orb charges available
              const availableCharges = fireballCharges.filter(charge => charge.available);
              if (availableCharges.length >= 2) {
                // Consume 2 orb charges
                setFireballCharges(prev => prev.map((charge, index) => {
                  if (
                    index === availableCharges[0].id - 1 || 
                    index === availableCharges[1].id - 1
                  ) {
                    return {
                      ...charge,
                      available: false,
                      cooldownStartTime: Date.now()
                    };
                  }
                  return charge;
                }));

                // Start cooldown recovery for each charge individually
                for (let i = 0; i < 2; i++) {
                  if (availableCharges[i].id) {
                    setTimeout(() => {
                      setFireballCharges(prev => prev.map((c, index) => 
                        index === availableCharges[i].id - 1
                          ? { ...c, available: true, cooldownStartTime: null }
                          : c
                      ));
                    }, ORBITAL_COOLDOWN); // Use ORBITAL_COOLDOWN constant (8.25 seconds)
                  }
                }

                // Trigger the ability
                setIsDivineStorming(true);
                setIsSwinging(true);
                triggerDivineStorm(); // Trigger the visual effect
                onAbilityUse(currentWeapon, 'r');
              }
            }
          } else if (currentWeapon === WeaponType.SWORD && currentSubclass === WeaponSubclass.DIVINITY) {
            // Divinity Sword uses Oathstrike for 'r'
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
              
              // Send oathstrike effect to other players in multiplayer
              if (isInRoom && isPlayer && sendEffect) {
                sendEffect({
                  type: 'oathstrike',
                  position: result.position.clone(),
                  direction: result.direction.clone(),
                  duration: 1000, // 1 second duration
                  weaponType: currentWeapon,
                  subclass: currentSubclass
                });
              }
            }
          } else if (currentWeapon === WeaponType.SABRES && currentSubclass === WeaponSubclass.FROST) {
            // Frost Sabres use Glacial Shard for 'r'
            if (shootGlacialShard && shootGlacialShard()) {
              onAbilityUse(currentWeapon, 'r');
              
              // Send glacial shard effect to other players in multiplayer
              if (isInRoom && isPlayer && sendEffect && groupRef.current) {
                sendEffect({
                  type: 'glacialShard',
                  position: groupRef.current.position.clone(),
                  direction: new Vector3(0, 0, 1).applyQuaternion(groupRef.current.quaternion),
                  duration: 8000, // 8 second max lifespan
                  speed: 0.4, // Glacial shard speed
                  weaponType: currentWeapon,
                  subclass: currentSubclass
                });
              }
            }
          } else if (currentWeapon === WeaponType.SPEAR) {
            if (currentSubclass === WeaponSubclass.PYRO) {
              // PYRO Spear uses MeteorSwarm for 'r' key
              const meteorSwarmActivated = activateMeteorSwarm();
              if (meteorSwarmActivated) {
                onAbilityUse(currentWeapon, 'r');
              }
            } else if (currentSubclass === WeaponSubclass.STORM) {
              // STORM Spear uses ThrowSpear for 'r' key
              if (!isThrowSpearCharging && !isSpearThrown && startThrowSpearCharge) {
                startThrowSpearCharge();
                // Don't set cooldown here - wait until spear is actually thrown
              }
            } else {
              // Default behavior for other spear subclasses
              if (!isBreaching) {
                const breachActivated = activateBreach();
                if (breachActivated) {
                  setIsBreaching(true);
                  onAbilityUse(currentWeapon, 'r');
                }
              }
            }
          } else {
            // Default behavior for other weapon/subclass combinations
            switch (currentWeapon) {
              case WeaponType.SABRES:
                // Both Sabres subclasses use Blizzard for 'r'
                setActiveEffects(prev => [...prev, {
                  id: Math.random(),
                  type: 'blizzard',
                  position: groupRef.current!.position.clone(),
                  direction: new Vector3(0, 0, 0) // unit origin
                }]);
                
                // Activate Blizzard shield for Assassin subclass
                if (currentSubclass === WeaponSubclass.ASSASSIN && activateBlizzardShield) {
                  activateBlizzardShield();
                }
                
                // Send blizzard effect to other players in multiplayer
                if (isInRoom && isPlayer && sendEffect && groupRef.current) {
                  sendEffect({
                    type: 'blizzard',
                    position: groupRef.current.position.clone(),
                    direction: new Vector3(0, 0, 0), // Centered effect
                    duration: 10000, // 10 second duration
                    weaponType: currentWeapon,
                    subclass: currentSubclass,
                    range: 6 // Blizzard radius
                  });
                }
                
                onAbilityUse(currentWeapon, 'r');
                break;
              case WeaponType.SCYTHE:
                // Default behavior for other scythe subclasses (non-Chaos)
                setActiveEffects(prev => [...prev, {
                  id: Math.random(),
                  type: 'boneclaw',
                  position: groupRef.current!.position.clone(),
                  direction: new Vector3(0, 0, 1).applyQuaternion(groupRef.current!.quaternion)
                }]);
                onAbilityUse(currentWeapon, 'r');
                break;
              case WeaponType.BOW:
                // Both Bow subclasses use Barrage for 'r'
                shootBarrage();
                onAbilityUse(currentWeapon, 'r');
                break;
            }
          }
        }
      }

      if (!isSwinging && currentWeapon === WeaponType.BOW) {
        if (e.key.toLowerCase() === 'q') {
          // Prevent quick shot during ability animations (Barrage, Viper Sting, etc.)
          if (!isAbilityBowAnimation) {
            shootQuickShot();
            onAbilityUse(WeaponType.BOW, 'q');
          }
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (isGameOver.current) return;
      
      if (isStunned) {
        return;
      }
      
      const key = e.key.toLowerCase();

      // Track 's' key release for double-tap detection
      if (key === 's') {
        lastSKeyReleaseTime.current = Date.now();
        sKeyWasReleased.current = true;
      }

      // Track 'w' key release for double-tap detection
      if (key === 'w') {
        lastWKeyReleaseTime.current = Date.now();
        wKeyWasReleased.current = true;
      }

      // Track 'd' key release for double-tap detection
      if (key === 'd') {
        lastDKeyReleaseTime.current = Date.now();
        dKeyWasReleased.current = true;
      }

      // Track 'a' key release for double-tap detection
      if (key === 'a') {
        lastAKeyReleaseTime.current = Date.now();
        aKeyWasReleased.current = true;
      }

      if (key in keys.current) {
        keys.current[key as keyof typeof keys.current] = false;
      }

      // Only handle bow charge release for BOW weapon type
      if (key === 'e' && currentWeapon === WeaponType.BOW && isBowCharging) {
        // Check for perfect shot for Elemental subclass during perfect shot window
        const actualIsPerfectShot = currentSubclass === WeaponSubclass.ELEMENTAL && isPerfectShotWindow;
        
        // Only release if auto-release hasn't already happened
        if (!hasAutoReleasedBowShot) {
          releaseBowShot(bowChargeProgress, actualIsPerfectShot);
        }
      }

      // Handle whirlwind cancellation for SPEAR
      if (key === 'e' && currentWeapon === WeaponType.SPEAR && isWhirlwinding) {
        setIsWhirlwinding(false);
        whirlwindStartTime.current = null;
        onAbilityUse(currentWeapon, 'e');
      }

      // Handle firebeam cancellation for SABRES
      if (key === '1' && currentWeapon === WeaponType.SABRES && isFirebeaming) {
        setIsFirebeaming(false);
        firebeamStartTime.current = null;
        onAbilityUse(currentWeapon, 'passive');
      }

      // Handle firebeam cancellation for Frost Sabres using 'e' key
      if (key === 'e' && currentWeapon === WeaponType.SABRES && currentSubclass === WeaponSubclass.FROST && isFirebeaming) {
        setIsFirebeaming(false);
        firebeamStartTime.current = null;
        if (stopFirebeam) {
          stopFirebeam();
        }
        onAbilityUse(currentWeapon, 'e');
      }

      // Handle Pyroclast release for Pyro Spear using 'e' key
      if (key === 'e' && currentWeapon === WeaponType.SPEAR && currentSubclass === WeaponSubclass.PYRO && isPyroclastActive) {
        releasePyroclastCharge();
        onAbilityUse(currentWeapon, 'e');
      }

      // Reset ability key states on key release
      if (key === '1') {
        abilityKeysPressed.current['1'] = false;
      }

      if (key === '3') {
        abilityKeysPressed.current['3'] = false;
      }

      if (key === 'r' && currentWeapon === WeaponType.SPEAR && isPyroclastActive) {
        releasePyroclastCharge();
        onAbilityUse(currentWeapon, 'r');
      }

      // Handle ThrowSpear release for Storm Spear using 'r' key
      if (key === 'r' && currentWeapon === WeaponType.SPEAR && currentSubclass === WeaponSubclass.STORM && isThrowSpearCharging && releaseThrowSpearCharge) {
        releaseThrowSpearCharge();
        // Note: onAbilityUse is called when the charge starts, not when released
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [
    handleVaultActivation,
    activeVault,
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
    shootGlacialShard,
    isPyroclastActive,
    startPyroclastCharge,
    releasePyroclastCharge,
    isBreaching,
    setIsBreaching,
    activateBreach,
    setIsFirebeaming,
    firebeamStartTime,
    isFirebeaming,
    shootBarrage,
    activateAegis,
    isAegisActive,
    aegisBlockedDamage,
    currentSubclass,
    activateMeteorSwarm,
    castGuidedBolts,
    lastLightningTarget,
    isDivineStorming,
    setIsDivineStorming,
    setFireballCharges,
    shootViperSting,
      activateColossusStrike,
  onEviscerate,
  hasInstantPowershot,
    setHasInstantPowershot,
    level,
    castSoulReaper,
    resetSwordCombo,
    resetIcicleCombo,
    activateBlizzardShield,
    isPerfectShotWindow,
    shootLavaLash,
    startThrowSpearCharge,
    releaseThrowSpearCharge,
    isThrowSpearCharging,
    isSpearThrown,
    isInRoom,
    isPlayer,
    sendEffect,
    isStunned,
    onBoneclaw,
    hasAutoReleasedBowShot,
    setHasAutoReleasedBowShot,
    isAbilityBowAnimation,
    triggerDivineStorm
  ]);

  // Mouse event handlers to check game over state
  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (isGameOver.current) return; // Ignore mouse events if game is over
      if (e.button === 0) {
        keys.current['mouse0'] = true;
        // Immediately try to attack on mouse down for responsiveness
        if (!isSwinging && !(currentWeapon === WeaponType.SPEAR && isWhirlwinding)) {
          if (currentWeapon === WeaponType.BOW) {
            // Prevent quick shot during ability animations (Barrage, Viper Sting, etc.)
            if (!isAbilityBowAnimation) {
              shootQuickShot();
            }
          } else {
            tryAttack();
          }
        }

        // Begin continuous auto-attack while the button is held
        startAutoAttack();
      }
    };

    const handleMouseUp = (e: MouseEvent) => {
      if (isGameOver.current) return; // Ignore mouse events if game is over
      if (e.button === 0) {
        keys.current['mouse0'] = false;

        // Stop auto-attacking when the button is released
        stopAutoAttack();
      }
    };

    window.addEventListener('mousedown', handleMouseDown);
    window.addEventListener('mouseup', handleMouseUp);

    return () => {
      window.removeEventListener('mousedown', handleMouseDown);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [keys, isSwinging, currentWeapon, isWhirlwinding, tryAttack, shootQuickShot, startAutoAttack, stopAutoAttack, isAbilityBowAnimation]);

  // Update the ref when ATTACK_DEBOUNCE changes
  useEffect(() => {
    attackDebounceRef.current = ATTACK_DEBOUNCE;
  }, [ATTACK_DEBOUNCE]);

  // Clean up on unmount
  useEffect(() => stopAutoAttack, [stopAutoAttack]);

  useEffect(() => {
    const handleGameOver = () => {
      isGameOver.current = true;

      // Ensure we stop any running auto-attack timer when the game ends
      stopAutoAttack();

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
  }, [stopAutoAttack]);

  // Add a useEffect that monitors fireballCharges to detect when all charges are depleted during whirlwind
  useEffect(() => {
    // Check if whirlwind is active but there are no charges available
    if (isWhirlwinding && currentWeapon === WeaponType.SPEAR) {
      const hasAvailableCharges = fireballCharges.some(charge => charge.available);
      if (!hasAvailableCharges) {
        // End whirlwind and trigger cooldown
        setIsWhirlwinding(false);
        whirlwindStartTime.current = null;
        onAbilityUse(currentWeapon, 'e');
      }
    }
  }, [fireballCharges, isWhirlwinding, currentWeapon, setIsWhirlwinding, whirlwindStartTime, onAbilityUse]);
}