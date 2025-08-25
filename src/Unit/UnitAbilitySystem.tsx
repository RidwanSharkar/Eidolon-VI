import React, { useMemo } from 'react';
import { Group, Vector3 } from 'three';
import { WeaponType, WeaponSubclass, WeaponInfo, AbilityType } from '../Weapons/weapons';
import { useAbilityKeys } from './useAbilityKeys';

// Import ability hooks that are actually used
import { useBreachController } from '../Spells/Breach/useBreachController';
import { useMeteorSwarm } from '../Spells/MeteorSwarm/useMeteorSwarm';
import { usePyroclast } from '../Spells/Pyroclast/usePyroclast';
import { useStealthEffect } from '../Spells/Stealth/useStealthEffect';
import { ReigniteRef } from '../Spells/Reignite/Reignite';
import { OrbShieldRef } from '../Spells/Avalanche/OrbShield';
import { SynchronizedEffect } from '../Multiplayer/MultiplayerContext';
// Removed unused ability hook imports

interface ActiveEffect {
  id: number;
  type: string;
  position: Vector3;
  direction: Vector3;
  duration?: number;
  startTime?: number;
  parentRef?: React.RefObject<Group>;
  enemyId?: string;
  targetPosition?: Vector3;
  targetId?: string;
}

interface UnitAbilitySystemProps {
  groupRef: React.RefObject<Group>;
  currentWeapon: WeaponType;
  currentSubclass?: WeaponSubclass;
  abilities: WeaponInfo;
  level: number;
  health: number;
  maxHealth: number;
  
  // Key handling
  keys: React.MutableRefObject<Record<string, boolean>>;
  
  // Animation states
  isSwinging: boolean;
  setIsSwinging: (swinging: boolean) => void;
  isSmiting: boolean;
  setIsSmiting: (smiting: boolean) => void;
  isBowCharging: boolean;
  setIsBowCharging: (charging: boolean) => void;
  setBowChargeStartTime: (time: number | null) => void;
  bowChargeProgress: number;
  isWhirlwinding: boolean;
  setIsWhirlwinding: (whirlwinding: boolean) => void;
  whirlwindStartTime: React.MutableRefObject<number | null>;
  isFirebeaming: boolean;
  setIsFirebeaming: (firebeaming: boolean) => void;
  firebeamStartTime: React.MutableRefObject<number | null>;
  isBreaching: boolean;
  setIsBreaching: (breaching: boolean) => void;
  isOathstriking: boolean;
  setIsOathstriking: (oathstriking: boolean) => void;
  isDivineStorming: boolean;
  setIsDivineStorming: (divineStorming: boolean) => void;
  isPerfectShotWindow: boolean;
  hasAutoReleasedBowShot: boolean;
  setHasAutoReleasedBowShot: (released: boolean) => void;
  isAbilityBowAnimation: boolean;
  
  // Combo states
  swordComboStep: 1 | 2 | 3;
  setSwordComboStep: (step: 1 | 2 | 3 | ((prev: 1 | 2 | 3) => 1 | 2 | 3)) => void;
  lastSwordSwingTime: React.MutableRefObject<number>;
  icicleComboStep: 1 | 2 | 3;
  setIcicleComboStep: (step: 1 | 2 | 3 | ((prev: 1 | 2 | 3) => 1 | 2 | 3)) => void;
  lastIcicleShootTime: React.MutableRefObject<number>;
  
  // Effects
  setActiveEffects: React.Dispatch<React.SetStateAction<ActiveEffect[]>>;
  setSmiteEffects: React.Dispatch<React.SetStateAction<Array<{ id: number; position: Vector3 }>>>;
  nextSmiteId: React.MutableRefObject<number>;
  
  // Charges
  fireballCharges: Array<{
    id: number;
    available: boolean;
    cooldownStartTime: number | null;
  }>;
  setFireballCharges: React.Dispatch<React.SetStateAction<Array<{
    id: number;
    available: boolean;
    cooldownStartTime: number | null;
  }>>>;
  
  // Enemy data
  enemyData: Array<{
    id: string;
    position: Vector3;
    health: number;
    maxHealth: number;
    isDying?: boolean;
  }>;
  
  // Refs for external access
  reanimateRef: React.RefObject<{
    castReanimate: () => boolean;
  }>;
  orbShieldRef: React.RefObject<OrbShieldRef>;
  reigniteRef: React.RefObject<ReigniteRef>;
  
  // Callback functions
  onAbilityUse: (weapon: WeaponType, abilityType: AbilityType) => void;
  onHealthChange?: (health: number) => void;
  shootFireball: () => void;
  releaseBowShot: (progress: number, isPerfectShot?: boolean) => void;
  activateOathstrike: () => { position: Vector3; direction: Vector3; onComplete: () => void } | null;
  triggerDivineStorm: () => void;
  activateColossusStrike: () => boolean;
  castGuidedBolts: (targetId: string) => boolean;
  lastLightningTarget: string | null;
  
  // Vault
  activateVault: (direction: 'south' | 'north' | 'east' | 'west') => void;
  activeVault: { isActive: boolean; direction: 'south' | 'north' | 'east' | 'west' | null };
  canVault: () => boolean;
  
  // Aegis
  isAegisActive: boolean;
  aegisBlockedDamage: React.MutableRefObject<number>;
  
  // Stealth
  activateStealth: () => void;
  
  // Instant powershot for Venom Bow
  hasInstantPowershot?: boolean;
  setHasInstantPowershot?: (available: boolean) => void;
  
  // Blizzard shield
  activateBlizzardShield?: () => void;
  
  // Eviscerate and Boneclaw
  onEviscerate?: () => void;
  onBoneclaw?: () => void;
  
  // Player stun
  isPlayerStunned?: boolean;
  
  // Multiplayer
  isInRoom?: boolean;
  isPlayer?: boolean;
  sendEffect?: (effect: Omit<SynchronizedEffect, 'id' | 'startTime'>) => void;
  healAllies?: (amount: number, position: Vector3, source: string) => void;
  
  // Additional ability functions
  startFirebeam?: () => boolean;
  stopFirebeam?: () => void;
  startBurstSequence?: () => void;
  shootLavaLash?: () => void;
  shootIcicle?: () => boolean;
  shootQuickShot?: () => void;
  shootBarrage?: () => void;
  shootGlacialShard?: () => boolean;
  shootViperSting?: () => boolean;
  castReanimate?: () => boolean;
  castSoulReaper?: () => boolean;
  activateAegis?: () => boolean;
  activateBreach?: () => boolean;
  activateMeteorSwarm?: () => boolean;
  startPyroclastCharge?: () => void;
  releasePyroclastCharge?: () => void;
  isPyroclastActive?: boolean;
  startThrowSpearCharge?: () => void;
  releaseThrowSpearCharge?: () => void;
  isThrowSpearCharging?: boolean;
  isSpearThrown?: boolean;
}

export interface UnitAbilitySystemRef {
  // Expose ability functions that might be called externally
  castReanimate: () => void;
  castSoulReaper?: () => boolean;
  shootGlacialShard?: () => boolean;
  shootViperSting: () => boolean;
  shootQuickShot: () => void;
  shootBarrage: () => void;
  activateAegis?: () => boolean;
  startFirebeam?: () => boolean;
  stopFirebeam?: () => void;
  startBurstSequence?: () => void;
  shootLavaLash?: () => void;
  shootIcicle?: () => boolean;
  startPyroclastCharge: () => void;
  releasePyroclastCharge: () => void;
  isPyroclastActive: boolean;
  activateBreach: () => boolean;
  activateMeteorSwarm: () => boolean;
  startThrowSpearCharge?: () => void;
  releaseThrowSpearCharge?: () => void;
  isThrowSpearCharging?: boolean;
  isSpearThrown?: boolean;
}

const UnitAbilitySystem = React.memo(React.forwardRef<UnitAbilitySystemRef, UnitAbilitySystemProps>(({
  groupRef,
  currentWeapon,
  currentSubclass,
  abilities,
  level,
  health,
  maxHealth,
  keys,
  isSwinging,
  setIsSwinging,
  isSmiting,
  setIsSmiting,
  isBowCharging,
  setIsBowCharging,
  setBowChargeStartTime,
  bowChargeProgress,
  isWhirlwinding,
  setIsWhirlwinding,
  whirlwindStartTime,
  isFirebeaming,
  setIsFirebeaming,
  firebeamStartTime,
  isBreaching,
  setIsBreaching,
  isOathstriking,
  setIsOathstriking,
  isDivineStorming,
  setIsDivineStorming,
  isPerfectShotWindow,
  hasAutoReleasedBowShot,
  setHasAutoReleasedBowShot,
  isAbilityBowAnimation,
  swordComboStep,
  setSwordComboStep,
  lastSwordSwingTime,
  icicleComboStep,
  setIcicleComboStep,
  lastIcicleShootTime,
  setActiveEffects,
  setSmiteEffects,
  nextSmiteId,
  fireballCharges,
  setFireballCharges,
  enemyData,
  reanimateRef,
  orbShieldRef,
  reigniteRef,
  onAbilityUse,
  onHealthChange,
  shootFireball,
  releaseBowShot,
  activateOathstrike,
  triggerDivineStorm,
  activateColossusStrike,
  castGuidedBolts,
  lastLightningTarget,
  activateVault,
  activeVault,
  canVault,
  isAegisActive,
  aegisBlockedDamage,
  // activateStealth, // Used in abilityFunctions
  hasInstantPowershot,
  setHasInstantPowershot,
  activateBlizzardShield,
  onEviscerate,
  onBoneclaw,
  isPlayerStunned,
  isInRoom,
  isPlayer,
  sendEffect,
  healAllies,
  startFirebeam,
  stopFirebeam,
  startBurstSequence,
  shootLavaLash,
  shootIcicle,
  shootQuickShot,
  shootBarrage,
  shootGlacialShard,
  shootViperSting,
  // castReanimate, // Used in abilityFunctions
  castSoulReaper,
  activateAegis,
  // activateBreach, // Used in abilityFunctions
  // activateMeteorSwarm, // Used in abilityFunctions
  // startPyroclastCharge, // Used in abilityFunctions
  // releasePyroclastCharge, // Used in abilityFunctions
  // isPyroclastActive, // Used in abilityFunctions
  startThrowSpearCharge,
  releaseThrowSpearCharge,
  isThrowSpearCharging,
  isSpearThrown
}, ref) => {
  
  // Initialize ability hooks
  const { activateBreach: breachController } = useBreachController({
    parentRef: groupRef,
    charges: fireballCharges,
    setCharges: setFireballCharges,
    reigniteRef
  });
  
  const { castMeteorSwarm } = useMeteorSwarm({
    enemyData: enemyData.map(enemy => ({
      ...enemy,
      rotation: 0,
      initialPosition: enemy.position.clone()
    })),
    onHit: () => {},
    playerPosition: groupRef.current?.position || new Vector3()
  });
  
  const { startCharging: pyroclastStart, releaseCharge: pyroclastRelease, isCharging: pyroclastActive } = usePyroclast({
    parentRef: groupRef,
    onHit: () => {},
    enemyData,
    setDamageNumbers: () => {},
    nextDamageNumberId: { current: 0 },
    charges: fireballCharges,
    setCharges: setFireballCharges,
    reigniteRef
  });
  
  const { activateStealth: stealthActivate } = useStealthEffect({
    onStealthStart: () => {},
    onStealthEnd: () => {}
  });
  
  // Memoize ability functions to prevent unnecessary re-renders
  const abilityFunctions = useMemo(() => ({
    shootFireball,
    releaseBowShot,
    startFirebeam: startFirebeam || (() => false),
    stopFirebeam: stopFirebeam || (() => {}),
    castReanimate: () => {
      const success = reanimateRef.current?.castReanimate();
      if (success && isInRoom && isPlayer && groupRef.current && healAllies) {
        healAllies(7, groupRef.current.position.clone(), 'reanimate');
      }
      return success;
    },
    castSoulReaper: () => {
      return castSoulReaper?.() || false;
    },
    health,
    startBurstSequence: startBurstSequence || (() => {}),
    shootLavaLash: shootLavaLash || (() => {}),
    shootIcicle: shootIcicle || (() => false),
    maxHealth,
    onHealthChange,
    activateOathstrike,
    setIsOathstriking,
    orbShieldRef,
    isWhirlwinding,
    setIsWhirlwinding: (value: boolean) => {
      setIsWhirlwinding(value);
      if (value && isInRoom && isPlayer && groupRef.current && sendEffect) {
        sendEffect({
          type: 'whirlwind',
          position: groupRef.current.position.clone(),
          direction: new Vector3(0, 0, 1).applyQuaternion(groupRef.current.quaternion),
          duration: 15000
        });
      }
    },
    whirlwindStartTime,
    fireballCharges,
    setFireballCharges,
    activateStealth: () => {
      stealthActivate();
      if (isInRoom && isPlayer && groupRef.current && sendEffect) {
        sendEffect({
          type: 'stealth',
          position: groupRef.current.position.clone(),
          direction: new Vector3(0, 0, 1).applyQuaternion(groupRef.current.quaternion),
          duration: 3500
        });
      }
    },
    shootQuickShot: shootQuickShot || (() => {}),
    shootGlacialShard: shootGlacialShard || (() => false),
    shootBarrage: shootBarrage || (() => {}),
    shootViperSting: shootViperSting || (() => false),
    activateVault,
    activeVault,
    canVault,
    startPyroclastCharge: pyroclastStart,
    releasePyroclastCharge: pyroclastRelease,
    isPyroclastActive: pyroclastActive,
    isBreaching,
    setIsBreaching,
    activateBreach: breachController,
    activateMeteorSwarm: () => castMeteorSwarm(),
    setSwordComboStep,
    lastSwordSwingTime,
    setIcicleComboStep,
    lastIcicleShootTime,
    setIsFirebeaming,
    firebeamStartTime,
    isFirebeaming,
    activateAegis: activateAegis || (() => false),
    isAegisActive,
    aegisBlockedDamage,
    reanimateRef,
    castGuidedBolts,
    lastLightningTarget,
    isDivineStorming,
    setIsDivineStorming,
    triggerDivineStorm,
    activateColossusStrike,
    onEviscerate: onEviscerate || (() => {}),
    onBoneclaw: onBoneclaw || (() => {}),
    hasInstantPowershot,
    setHasInstantPowershot,
    level,
    activateBlizzardShield: activateBlizzardShield || (() => {}),
    isPerfectShotWindow,
    hasAutoReleasedBowShot,
    setHasAutoReleasedBowShot,
    startThrowSpearCharge: startThrowSpearCharge || (() => {}),
    releaseThrowSpearCharge: releaseThrowSpearCharge || (() => {}),
    isThrowSpearCharging: isThrowSpearCharging || false,
    isSpearThrown: isSpearThrown || false,
    sendEffect,
    isInRoom,
    isPlayer,
    isStunned: isPlayerStunned,
    // Add missing state variables that abilities need
    isOathstriking: isOathstriking,
    isAbilityBowAnimation: isAbilityBowAnimation,
    swordComboStep: swordComboStep,
    icicleComboStep: icicleComboStep
  }), [
    shootFireball, releaseBowShot, startFirebeam, stopFirebeam, reanimateRef, castSoulReaper,
    health, startBurstSequence, shootLavaLash, shootIcicle, maxHealth, onHealthChange,
    activateOathstrike, setIsOathstriking, orbShieldRef, isWhirlwinding, setIsWhirlwinding,
    whirlwindStartTime, fireballCharges, setFireballCharges, stealthActivate, shootQuickShot,
    shootGlacialShard, shootBarrage, shootViperSting, activateVault, activeVault, canVault,
    pyroclastStart, pyroclastRelease, pyroclastActive, isBreaching, setIsBreaching,
    breachController, castMeteorSwarm, setSwordComboStep, lastSwordSwingTime, setIcicleComboStep,
    lastIcicleShootTime, setIsFirebeaming, firebeamStartTime, isFirebeaming, activateAegis,
    isAegisActive, aegisBlockedDamage, castGuidedBolts, lastLightningTarget, isDivineStorming,
    setIsDivineStorming, triggerDivineStorm,     activateColossusStrike, onEviscerate, onBoneclaw,
    hasInstantPowershot, setHasInstantPowershot, level, activateBlizzardShield, isPerfectShotWindow,
    hasAutoReleasedBowShot, setHasAutoReleasedBowShot, startThrowSpearCharge, releaseThrowSpearCharge,
    isThrowSpearCharging, isSpearThrown, sendEffect, isInRoom, isPlayer, isPlayerStunned,
    groupRef, healAllies, isOathstriking, isAbilityBowAnimation, swordComboStep, icicleComboStep
  ]);
  
  // Initialize useAbilityKeys with all the ability functions
  useAbilityKeys({
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
    setBowChargeStartTime: (value) => {
      setBowChargeStartTime(value);
      if (value !== null && isInRoom && isPlayer && groupRef.current && sendEffect) {
        sendEffect({
          type: 'bowCharge',
          position: groupRef.current.position.clone(),
          direction: new Vector3(0, 0, 1).applyQuaternion(groupRef.current.quaternion),
          duration: 2000
        });
      }
    },
    setSmiteEffects: (callback) => {
      setSmiteEffects(prev => {
        const newEffects = callback(prev);
        const addedEffects = newEffects.filter(effect => 
          !prev.some(prevEffect => prevEffect.id === effect.id)
        );
        
        if (addedEffects.length > 0 && isInRoom && isPlayer && groupRef.current && sendEffect) {
          addedEffects.forEach(effect => {
            sendEffect({
              type: 'smite',
              position: groupRef.current!.position.clone(),
              direction: new Vector3(0, 0, 1).applyQuaternion(groupRef.current!.quaternion),
              targetPosition: effect.position.clone(),
              duration: 1000
            });
          });
        }
        
        return newEffects;
      });
    },
    setActiveEffects,
    onAbilityUse,
    ...abilityFunctions
  });
  
  // Expose functions through ref
  React.useImperativeHandle(ref, () => ({
    castReanimate: abilityFunctions.castReanimate,
    castSoulReaper: abilityFunctions.castSoulReaper,
    shootGlacialShard: abilityFunctions.shootGlacialShard,
    shootViperSting: abilityFunctions.shootViperSting,
    shootQuickShot: abilityFunctions.shootQuickShot,
    shootBarrage: abilityFunctions.shootBarrage,
    activateAegis: abilityFunctions.activateAegis,
    startFirebeam: abilityFunctions.startFirebeam,
    stopFirebeam: abilityFunctions.stopFirebeam,
    startBurstSequence: abilityFunctions.startBurstSequence,
    shootLavaLash: abilityFunctions.shootLavaLash,
    shootIcicle: abilityFunctions.shootIcicle,
    startPyroclastCharge: abilityFunctions.startPyroclastCharge,
    releasePyroclastCharge: abilityFunctions.releasePyroclastCharge,
    isPyroclastActive: abilityFunctions.isPyroclastActive,
    activateBreach: abilityFunctions.activateBreach,
    activateMeteorSwarm: abilityFunctions.activateMeteorSwarm,
    startThrowSpearCharge: abilityFunctions.startThrowSpearCharge,
    releaseThrowSpearCharge: abilityFunctions.releaseThrowSpearCharge,
    isThrowSpearCharging: abilityFunctions.isThrowSpearCharging,
    isSpearThrown: abilityFunctions.isSpearThrown
  }), [abilityFunctions]);
  
  return null; // This component only handles ability logic, no rendering
}));

UnitAbilitySystem.displayName = 'UnitAbilitySystem';

export default UnitAbilitySystem;