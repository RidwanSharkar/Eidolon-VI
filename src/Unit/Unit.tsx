// src/unit/Unit.tsx
import { useRef, useState, useEffect, useCallback, useMemo, useImperativeHandle } from 'react';
import { Vector3, Group } from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import Fireball from '../Spells/Fireball/Fireball';
import CrossentropyBolt from '../Spells/Fireball/CrossentropyBolt';
import * as THREE from 'three';
import { WeaponType, WeaponSubclass, WEAPON_DAMAGES, WEAPON_ORB_COUNTS, getWeaponDamage } from '../Weapons/weapons';

import Scythe from '@/Weapons/Scythe';
import Sword from '@/Weapons/Sword';
import Shield from '@/Weapons/Shield';
import Sabres from '@/Weapons/Sabres';
import EtherealBow from '@/Weapons/EtherBow';
import Spear from '@/Weapons/Spear';

import Smite from '@/Spells/Smite/Smite';
import DamageNumber from '@/Interface/DamageNumber';
import { DamageNumber as DamageNumberType } from './useDamageNumbers';
import Billboard from '@/Interface/Billboard';
import GhostTrail from '@/color/GhostTrail';
import BoneWings from '@/gear/BoneWings';
import BoneAura from '@/color/BoneAura';
import BonePlate from '@/gear/BonePlate';
import BoneTail from '@/gear/BoneTail';
import BoneVortex from '@/color/BoneVortex';
import { UnitProps, AllSummonedUnitInfo } from '@/Unit/UnitProps';
import { useUnitControls } from '@/Unit/useUnitControls';
import { calculateDamage } from '@/Weapons/damage';
import Boneclaw from '@/Spells/Boneclaw/Boneclaw';
import { useConcussiveBlow } from '@/Spells/ConcussiveBlow/useConcussiveBlow';
import ConcussiveStunEffect from '@/Spells/ConcussiveBlow/ConcussiveStunEffect';
import ConcussiveLightningStrike from '@/Spells/ConcussiveBlow/ConcussiveLightningStrike';
import PlayerStunEffect from '@/Spells/ConcussiveBlow/PlayerStunEffect';
import { useThrowSpear } from '@/Spells/ThrowSpear/useThrowSpear';
import ThrowSpear from '@/Spells/ThrowSpear/ThrowSpear';
import ThrowSpearChargeEffect from '@/Spells/ThrowSpear/ThrowSpearChargeEffect';
import EvisceratestunEffect from '@/Spells/Eviscerate/EvisceratestunEffect';
import Blizzard from '@/Spells/Blizzard/Blizzard';
import { useBlizzardShield } from '@/Spells/Blizzard/useBlizzardShield';
import Firestorm from '@/Spells/Firestorm/Firestorm';
import DivineStorm from '@/Spells/DivineStorm/DivineStorm';
import { useAbilityKeys } from '@/Unit/useAbilityKeys';
import { useFirebeamManager } from '@/Spells/Firebeam/useFirebeamManager';
import Firebeam from '@/Spells/Firebeam/Firebeam';
import IcicleOrbitals, { IcicleCharge } from '@/Spells/Firebeam/IcicleOrbitals';
import ChargedOrbitals, { ORBITAL_COOLDOWN } from '@/color/ChargedOrbitals';
import ElementalTrail from '@/Spells/Summon/ElementalTrail';
import Reanimate, { ReanimateRef } from '../Spells/Reanimate/Reanimate';
import Oathstrike from '@/Spells/Oathstrike/Oathstrike';
import { useOathstrike } from '../Spells/Oathstrike/useOathstrike';
import { useHealing } from '@/Unit/useHealing';
import SoulReaper, { SoulReaperRef } from '../Spells/SoulReaper/SoulReaper';

import Aegis from '@/Spells/Aegis/Aegis';

import { useAegis } from '../Spells/Aegis/useAegis';
import HolyNova from '@/color/HolyNova';
import CrusaderAura from '../Spells/CrusaderAura/CrusaderAura';
import FrenzyAura, { FrenzyAuraRef } from '../Spells/FrenzyAura/FrenzyAura';
import { useLegionEmpowerment, LegionEmpowermentRef } from '../Spells/Legion/useLegionEmpowerment';
import AbyssalSlashEffect from '../Spells/FrenzyAura/AbyssalSlashEffect';
import Summon from '@/Spells/Summon/Summon';
import Elemental from '@/Spells/Summon/Elemental';
import { useChaosTotemHealing } from '@/Spells/Summon/useChaosTotemHealing';
import DragonBreath from '@/Spells/DragonBreath/DragonBreath';
import { calculateDragonBreathHits } from '@/Spells/DragonBreath/DragonBreathDamage';
import Legion from '@/Spells/Legion/Legion';
import AbyssalAbominationSummon from '@/Spells/Legion/AbyssalAbominationSummon';
import { OrbShieldRef } from '@/Spells/Avalanche/OrbShield';
import ChainLightning from '@/Spells/ChainLightning/ChainLightning';
import OrbShield from '@/Spells/Avalanche/OrbShield';
import { FrostExplosion } from '@/Spells/Avalanche/FrostExplosion';
import FrozenEffect from '@/Spells/Firebeam/FrozenEffect';
import Raze from '@/Spells/Raze/Raze';
import { DragonHorns } from '@/gear/DragonHorns';
import Whirlwind from '@/Spells/Whirlwind/Whirlwind';
import { useStealthEffect } from '../Spells/Stealth/useStealthEffect';
import { stealthManager } from '../Spells/Stealth/StealthManager';
import MeteorSwarm from '@/Spells/MeteorSwarm/MeteorSwarm';
import { useMeteorSwarm } from '@/Spells/MeteorSwarm/useMeteorSwarm';
import { useStealthHealing } from '@/Spells/Stealth/useStealthHealing';
import StealthMistEffect from '../Spells/Stealth/StealthMistEffect';
import StealthStrikeEffect from '@/Spells/Stealth/StealthStrikeEffect';
import { useQuickShot } from '../Spells/QuickShot/QuickShot';
import BoneArrow from '@/Spells/QuickShot/BoneArrow';
import UnifiedVault, { VaultDirection } from '@/Spells/Vault/UnifiedVault';

import { usePyroclast } from '../Spells/Pyroclast/usePyroclast';
import PyroclastMissile from '../Spells/Pyroclast/PyroclastMissile';
import Reignite, { ReigniteRef } from '../Spells/Reignite/Reignite';
import PyrochargeEffect from '../Spells/Pyroclast/PyrochargeEffect';
import PyroclastExplosion from '@/Spells/Pyroclast/PyroclastExplosion';
import Breach from '@/Spells/Breach/Breach';
import { useBreachController } from '@/Spells/Breach/useBreachController';
import { useBowLightning } from '@/Spells/BowLightning/useBowLightning';
import BowLightningStrike from '@/Spells/BowLightning/BowLightningStrike';
import ColossusStrikeLightning from '@/Spells/BowLightning/ColossusStrikeLightning';
import { useBowPowershot } from '@/Spells/BowPowershot/useBowPowershot';
import BowPowershot from '@/Spells/BowPowershot/BowPowershot';
import { useGuidedBolts } from '@/Spells/GuidedBolts/useGuidedBolts';
import GuidedBolts from '@/Spells/GuidedBolts/GuidedBolts';
import EagleEyeManager from '@/Spells/EagleEye/EagleEyeManager';
import { useBarrage } from '@/Spells/Barrage/useBarrage';
import GlacialShard, { GlacialShardRef } from '@/Spells/GlacialShard/GlacialShard';
import { useViperSting } from '@/Spells/ViperSting/useViperSting';
import ViperSting from '@/Spells/ViperSting/ViperSting';
import SoulStealEffect from '@/Spells/ViperSting/SoulStealEffect';
import { useViperStingBeam } from '@/Spells/ViperSting/useViperStingBeam';
import ViperStingBeam from '@/Spells/ViperSting/ViperStingBeam';
import { useMultiplayer } from '@/Multiplayer/MultiplayerContext';
import { useLifesteal } from '@/Spells/Lifesteal/useLifesteal';
import HolyBurn from '@/color/HolyBurn';
import EviscerateSlashEffect from '@/Spells/Eviscerate/EviscerateSlashEffect';
import { useEviscerate } from '@/Spells/Eviscerate/useEviscerate';
import { useBoneclaw } from '@/Spells/Boneclaw/useBoneclaw';
import { useDivineShield } from '@/Unit/useDivineShield';
import { useLavaLash } from '@/Spells/LavaLash/useLavaLash';
import LavaLashProjectile from '@/Spells/LavaLash/LavaLashProjectile';
import { IncinerateEmpowerment } from '@/color/IncinerateEmpowerment';
import { findHighestPriorityTarget } from '@/Versus/enemy';
import { performanceMonitor } from '@/Scene/PerformanceMonitor';

class ObjectPool<T> {
  private pool: T[] = [];
  private createFn: () => T;
  private resetFn: (obj: T) => void;

  constructor(initialSize: number, createFn: () => T, resetFn: (obj: T) => void) {
    this.createFn = createFn;
    this.resetFn = resetFn;
    for (let i = 0; i < initialSize; i++) {
      this.pool.push(createFn());
    }
  }

  acquire(): T {
    return this.pool.pop() || this.createFn();
  }

  release(obj: T): void {
    this.resetFn(obj);
    this.pool.push(obj);
  }
}

//=====================================================================================================

//  ORBITAL CHARGES FIREBALL INTERFACE 
interface FireballData {
  id: number;
  position: Vector3;
  direction: Vector3;
  startPosition: Vector3;
  maxDistance: number;
  isCrossentropyBolt?: boolean;
}

//=====================================================================================================

// Icicle Projectile with Trail component
interface IcicleProjectileWithTrailProps {
  projectile: {
    id: number;
    position: Vector3;
    direction: Vector3;
    opacity: number;
  };
}

function IcicleProjectileWithTrail({ projectile }: IcicleProjectileWithTrailProps) {
  const projectileRef = useRef<THREE.Group>(null);

  // Update position when projectile position changes
  useEffect(() => {
    if (projectileRef.current) {
      projectileRef.current.position.copy(projectile.position);
    }
  }, [projectile.position]);

  return (
    <group>
      {/* Icicle trail effect - smaller than elemental */}
      <ElementalTrail
        color={new THREE.Color("#CCFFFF")}
        size={0.2} // Smaller than elemental (0.35)
        meshRef={projectileRef}
        opacity={projectile.opacity * 0.8}
      />
      
      <group 
        ref={projectileRef}
        position={projectile.position.toArray()}
        rotation={[
          0, // No X rotation
          Math.atan2(projectile.direction.x, projectile.direction.z), // Yaw rotation to point towards target
          0  // No Z rotation
        ]}
      >
        {/* Main icicle body - rotated to point forward like ElementalProjectile */}
        <mesh rotation={[Math.PI/2, 0, 0]}>
          <coneGeometry args={[0.08, 0.4, 6]} />
          <meshStandardMaterial
            color="#AAEEFF"
            emissive="#AAEEFF"
            emissiveIntensity={0.8}
            transparent
            opacity={projectile.opacity}
          />
        </mesh>
        
        {/* Subtle glow effect */}
        <pointLight 
          color="#CCFFFF"
          intensity={0.5 * projectile.opacity}
          distance={2}
          decay={2}
        />
      </group>
    </group>
  );
}

// Import performance monitor - will be imported at the top of the file

//=====================================================================================================

// EXPORT UNIT
export default function Unit({
  onHit,
  controlsRef,
  currentWeapon,
  currentSubclass,
  health,
  maxHealth,
  isPlayer = false,
  abilities,
  onAbilityUse,
  onPositionUpdate,
  enemyData,
  onHealthChange,
  fireballManagerRef,
  level = 1,
  onAegisStateChange,
  onFreezeStateCheck,
  onFrozenEnemyIdsUpdate,
  onStealthKillCountChange,
  onGlacialShardKillCountChange,
  onSkeletonCountChange,
  canVault,
  consumeDashCharge,
  onApplySlowEffect,
  onApplyStunEffect,
  onApplyKnockbackEffect,
  glacialShardRef: externalGlacialShardRef,
  onShieldStateChange,
  onSummonedUnitsUpdate,
  playerStunRef,
  onDamage,
  onEviscerateLashesChange,
  onBoneclawChargesChange,
  onIncinerateStacksChange,
  onResetAbilityCooldown,
}: UnitProps) {
  const groupRef = useRef<Group>(null);
  const [isSwinging, setIsSwinging] = useState(false);
  const [fireballs, setFireballs] = useState<FireballData[]>([]);
  const nextFireballId = useRef(0);
  const { camera } = useThree();
  const [isBowCharging, setIsBowCharging] = useState(false);
  
  // Sword combo state tracking
  const [swordComboStep, setSwordComboStep] = useState<1 | 2 | 3>(1);
  const lastSwordSwingTime = useRef<number>(0);
  
  // Icicle combo state tracking (for FROST sabres)
  const [icicleComboStep, setIcicleComboStep] = useState<1 | 2 | 3>(1);
  const lastIcicleShootTime = useRef<number>(0);
  
  // Multiplayer context for syncing effects
  const { sendEffect, isInRoom, healAllies } = useMultiplayer();
  
  // SKELETON COUNT for Abyssal Scythe FrenzyAura
  const [skeletonCount, setSkeletonCount] = useState(0);
  const [soulReaperSkeletons, setSoulReaperSkeletons] = useState(0);

  
  // FrenzyAura empowered attack system
  const frenzyAuraRef = useRef<FrenzyAuraRef>(null);
  const [abyssalSlashEffects, setAbyssalSlashEffects] = useState<Array<{
    id: string;
    position: Vector3;
    direction: Vector3;
    damage: number;
  }>>([]);
  
  // Legion empowerment system (10 second buff from meteor impact)
  const legionEmpowermentRef = useRef<LegionEmpowermentRef>(null);
  const legionEmpowerment = useLegionEmpowerment();
  
  // Expose Legion empowerment functions through the ref
  useImperativeHandle(legionEmpowermentRef, () => ({
    isEmpowered: legionEmpowerment.isEmpowered,
    timeRemaining: legionEmpowerment.timeRemaining,
    activateEmpowerment: legionEmpowerment.activateEmpowerment
  }), [legionEmpowerment]);
  
  // Debug: Log when Legion empowerment state changes
  useEffect(() => {
    console.log('[Unit] Legion empowerment state changed:', {
      isEmpowered: legionEmpowerment.isEmpowered,
      timeRemaining: legionEmpowerment.timeRemaining
    });
  }, [legionEmpowerment.isEmpowered, legionEmpowerment.timeRemaining]);
  
  // Update total skeleton count when SoulReaper changes
  useEffect(() => {
    setSkeletonCount(soulReaperSkeletons);
    onSkeletonCountChange?.(soulReaperSkeletons);
  }, [soulReaperSkeletons, onSkeletonCountChange]);
  
  // Handle skeleton count changes from SoulReaper
  const handleSoulReaperSkeletonCountChange = useCallback((count: number) => {
    setSoulReaperSkeletons(count);
  }, []);
  

  
  // DAMAGE NUMBERS 
  const [damageNumbers, setDamageNumbers] = useState<DamageNumberType[]>([]);
  
  const nextDamageNumberId = useRef(0);
  
  // ORBITAL CHARGES
  const [fireballCharges, setFireballCharges] = useState<Array<{
    id: number;
    available: boolean;
    cooldownStartTime: number | null;
  }>>(() => {
    const count = WEAPON_ORB_COUNTS[currentWeapon];
    return Array.from({ length: count }, (_, i) => ({
      id: i + 1,
      available: true,
      cooldownStartTime: null
    }));
  });

  // ICICLE ORBITAL CHARGES (for Frost Sabres)
  const [icicleCharges, setIcicleCharges] = useState<Array<IcicleCharge>>(() => {
    return Array.from({ length: 8 }, (_, i) => ({
      id: i,
      available: true,
      cooldownStartTime: null
    }));
  });
  
  // Ref to store the shootIcicle function from IcicleOrbitals
  const shootIcicleRef = useRef<(() => boolean) | null>(null);
  
  // Refs for icicle projectile management
  const updateIcicleProjectilesRef = useRef<(() => void) | null>(null);
  const getIcicleProjectilesRef = useRef<(() => Array<{
    id: number;
    position: Vector3;
    direction: Vector3;
    opacity: number;
  }>) | null>(null);
  
  const [activeEffects, setActiveEffects] = useState<Array<{
    id: number;
    type: string;
    position: Vector3;
    direction: Vector3;
    duration?: number;
    startTime?: number;
    parentRef?: React.RefObject<Group>;
    enemyId?: string;
    targetPosition?: Vector3; // For Legion meteor targeting
    targetId?: string; // For effects that need to track specific enemies
  }>>([]);

  // Update performance monitoring for damage numbers and effects
  useEffect(() => {
    if (performanceMonitor) {
      performanceMonitor.updateObjectCount('damageNumbers', damageNumbers.length);
      performanceMonitor.updateObjectCount('activeEffects', activeEffects.length);
    }
  }, [damageNumbers.length, activeEffects.length]);
  
  // Track summoned units for aggro system
  const [summonedUnitsData, setSummonedUnitsData] = useState<AllSummonedUnitInfo[]>([]);

  // Update summoned units information and report to Scene
  useEffect(() => {
    if (onSummonedUnitsUpdate) {
      onSummonedUnitsUpdate(summonedUnitsData);
    }
  }, [summonedUnitsData, onSummonedUnitsUpdate]);
  
  // BEFORE usePyroclast initialization
  const reigniteRef = useRef<ReigniteRef>(null);
  
  // Incinerate stack management for Pyro Spear (moved here to be available before usePyroclast)
  const [incinerateStacks, setIncinerateStacks] = useState(0);
  const [isIncinerateEmpowered, setIsIncinerateEmpowered] = useState(false);

  // Handle Incinerate stack changes
  const handleIncinerateStackChange = useCallback((stacks: number) => {
    console.log('[Unit] handleIncinerateStackChange called with stacks:', stacks, 'current internal stacks:', incinerateStacks);
    setIncinerateStacks(stacks);
    setIsIncinerateEmpowered(stacks >= 25);
    // Report to parent component
    if (onIncinerateStacksChange) {
      onIncinerateStacksChange(stacks);
    }
  }, [onIncinerateStacksChange, incinerateStacks]);

  // Create a ref to hold the reset function that will be available after LavaLash hook
  const resetIncinerateStacksRef = useRef<(() => void) | null>(null);

  // Handle empowerment consumption
  const handleIncinerateEmpowermentUsed = useCallback(() => {
    console.log('[Unit] Empowerment consumed, resetting stacks to 0');
    console.log('[Unit] Current incinerateStacks before reset:', incinerateStacks);
    setIncinerateStacks(0);
    setIsIncinerateEmpowered(false);
    
    // Reset the LavaLash internal state if available
    if (resetIncinerateStacksRef.current) {
      console.log('[Unit] Calling resetIncinerateStacks via ref');
      resetIncinerateStacksRef.current();
    } else {
      console.log('[Unit] resetIncinerateStacks not available yet');
    }
    
    // Report to parent component
    if (onIncinerateStacksChange) {
      console.log('[Unit] Calling onIncinerateStacksChange with 0');
      onIncinerateStacksChange(0);
    }
    console.log('[Unit] Reset complete');
  }, [onIncinerateStacksChange, incinerateStacks]);

  // Use incinerateStacks to avoid unused variable warning
  void incinerateStacks;
  
  // Firestorm state for Storm subclass passive
  const firestormTimerRef = useRef<NodeJS.Timeout | null>(null);
  const firestormActiveRef = useRef<number | null>(null); // Track active firestorm ID
  
  // DivineStorm state for DivineStorm ability
  const divineStormTimerRef = useRef<NodeJS.Timeout | null>(null);
  const divineStormActiveRef = useRef<number | null>(null); // Track active divine storm ID
  
  // Venom DoT tracking for Venom Bow fully charged shots
  const venomDoTEnemies = useRef<Record<string, {
    startTime: number;
    lastTickTime: number;
    duration: number;
  }>>({});
  
  // Viper Sting DoT tracking
  const viperStingDoTEnemies = useRef<Record<string, {
    startTime: number;
    lastTickTime: number;
    duration: number;
  }>>({});
  
  // Note: Raze manager removed - no longer used for Elemental Bow
  
  // Firestorm trigger function for Storm subclass
  const triggerFirestorm = useCallback(() => {
    if (currentSubclass !== WeaponSubclass.STORM) return;
    
    // Clear existing timer if any
    if (firestormTimerRef.current) {
      clearTimeout(firestormTimerRef.current);
    }
    
    // If no firestorm is active, create one
    if (!firestormActiveRef.current) {
      const newFirestormId = Date.now();
      firestormActiveRef.current = newFirestormId;
      
      setActiveEffects(prev => [...prev, {
        id: newFirestormId,
        type: 'firestorm',
        position: groupRef.current?.position.clone() || new Vector3(),
        direction: new Vector3(),
        startTime: Date.now()
      }]);
    }
    
    // Always refresh the cleanup timer for 4 seconds (this is the key - it extends duration)
    firestormTimerRef.current = setTimeout(() => {
      if (firestormActiveRef.current) {
        setActiveEffects(prev => prev.filter(e => e.id !== firestormActiveRef.current));
        firestormActiveRef.current = null;
      }
      firestormTimerRef.current = null;
    }, 4000); // 4 seconds as requested
  }, [currentSubclass, groupRef]);

  // DivineStorm trigger function for DivineStorm ability
  const triggerDivineStorm = useCallback(() => {
    // Clear existing timer if any
    if (divineStormTimerRef.current) {
      clearTimeout(divineStormTimerRef.current);
    }
    
    // If no divine storm is active, create one
    if (!divineStormActiveRef.current) {
      const newDivineStormId = Date.now();
      divineStormActiveRef.current = newDivineStormId;
      
      setActiveEffects(prev => [...prev, {
        id: newDivineStormId,
        type: 'divineStorm',
        position: groupRef.current?.position.clone() || new Vector3(),
        direction: new Vector3(),
        startTime: Date.now()
      }]);
    }
    
    // Set cleanup timer for 3 seconds (duration of DivineStorm)
    divineStormTimerRef.current = setTimeout(() => {
      if (divineStormActiveRef.current) {
        setActiveEffects(prev => prev.filter(e => e.id !== divineStormActiveRef.current));
        divineStormActiveRef.current = null;
      }
      divineStormTimerRef.current = null;
    }, 1200); // 3 seconds duration
  }, [groupRef]);

  // Add this memoized function before usePyroclast
  const pyroclastCheckForSpearKillAndProcessReignite = useCallback((
    targetId: string, 
    damageFn: (id: string, damage: number) => void, 
    damage: number, 

  ) => {
    // For Pyroclast, we need to bypass weapon checks when bypassWeaponCheck is true
    // The only check we need is to ensure reigniteRef.current exists
    if (reigniteRef.current) {
      // Get the target and store its health before damage
      const target = enemyData.find(e => e.id === targetId);
      if (!target) {
        damageFn(targetId, damage);
        return;
      }
      
      const previousHealth = target.health;
      const killPosition = target.position.clone(); // Store position before damage
      
      // Apply the damage
      damageFn(targetId, damage);
      
      // Check if the enemy was killed by this hit using the same logic as Whirlwind
      // Use previousHealth - damage <= 0 instead of checking updated enemy health
      if (previousHealth > 0 && previousHealth - damage <= 0) {
        reigniteRef.current.processKill(killPosition);
      }
    } else {
      // Just apply damage if reigniteRef is not available
      damageFn(targetId, damage);
    }
  }, [enemyData, reigniteRef]);

  const {
    isCharging: isPyroclastActive,
    chargeStartTime,
    activeMissiles: pyroclastMissiles,
    startCharging: startPyroclastCharge,
    releaseCharge: releasePyroclastCharge,
    handleMissileImpact: handlePyroclastImpact,
    checkMissileCollisions: checkPyroclastCollisions
  } = usePyroclast({
    parentRef: groupRef,
    onHit,
    enemyData,
    setDamageNumbers,
    nextDamageNumberId,
    onImpact: (missileId: number, impactPosition?: Vector3) => {
      const missile = pyroclastMissiles.find(m => m.id === missileId);
      if (missile) {
        setActiveEffects(prev => [...prev, {
          id: Date.now(),
          type: 'pyroclastExplosion',
          position: impactPosition || missile.position.clone(),
          direction: new Vector3(),
          duration: 0.3,
          startTime: Date.now()
        }]);
        
        // Send pyroclast explosion effect to other players in multiplayer
        if (isInRoom && isPlayer) {
          sendEffect({
            type: 'pyroclastExplosion',
            position: impactPosition || missile.position.clone(),
            direction: new Vector3(0, 1, 0), // Upward explosion
            duration: 2000, // 2 second explosion effect
            weaponType: currentWeapon,
            subclass: currentSubclass
          });
        }
      }
    },
    charges: fireballCharges,
    setCharges: setFireballCharges,
    reigniteRef: reigniteRef,
    // Use the memoized function instead of an inline function
    checkForSpearKillAndProcessReignite: pyroclastCheckForSpearKillAndProcessReignite,
    isIncinerateEmpowered,
    onIncinerateEmpowermentUsed: handleIncinerateEmpowermentUsed
  });



  // Divine Shield hook for DIVINITY sword subclass (inherent to subclass)
  const { shieldState, takeDamage: takeShieldDamage, resetShield, restoreFromAegis } = useDivineShield(
    currentWeapon,
    currentSubclass
  );

  // Boneclaw hook for CHAOS scythe subclass
  const {
    activeEffects: boneclawActiveEffects,
    triggerBoneclaw,
    charges: boneclawCharges,
    setCharges: setBoneclawCharges,
    removeEffect: removeBoneclawEffect
  } = useBoneclaw({
    onHit,
    enemyData,
    onKillingBlow: (position: Vector3) => {
      // Trigger totem summoning when BoneClaw gets a killing blow
      if (currentWeapon === WeaponType.SCYTHE && currentSubclass === WeaponSubclass.CHAOS) {
        console.log('🎯 BoneClaw killing blow detected! Summoning Chaos Totem...');
        
        const summonId = Date.now();
        
        setActiveEffects(prev => {
          // Get max totems based on level (1 at levels 1-2, 2 at level 3+)
          const maxTotems = level >= 3 ? 2 : 1;
          const currentTotems = prev.filter(effect => effect.type === 'summon').length;
          
          if (currentTotems >= maxTotems) {
            console.log(`⚠️ Maximum totems (${maxTotems}) already exist, not summoning another`);
            return prev;
          }

          // Start the healing effect when totem is summoned
          console.log('🟢 [Chaos Totem] Starting healing: 2HP per second for 8 seconds');
          startTotemHealing();

          // Send totem effect to other players in multiplayer
          if (isInRoom && isPlayer && sendEffect && groupRef.current) {
            sendEffect({
              type: 'totem',
              position: position.clone(),
              direction: new Vector3(0, 0, 1).applyQuaternion(groupRef.current.quaternion),
              duration: 8000, // 8 second duration
              weaponType: currentWeapon,
              subclass: currentSubclass,
              totemId: summonId.toString()
            });
          }

          return [
            ...prev,
            {
              id: summonId,
              type: 'summon',
              position: position.clone().setY(0.8),
              direction: new Vector3(0, 0, 1).applyQuaternion(groupRef.current!.quaternion),
              onComplete: () => {
                // Stop healing when totem expires
                console.log('🛑 [Chaos Totem] Totem expired, stopping healing');
                stopTotemHealing();
              },
              onStartCooldown: () => {}
            }
          ];
        });
      }
    },
    level
  });

  // Eviscerate hook for ASSASSIN sabres subclass
  const {
    triggerEviscerate,
    charges: eviscerateLashes,
    setCharges: setEviscerateCharges
  } = useEviscerate({
    onHit,
    parentRef: groupRef,
    enemyData,
    setDamageNumbers,
    nextDamageNumberId,
    setActiveEffects,
    onApplyStunEffect,
    onChargesChange: onEviscerateLashesChange
  });

  // Report Eviscerate charges changes to parent
  useEffect(() => {
    if (onEviscerateLashesChange && currentWeapon === WeaponType.SABRES && currentSubclass === WeaponSubclass.ASSASSIN) {
      onEviscerateLashesChange(eviscerateLashes);
    }
  }, [eviscerateLashes, currentWeapon, currentSubclass, onEviscerateLashesChange]);

  // Report Boneclaw charges changes to parent
  useEffect(() => {
    if (onBoneclawChargesChange && currentWeapon === WeaponType.SCYTHE && currentSubclass === WeaponSubclass.CHAOS) {
      onBoneclawChargesChange(boneclawCharges);
    }
  }, [boneclawCharges, currentWeapon, currentSubclass, onBoneclawChargesChange]);

  // Boneclaw ability trigger function
  const handleBoneclawTrigger = useCallback(() => {
    if (currentWeapon === WeaponType.SCYTHE && 
        currentSubclass === WeaponSubclass.CHAOS && 
        abilities[WeaponType.SCYTHE].r.isUnlocked &&
        groupRef.current) {
      const playerPosition = new Vector3().copy(groupRef.current.position);
      // Use Three.js standard forward direction calculation
      const playerDirection = new Vector3(0, 0, 1);
      playerDirection.applyQuaternion(groupRef.current.quaternion);
      playerDirection.normalize();
      triggerBoneclaw(playerPosition, playerDirection);
    }
  }, [currentWeapon, currentSubclass, abilities, triggerBoneclaw]);

  // Reset Boneclaw charges when game resets
  useEffect(() => {
    const handleGameReset = () => {
      // Reset charges to initial state
      const resetCharges = [
        { id: 1, available: true, cooldownStartTime: null },
        { id: 2, available: true, cooldownStartTime: null }
      ];
      setBoneclawCharges(resetCharges);
    };

    window.addEventListener('gameReset', handleGameReset);
    return () => window.removeEventListener('gameReset', handleGameReset);
  }, [setBoneclawCharges]);



  // Eviscerate ability trigger function
  const handleEviscerateTrigger = useCallback(() => {
    if (currentWeapon === WeaponType.SABRES && 
        currentSubclass === WeaponSubclass.ASSASSIN && 
        abilities[WeaponType.SABRES].active.isUnlocked &&
        groupRef.current) {
      const playerPosition = new Vector3().copy(groupRef.current.position);
      // Use Three.js standard forward direction calculation
      const playerDirection = new Vector3(0, 0, 1);
      playerDirection.applyQuaternion(groupRef.current.quaternion);
      playerDirection.normalize();
      triggerEviscerate(playerPosition, playerDirection);
    }
  }, [currentWeapon, currentSubclass, abilities, triggerEviscerate]);

  // Reset Eviscerate charges when game resets
  useEffect(() => {
    const handleGameReset = () => {
      // Reset charges to initial state
      const resetCharges = [
        { id: 1, available: true, cooldownStartTime: null },
        { id: 2, available: true, cooldownStartTime: null }
      ];
      setEviscerateCharges(resetCharges);
    };

    window.addEventListener('gameReset', handleGameReset);
    return () => window.removeEventListener('gameReset', handleGameReset);
  }, [setEviscerateCharges]);

  // Reset Divine Shield when game resets
  useEffect(() => {
    const handleGameReset = () => {
      resetShield();
    };

    window.addEventListener('gameReset', handleGameReset);
    return () => window.removeEventListener('gameReset', handleGameReset);
  }, [resetShield]);

  // Reset Eviscerate charges when game resets
  useEffect(() => {
    const handleGameReset = () => {
      // Reset charges to initial state
      const resetCharges = [
        { id: 1, available: true, cooldownStartTime: null },
        { id: 2, available: true, cooldownStartTime: null }
      ];
      setEviscerateCharges(resetCharges);
    };

    window.addEventListener('gameReset', handleGameReset);
    return () => window.removeEventListener('gameReset', handleGameReset);
  }, [setEviscerateCharges]);



  // SMITE 
  const [isSmiting, setIsSmiting] = useState(false);
  const [smiteEffects, setSmiteEffects] = useState<{ id: number; position: Vector3 }[]>([]);
  const nextSmiteId = useRef(0);

  // COLOSSUS STRIKE
  const [isColossusStriking, setIsColossusStriking] = useState(false);
  const [colossusStrikeLightning, setColossusStrikeLightning] = useState<Array<{
    id: number;
    position: Vector3;
  }>>([]);
  
 
  const [hitCountThisSwing, setHitCountThisSwing] = useState<Record<string, number | boolean>>({});

  // BOW CHARGING
  const [bowChargeProgress, setBowChargeProgress] = useState(0);
  const bowChargeStartTime = useRef<number | null>(null);
  const bowChargeLineOpacity = useRef(0);
  const [isPerfectShotWindow, setIsPerfectShotWindow] = useState(false);

  // VENOM BOW CONSECUTIVE HIT TRACKING
  const [venomConsecutiveHits, setVenomConsecutiveHits] = useState(0);
  const [hasInstantPowershot, setHasInstantPowershot] = useState(false);
  
  // BowPowershot hook for enhanced visuals
  const { activeEffects: activePowershotEffects, createPowershotEffect, removeEffect: removePowershotEffect } = useBowPowershot({
    sendEffect,
    isInRoom,
    isPlayer
  });
  
  // ViperStingBeam hook for enhanced visuals
  const { activeEffects: activeViperStingBeamEffects, createBeamEffect: createViperStingBeamEffect, removeEffect: removeViperStingBeamEffect } = useViperStingBeam();

  // Viper Sting DoT callback
  const applyViperStingDoT = useCallback((enemyId: string) => {
    const now = Date.now();
    viperStingDoTEnemies.current[enemyId] = {
      startTime: now,
      lastTickTime: now,
      duration: 5000 // 5 seconds
    };
  }, []);

  // PROJECTILES 
  const [activeProjectiles, setActiveProjectiles] = useState<PooledProjectile[]>([]);

  const pendingLightningTargets = useRef<Set<string>>(new Set()); 
  const [collectedBones, ] = useState<number>(15); // LATER

  const [isOathstriking, setIsOathstriking] = useState(false);
  const [isDivineStorming, setIsDivineStorming] = useState(false);
  const [hasHealedThisSwing, setHasHealedThisSwing] = useState(false);
  const crusaderAuraRef = useRef<{ processHealingChance: () => void }>(null);
  const [bowGroundEffectProgress, setBowGroundEffectProgress] = useState(0);
  const [movementDirection] = useState(() => new Vector3());
  const chainLightningRef = useRef<{ processChainLightning: () => void }>(null);
  const lastFrostExplosionTime = useRef(0);
  const FROST_EXPLOSION_COOLDOWN = 1000; // 1 second cooldown between frost explosions
  
  // Track Pyroclast charge progress
  const pyroclastChargeProgress = useRef(0);

  // Player stun state
  const [isPlayerStunned, setIsPlayerStunned] = useState(false);
  const [playerStunEffects, setPlayerStunEffects] = useState<Array<{
    id: string;
    position: Vector3;
    duration: number;
    startTime: number;
  }>>([]);
  const stunEndTime = useRef<number>(0);

  // ref for frame-by-frame fireball updates
  const activeFireballsRef = useRef<{
    id: number;
    position: Vector3;
    direction: Vector3;
    startPosition: Vector3;
    maxDistance: number;
    isCrossentropyBolt?: boolean;
  }[]>([]);

  // ref for projectiles
  const activeProjectilesRef = useRef<PooledProjectile[]>([]);

  const {
    activateStealth,
    isStealthed,
    setIsStealthed,
    setHasShadowStrikeBuff
  } = useStealthEffect({
    onStealthStart: () => {
      setActiveEffects(prev => [...prev, {
        id: Date.now(),
        type: 'stealth',
        position: groupRef.current?.position.clone() || new Vector3(),
        direction: new Vector3(),
        duration: 5,
        startTime: Date.now()
      }]);
    },
    onStealthEnd: () => {
      setActiveEffects(prev => 
        prev.filter(effect => effect.type !== 'stealth')
      );
    }
  });

  const { handleStealthKillHeal, getStealthBonusDamage, resetStealthKillCount, stealthKillCount } = useStealthHealing({
    currentHealth: health,
    maxHealth: maxHealth,
    onHealthChange: (health: number) => onHealthChange?.(health),
    currentSubclass,
    setDamageNumbers,
    nextDamageNumberId
  });

  // Chaos Totem healing functionality for Chaos Scythe subclass
  const { startTotemHealing, stopTotemHealing } = useChaosTotemHealing({
    onHealthChange: (health: number) => onHealthChange?.(health),
    setDamageNumbers,
    nextDamageNumberId,
    parentRef: groupRef
  });

  // Listen for reset events to reset stealth kill count and clear damage numbers
  useEffect(() => {
    const handleGameReset = () => {
      console.log('🔄 Unit reset - clearing all state');
      resetStealthKillCount();
      setDamageNumbers([]); // Clear all damage numbers on reset
      setActiveEffects([]);
      setFireballs([]);
      setActiveProjectiles([]);
      setSmiteEffects([]);
      setColossusStrikeLightning([]);
      setHitCountThisSwing({});
      setIsSwinging(false);
      setIsColossusStriking(false);
      setIsStealthed(false);
      setActiveVault({ isActive: false, direction: null });
      setAbyssalSlashEffects([]);
      setPlayerStunEffects([]);
      
      // Reset ID counters to prevent overflow
      nextDamageNumberId.current = 0;
      nextFireballId.current = 0;
      nextSmiteId.current = 0;
      
      console.log('✅ Unit state reset completed');
    };

    window.addEventListener('gameReset', handleGameReset);
    return () => window.removeEventListener('gameReset', handleGameReset);
  }, [setIsStealthed, resetStealthKillCount]);

  // Report stealth kill count changes to parent
  useEffect(() => {
    if (onStealthKillCountChange) {
      onStealthKillCountChange(stealthKillCount);
    }
  }, [onStealthKillCountChange, stealthKillCount]);



  // MeteorSwarm hook for PYRO spear subclass
  const { 
    activeMeteorSwarms, 
    castMeteorSwarm,
    removeMeteorSwarm 
  } = useMeteorSwarm({
    enemyData,
    onHit: (targetId: string, damage: number, isCritical: boolean, position: Vector3) => {
      onHit(targetId, damage);
      setDamageNumbers(prev => [...prev, {
        id: nextDamageNumberId.current++,
        damage,
        position: position.clone(),
        isCritical: false,
        isMeteor: true
      }]);
    },
    playerPosition: groupRef.current?.position || new Vector3()
  });

  // Modify handleAttack to use the new stealth system
  const handleAttack = useCallback(
    (targetId: string, baseDamage: number, wasWeaponCritical: boolean = false) => {
      let finalDamage = baseDamage;
      let isStealthStrike = false;
      let isCritical = wasWeaponCritical; // Use the passed critical flag as a starting point
      let stealthBonusAmount = 0;

      // Cache stealth status at the start of the attack
      const wasStealthed = stealthManager.hasShadowStrikeBuff();
      
      if (wasStealthed) {
        const target = enemyData.find(e => e.id === targetId);
        
        if (target && groupRef.current) {
          const playerPos = groupRef.current.position;
          const enemyPos = target.position;
          
          const enemyForward = new Vector3(0, 0, 1).applyEuler(new THREE.Euler(0, target.rotation, 0));
          const toPlayer = new Vector3()
            .subVectors(playerPos, enemyPos)
            .normalize();
          
          const dotProduct = toPlayer.dot(enemyForward);
          
          // Break stealth immediately to prevent race conditions
          isStealthStrike = true;
          stealthManager.breakStealth();
          
          // Send stealth strike effect to other players in multiplayer
          if (isInRoom && isPlayer && groupRef.current) {
            sendEffect({
              type: 'stealthStrike',
              position: groupRef.current.position.clone(),
              direction: new Vector3(0, 0, 1).applyQuaternion(groupRef.current.quaternion),
              duration: 1000, // 1 second effect
              weaponType: currentWeapon,
              subclass: currentSubclass,
              targetPosition: target.position.clone()
            });
          }
          
          // Use requestAnimationFrame to ensure UI updates happen on the next frame
          requestAnimationFrame(() => {
            setIsStealthed(false);
            setHasShadowStrikeBuff(false);
          });

          // Calculate and apply damage
          const bonusDamage = getStealthBonusDamage();
          if (dotProduct > 0.5) {
            stealthBonusAmount = 273 + (bonusDamage * 3);
            finalDamage += stealthBonusAmount;
            isCritical = true;
            
            if (target.health <= finalDamage) {
              handleStealthKillHeal(target.position, true);
            }
          } else {
            stealthBonusAmount = 161 + bonusDamage;
            finalDamage += stealthBonusAmount;
            
            if (target.health <= finalDamage) {
              handleStealthKillHeal(target.position, false);
            }
          }
        }
      }



      // Handle damage numbers after hit is confirmed
      const target = enemyData.find(e => e.id === targetId);
      if (target) {
        setDamageNumbers(prev => [...prev, {
          id: nextDamageNumberId.current++,
          damage: finalDamage,
          position: target.position.clone(),
          isCritical,
          isStealthStrike
        }]);
      }

      if (wasStealthed && target && groupRef.current) {
        const effectDirection = new Vector3().subVectors(target.position, groupRef.current.position).normalize();
        setActiveEffects(prev => [...prev, {
          id: Date.now(),
          type: 'stealthStrike',
          position: target.position.clone(),
          direction: effectDirection,
          duration: 0.2,
          startTime: Date.now()
        }]);
      }

      if (onHit) {
        onHit(targetId, finalDamage);
        
        // Get target after damage
        const targetAfterDamage = target && target.health - finalDamage;
        if (targetAfterDamage && targetAfterDamage <= 0) {
          // Process kill for Reignite if using Spear with passive unlocked
          if ((currentWeapon as WeaponType) === WeaponType.SPEAR && 
              abilities[WeaponType.SPEAR].passive.isUnlocked && 
              reigniteRef.current) {
            // Ensure we pass a fresh clone of the position
            const killPosition = target.position.clone();
            reigniteRef.current.processKill(killPosition);
            
            // Send reignite effect to other players in multiplayer
            if (isInRoom && isPlayer) {
              sendEffect({
                type: 'reignite',
                position: killPosition.clone(),
                direction: new Vector3(0, 1, 0), // Upward flame effect
                duration: 2000, // 2 second flame duration
                weaponType: currentWeapon,
                subclass: currentSubclass
              });
            }
          }
        }
      }
    },
    [onHit, setIsStealthed, setHasShadowStrikeBuff, enemyData, handleStealthKillHeal, currentWeapon, currentSubclass, abilities, getStealthBonusDamage, isInRoom, isPlayer, sendEffect]
  );

  // Add new state for whirlwind
  const [isWhirlwinding, setIsWhirlwinding] = useState(false);

  // Add ref to track whirlwind duration
  const whirlwindStartTime = useRef<number | null>(null);
  const WHIRLWIND_MAX_DURATION = 15000; // 1.5 seconds max duration

  // Add new state for firebeam
  const [isFirebeaming, setIsFirebeaming] = useState(false);
  const firebeamStartTime = useRef<number | null>(null);

  // Movement controls - positioned here after isFirebeaming is declared
  const { keys: movementKeys } = useUnitControls({
    groupRef,
    controlsRef,
    camera: camera!,
    onPositionUpdate,
    health,
    isCharging: isBowCharging || isPyroclastActive || isFirebeaming,
    onMovementUpdate: (direction: Vector3) => {
      movementDirection.copy(direction);
    },
    currentWeapon,
    currentSubclass,
    level,
    isStunned: isPlayerStunned
  });

  const { shootQuickShot, projectilePool: quickShotProjectilesRef, resetEagleEyeCounter, eagleEyeManagerRef } = useQuickShot({
    parentRef: groupRef,
    onHit,
    enemyData,
    setDamageNumbers,
    nextDamageNumberId,
    charges: fireballCharges,
    setCharges: setFireballCharges,
    isEagleEyeUnlocked: currentSubclass === WeaponSubclass.VENOM && abilities[WeaponType.BOW].passive.isUnlocked,
    currentSubclass,
    level,
    venomConsecutiveHits,
    setVenomConsecutiveHits,
    setHasInstantPowershot,
    onApplySlowEffect
  });

  //=====================================================================================================

  // Define types for pooled objects
  interface PooledProjectile {
    id: number;
    position: Vector3;
    direction: Vector3;
    power: number;
    startTime: number;
    maxDistance: number;
    startPosition: Vector3;
    hasCollided?: boolean;
    isFullyCharged?: boolean;
    hitEnemies?: Set<string>;
    opacity?: number;
    fadeStartTime?: number | null;
    isPerfectShot?: boolean;
  }

  interface PooledFireball {
    id: number;
    position: Vector3;
    direction: Vector3;
    startPosition: Vector3;
    maxDistance: number;
    isCrossentropyBolt?: boolean;
  }

  // Initialize pools
  const { fireballPool, projectilePool } = useMemo(() => ({
    fireballPool: new ObjectPool<PooledFireball>(
      10,
      () => ({
        id: 0,
        position: new Vector3(),
        direction: new Vector3(),
        startPosition: new Vector3(),
        maxDistance: 0
      }),
      (fireball) => {
        fireball.position.set(0, 0, 0);
        fireball.direction.set(0, 0, 0);
        fireball.startPosition.set(0, 0, 0);
        fireball.maxDistance = 0;
        fireball.isCrossentropyBolt = false;
      }
    ),
    projectilePool: new ObjectPool<PooledProjectile>(
      20,
      () => ({
        id: 0,
        position: new Vector3(),
        direction: new Vector3(),
        power: 0,
        startTime: 0,
        maxDistance: 0,
        startPosition: new Vector3(),
        hasCollided: false
      }),
      (proj) => {
        proj.position.set(0, 0, 0);
        proj.direction.set(0, 0, 0);
        proj.power = 0;
        proj.startTime = 0;
        proj.maxDistance = 0;
        proj.startPosition.set(0, 0, 0);
        proj.hasCollided = false;
      }
    )
  }), []);

  // Add at the top of the component, after state declarations
  const tempVec3 = useMemo(() => new Vector3(), []);
  const tempVec3_2 = useMemo(() => new Vector3(), []);

  // Modify shootFireball to reuse vectors and add Crossentropy Bolt logic
  const shootFireball = useCallback(() => {
    if (!groupRef.current) return;

    // Check for Crossentropy Bolt (Chaos Scythe subclass at level 2+ with 50% chance)
    const weaponCheck = currentWeapon === WeaponType.SCYTHE;
    const chaosCheck = currentSubclass === WeaponSubclass.CHAOS;
    const levelCheck = level >= 2;
    const randomCheck = Math.random() < 0.5;
    const isCrossentropyBolt = weaponCheck && chaosCheck && levelCheck && randomCheck;
    
    if (isCrossentropyBolt) {
      
      // Send crossentropy effect to other players in multiplayer
      if (isInRoom && isPlayer) {
        sendEffect({
          type: 'crossentropy',
          position: tempVec3.clone(),
          direction: tempVec3_2.clone(),
          duration: 10000, // 10 second max lifespan
          speed: 0.3, // CrossEntropy bolt speed
          weaponType: currentWeapon,
          subclass: currentSubclass
        });
      }
    }

    // Only check for available charges if it's NOT a Crossentropy Bolt
    if (!isCrossentropyBolt) {
      const availableChargeIndex = fireballCharges.findIndex(charge => charge.available);
      if (availableChargeIndex === -1) return;

      // Consume the charge for regular fireballs
      setFireballCharges(prev => prev.map((charge, index) => 
        index === availableChargeIndex
          ? { ...charge, available: false, cooldownStartTime: Date.now() }
          : charge
      ));
    }

    // Reuse tempVec3 for unit position
    tempVec3.copy(groupRef.current.position);
    tempVec3.y += 1;

    // Reuse tempVec3_2 for direction
    tempVec3_2.set(0, 0, 1);
    tempVec3_2.applyQuaternion(groupRef.current.quaternion);
    tempVec3_2.normalize();

    // Send crossentropy effect to other players in multiplayer (after position is set)
    if (isCrossentropyBolt && isInRoom && isPlayer) {
      sendEffect({
        type: 'crossentropy',
        position: tempVec3.clone(),
        direction: tempVec3_2.clone(),
        duration: 10000, // 10 second max lifespan
        speed: 0.3, // CrossEntropy bolt speed
        weaponType: currentWeapon,
        subclass: currentSubclass
      });
    }

    const newFireball = fireballPool.acquire();
    newFireball.id = nextFireballId.current++;
    newFireball.position.copy(tempVec3);
    newFireball.startPosition.copy(tempVec3);
    newFireball.direction.copy(tempVec3_2);
    newFireball.maxDistance = 30;
    // Add a flag to identify Crossentropy Bolt
    newFireball.isCrossentropyBolt = isCrossentropyBolt;

    activeFireballsRef.current.push(newFireball);
    setFireballs(prev => [...prev, newFireball]);

    // Send fireball effect to other players in multiplayer
    if (isInRoom && isPlayer) {
      sendEffect({
        type: 'fireball',
        position: tempVec3.clone(),
        direction: tempVec3_2.clone(),
        duration: 10000, // 10 second max lifespan
        speed: 0.4, // Match the speed used in Unit component fireball movement
        lifespan: 10, // 10 second lifespan to match original
        hasCollided: false,
        fireballId: `fireball-${newFireball.id}` // Unique identifier for this fireball
      });
    }
  }, [currentWeapon, currentSubclass, level, groupRef, fireballCharges, tempVec3, tempVec3_2, fireballPool, isInRoom, isPlayer, sendEffect]);

  // Add state declaration at the top with component's other states
  const [lastBowShotTime, setLastBowShotTime] = useState<number>(0);
  const [hasAutoReleasedBowShot, setHasAutoReleasedBowShot] = useState<boolean>(false);
  
  // Animation states for ability-triggered bow animations
  const [isAbilityBowAnimation, setIsAbilityBowAnimation] = useState<boolean>(false);
  const abilityBowAnimationStartTime = useRef<number | null>(null);

  // Now the releaseBowShot callback can use lastBowShotTime safely
  const releaseBowShot = useCallback((power: number, isPerfectShot: boolean = false) => {
    if (!groupRef.current) return;
    
    const now = Date.now();
    const timeSinceLastShot = now - lastBowShotTime;
    if (timeSinceLastShot < 750) return;
    setLastBowShotTime(now);
    
    // Reuse tempVec3 for position
    tempVec3.copy(groupRef.current.position);
    tempVec3.y += 1;

    // Reuse tempVec3_2 for direction
    tempVec3_2.set(0, 0, 1);
    tempVec3_2.applyQuaternion(groupRef.current.quaternion);

    const newProjectile = projectilePool.acquire();
    newProjectile.id = Date.now();
    newProjectile.position.copy(tempVec3);
    newProjectile.direction.copy(tempVec3_2);
    newProjectile.power = power;
    newProjectile.startTime = Date.now();
    newProjectile.maxDistance = 20;
    newProjectile.startPosition.copy(tempVec3);
    newProjectile.hasCollided = false;
    newProjectile.opacity = 1;
    newProjectile.fadeStartTime = null;

    // Store additional projectile data for debuff checking
    newProjectile.isFullyCharged = power >= 0.95;
    
    // Store perfect shot status for damage calculation
    newProjectile.isPerfectShot = isPerfectShot;
    
    // If this is a perfect shot, set the auto-release flag to prevent duplicate shots
    if (isPerfectShot) {
      setHasAutoReleasedBowShot(true);
    }

    // Create powershot visual effect for fully charged shots or perfect shots
    if (power >= 0.95 || isPerfectShot) {
      const startPosition = groupRef.current.position.clone();
      startPosition.y += 1; // Offset for bow height
      
      const direction = new Vector3(0, 0, 1).applyQuaternion(groupRef.current.quaternion);
      
      createPowershotEffect(
        startPosition,
        direction,
        currentSubclass || WeaponSubclass.ELEMENTAL,
        abilities[WeaponType.BOW].passive.isUnlocked,
        isPerfectShot
      );
    }

    // Note: Raze effect removed from Elemental Bow fully charged shots

    // Update both ref and state
    activeProjectilesRef.current.push(newProjectile);
    setActiveProjectiles(prev => [...prev, newProjectile]);

    // Send bow projectile effect to other players in multiplayer
    if (isInRoom && isPlayer) {
      sendEffect({
        type: 'bowProjectile',
        position: tempVec3.clone(),
        direction: tempVec3_2.clone(),
        power: power,
        isFullyCharged: power >= 0.95,
        duration: 2000 // 2 second max lifespan
      });
    }

    setIsBowCharging(false);
    setBowChargeProgress(0);
    setIsPerfectShotWindow(false);
    bowChargeStartTime.current = null;
    onAbilityUse(currentWeapon, 'e');
  }, [groupRef, lastBowShotTime, tempVec3, tempVec3_2, currentWeapon, onAbilityUse, projectilePool, isInRoom, isPlayer, sendEffect, abilities, createPowershotEffect, currentSubclass]);

  // Function to trigger ability bow animation (75% draw) - VISUAL ONLY, no actual bow shot
  const triggerAbilityBowAnimation = useCallback(() => {
    if (currentWeapon !== WeaponType.BOW) return;
    
    setIsAbilityBowAnimation(true);
    abilityBowAnimationStartTime.current = Date.now();
    
    // End animation after delay - NO AUTO-RELEASE to prevent uncharged 'E' attacks
    setTimeout(() => {
      setIsAbilityBowAnimation(false);
      abilityBowAnimationStartTime.current = null;
      // Reset bow charge progress to return string to resting position
      setBowChargeProgress(0);
    }, 500); // 0.5 second animation to match ability delay
  }, [currentWeapon]);

  // Modify handleFireballImpact to return fireball to pool
  const handleFireballImpact = (id: number, impactPosition?: Vector3) => {
    // Find and release the fireball back to the pool
    const fireball = activeFireballsRef.current.find(f => f.id === id);
    if (fireball) {
      // Store the final position before releasing
      const finalPosition = fireball.position.clone();
      fireballPool.release(fireball);
      
      // Add explosion effect at the final position if no impact position was provided
      const explosionPosition = impactPosition || finalPosition;
      
      setActiveEffects(prev => [...prev, {
        id: Date.now(),
        type: 'unitFireballExplosion',
        position: explosionPosition,
        direction: new Vector3(),
        duration: 0.225,
        startTime: Date.now()
      }]);

      // Send fireball explosion effect to other players in multiplayer
      if (isInRoom && isPlayer) {
        sendEffect({
          type: 'fireballExplosion',
          position: explosionPosition.clone(),
          direction: new Vector3(),
          duration: 225 // 0.225 seconds in milliseconds
        });
      }
    }
    
    // Update both ref and state
    activeFireballsRef.current = activeFireballsRef.current.filter(fireball => fireball.id !== id);
    setFireballs(prev => prev.filter(fireball => fireball.id !== id));
  };

  //=====================================================================================================

  // ATTACK LOGIC
  const lastHitDetectionTime = useRef<Record<string, number>>({});
  const HIT_DETECTION_DEBOUNCE = currentWeapon === WeaponType.SCYTHE ? 120 : 200; // ms

  // Change to regular function without useCallback
  const handleWeaponHit = (targetId: string) => {
    if (!groupRef.current || !isSwinging || isDivineStorming) return;

    const now = Date.now();
    const lastHitTime = lastHitDetectionTime.current[targetId] || 0;
    
    // Add frame-level debouncing
    if (now - lastHitTime < HIT_DETECTION_DEBOUNCE) return;
    
    lastHitDetectionTime.current[targetId] = now;
    
    const target = enemyData.find(e => e.id === targetId);
    if (!target || target.health <= 0 || target.isDying) return;

    // When retrieving currentHits, ensure it's a number:
    const currentHits = typeof hitCountThisSwing[target.id] === 'number' ? 
        hitCountThisSwing[target.id] as number : 0;

    const isEnemy = target.id.startsWith('enemy');
    if (!isEnemy) return;

    // Update maxHits logic to support dual scythes for Abyssal at level 2+
    const isDualScythe = currentWeapon === WeaponType.SCYTHE && 
                        currentSubclass === WeaponSubclass.ABYSSAL && 
                        level >= 2;
    
    // Allow 3 hits for Storm spear burst attacks
    const isStormSpear = currentWeapon === WeaponType.SPEAR && 
                         currentSubclass === WeaponSubclass.STORM;
    
    const maxHits = isEnemy 
      ? (currentWeapon === WeaponType.SABRES || isDualScythe ? 2 : 
         isStormSpear ? 3 : 1)
      : 1;

    // Return immediately if max hits is already reached for this target
    if (currentHits >= maxHits) return;

    // Update hit count before processing damage to prevent race conditions
    setHitCountThisSwing(prev => ({
      ...prev,
      [target.id]: (prev[target.id] as number || 0) + 1,
      [`${target.id}_time`]: now
    }));

    const distance = groupRef.current.position.distanceTo(target.position);
    const weaponRange = WEAPON_DAMAGES[currentWeapon].range;

    if (distance <= weaponRange) {
      // Check for Abyssal Scythe empowered attack
      let empoweredDamage = 0;
      let shouldTriggerSlashEffect = false;
      
      if (currentWeapon === WeaponType.SCYTHE && 
          currentSubclass === WeaponSubclass.ABYSSAL && 
          frenzyAuraRef.current?.isEmpowered) {
        
        // Consume the empowered attack and get damage
        if (frenzyAuraRef.current.consumeEmpoweredAttack()) {
          empoweredDamage = frenzyAuraRef.current.getEmpoweredDamage(level);
          shouldTriggerSlashEffect = true;
        }
      }
      
      // Check for Legion empowerment (10 second buff from meteor impact)
      let isLegionEmpowered = false;
      if (currentWeapon === WeaponType.SCYTHE && 
          currentSubclass === WeaponSubclass.ABYSSAL && 
          legionEmpowermentRef.current?.isEmpowered) {
        isLegionEmpowered = true;
      }
      
      // SPEAR STRAIGHT LINE CHECK
      if (currentWeapon === WeaponType.SPEAR) {
        const toTarget = new Vector3()
          .subVectors(target.position, groupRef.current.position)
          .normalize();
        const forward = new Vector3(0, 0, 1)
          .applyQuaternion(groupRef.current.quaternion);
        
        const angle = toTarget.angleTo(forward);
        
        // DEADZONE
        const closeRange = weaponRange * 0.75; // 30% of max range
        const maxAllowedAngle = distance <= closeRange ? 
          Math.PI / 6 : // 30 degrees for close range
          Math.PI / 8.5; // ~20 degrees for normal range
        
        if (Math.abs(angle) > maxAllowedAngle) {
          return;
        }
      }
      // SABRES HIT ARC CHECK
      else if (currentWeapon === WeaponType.SABRES) {
        const toTarget = new Vector3()
          .subVectors(target.position, groupRef.current.position)
          .normalize();
        const forward = new Vector3(0, 0, 0.25) // SABRE FORWARD 
          .applyQuaternion(groupRef.current.quaternion);
        
        const angle = toTarget.angleTo(forward);
        
        if (Math.abs(angle) > Math.PI / 4.5) { // 52 degree?
          return;
        }
      }
      
      // Get base damage with potential Legion empowerment for Abyssal Scythe
      const baseDamage = getWeaponDamage(currentWeapon, currentSubclass, stealthKillCount, isLegionEmpowered);
      
      //=====================================================================================================

      // SMITE LOGIC
      if (isSmiting && currentWeapon === WeaponType.SWORD) {
        const currentPendingTargets = pendingLightningTargets.current;
        
        if (currentPendingTargets.has(target.id)) {
          return;
        }
        
        // Check if target is alive before initial hit
        if (target.health <= 0) return;
        
        currentPendingTargets.add(target.id);
        
        setDamageNumbers(prev => [...prev, {
          id: nextDamageNumberId.current++,
          damage,
          position: target.position.clone(),
          isCritical
        }]);

        // Schedule lightning damage
        setTimeout(() => {
          // Check if target is still alive before lightning hit
          const updatedTarget = enemyData.find(e => e.id === target.id);
          if (!updatedTarget || updatedTarget.health <= 0) {
            currentPendingTargets.delete(target.id);
            return;
          }

          // Smite level-based damage
          let smiteDamage = 79; // Default level 1 damage
          switch (level) {
            case 1:
              smiteDamage = 79;
              break;
            case 2:
              smiteDamage = 89;
              break;
            case 3:
              smiteDamage = 103;
              break;
            case 4:
              smiteDamage = 113;
              break;
            case 5:
            default:
              smiteDamage = 211;
              break;
          }
          
          const { damage: lightningDamage, isCritical: lightningCrit } = calculateDamage(smiteDamage);
          onHit(target.id, lightningDamage);
          
          setDamageNumbers(prev => [...prev, {
            id: nextDamageNumberId.current++,
            damage: lightningDamage,
            position: updatedTarget.position.clone(),
            isCritical: lightningCrit,
            isLightning: true
          }]);
          
          currentPendingTargets.delete(target.id);
        }, 300);
      }

      //=====================================================================================================

      // NORMAL WEAPON HIT HANDLING
      let isCritical = false;
      let damage = baseDamage;
      
      if (currentWeapon === WeaponType.SPEAR) {
        // Use subclass-specific damage
        const spearDamage = getWeaponDamage(WeaponType.SPEAR, currentSubclass, undefined);
        
        // Calculate if the hit is within 80-100% of max range
        const maxRange = WEAPON_DAMAGES[WeaponType.SPEAR].range;
        const sweetSpotStart = maxRange * 0.75;
        
        // Guaranteed critical at 80-100% of max range
        if (distance >= sweetSpotStart && distance <= maxRange) {
          isCritical = true;
          damage = spearDamage * 2;
        } else {
          // Normal damage calculation for non-sweet spot hits
          const result = calculateDamage(spearDamage);
          damage = result.damage;
          isCritical = result.isCritical;
        }
        
        // Storm spear Concussive Blow logic
        if (currentSubclass === WeaponSubclass.STORM && isCritical && handleConcussiveCritical) {
          // For Storm spear burst attacks, we need to track which burst attack this is
          // Use the current hit count to determine burst attack number (0 or 1)
          const burstAttackNumber = (currentHits - 1) % 2; // 0 for first hit, 1 for second hit in burst
          handleConcussiveCritical(target.id, target.position, burstAttackNumber);
        }
      } else if (currentWeapon === WeaponType.SABRES) {
        // Sabres damage calculation - different damage for different subclasses
        // For Assassin subclass, include stealth kill count bonus
        const sabresDamage = getWeaponDamage(WeaponType.SABRES, currentSubclass, stealthKillCount, undefined);
        
        // Calculate damage independently for each hit
        // Calculate and store critical status for this specific hit
        const currentHitIndex = currentHits;
        isCritical = Math.random() < 0.25; // 25% crit chance for Sabres
        
        // Store the critical hit status for this specific hit
        setHitCountThisSwing(prev => ({
          ...prev,
          [`${target.id}_crit_${currentHitIndex}`]: isCritical
        }));
        
        damage = isCritical ? sabresDamage * 2 : sabresDamage;
      } else if (currentWeapon === WeaponType.SWORD && !isSmiting && !isOathstriking) {
        // Sword damage calculation - different behavior for subclasses
        if (currentSubclass === WeaponSubclass.DIVINITY) {
          // Divinity always does 41 damage (no combo system)
          const result = calculateDamage(41);
          damage = result.damage;
          isCritical = result.isCritical;
        } else if (currentSubclass === WeaponSubclass.VENGEANCE) {
          // Vengeance uses combo damage calculation
          const comboDamages = [41, 47, 59]; // 1st, 2nd, 3rd hit damage
          const comboBaseDamage = comboDamages[swordComboStep - 1];
          
          const result = calculateDamage(comboBaseDamage);
          damage = result.damage;
          isCritical = result.isCritical;
        } else {
          // Fallback for any unknown subclasses
          const result = calculateDamage(41);
          damage = result.damage;
          isCritical = result.isCritical;
        }
      } else if (currentWeapon === WeaponType.SWORD && isSmiting) {
        // Smite damage calculation - always does 59 damage
        const result = calculateDamage(59);
        damage = result.damage;
        isCritical = result.isCritical;
      } else {
        // Normal damage calculation for other weapons
        const result = calculateDamage(baseDamage);
        damage = result.damage;
        isCritical = result.isCritical;
      }
      
      // Add orb shield bonus damage for ASSASSIN Sabres (Avalanche passive ability)
      let totalDamage = damage;
      if (currentWeapon === WeaponType.SABRES && currentSubclass === WeaponSubclass.ASSASSIN && 
        orbShieldRef.current && abilities[WeaponType.SABRES].passive.isUnlocked) {
        const bonusDamage = orbShieldRef.current.calculateBonusDamage();
        if (bonusDamage > 0) {
          totalDamage += bonusDamage;
          
          // Display bonus damage number separately
          setDamageNumbers(prev => {
            return [...prev, {
              id: nextDamageNumberId.current++,
              damage: bonusDamage,
              position: new Vector3(
                target.position.x + (currentHits === 0 ? -0.4 : 0.4),
                target.position.y + 0.8,
                target.position.z
              ),
              isCritical: false,
              isOrbShield: true
            }];
          });

          // Add rate-limited frost explosion effect
          const now = Date.now();
          if (now - lastFrostExplosionTime.current >= FROST_EXPLOSION_COOLDOWN) {
            lastFrostExplosionTime.current = now;
            
            const unitPosition = groupRef.current.position.clone();
            const forward = new Vector3(0, 0, 1)
              .applyQuaternion(groupRef.current.quaternion)
              .multiplyScalar(2);
            
            setActiveEffects(prev => {
              // Clean up any old frost explosions first
              const filtered = prev.filter(effect => 
                effect.type !== 'frostExplosion' || 
                (effect.startTime && Date.now() - effect.startTime < 2000)
              );
              
              return [...filtered, {
                id: Date.now(),
                type: 'frostExplosion',
                position: unitPosition.add(forward),
                direction: new Vector3(),
                duration: 0.5,
                startTime: Date.now()
              }];
            });
          }

          // Consume one orb per attack (not per hit)
          if (!hitCountThisSwing[targetId]) {
            orbShieldRef.current.consumeOrb();
          }
        }
      }

      // Add empowered damage from Abyssal Scythe Frenzy Aura
      if (empoweredDamage > 0) {
        totalDamage += empoweredDamage;
        
        // Display empowered damage number separately with green color
        setDamageNumbers(prev => [...prev, {
          id: nextDamageNumberId.current++,
          damage: empoweredDamage,
          position: new Vector3(
            target.position.x + 0.6,
            target.position.y + 0.3,
            target.position.z
          ),
          isCritical: false,
          isHealing: false,
          isBoneclaw: true // Using green color from boneclaw
        }]);
        
        // Trigger slash effect
        if (shouldTriggerSlashEffect) {
          const playerPosition = groupRef.current.position.clone();
          const direction = new Vector3()
            .subVectors(target.position, playerPosition)
            .normalize();
          
          setAbyssalSlashEffects(prev => [...prev, {
            id: `abyssal-slash-${Date.now()}`,
            position: target.position.clone(),
            direction,
            damage: empoweredDamage
          }]);

          // Send abyssal slash effect to other players in multiplayer
          if (isInRoom && isPlayer && sendEffect) {
            sendEffect({
              type: 'abyssalSlash',
              position: target.position.clone(),
              direction: direction.clone(),
              duration: 200, // 200ms duration for slash effect
              weaponType: currentWeapon,
              subclass: currentSubclass,
              intensity: empoweredDamage // Pass damage as intensity for visual scaling
            });
          }
        }
      }

      // Use totalDamage instead of just damage
      handleAttack(target.id, totalDamage, isCritical);

      // Calculate target's health after damage
      const targetAfterDamage = target.health - totalDamage;

      // Add Crusader Aura healing check for Sword Q
      if (currentWeapon === WeaponType.SWORD && 
          abilities[WeaponType.SWORD].passive.isUnlocked && 
          !isSmiting && !isOathstriking && 
          !hasHealedThisSwing &&
          targetAfterDamage > 0) {  // Only trigger healing if target is still alive
        crusaderAuraRef.current?.processHealingChance();
        setHasHealedThisSwing(true);
        
        // Send crusader aura effect to other players in multiplayer
        if (isInRoom && isPlayer && groupRef.current) {
          sendEffect({
            type: 'crusaderAura',
            position: groupRef.current.position.clone(),
            direction: new Vector3(0, 0, 1).applyQuaternion(groupRef.current.quaternion),
            duration: 2000, // 2 second duration for healing effect
            weaponType: currentWeapon,
            subclass: currentSubclass
          });
        }
      }

      // Add Lifesteal check for Abyssal Scythe at level 2+
      if (currentWeapon === WeaponType.SCYTHE && 
          currentSubclass === WeaponSubclass.ABYSSAL && 
          level >= 2) {  // Trigger lifesteal on all damage dealt, including killing blows
        lifestealRef.current?.processLifesteal(totalDamage);
      }

      // Only display damage number if target is still alive
      if (targetAfterDamage > 0) {
        // Special handling for Sabres and dual scythes to offset damage numbers
        if (currentWeapon === WeaponType.SABRES || isDualScythe) {
          const offset = currentHits === 0 ? -0.4 : 0.4;
          // Use the stored critical hit status for this specific hit
          const critValue = hitCountThisSwing[`${target.id}_crit_${currentHits}`];
          const hitIsCritical = typeof critValue === 'boolean' && critValue === true;
          
          // Check if this is an empowered Abyssal Scythe attack (47 damage)
          const isLegionEmpoweredScythe = currentWeapon === WeaponType.SCYTHE && 
                                         currentSubclass === WeaponSubclass.ABYSSAL && 
                                         legionEmpowerment.isEmpowered && 
                                         damage === 47;
          
          setDamageNumbers(prev => [...prev, {
            id: nextDamageNumberId.current++,
            damage,
            position: new Vector3(
              target.position.x + offset,
              target.position.y,
              target.position.z
            ),
            isCritical: hitIsCritical,
            isLegionEmpoweredScythe
          }]);
        } else {
          // Check if this is an empowered Abyssal Scythe attack (47 damage)
          const isLegionEmpoweredScythe = currentWeapon === WeaponType.SCYTHE && 
                                         currentSubclass === WeaponSubclass.ABYSSAL && 
                                         legionEmpowerment.isEmpowered && 
                                         damage === 47;
          
          setDamageNumbers(prev => [...prev, {
            id: nextDamageNumberId.current++,
            damage,
            position: target.position.clone(),
            isCritical,
            isLegionEmpoweredScythe
          }]);
        }
      }

      if (currentWeapon === WeaponType.SWORD && 
          currentSubclass === WeaponSubclass.VENGEANCE && 
          !isSmiting && !isOathstriking) {
          
          chainLightningRef.current?.processChainLightning();
      }

      // Process kill for Reignite if using Spear with passive unlocked
      if ((currentWeapon as WeaponType) === WeaponType.SPEAR && 
          abilities[WeaponType.SPEAR].passive.isUnlocked && 
          reigniteRef.current &&
          targetAfterDamage <= 0) {
        // Ensure we pass a fresh clone of the position
        const killPosition = target.position.clone();
        reigniteRef.current.processKill(killPosition);
      }

      return;
    }

    return;
  };

  const handleSwingComplete = () => {
    setIsSwinging(false);
    setHitCountThisSwing({});
    setIsSmiting(false); // Reset smiting after swing
    setHasHealedThisSwing(false);
    
    // Advance sword combo step after swing completion - only for VENGEANCE subclass
    if (currentWeapon === WeaponType.SWORD && currentSubclass === WeaponSubclass.VENGEANCE) {
      setSwordComboStep(prev => {
        const nextStep = prev === 3 ? 1 : (prev + 1) as 1 | 2 | 3;
        
        // Send sword combo effect to other players in multiplayer
        if (isInRoom && isPlayer && sendEffect && groupRef.current) {
          sendEffect({
            type: 'swordCombo',
            position: groupRef.current.position.clone(),
            direction: new Vector3(0, 0, 1).applyQuaternion(groupRef.current.quaternion),
            duration: 600, // 600ms duration for combo indicator
            comboStep: nextStep
          });
        }
        
        return nextStep;
      });
    }
    
    // Process accumulated lifesteal damage for Abyssal Scythe at level 2+
    if (currentWeapon === WeaponType.SCYTHE && 
        currentSubclass === WeaponSubclass.ABYSSAL && 
        level >= 2 && 
        lifestealDamageThisSwing.current > 0) {
      processLifesteal(lifestealDamageThisSwing.current);
      lifestealDamageThisSwing.current = 0; // Reset for next swing
    }
  };

  // Handle icicle combo completion for FROST sabres
  const handleIcicleComboComplete = () => {
    lastIcicleShootTime.current = Date.now();
    
    // Advance icicle combo step after shooting
    setIcicleComboStep(prev => {
      if (prev === 3) {
        return 1; // Reset to first hit after third hit
      }
      return (prev + 1) as 1 | 2 | 3;
    });
  };

  // Handle player stun from lightning strikes
  const handlePlayerStun = useCallback((duration: number) => {
    if (!groupRef.current) return;
    
    const currentTime = Date.now();
    const stunId = `player-stun-${currentTime}`;
    const playerPosition = groupRef.current.position.clone();
    playerPosition.y += 1.0; // Offset slightly above ground
    
    // IMPORTANT: Stun should NOT affect health - this is purely a movement/ability restriction
    
    // Set stun state
    setIsPlayerStunned(true);
    stunEndTime.current = currentTime + duration;
    
    // Add visual effect
    setPlayerStunEffects(prev => [...prev, {
      id: stunId,
      position: playerPosition,
      duration,
      startTime: currentTime
    }]);
    
    console.log(`[Player Stun] ⚡ Stun state set to TRUE, will end at ${new Date(currentTime + duration).toLocaleTimeString()}`);
    
    // Clear stun state after duration
    const timeoutId = setTimeout(() => {
      console.log(`[Player Stun] ⏰ Timeout triggered after ${duration}ms - clearing stun state`);
      setIsPlayerStunned(false);
      stunEndTime.current = 0;
      console.log(`[Player Stun] ✅ Stun ENDED - Player can move and use abilities again (health still: ${health})`);
    }, duration);
    
    console.log(`[Player Stun] ⏰ Timeout set with ID ${timeoutId} for ${duration}ms from now`);
  }, [health]);

  // Remove completed stun effects
  const removePlayerStunEffect = useCallback((effectId: string) => {
    setPlayerStunEffects(prev => prev.filter(effect => effect.id !== effectId));
  }, []);

  // Expose the stun function to parent component via ref
  useEffect(() => {
    if (playerStunRef) {
      playerStunRef.current = { triggerStun: handlePlayerStun };
    }
  }, [playerStunRef, handlePlayerStun]);

  // Debug logging for stun state changes
  useEffect(() => {
    console.log(`[Player Stun] 🔄 Stun state changed to: ${isPlayerStunned}`);
  }, [isPlayerStunned]);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    
    // Backup stun clearing mechanism - check if stun should have ended
    if (isPlayerStunned && stunEndTime.current > 0 && Date.now() >= stunEndTime.current) {
      console.log(`[Player Stun] 🔄 Backup stun clear triggered - setTimeout may have failed`);
      setIsPlayerStunned(false);
      stunEndTime.current = 0;
    }
    
    // Failsafe: Clear stun if it's been active for more than 5 seconds (something went wrong)
    if (isPlayerStunned && stunEndTime.current > 0 && Date.now() - stunEndTime.current > 3000) {
      console.log(`[Player Stun] 🚨 FAILSAFE: Clearing stun that has been active too long`);
      setIsPlayerStunned(false);
      stunEndTime.current = 0;
    }

    if (isSwinging && groupRef.current) {
      enemyData.forEach(enemy => {
        handleWeaponHit(enemy.id);
      });
    }

    // BOW CHARGING 
    if (isBowCharging && bowChargeStartTime.current !== null) {
      const chargeTime = (Date.now() - bowChargeStartTime.current) / 1000;
      const progress = Math.min(chargeTime / 1.375, 1); // BOWCHARGE CHARGETIME - 1.375 no movemvent
      setBowChargeProgress(progress);
      setBowGroundEffectProgress(progress); // Update ground effect progress

      // Perfect shot window detection for Elemental bow (1.3-1.35s mark)
      if (currentSubclass === WeaponSubclass.ELEMENTAL) {
        const isPerfectWindow = chargeTime >= 1.25 && chargeTime <= 1.35;
        setIsPerfectShotWindow(isPerfectWindow);
      }

      // Smooth charge line opacity using delta
      const targetOpacity = progress;
      const currentOpacity = bowChargeLineOpacity.current;
      bowChargeLineOpacity.current += (targetOpacity - currentOpacity) * delta * 5;

      if (progress >= 1 && !hasAutoReleasedBowShot) {
        releaseBowShot(1);
        setHasAutoReleasedBowShot(true);
      }
    }

    // Handle ability bow animation (75% draw for Viper Sting and Barrage)
    if (isAbilityBowAnimation && abilityBowAnimationStartTime.current !== null) {
      const animationTime = (Date.now() - abilityBowAnimationStartTime.current) / 1000;
      const animationProgress = Math.min(animationTime / 0.5, 1); // 0.5 second animation to 75%
      const targetProgress = 0.75; // 75% draw distance
      setBowChargeProgress(targetProgress * animationProgress);
      setBowGroundEffectProgress(targetProgress * animationProgress);
    }

    // Handle Venom DoT ticks
    const currentTime = Date.now();
    Object.entries(venomDoTEnemies.current).forEach(([enemyId, dotData]) => {
      const timeElapsed = currentTime - dotData.startTime;
      const timeSinceLastTick = currentTime - dotData.lastTickTime;
      
      // Check if DoT has expired
      if (timeElapsed >= dotData.duration) {
        delete venomDoTEnemies.current[enemyId];
        return;
      }
      
      // Apply DoT damage every second (1000ms)
      if (timeSinceLastTick >= 1000) {
        const enemy = enemyData.find(e => e.id === enemyId);
        if (enemy && enemy.health > 0) {
          // Deal poison damage - 29 at levels 1-2, 71 at level 3+
          const poisonDamage = level >= 3 ? 71 : 37;
          onHit(enemyId, poisonDamage);
          
          // Add poison damage number
          setDamageNumbers(prev => [...prev, {
            id: nextDamageNumberId.current++,
            damage: poisonDamage,
            position: enemy.position.clone(),
            isCritical: false,
            isLightning: false,
            isBlizzard: false,
            isHealing: false,
            isBoneclaw: false,
            isSmite: false,
            isSword: false,
            isSabres: false,
            isOathstrike: false,
            isFirebeam: false,
            isOrbShield: false,
            isChainLightning: false,
            isFireball: false,
            isSummon: false,
            isStealthStrike: false,
            isPyroclast: false,
            isEagleEye: false,
            isBreach: false,
            isBowLightning: false,
            isBarrage: false,
            isGlacialShard: false,
            isAegis: false,
            isCrossentropyBolt: false,
            isGuidedBolt: false,
            isDivineStorm: false,
            isHolyBurn: false,
            isColossusStrike: false,
            isColossusLightning: false,
            isFirestorm: false,
            isElementalBowPowershot: false,
            isPoisonDoT: true
          }]);
          
          // Update last tick time
          dotData.lastTickTime = currentTime;
        } else {
          // Enemy is dead, remove from DoT tracking
          delete venomDoTEnemies.current[enemyId];
        }
      }
    });

    // Handle Viper Sting DoT ticks
    Object.entries(viperStingDoTEnemies.current).forEach(([enemyId, dotData]) => {
      const timeElapsed = currentTime - dotData.startTime;
      const timeSinceLastTick = currentTime - dotData.lastTickTime;
      
      // Check if DoT has expired
      if (timeElapsed >= dotData.duration) {
        delete viperStingDoTEnemies.current[enemyId];
        return;
      }
      
      // Apply DoT damage every second (1000ms)
      if (timeSinceLastTick >= 1000) {
        const enemy = enemyData.find(e => e.id === enemyId);
        if (enemy && enemy.health > 0) {
          // Deal viper sting poison damage - 53 damage per second
          const viperPoisonDamage = 53;
          onHit(enemyId, viperPoisonDamage);
          
          // Add viper sting poison damage number
          setDamageNumbers(prev => [...prev, {
            id: nextDamageNumberId.current++,
            damage: viperPoisonDamage,
            position: enemy.position.clone(),
            isCritical: false,
            isLightning: false,
            isBlizzard: false,
            isHealing: false,
            isBoneclaw: false,
            isSmite: false,
            isSword: false,
            isSabres: false,
            isOathstrike: false,
            isFirebeam: false,
            isOrbShield: false,
            isChainLightning: false,
            isFireball: false,
            isSummon: false,
            isStealthStrike: false,
            isPyroclast: false,
            isEagleEye: false,
            isBreach: false,
            isBowLightning: false,
            isBarrage: false,
            isGlacialShard: false,
            isAegis: false,
            isCrossentropyBolt: false,
            isGuidedBolt: false,
            isDivineStorm: false,
            isHolyBurn: false,
            isColossusStrike: false,
            isColossusLightning: false,
            isFirestorm: false,
            isElementalBowPowershot: false,
            isPoisonDoT: false,
            isViperSting: true
          }]);
          
          // Update last tick time
          dotData.lastTickTime = currentTime;
        } else {
          // Enemy is dead, remove from DoT tracking
          delete viperStingDoTEnemies.current[enemyId];
        }
      }
    });

    // Update projectiles with optimized frame-by-frame movement
    const now = Date.now();
    activeProjectilesRef.current = activeProjectilesRef.current.filter(projectile => {
      const distanceTraveled = projectile.position.distanceTo(projectile.startPosition);
      
      // Handle fading when projectile reaches max distance
      if (distanceTraveled >= projectile.maxDistance && !projectile.fadeStartTime) {
        projectile.fadeStartTime = now;
      }
      
      // Handle fade effect
      if (projectile.fadeStartTime) {
        const fadeElapsed = now - projectile.fadeStartTime;
        const fadeProgress = fadeElapsed / 1000; // 1 second fade duration
        projectile.opacity = Math.max(0, 1 - fadeProgress);
        
        if (fadeProgress >= 1) {
          return false; // Remove projectile after fade completes
        }
      }
      
      if (distanceTraveled < projectile.maxDistance && !projectile.hasCollided && !projectile.fadeStartTime) {
        const speed = (projectile.power >= 1 || projectile.isPerfectShot) ? 0.925 : 0.55; // PROJECTILE SPEED - includes perfect shots 
        projectile.position.add(
          projectile.direction
            .clone()
            .multiplyScalar(speed)
        );

        // Initialize hitEnemies array if it doesn't exist
        if (!projectile.hitEnemies) {
          projectile.hitEnemies = new Set();
        }

        // Check collisions only if projectile is within range and not fading
        for (const enemy of enemyData) {
          // Skip dead enemies - add this check
          if (enemy.health <= 0 || enemy.isDying) continue;
          
          const projectilePos2D = new Vector3(
            projectile.position.x,
            0,
            projectile.position.z
          );
          const enemyPos2D = new Vector3(
            enemy.position.x,
            0,
            enemy.position.z
          );
          const distanceToEnemy = projectilePos2D.distanceTo(enemyPos2D);
          
          // Only process collision if we haven't hit this enemy before
          if (distanceToEnemy < 1.3 && !projectile.hitEnemies.has(enemy.id)) {
            // Add enemy to hit list
            projectile.hitEnemies.add(enemy.id);
            
            handleProjectileHit(projectile.id, enemy.id, projectile.power, projectile.position);
            
            // Only set hasCollided if it's not a fully charged shot or perfect shot
            if (projectile.power < 1 && !projectile.isPerfectShot) {
              projectile.hasCollided = true;
              return false;
            }
            // Fully charged shots and perfect shots continue through enemies
          }
        }
        
        return true;
      }
      
      // Keep projectile alive if it's fading
      return projectile.fadeStartTime !== null;
    });

    // Sync React state with ref only when projectiles are added/removed
    if (activeProjectilesRef.current.length !== activeProjectiles.length) {
      setActiveProjectiles([...activeProjectilesRef.current]);
    }

    // FIREBALLS 
    activeFireballsRef.current = activeFireballsRef.current.filter(fireball => {
      const distanceTraveled = fireball.position.distanceTo(fireball.startPosition);
      
      if (distanceTraveled < fireball.maxDistance) {
        const speed = 0.4;
        fireball.position.add(
          fireball.direction
            .clone()
            .multiplyScalar(speed)
        );
    
        // Check enemy collisions - only with living enemies
        for (const enemy of enemyData) {
          if (enemy.health <= 0) continue;
          
          const enemyPos = enemy.position.clone();
          enemyPos.y = 1.5;
          if (fireball.position.distanceTo(enemyPos) < 1.5) {
            // Send collision information to other players in multiplayer
            if (isInRoom && isPlayer) {
              // Send the collision information immediately when hit is detected
              sendEffect({
                type: 'fireball',
                position: fireball.startPosition.clone(),
                direction: fireball.direction.clone(),
                speed: 0.4,
                lifespan: 10,
                hasCollided: true,
                collisionPosition: fireball.position.clone(),
                collisionTime: Date.now(),
                duration: 10000,
                fireballId: `fireball-${fireball.id}` // Include the fireball ID for collision update
              });
            }
            
            handleFireballHit(fireball.id, enemy.id);
            handleFireballImpact(fireball.id, fireball.position.clone());
            return false;
          }
        }
    
        return true;
      }
      
      handleFireballImpact(fireball.id);
      return false;
    });

    // Sync React state with ref for rendering
    setFireballs([...activeFireballsRef.current]);

    // Update fireball charge cooldowns
    setFireballCharges(prev => prev.map(charge => {
      if (!charge.available && charge.cooldownStartTime) {
        const elapsedTime = Date.now() - charge.cooldownStartTime;
        if (elapsedTime >= ORBITAL_COOLDOWN) {
          return { ...charge, available: true, cooldownStartTime: null };
        }
      }
      return charge;
    }));

    // Fireball Cleanup
    setActiveEffects(prev => prev.filter(effect => {
      // Special handling for boneclaw and blizzard
      if (effect.type === 'boneclaw' || effect.type === 'blizzard') {
        return true; // Let these effects manage their own cleanup via onComplete
      }

      // Handle timed effects
      if (effect.duration && effect.startTime) {
        const elapsed = (Date.now() - effect.startTime) / 1000;
        return elapsed < effect.duration;
      }

      return true;
    }));

    // Check whirlwind duration
    if (isWhirlwinding && whirlwindStartTime.current) {
      const now = Date.now();
      if (now - whirlwindStartTime.current >= WHIRLWIND_MAX_DURATION) {
        setIsWhirlwinding(false);
        whirlwindStartTime.current = null;
        onAbilityUse(currentWeapon, 'e');
      }
    }

    // Pyroclast charge progress update
    if (isPyroclastActive) {
      const now = Date.now();
      if (chargeStartTime.current) {
        const chargeTime = (now - chargeStartTime.current) / 1000;
        // Update progress calculation to show it charging up to 6 seconds 
        // Use a more smooth ease-in curve for progress
        const progress = Math.min(chargeTime / 4, 1);
        // Apply smoothing to the progress update using a simple easing function
        const smoothProgress = progress * progress * (3 - 2 * progress); // Smooth step function
        pyroclastChargeProgress.current = smoothProgress;
        
        // Auto-release after 4 seconds (max charge) - only for Cinder Spear, not Pyro Spear
        if (chargeTime >= 4 && currentSubclass !== WeaponSubclass.PYRO) {
          releasePyroclastCharge();
          onAbilityUse(WeaponType.SPEAR, 'e');
        }
      }
    } else {
      // Ensure progress resets to zero when not charging
      if (pyroclastChargeProgress.current > 0) {
        pyroclastChargeProgress.current = 0;
      }
    }

    // Pyroclast collision check
    pyroclastMissiles.forEach(missile => {
      checkPyroclastCollisions(missile.id, missile.position);
    });

    // Update barrage projectiles
    updateBarrageProjectiles();

    // Update icicle projectiles
    if (updateIcicleProjectilesRef.current) {
      updateIcicleProjectilesRef.current();
    }

    // Update guided bolt missiles
    updateGuidedBoltMissiles();

    // Update lava lash projectiles
    updateLavaLashProjectiles();

    // Update lava lash projectiles
    updateLavaLashProjectiles();
  });

  // FROST LANCE
  const {  startFirebeam, stopFirebeam, isEnemyFrozen, getFrozenEnemyIds } = useFirebeamManager({
    parentRef: groupRef,
    onHit,
    enemyData,
    setActiveEffects,
    charges: fireballCharges,
    setCharges: setFireballCharges,
    setDamageNumbers,
    nextDamageNumberId,
    isFirebeaming,
    onFirebeamEnd: () => {
      setIsFirebeaming(false);
      firebeamStartTime.current = null;
    },
    currentSubclass,
    level
  });

  // CONCUSSIVE BLOW - Storm spear stun system
  const {
    isEnemyStunned: _isEnemyStunned, // eslint-disable-line @typescript-eslint/no-unused-vars
    getStunnedEnemyIds: _getStunnedEnemyIds, // eslint-disable-line @typescript-eslint/no-unused-vars
    handleCriticalHit: handleConcussiveCritical,
    startBurstSequence,
    isConcussiveBlowActive: _isConcussiveBlowActive // eslint-disable-line @typescript-eslint/no-unused-vars
  } = useConcussiveBlow({
    currentSubclass,
    setActiveEffects,
    onApplyStunEffect,
    enemyData
  });

  // ThrowSpear hook for STORM spear subclass
  const {
    isCharging: isThrowSpearCharging,
    chargeProgress: throwSpearChargeProgress,
    activeProjectiles: throwSpearProjectiles,
    startCharging: startThrowSpearCharge,
    releaseCharge: releaseThrowSpearCharge,
    isSpearThrown
  } = useThrowSpear({
    parentRef: groupRef,
    onHit,
    enemyData,
    setDamageNumbers,
    nextDamageNumberId,
    isEnemyStunned: _isEnemyStunned, // Pass the stun check function from ConcussiveBlow
    charges: fireballCharges, // Use fireball charges for orb consumption
    setCharges: setFireballCharges, // Setter for fireball charges
    reigniteRef, // For triggering Reignite on kills
    onCooldownReset: (weapon: string, ability: string) => {
      // Reset ThrowSpear cooldown to 0 when hitting stunned enemies
      console.log('[Unit] onCooldownReset called with:', weapon, ability);
      if (weapon === 'spear' && ability === 'r' && onResetAbilityCooldown) {
        console.log('[Unit] Resetting ThrowSpear cooldown');
        onResetAbilityCooldown(WeaponType.SPEAR, 'r');
      } else {
        console.log('[Unit] Conditions not met for cooldown reset:', { weapon, ability, hasResetFunction: !!onResetAbilityCooldown });
      }
    },
    onAbilityUse: (weapon: string, ability: string) => {
      // Set ThrowSpear cooldown when spear is actually thrown
      console.log('[Unit] onAbilityUse called with:', weapon, ability);
      if (weapon === 'spear' && ability === 'r' && onAbilityUse) {
        console.log('[Unit] Setting ThrowSpear cooldown');
        onAbilityUse(WeaponType.SPEAR, 'r');
      } else {
        console.log('[Unit] Conditions not met for setting cooldown:', { weapon, ability, hasAbilityUseFunction: !!onAbilityUse });
      }
    }
  });

  // Track last frozen enemy IDs to avoid unnecessary updates
  const lastFrozenEnemyIds = useRef<string[]>([]);
  
  // Update frozen enemy IDs every frame and notify parent
  useEffect(() => {
    if (currentSubclass === WeaponSubclass.FROST && getFrozenEnemyIds) {
      const updateFrozenIds = () => {
        const newFrozenIds = getFrozenEnemyIds();
        const prev = lastFrozenEnemyIds.current;
        
        // Only update if the array actually changed
        if (prev.length !== newFrozenIds.length || 
            !prev.every((id, index) => id === newFrozenIds[index])) {
          // Notify parent component of the change
          if (onFrozenEnemyIdsUpdate) {
            onFrozenEnemyIdsUpdate(newFrozenIds);
          }
          lastFrozenEnemyIds.current = newFrozenIds;
        }
      };
      
      updateFrozenIds();
      const interval = setInterval(updateFrozenIds, 100); // Update every 100ms
      return () => clearInterval(interval);
    } else if (onFrozenEnemyIdsUpdate) {
      // Clear frozen enemies if not using Frost subclass
      onFrozenEnemyIdsUpdate([]);
      lastFrozenEnemyIds.current = [];
    }
  }, [currentSubclass, getFrozenEnemyIds, onFrozenEnemyIdsUpdate]);
  
  // Expose freeze state check to parent component
  useEffect(() => {
    if (onFreezeStateCheck && isEnemyFrozen) {
      // Store the freeze check function in the parent component
      // Note: This is a bit of a hack since React callbacks aren't meant for this
      // but it allows the Scene component to access the freeze state
      (onFreezeStateCheck as typeof onFreezeStateCheck & { __freezeCheckFunction?: (enemyId: string) => boolean }).__freezeCheckFunction = isEnemyFrozen;
    }
  }, [onFreezeStateCheck, isEnemyFrozen]);

  // ABILITY KEYS 
  const reanimateRef = useRef<ReanimateRef>(null);
  const soulReaperRef = useRef<SoulReaperRef>(null);


  const handleHealthChange = useCallback((healAmount: number) => {
    if (onHealthChange) {
      // Pass the delta amount directly
      onHealthChange(healAmount);
    }
  }, [onHealthChange]);

  // Reference onDamage prop to satisfy linter (damage is handled in Scene component)
  const damageHandler = useCallback(onDamage, [onDamage]); // eslint-disable-line @typescript-eslint/no-unused-vars

  const orbShieldRef = useRef<OrbShieldRef>(null);
  const glacialShardRef = useRef<GlacialShardRef>(null);
  
  // Use local ref for the component - declare this immediately after glacialShardRef
  const finalGlacialShardRef = glacialShardRef;
  
  // Blizzard shield hook for Assassin Sabres
  const {
    hasShield: hasBlizzardShield,
    shieldAbsorption: blizzardShieldAbsorption,
    activateShield: activateBlizzardShield,
    absorbDamage: absorbBlizzardDamage,
    cleanup: cleanupBlizzardShield
  } = useBlizzardShield({
    currentWeapon: currentWeapon,
    currentSubclass: currentSubclass
  });
  
  // Combined shield absorption function that handles Divine Shield, Blizzard, and Glacial Shard shields
  const combinedAbsorbDamage = useCallback((damage: number): number => {
    let remainingDamage = damage;
    
    // First try Divine Shield (highest priority as it's a passive always-on ability)
    if (shieldState.isActive && shieldState.currentShield > 0) {
      remainingDamage = takeShieldDamage(damage);
      console.log(`[Unit] After Divine Shield: ${remainingDamage} damage remaining`);
    }
    
    // Then try Blizzard shield (higher priority since it's temporary)
    if (remainingDamage > 0 && hasBlizzardShield && blizzardShieldAbsorption > 0) {
      remainingDamage = absorbBlizzardDamage(remainingDamage);
      console.log(`[Unit] After Blizzard shield: ${remainingDamage} damage remaining`);
    }
    
    // Finally try Glacial Shard shield
    if (remainingDamage > 0 && glacialShardRef.current?.hasShield) {
      remainingDamage = glacialShardRef.current.absorbDamage(remainingDamage);
      console.log(`[Unit] After Glacial Shard shield: ${remainingDamage} damage remaining`);
    }
    
    return remainingDamage;
  }, [shieldState.isActive, shieldState.currentShield, takeShieldDamage, hasBlizzardShield, blizzardShieldAbsorption, absorbBlizzardDamage, glacialShardRef]);

  // Update external ref when local ref changes
  useEffect(() => {
    if (externalGlacialShardRef) {
      // Type assertion for external ref to match the expected interface
      const externalRef = externalGlacialShardRef as React.MutableRefObject<{
        absorbDamage: (damage: number) => number;
        hasShield: boolean;
        shieldAbsorption: number;
        shootGlacialShard?: () => boolean;
        getKillCount?: () => number;
      } | null>;
      
      const glacialShieldValue = glacialShardRef.current?.hasShield ? 
        (glacialShardRef.current.shieldAbsorption || 0) : 0;
      const divineShieldValue = shieldState.isActive ? shieldState.currentShield : 0;
      const totalShieldAbsorption = divineShieldValue + glacialShieldValue + (hasBlizzardShield ? blizzardShieldAbsorption : 0);
      const hasAnyShield = divineShieldValue > 0 || glacialShieldValue > 0 || hasBlizzardShield;
      
      externalRef.current = {
        absorbDamage: combinedAbsorbDamage,
        hasShield: hasAnyShield,
        shieldAbsorption: totalShieldAbsorption,
        shootGlacialShard: glacialShardRef.current?.shootGlacialShard,
        getKillCount: glacialShardRef.current?.getKillCount
      };
    }
  }, [externalGlacialShardRef, glacialShardRef, combinedAbsorbDamage, hasBlizzardShield, blizzardShieldAbsorption, shieldState.isActive, shieldState.currentShield]);
  
  // Glacial Shard function for Frost Sabres
  const shootGlacialShard = useCallback(() => {
    return finalGlacialShardRef.current?.shootGlacialShard?.() || false;
  }, [finalGlacialShardRef]);
  
  // Update combined shield state when any shield changes
  useEffect(() => {
    if (onShieldStateChange) {
      const glacialShieldValue = finalGlacialShardRef.current?.hasShield ? 
        (finalGlacialShardRef.current.shieldAbsorption || 0) : 0;
      const blizzardShieldValue = hasBlizzardShield ? blizzardShieldAbsorption : 0;
      const divineShieldValue = shieldState.isActive ? shieldState.currentShield : 0;
      
      const totalShieldAbsorption = divineShieldValue + glacialShieldValue + blizzardShieldValue;
      const hasAnyShield = divineShieldValue > 0 || glacialShieldValue > 0 || blizzardShieldValue > 0;
      
      onShieldStateChange(hasAnyShield, totalShieldAbsorption);
    }
  }, [finalGlacialShardRef, onShieldStateChange, hasBlizzardShield, blizzardShieldAbsorption, shieldState.isActive, shieldState.currentShield]);

  // Report glacial shard kill count changes to parent
  useEffect(() => {
    if (onGlacialShardKillCountChange && finalGlacialShardRef.current) {
      const glacialKillCount = finalGlacialShardRef.current.getKillCount?.() || 0;
      onGlacialShardKillCountChange(glacialKillCount);
    }
  }, [finalGlacialShardRef, onGlacialShardKillCountChange]);

  // Poll for glacial shard kill count changes (since we can't detect them directly)
  useEffect(() => {
    if (onGlacialShardKillCountChange && finalGlacialShardRef.current) {
      const interval = setInterval(() => {
        if (finalGlacialShardRef.current) {
          const glacialKillCount = finalGlacialShardRef.current.getKillCount?.() || 0;
          onGlacialShardKillCountChange(glacialKillCount);
        }
      }, 100); // Check every 100ms

      return () => clearInterval(interval);
    }
  }, [finalGlacialShardRef, onGlacialShardKillCountChange]);

  // Trigger Blizzard shield when Blizzard is cast for Assassin Sabres
  const prevActiveEffectsRef = useRef<Array<{ id: number; type: string }>>([]);
  useEffect(() => {
    const blizzardEffects = activeEffects.filter(effect => effect.type === 'blizzard');
    const prevBlizzardEffects = prevActiveEffectsRef.current.filter(effect => effect.type === 'blizzard');
    
    // Check if new Blizzard effect was added
    if (blizzardEffects.length > prevBlizzardEffects.length && 
        currentWeapon === WeaponType.SABRES && 
        currentSubclass === WeaponSubclass.ASSASSIN) {
      console.log('[Unit] New Blizzard detected for Assassin Sabres, activating shield...');
      activateBlizzardShield();
    }
    
    // Update previous effects reference
    prevActiveEffectsRef.current = activeEffects.map(effect => ({ id: effect.id, type: effect.type }));
  }, [activeEffects, currentWeapon, currentSubclass, activateBlizzardShield]);

  // Cleanup Blizzard shield on component unmount or weapon change
  useEffect(() => {
    return () => {
      cleanupBlizzardShield();
    };
  }, [cleanupBlizzardShield]);
  
  const { activateOathstrike: originalActivateOathstrike } = useOathstrike({
    parentRef: groupRef,
    onHit,
    charges: fireballCharges,
    setCharges: setFireballCharges,
    enemyData,
    onHealthChange: handleHealthChange,
    setDamageNumbers,
    nextDamageNumberId,
    currentHealth: health,
    maxHealth: maxHealth
  });

  // Wrap activateOathstrike to add multiplayer healing
  const activateOathstrike = useCallback(() => {
    const result = originalActivateOathstrike();
    // If Oathstrike was successfully cast and we're in multiplayer, heal all allies
    // Note: Oathstrike only heals if it hits enemies, but in multiplayer we heal allies regardless
    if (result && isInRoom && isPlayer && groupRef.current) {
      if (healAllies) {
        healAllies(5, groupRef.current.position.clone(), 'oathstrike'); // 5 HP heal amount from Oathstrike
      }
      
      // Send OathStrike effect to other players in multiplayer
      if (sendEffect) {
        sendEffect({
          type: 'oathstrike',
          position: result.position.clone(),
          direction: result.direction.clone(),
          duration: 1000, // 1 second duration for OathStrike effect
          weaponType: WeaponType.SWORD,
          subclass: WeaponSubclass.DIVINITY
        });
      }
    }
    return result;
  }, [originalActivateOathstrike, isInRoom, isPlayer, groupRef, healAllies, sendEffect]);

  // Colossus Strike healing functionality
  const COLOSSUS_STRIKE_HEAL_AMOUNT = 20;
  const { processHealing: processColossusHealing } = useHealing({
    currentHealth: health,
    maxHealth: maxHealth,
    onHealthChange: handleHealthChange,
    setDamageNumbers,
    nextDamageNumberId,
    healAmount: COLOSSUS_STRIKE_HEAL_AMOUNT
  });

  // Aegis ability state and management
  const aegisBlockedDamage = useRef(0);
  
  // Callback for when Aegis gets a kill - restore Divine Shield
  const handleAegisKill = useCallback(() => {
    if (currentSubclass === WeaponSubclass.DIVINITY) {
      restoreFromAegis();
    }
  }, [currentSubclass, restoreFromAegis]);

  const { projectiles: aegisProjectiles, activateAegis, updateProjectiles: updateAegisProjectiles } = useAegis({
    parentRef: groupRef,
    onHit,
    enemyData,
    setDamageNumbers,
    nextDamageNumberId,
    onAegisKill: handleAegisKill,
    charges: fireballCharges,
    setCharges: setFireballCharges
  });
  const isAegisActive = aegisProjectiles.length > 0;



  // Update parent component when Aegis state changes
  useEffect(() => {
    if (onAegisStateChange) {
      onAegisStateChange(isAegisActive);
    }
  }, [isAegisActive, onAegisStateChange]);



  // Unified vault state
  const [activeVault, setActiveVault] = useState<{ isActive: boolean; direction: 'south' | 'north' | 'east' | 'west' | null }>({
    isActive: false,
    direction: null
  });

  // Dash charges system - use props if provided, otherwise default functions
  const canVaultFn = useMemo(() => canVault || (() => false), [canVault]);
  const consumeDashChargeFn = useMemo(() => consumeDashCharge || (() => false), [consumeDashCharge]);

  // Unified vault activation functions
  const activateVault = useCallback((direction: VaultDirection) => {
    if (canVaultFn() && !activeVault.isActive) {
      const success = consumeDashChargeFn();
      if (success) {
        setActiveVault({ isActive: true, direction });
      }
    }
  }, [canVaultFn, consumeDashChargeFn, activeVault.isActive]);

  const completeVault = useCallback(() => {
    setActiveVault({ isActive: false, direction: null });
    // Note: onAbilityUse is no longer needed as we're using the dash charges system
  }, []);
  
  // Add isBreaching state before useAbilityKeys call
  const [isBreaching, setIsBreaching] = useState(false);
  
  // Track Dragon Breath effects that have already applied damage
  const dragonBreathDamageApplied = useRef<Set<number>>(new Set());


  // In the Unit component, add this before useAbilityKeys initialization
  const { activateBreach } = useBreachController({
    parentRef: groupRef,
    charges: fireballCharges,
    setCharges: setFireballCharges,
    reigniteRef
  });

  const activateMeteorSwarm = useCallback(() => {
    return castMeteorSwarm();
  }, [castMeteorSwarm]);

  // Colossus Strike activation function (costs 1 orb)
  const activateColossusStrike = useCallback((): boolean => {
    if (!groupRef.current || isColossusStriking || isSwinging || isSmiting) return false;

    // Check if we have at least 1 orb charge available
    const availableCharges = fireballCharges.filter(charge => charge.available);
    if (availableCharges.length < 1) return false;

    // Find the closest enemy target
    let closestEnemy = null;
    let closestDistance = Infinity;
    const playerPosition = groupRef.current.position;

    for (const enemy of enemyData) {
      if (enemy.health <= 0 || enemy.isDying) continue;
      
      const distance = playerPosition.distanceTo(enemy.position);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestEnemy = enemy;
      }
    }

    // If no enemy found, don't activate and return false
    if (!closestEnemy) return false;

    // Consume 1 orb charge
    setFireballCharges(prev => prev.map((charge, index) => {
      if (index === availableCharges[0].id - 1) {
        return {
          ...charge,
          available: false,
          cooldownStartTime: Date.now()
        };
      }
      return charge;
    }));

    // Start cooldown recovery for the charge
    setTimeout(() => {
      setFireballCharges(prev => prev.map((c, index) => 
        index === availableCharges[0].id - 1
          ? { ...c, available: true, cooldownStartTime: null }
          : c
      ));
    }, ORBITAL_COOLDOWN);

    // Start the Colossus Strike animation
    setIsColossusStriking(true);
    setIsSwinging(true);
    return true;
  }, [enemyData, groupRef, isColossusStriking, isSwinging, isSmiting, fireballCharges, setFireballCharges]);

  // First, add this near the top of the component:
  const { activeStrikes, createLightningStrike, removeLightningStrike, lastLightningTarget } = useBowLightning();

  // Barrage hook for bow r ability
  const { 
    shootBarrage: originalShootBarrage, 
    updateProjectiles: updateBarrageProjectiles, 
    getActiveProjectiles: getBarrageProjectiles, 
    cleanup: cleanupBarrage 
  } = useBarrage({
    parentRef: groupRef,
    onHit,
    enemyData,
    setDamageNumbers,
    nextDamageNumberId,
    charges: fireballCharges,
    setCharges: setFireballCharges
  });

  // Wrap shootBarrage to include bow animation with delay
  const shootBarrage = useCallback(() => {
    triggerAbilityBowAnimation(); // Visual bow animation only
    
    // Delay the actual ability firing by 0.5 seconds to match bow animation
    setTimeout(() => {
      originalShootBarrage();
    }, 500);
  }, [triggerAbilityBowAnimation, originalShootBarrage]);

  // IcicleOrbitals refs for FROST sabres innate ability (already declared above)

  // Add lifesteal state for accumulating damage per swing
  const lifestealDamageThisSwing = useRef(0);

  // Add lifesteal ref
  const lifestealRef = useRef<{ processLifesteal: (damage: number) => void }>(null);

  // Add lifesteal hook
  const { processLifesteal } = useLifesteal({
    onHealthChange: handleHealthChange,
    parentRef: groupRef,
    setDamageNumbers,
    nextDamageNumberId,
    currentHealth: health,
    maxHealth
  });

  // Expose lifesteal through ref
  useImperativeHandle(lifestealRef, () => ({
    processLifesteal: (damage: number) => {
      // Accumulate damage for this swing instead of processing immediately
      lifestealDamageThisSwing.current += damage;
    }
  }));

  // Add GuidedBolts hook
  const {
    castGuidedBolts,
    updateMissiles: updateGuidedBoltMissiles,
    getActiveMissiles: getGuidedBoltMissiles,
    cleanup: cleanupGuidedBolts
  } = useGuidedBolts({
    parentRef: groupRef,
    charges: fireballCharges,
    setCharges: setFireballCharges,
    onHit,
    enemyData,
    setDamageNumbers,
    nextDamageNumberId
  });



  // Add LavaLash hook for PYRO spear subclass
  const {
    projectiles: lavaLashProjectiles,
    shootLavaLash,
    checkCollisions: checkLavaLashCollisions,
    handleProjectileImpact: handleLavaLashImpact,
    updateProjectiles: updateLavaLashProjectiles,
    resetIncinerateStacks
  } = useLavaLash({
    onHit,
    setDamageNumbers,
    nextDamageNumberId,
    enemyData,
    level,
    onIncinerateStackChange: handleIncinerateStackChange
  });

  // Set the reset function ref after LavaLash hook is initialized
  resetIncinerateStacksRef.current = resetIncinerateStacks;

  // Reset Incinerate stacks when game resets
  useEffect(() => {
    const handleGameReset = () => {
      resetIncinerateStacks();
      setIncinerateStacks(0);
      setIsIncinerateEmpowered(false);
      if (onIncinerateStacksChange) {
        onIncinerateStacksChange(0);
      }
    };

    window.addEventListener('gameReset', handleGameReset);
    return () => window.removeEventListener('gameReset', handleGameReset);
  }, [resetIncinerateStacks, onIncinerateStacksChange]);

  // Shoot LavaLash projectile for Pyro Spear Q ability
  const shootLavaLashFromUnit = useCallback(() => {
    if (!groupRef.current) {
      return;
    }

    // Calculate position from Unit center, elevated
    const position = groupRef.current.position.clone();
    position.y += 1; // Elevate projectile like other projectiles

    // Calculate direction - forward from Unit's current rotation
    const direction = new Vector3(0, 0, 1)
      .applyQuaternion(groupRef.current.quaternion)
      .normalize();

    // Shoot the LavaLash projectile
    shootLavaLash(position, direction);

    // Send lava lash projectile effect to other players in multiplayer
    if (isInRoom && isPlayer && sendEffect) {
      sendEffect({
        type: 'lavaLashProjectile',
        position: position.clone(),
        direction: direction.clone(),
        duration: 2000, // 10 second max lifespan
        speed: 0.2, // LavaLash projectile speed
        weaponType: currentWeapon,
        subclass: currentSubclass
      });
    }
  }, [groupRef, shootLavaLash, isInRoom, isPlayer, sendEffect, currentWeapon, currentSubclass]);

  // Shoot Icicle projectile for Frost Sabres Q ability
  const shootIcicleFromUnit = useCallback((): boolean => {
    if (!shootIcicleRef.current) {
      return false;
    }

    // Call the shootIcicle function from IcicleOrbitals
    return shootIcicleRef.current();
  }, []);

  // Add ViperSting hook for VENOM bow subclass
  const {
    shootViperSting: originalShootViperSting,
    projectilePool: viperStingProjectilesRef,
    soulStealEffects: viperStingSoulStealEffects
  } = useViperSting({
    parentRef: groupRef,
    onHit,
    enemyData,
    setDamageNumbers,
    nextDamageNumberId,
    onHealthChange: handleHealthChange,
    createBeamEffect: createViperStingBeamEffect,
    applyDoT: applyViperStingDoT,
    charges: fireballCharges,
    setCharges: setFireballCharges
  });

  // Wrap shootViperSting to include bow animation with delay
  const shootViperSting = useCallback(() => {
    triggerAbilityBowAnimation(); // Visual bow animation only
    
    // Delay the actual ability firing by 0.5 seconds to match bow animation
    setTimeout(() => {
      originalShootViperSting();
    }, 500);
    
    return true; // Return true immediately to indicate ability was triggered
  }, [triggerAbilityBowAnimation, originalShootViperSting]);

  useAbilityKeys({
    keys: movementKeys,
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
      bowChargeStartTime.current = value; 
      // Send bow charge effect when charging starts
      if (value !== null && isInRoom && isPlayer && groupRef.current) {
        sendEffect({
          type: 'bowCharge',
          position: groupRef.current.position.clone(),
          direction: new Vector3(0, 0, 1).applyQuaternion(groupRef.current.quaternion),
          duration: 2000 // 2 second charge duration
        });
      }
    },
    setSmiteEffects: (callback) => {
      setSmiteEffects(prev => {
        const newEffects = callback(prev);
        // Send smite effect for newly added effects
        const addedEffects = newEffects.filter(effect => 
          !prev.some(prevEffect => prevEffect.id === effect.id)
        );
        
        if (addedEffects.length > 0 && isInRoom && isPlayer && groupRef.current) {
          addedEffects.forEach(effect => {
            sendEffect({
              type: 'smite',
              position: groupRef.current!.position.clone(),
              direction: new Vector3(0, 0, 1).applyQuaternion(groupRef.current!.quaternion),
              targetPosition: effect.position.clone(),
              duration: 1000 // 1 second smite duration
            });
          });
        }
        
        return newEffects;
      });
    },
    setActiveEffects, 
    onAbilityUse,
    shootFireball,
    releaseBowShot,
    startFirebeam,
    stopFirebeam,
    castReanimate: () => {
      const success = reanimateRef.current?.castReanimate();
      // If Reanimate was successfully cast and we're in multiplayer, heal all allies
      if (success && isInRoom && isPlayer && groupRef.current && healAllies) {
        healAllies(7, groupRef.current.position.clone(), 'reanimate'); // 7 HP heal amount from Reanimate
      }
      return success;
    },
    castSoulReaper: () => {
      return soulReaperRef.current?.castSoulReaper() || false;
    },
    health,
    startBurstSequence,
    shootLavaLash: shootLavaLashFromUnit,
    shootIcicle: shootIcicleFromUnit,
    maxHealth,
    onHealthChange,
    activateOathstrike,
    setIsOathstriking,
    orbShieldRef,
    isWhirlwinding,
    setIsWhirlwinding: (value) => {
      setIsWhirlwinding(value);
      // Send whirlwind effect when whirlwind starts
      if (value && isInRoom && isPlayer && groupRef.current) {
        sendEffect({
          type: 'whirlwind',
          position: groupRef.current.position.clone(),
          direction: new Vector3(0, 0, 1).applyQuaternion(groupRef.current.quaternion),
          duration: 15000 // 15 second max whirlwind duration
        });
      }
    },
    whirlwindStartTime,
    fireballCharges,
    setFireballCharges,
    activateStealth: () => {
      activateStealth();
      // Send stealth effect
      if (isInRoom && isPlayer && groupRef.current) {
        sendEffect({
          type: 'stealth',
          position: groupRef.current.position.clone(),
          direction: new Vector3(0, 0, 1).applyQuaternion(groupRef.current.quaternion),
          duration: 3500 // 5 second stealth duration
        });
      }
    },
    shootQuickShot,
    shootGlacialShard,
    shootBarrage,
    shootViperSting,
    activateVault,
    activeVault,
    canVault: canVaultFn,
    startPyroclastCharge,
    releasePyroclastCharge,
    isPyroclastActive,
    isBreaching,
    setIsBreaching,
    activateBreach,  // Add this new prop
    activateMeteorSwarm,  // Add MeteorSwarm activation
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
    reanimateRef,
    castGuidedBolts,
    lastLightningTarget,
    isDivineStorming,
    setIsDivineStorming,
    triggerDivineStorm,
    activateColossusStrike,
    onEviscerate: handleEviscerateTrigger,
    onBoneclaw: handleBoneclawTrigger,
    hasInstantPowershot,
    setHasInstantPowershot,
    level,
    activateBlizzardShield,
    isPerfectShotWindow,
    hasAutoReleasedBowShot,
    setHasAutoReleasedBowShot,
    startThrowSpearCharge,
    releaseThrowSpearCharge,
    isThrowSpearCharging,
    isSpearThrown,
    // Multiplayer parameters
    sendEffect,
    isInRoom,
    isPlayer,
    isStunned: isPlayerStunned
  });

  // Add dual wield effect detection for Abyssal Scythe at level 2+
  const dualWieldSent = useRef(false);
  useEffect(() => {
    if (currentWeapon === WeaponType.SCYTHE && 
        currentSubclass === WeaponSubclass.ABYSSAL && 
        level >= 2 && 
        !dualWieldSent.current &&
        isInRoom && isPlayer && groupRef.current) {
      
      sendEffect({
        type: 'dualWield',
        position: groupRef.current.position.clone(),
        direction: new Vector3(0, 0, 1).applyQuaternion(groupRef.current.quaternion),
        duration: -1, // Permanent effect
        weaponType: currentWeapon,
        subclass: currentSubclass,
        isSecondaryWeapon: true
      });
      
      dualWieldSent.current = true;
    }
  }, [currentWeapon, currentSubclass, level, isInRoom, isPlayer, sendEffect]);

  //=====================================================================================================

  // SMITE COMPLETE 
  const handleSmiteComplete = () => {
    setIsSmiting(false);
    setIsSwinging(false);
    setHitCountThisSwing({});
  };

  // COLOSSUS STRIKE COMPLETE
  const handleColossusStrikeComplete = () => {
    if (!groupRef.current) return;

    // Find the closest enemy target again (same logic as activation)
    let closestEnemy = null;
    let closestDistance = Infinity;
    const playerPosition = groupRef.current.position;

    for (const enemy of enemyData) {
      if (enemy.health <= 0 || enemy.isDying) continue;
      
      const distance = playerPosition.distanceTo(enemy.position);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestEnemy = enemy;
      }
    }

    if (closestEnemy) {
      // Calculate missing health damage: 100 + (5 × missing HP)
      const missingHP = maxHealth - health;
      const baseDamage = 100 + (missingHP * 3);
      
      // Apply the main Colossus Strike damage
      if (onHit) {
        onHit(closestEnemy.id, baseDamage);
      }

      // Add regular damage number (white)
      setDamageNumbers(prev => [...prev, {
        id: nextDamageNumberId.current++,
        damage: baseDamage,
        position: closestEnemy.position.clone(),
        isCritical: false,
        isColossusStrike: true
      }]);

      // Calculate lightning damage: 100 + (20% of enemy's max health)
      const lightningDamage = 100 + Math.floor(closestEnemy.maxHealth * 0.2);

      // Apply lightning damage after a short delay
      setTimeout(() => {
        if (onHit) {
          onHit(closestEnemy.id, lightningDamage);
        }

        // Add golden lightning damage number
        setDamageNumbers(prev => [...prev, {
          id: nextDamageNumberId.current++,
          damage: lightningDamage,
          position: closestEnemy.position.clone(),
          isCritical: false,
          isColossusLightning: true
        }]);
      }, 100);

      // Create the yellow lightning effect
      setColossusStrikeLightning(prev => [...prev, {
        id: Date.now(),
        position: closestEnemy.position.clone()
      }]);

      // Heal the player for 20 HP (only for Vengeance subclass)
      if (currentSubclass === WeaponSubclass.VENGEANCE && groupRef.current) {
        const playerPosition = groupRef.current.position.clone();
        playerPosition.y += 1; // Adjust height for healing effect
        processColossusHealing(COLOSSUS_STRIKE_HEAL_AMOUNT, playerPosition);
      }
    }

    // Reset states
    setIsColossusStriking(false);
    setIsSwinging(false);
    setHitCountThisSwing({});
  };

  const handleSmiteEffectComplete = (id: number) => {
    setSmiteEffects(prev => prev.filter(effect => effect.id !== id));
  };

  const handleColossusLightningComplete = (id: number) => {
    setColossusStrikeLightning(prev => prev.filter(lightning => lightning.id !== id));
  };

  // DAMAGE NUMBERS COMPLETE 
  const handleDamageNumberComplete = (id: number) => {
    setDamageNumbers(prev => prev.filter(dn => dn.id !== id));
  };

  // Periodic cleanup for stuck damage numbers (safety measure)
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      setDamageNumbers(prev => {
        const filtered = prev.filter(dn => {
          // Remove damage numbers older than 3 seconds (normal lifespan is 1.5s)
          const age = now - (typeof dn.id === 'number' ? dn.id : 0);
          return age < 3000;
        });
        
        // Log cleanup if we removed any damage numbers
        if (filtered.length < prev.length) {
          console.log(`🧹 Cleaned up ${prev.length - filtered.length} stuck damage numbers`);
        }
        
        return filtered;
      });
    }, 2000); // Check every 2 seconds

    return () => clearInterval(interval);
  }, []);

  // SABRE DOUBLE HIT
  useEffect(() => {
    if (currentWeapon === WeaponType.SABRES ) {
      setHitCountThisSwing({});
    }
  }, [currentWeapon]);

  //BOW PROJECTILE HIT 
  const handleProjectileHit = (projectileId: number, targetId: string, power: number, projectilePosition: Vector3) => {
    const projectile = activeProjectilesRef.current.find(p => p.id === projectileId);
    if (!projectile) return;
    
    // Calculate base damage based on charge level
    let baseDamage;
    const isPerfectShotBehavior = projectile.isPerfectShot && currentSubclass === WeaponSubclass.ELEMENTAL;
    const isFullyChargedBehavior = projectile.power >= 0.99 || isPerfectShotBehavior;
    
    if (isFullyChargedBehavior) { // Fully charged OR perfect shot
      baseDamage = 157;
      
      // Add bonus damage from Elemental Shots (passive ability) if it's unlocked and ELEMENTAL subclass  
      // Perfect shots get this bonus from level 1+ (at all levels), fully charged shots get it when ability is unlocked
      if (currentSubclass === WeaponSubclass.ELEMENTAL && 
          (abilities[WeaponType.BOW].passive.isUnlocked || isPerfectShotBehavior)) {
        const randomBonus = Math.floor(Math.random() * 121) + 120; // 120-240 range
        baseDamage += randomBonus;
      }
      
      // Perfect shot level-based bonus damage
      if (isPerfectShotBehavior) {
        let perfectShotBonus = 100; // Base 100 at level 1
        if (level >= 2) perfectShotBonus = 150;
        if (level >= 3) perfectShotBonus = 200;
        if (level >= 4) perfectShotBonus = 250;
        if (level >= 5) perfectShotBonus = 300;
        baseDamage += perfectShotBonus;
      }
    } else {
      // Minimum damage of 41, scaling up with charge
      baseDamage = 36 + Math.floor((projectile.power * 108));
      
      // Add bonus damage from Elemental Shots for non-fully charged shots (ELEMENTAL subclass only)
      // Only create lightning strike for truly non-fully charged, non-perfect shots
      if (currentSubclass === WeaponSubclass.ELEMENTAL && abilities[WeaponType.BOW].passive.isUnlocked && 
          !isPerfectShotBehavior && projectile.power < 0.99) {
        baseDamage += Math.floor(Math.random() * (111 - 59 + 1)) + 59; // Add random bonus damage (59-111) to non-fully charged shots
        
        // Create lightning strike effect and track the target (only for non-perfect, non-fully charged shots)
        createLightningStrike(projectilePosition, targetId);
      }
    }
    
    // Apply critical hit calculation
    const { damage, isCritical } = calculateDamage(baseDamage);
    
    // Apply stun effect for perfect shots to all enemies hit
    if (isPerfectShotBehavior && onApplyStunEffect) {
      onApplyStunEffect(targetId.replace('enemy-', ''), 2500); // 2 second stun duration
      
      // Create visual stun effect
      const enemy = enemyData.find(e => e.id === targetId);
      if (enemy && setActiveEffects) {
        const stunPosition = enemy.position.clone();
        stunPosition.y += 1;
        
        const effectId = Date.now() + Math.random(); // Ensure unique ID
        
        setActiveEffects(prev => [...prev, {
          id: effectId,
          type: 'concussiveStun',
          position: stunPosition,
          direction: new Vector3(0, 0, 0),
          duration: 2500,
          startTime: Date.now(),
          enemyId: targetId
        }]);

        // Create lightning strike effect at enemy position for visual feedback
        const lightningEffectId = Date.now() + Math.random() + 0.1; // Ensure unique ID
        
        setActiveEffects(prev => [...prev, {
          id: lightningEffectId,
          type: 'concussiveLightning',
          position: enemy.position.clone(),
          scale: new Vector3(0.25, 0.25, 0.25),
          direction: new Vector3(0, 0, 0),
          duration: 600, // 0.6 seconds
          startTime: Date.now(),
          enemyId: targetId
        }]);
      }
    }
    
    // Create damage number with proper flags
    setDamageNumbers(prev => [
      ...prev,
      {
        id: nextDamageNumberId.current++,
        damage: damage,
        position: projectilePosition.clone().add(new Vector3(0, 0, 0)),
        isCritical: isCritical, 
        isLightning: false,
        isBowLightning: !isFullyChargedBehavior && currentSubclass === WeaponSubclass.ELEMENTAL && abilities[WeaponType.BOW].passive.isUnlocked,
        isHealing: false,
        isBlizzard: false,
        isBoneclaw: false,
        isSmite: false,
        isSword: false,
        isSabres: false,
        isOathstrike: false,
        isFirebeam: false,
        isOrbShield: false,
        isChainLightning: false,
        isFireball: false,
        isSummon: false,
        isStealthStrike: false,
        isPyroclast: false,
        isEagleEye: false,
        isBreach: false,
        isBarrage: false,
        isGlacialShard: false,
        isAegis: false,
        isCrossentropyBolt: false,
        isGuidedBolt: false,
        isDivineStorm: false,
        isHolyBurn: false,
        isColossusStrike: false,
        isColossusLightning: false,
        isFirestorm: false,
        isElementalBowPowershot: isFullyChargedBehavior && currentSubclass === WeaponSubclass.ELEMENTAL && abilities[WeaponType.BOW].passive.isUnlocked,
        isPoisonDoT: false
      }
    ]);
    
    // Handle damage effects
    onHit(targetId, damage);
    
    // Apply poison DoT for fully charged Venom bow shots
    if (projectile.isFullyCharged && currentSubclass === WeaponSubclass.VENOM) {
      const now = Date.now();
      venomDoTEnemies.current[targetId] = {
        startTime: now,
        lastTickTime: now,
        duration: 7000 // 7 seconds
      };
    }
    
    // Only set hasCollided for non-fully charged shots and non-perfect shots
    // This allows fully charged shots and perfect shots to pierce through enemies
    if (!projectile.isFullyCharged && !projectile.isPerfectShot) {
      projectile.hasCollided = true;
    }
  };

  // FIREBALL HIT 
  const handleFireballHit = (fireballId: number, targetId: string) => {
    const isEnemy = targetId.startsWith('enemy');
    if (!isEnemy) return;

    const enemy = enemyData.find(e => e.id === targetId);
    if (!enemy) return;

    // Find the fireball to check if it's a Crossentropy Bolt
    const fireball = activeFireballsRef.current.find(f => f.id === fireballId);
    const isCrossentropyBolt = fireball?.isCrossentropyBolt;

    // Debug logging for Crossentropy Bolt hits
    if (isCrossentropyBolt) {
      console.log('💥 Crossentropy Bolt hit!', { fireballId, targetId, isCrossentropyBolt });
    }

    // Calculate damage - scale with level for Chaos Scythe subclass
    let baseDamage = 73; // Default damage
    
    // Check if this is Chaos Scythe subclass for level-based damage scaling
    if (currentWeapon === WeaponType.SCYTHE && currentSubclass === WeaponSubclass.CHAOS) {
      // Level-based damage scaling for Chaos Scythe Entropic Bolt
      switch (level) {
        case 1:
          baseDamage = 79;
          break;
        case 2:
          baseDamage = 83;
          break;
        case 3:
          baseDamage = 89;
          break;
        case 4:
          baseDamage = 97;
          break;
        case 5:
        default:
          baseDamage = 101;
          break;
      }
    }
    
    // For Crossentropy Bolt (level 2+ minimum), use special scaling
    let finalDamage;
    if (isCrossentropyBolt) {
      if (currentWeapon === WeaponType.SCYTHE && currentSubclass === WeaponSubclass.CHAOS) {
        // Crossentropy Bolt level-based damage (minimum level 2)
        switch (level) {
          case 2:
            finalDamage = 167;
            break;
          case 3:
            finalDamage = 179;
            break;
          case 4:
            finalDamage = 197;
            break;
          case 5:
          default:
            finalDamage = 211;
            break;
        }
      } else {
        finalDamage = baseDamage * 2; // Default double damage for other weapons
      }
    } else {
      finalDamage = baseDamage; // Regular Entropic Bolt damage
    }
    const { damage, isCritical } = calculateDamage(finalDamage);
    
    // Debug logging for damage calculation
    if (isCrossentropyBolt) {
      console.log('⚡ Crossentropy Bolt damage calculation:', { level, baseDamage, finalDamage, damage, isCritical });
    } else if (currentWeapon === WeaponType.SCYTHE && currentSubclass === WeaponSubclass.CHAOS) {
      console.log('🔮 Chaos Scythe Entropic Bolt damage:', { level, baseDamage, finalDamage, damage, isCritical });
    }
    
    // Passive Chaos Totem summoning on critical Fireball/Entropic Bolt hits
    if (isCritical && currentWeapon === WeaponType.SCYTHE && currentSubclass === WeaponSubclass.CHAOS) {
      console.log('🎯 Critical hit detected! Summoning Chaos Totem passively...');
      
      const summonId = Date.now();
      
      setActiveEffects(prev => {
        // Get max totems based on level (1 at levels 1-2, 2 at level 3+)
        const maxTotems = level >= 3 ? 2 : 1;
        const currentTotems = prev.filter(effect => effect.type === 'summon').length;
        
        if (currentTotems >= maxTotems) {
          console.log(`⚠️ Maximum totems (${maxTotems}) already exist, not summoning another`);
          return prev;
        }

        // Start the healing effect when totem is summoned
        console.log('🟢 [Chaos Totem] Starting healing: 2HP per second for 8 seconds');
        startTotemHealing();

        // Send totem effect to other players in multiplayer
        if (isInRoom && isPlayer && groupRef.current) {
          sendEffect({
            type: 'totem',
            position: groupRef.current.position.clone(),
            direction: new Vector3(0, 0, 1).applyQuaternion(groupRef.current.quaternion),
            duration: 8000, // 8 second duration
            weaponType: currentWeapon,
            subclass: currentSubclass,
            totemId: summonId.toString()
          });
        }

        return [
          ...prev,
          {
            id: summonId,
            type: 'summon',
            position: groupRef.current!.position.clone(),
            direction: new Vector3(0, 0, 1).applyQuaternion(groupRef.current!.quaternion),
            onComplete: () => {
              // Stop healing when totem expires
              console.log('🛑 [Chaos Totem] Totem expired, stopping healing');
              stopTotemHealing();
            },
            onStartCooldown: () => {}
          }
        ];
      });
    }
    
    onHit(targetId, damage);

    // Check if target is still alive before adding damage number
    const targetAfterDamage = enemy.health - damage;
    if (targetAfterDamage > 0) {
      setDamageNumbers(prev => [...prev, {
        id: nextDamageNumberId.current++,
        damage,
        position: enemy.position.clone(),
        isCritical,
        isFireball: true,
        isCrossentropyBolt: isCrossentropyBolt
      }]);
    }

    // Remove the fireball
    handleFireballImpact(fireballId);

    // Add this check for Reignite passive
    if (targetAfterDamage <= 0) {
      // Process kill for Reignite if using Spear with passive unlocked
      if ((currentWeapon as WeaponType) === WeaponType.SPEAR && 
          abilities[WeaponType.SPEAR].passive.isUnlocked && 
          reigniteRef.current) {
        // Ensure we pass a fresh clone of the position
        const killPosition = enemy.position.clone();
        console.log(`[Fireball] Reignite processKill at position:`, {
          x: killPosition.x.toFixed(3),
          y: killPosition.y.toFixed(3),
          z: killPosition.z.toFixed(3)
        });
        reigniteRef.current.processKill(killPosition);
      }
    }
  };

  // POSITION UPDATE 
  useFrame(() => {
    if (groupRef.current) {
      const position = groupRef.current.position.clone();
      const rotation = groupRef.current.rotation;
      const rotationVector = new Vector3(rotation.x, rotation.y, rotation.z);
      onPositionUpdate(position, isStealthed, rotationVector, movementDirection); // Pass stealth state, rotation, and movement direction to parent
    }
  });

  // OATHSTRIKE COMPLETE
  const handleOathstrikeComplete = () => {
    setIsOathstriking(false);
    setIsSwinging(false);
    setHitCountThisSwing({});
  };

  // DIVINESTORM COMPLETE
  const handleDivineStormComplete = () => {
    setIsDivineStorming(false);
    setIsSwinging(false);
    setHitCountThisSwing({});
  };



  // Clear any pending SMITE targets using the captured value
  useEffect(() => {
    const currentPendingTargets = pendingLightningTargets.current;
    return () => {
      currentPendingTargets.clear();
    };
  }, []);

  // Add cleanup for expired projectiles
  useFrame(() => {
    // Update Aegis projectiles
    updateAegisProjectiles();
    
    setActiveProjectiles(prev => prev.filter(projectile => {
      const distanceTraveled = projectile.position.distanceTo(projectile.startPosition);
      return distanceTraveled < projectile.maxDistance;
    }));
  });

  // Consolidated cleanup for all effects - runs every 500ms instead of multiple 100ms intervals
  useEffect(() => {
    const consolidatedCleanup = () => {
      const now = Date.now();
      
      setActiveEffects(prev => 
        prev.filter(effect => {
          // Skip effects that don't have timing
          if (!effect.startTime || !effect.duration) return true;
          
          const elapsed = (now - effect.startTime) / 1000;
          const duration = effect.duration;
          
          // Keep effect if it hasn't expired
          return elapsed < duration;
        })
      );
    };

    // Single interval at 500ms instead of multiple 100ms intervals
    const cleanupInterval = setInterval(consolidatedCleanup, 500);
    
    return () => {
      clearInterval(cleanupInterval);
      // Clear all effects on unmount
      setActiveEffects([]);
    };
  }, [setActiveEffects]);

  // Aggressive cleanup for damage numbers and effects when they accumulate too much
  useEffect(() => {
    const aggressiveCleanup = setInterval(() => {
      // Check if we have too many damage numbers
      if (damageNumbers.length > 30) {
        console.log(`🧹 Aggressive damage number cleanup - ${damageNumbers.length} damage numbers detected`);
        setDamageNumbers(prev => prev.slice(-20)); // Keep only the last 20
      }
      
      // Check if we have too many active effects
      if (activeEffects.length > 50) {
        console.log(`🧹 Aggressive effect cleanup - ${activeEffects.length} active effects detected`);
        setActiveEffects(prev => prev.slice(-30)); // Keep only the last 30
      }
      
      // Check if we have too many fireballs
      if (fireballs.length > 20) {
        console.log(`🧹 Aggressive fireball cleanup - ${fireballs.length} fireballs detected`);
        setFireballs(prev => prev.slice(-10)); // Keep only the last 10
      }
    }, 3000); // Check every 3 seconds
    
    return () => clearInterval(aggressiveCleanup);
  }, [damageNumbers.length, activeEffects.length, fireballs.length]);

  // Add additional cleanup for unmounting


  useEffect(() => {
    if (fireballManagerRef) {
      fireballManagerRef.current = {
        shootFireball,
        cleanup: () => {
          setFireballs([]);
          setActiveEffects([]);
          // Clear any pending effects
          pendingLightningTargets.current.clear();
          // Reset orbital charges
          setFireballCharges(prev => prev.map(charge => ({
            ...charge,
            available: true,
            cooldownStartTime: null
          })));
        }
      };
    }
  }, [fireballManagerRef, shootFireball]);

  useEffect(() => {
    return () => {
      setFireballs([]);
      setFireballCharges(prev => prev.map(charge => ({
        ...charge,
        available: true,
        cooldownStartTime: null
      })));
    };
  }, []);







  // Cleanup effect for fireballs
  useEffect(() => {
    return () => {
      activeFireballsRef.current = [];
      setFireballs([]);
    };
  }, []);

  // Cleanup effect for projectiles
  useEffect(() => {
    return () => {
      activeProjectilesRef.current = [];
      setActiveProjectiles([]);
    };
  }, []);

  useEffect(() => {
    return () => {
      setIsWhirlwinding(false);
      whirlwindStartTime.current = null;
    };
  }, []);

  // Add cleanup in useEffect
  useEffect(() => {
    return () => {
      // Return all active projectiles and fireballs to their pools
      activeProjectilesRef.current.forEach(proj => projectilePool.release(proj));
      activeFireballsRef.current.forEach(fireball => fireballPool.release(fireball));
      
      // Clear refs and states
      activeProjectilesRef.current = [];
      activeFireballsRef.current = [];
      setActiveProjectiles([]);
      setFireballs([]);
      
      // Clean up barrage projectiles
      cleanupBarrage();
      
      // Clean up guided bolt missiles
      cleanupGuidedBolts();
    };
  }, [projectilePool, fireballPool, cleanupBarrage, cleanupGuidedBolts]);

  useEffect(() => {
    // Reset Eagle Eye counter when switching weapons
    if (resetEagleEyeCounter) {
      resetEagleEyeCounter();
    }
  }, [currentWeapon, resetEagleEyeCounter]);

  // Add this function after the handleAttack function in Unit.tsx
  const checkForSpearKillAndProcessReignite = useCallback((
    targetId: string, 
    damageFn: (id: string, damage: number) => void, 
    damage: number,
    ignoreWeaponCheck = false 
  ) => {
    // Skip weapon check if ignoreWeaponCheck is true
    if (!ignoreWeaponCheck && (currentWeapon !== WeaponType.SPEAR || !abilities[WeaponType.SPEAR].passive.isUnlocked)) {
      console.log(`[SpearKill] Not processing Reignite - weapon: ${currentWeapon}, passive unlocked: ${abilities[WeaponType.SPEAR]?.passive?.isUnlocked}, reigniteRef: ${reigniteRef.current ? 'available' : 'null'}`);
      damageFn(targetId, damage);
      return;
    }
    
    // Get the target and store its health before damage
    const target = enemyData.find(e => e.id === targetId);
    if (!target) {
      console.log(`[SpearKill] Target ${targetId} not found`);
      damageFn(targetId, damage);
      return;
    }
    
    const previousHealth = target.health;
    console.log(`[SpearKill] Target ${targetId} health before damage: ${previousHealth}, damage: ${damage}`);
    
    // Apply the damage
    damageFn(targetId, damage);
    
    // Need to find the target again to get updated health
    const updatedTarget = enemyData.find(e => e.id === targetId);
    if (!updatedTarget) {
      console.log(`[SpearKill] Target ${targetId} was removed after damage`);
      return;
    }
    
    console.log(`[SpearKill] Target ${targetId} health after damage: ${updatedTarget.health}`);
    
    // Check if the enemy was killed by this hit
    if (previousHealth > 0 && updatedTarget.health <= 0) {
      console.log(`[SpearKill] Kill detected with Spear ability, processing Reignite...`);
      if (reigniteRef.current) {
        // Ensure we pass a fresh clone of the position
        const killPosition = updatedTarget.position.clone();
        console.log(`[SpearKill] Reignite processKill at position:`, {
          x: killPosition.x.toFixed(3),
          y: killPosition.y.toFixed(3),
          z: killPosition.z.toFixed(3)
        });
        reigniteRef.current.processKill(killPosition);
      } else {
        console.log(`[SpearKill] ISSUE: reigniteRef.current is null at kill time`);
      }
    } else {
      console.log(`[SpearKill] No kill detected - health before: ${previousHealth}, after: ${updatedTarget.health}`);
    }
  }, [currentWeapon, abilities, enemyData, reigniteRef]);

  // Function to handle Dragon Breath kills and restore orb charges
  const processDragonBreathKill = useCallback(() => {
    console.log('[DragonBreath] Kill detected! Processing orb charge restoration...');
    
    // Restore 3 orb charges when Dragon Breath kills an enemy
    setFireballCharges(currentCharges => {
      console.log('[DragonBreath] Current charges state:', 
        currentCharges.map(charge => ({
          id: charge.id,
          available: charge.available,
          cooldownStartTime: charge.cooldownStartTime
        }))
      );
      
      // Find up to three unavailable charges
      const unavailableIndices = currentCharges
        .map((charge, index) => charge.available ? -1 : index)
        .filter(index => index !== -1)
        .slice(0, 3); // Restore exactly 3 charges per kill
      
      if (unavailableIndices.length === 0) {
        console.log('[DragonBreath] No charges to restore - all orbs are already available');
        return currentCharges; // No changes needed
      }
      
      console.log(`[DragonBreath] Restoring ${unavailableIndices.length} orb charges`);
      
      // Create a new array with the updated charges
      const updatedCharges = currentCharges.map((charge, index) => 
        unavailableIndices.includes(index) ? {
          ...charge,
          available: true,
          cooldownStartTime: null
        } : charge
      );
      
      return updatedCharges;
    });
  }, []);

  return (
    <>
      <group ref={groupRef} position={[0, 1, 0]}>

        {/* DRAGON HORNS */}
        <group scale={[0.235, 0.335, 0.235]} position={[-0.05, 0.215, 0.35]} rotation={[+0.15, 0, -5]}>
          <DragonHorns isLeft={true} />
        </group>

       <group scale={[0.235, 0.335, 0.235]} position={[0.05, 0.215, 0.35]} rotation={[+0.15, 0, 5]}>
        <DragonHorns isLeft={false} />

      </group>
        {/* Outer glow SPhere layer */}
        <mesh scale={1.085}>
          <sphereGeometry args={[0.415, 32, 32]} />
          <meshBasicMaterial
            color="#a8e6cf"
            transparent
            opacity={isStealthed ? 0.15 : 0.125}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>

        {/* Stealth fade effect */}
        {isStealthed && (
          <mesh scale={1.1}>
            <sphereGeometry args={[0.42, 32, 32]} />
            <meshBasicMaterial
              color="#a8e6cf"
              transparent
              opacity={0.08}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
        )}

        {/* Stealth mist effect */}
        {isStealthed && <StealthMistEffect parentRef={groupRef} />}

        {/* Incinerate Empowerment effect for Pyro Spear */}
        {currentWeapon === WeaponType.SPEAR && 
         currentSubclass === WeaponSubclass.PYRO && 
         isIncinerateEmpowered && (
          <IncinerateEmpowerment
            position={new Vector3(0, 0, 0)} // Relative to the Unit group
            isEmpowered={isIncinerateEmpowered}
          />
        )}
        
        {/* WINGS */}
        <group position={[0, 0.2, -0.2]}>
          {/* Left Wing */}
          <group rotation={[0, Math.PI / 5.5, 0]}>
            <BoneWings 
              collectedBones={collectedBones} 
              isLeftWing={true}
              parentRef={groupRef} 
            />
          </group>
          
          {/* Right Wing */}
          <group rotation={[0, -Math.PI / 5.5, 0]}>
            <BoneWings 
              collectedBones={collectedBones} 
              isLeftWing={false}
              parentRef={groupRef} 
            />
          </group>
        </group>

        <ChargedOrbitals 
          parentRef={groupRef} 
          charges={fireballCharges}
          weaponType={currentWeapon}
          weaponSubclass={currentSubclass}
        />

        {/* Icicle Orbitals for FROST sabres subclass - innate ability */}
        {currentWeapon === WeaponType.SABRES && currentSubclass === WeaponSubclass.FROST && (
          <IcicleOrbitals
            parentRef={groupRef}
            charges={icicleCharges}
            setCharges={setIcicleCharges}
            enemyData={enemyData}
            onHit={onHit}
            setDamageNumbers={setDamageNumbers}
            nextDamageNumberId={nextDamageNumberId}
            level={level}
            onFreezeStateCheck={onFreezeStateCheck}
            onApplySlowEffect={onApplySlowEffect}
            comboStep={icicleComboStep}
            onComboComplete={handleIcicleComboComplete}
            onShootIcicle={(shootFunction) => {
              shootIcicleRef.current = shootFunction;
            }}
            onUpdateProjectiles={(updateFunction) => {
              updateIcicleProjectilesRef.current = updateFunction;
            }}
            onGetActiveProjectiles={(getFunction) => {
              getIcicleProjectilesRef.current = getFunction;
            }}
            // Multiplayer props
            sendEffect={sendEffect}
            isInRoom={isInRoom}
            isPlayer={isPlayer}
          />
        )}

        {/* Eviscerate effects are now handled through activeEffects array like Oathstrike */}
      <group scale={[0.8 , 0.55, 0.8]} position={[0, 0.04, -0.015]} rotation={[0.4, 0, 0]}>
        <BonePlate />
      </group>
      <group scale={[0.85  , 0.85, 0.85]} position={[0, 0.05, +0.1]}>
        <BoneTail movementDirection={movementDirection} />
      </group>
        
        {currentWeapon === WeaponType.SABRES ? (
          <Sabres
            isSwinging={isSwinging}
            onSwingComplete={handleSwingComplete}
            onLeftSwingStart={() => {}}
            onRightSwingStart={() => {}}
            isBowCharging={isBowCharging}
            isFirebeaming={isFirebeaming}
            hasActiveAbility={abilities[WeaponType.SABRES].active.isUnlocked}
          />
        ) : currentWeapon === WeaponType.SCYTHE ? (
          <Scythe 
            parentRef={groupRef}
            isSwinging={isSwinging} 
            onSwingComplete={handleSwingComplete}
            currentSubclass={currentSubclass}
            level={level}
            onLeftSwingStart={() => {}}
            onRightSwingStart={() => {}}
            isEmpowered={currentSubclass === WeaponSubclass.ABYSSAL && legionEmpowerment.isEmpowered}
          />
        ) : currentWeapon === WeaponType.SPEAR ? (
          <Spear
            isSwinging={isSwinging}
            onSwingComplete={handleSwingComplete}
            enemyData={enemyData}
            onHit={(targetId: string, damage: number) => {
              onHit(targetId, damage);
            }}
            setDamageNumbers={setDamageNumbers}
            nextDamageNumberId={nextDamageNumberId}
            isWhirlwinding={isWhirlwinding}
            fireballCharges={fireballCharges}
            currentSubclass={currentSubclass}
            isThrowSpearCharging={isThrowSpearCharging}
            throwSpearChargeProgress={throwSpearChargeProgress}
            isSpearThrown={isSpearThrown}
            // Concussive Blow now handled directly in Unit.tsx hit detection
          />
        ) : currentWeapon === WeaponType.BOW ? (
          <group position={[0, 0.1, 0.3]}>
            <EtherealBow
              position={new Vector3()}
              direction={new Vector3(0, 0, 1).applyQuaternion(groupRef.current?.quaternion || new THREE.Quaternion())}
              chargeProgress={bowChargeProgress}
              isCharging={isBowCharging || isAbilityBowAnimation}
              onRelease={releaseBowShot}
              currentSubclass={currentSubclass}
              hasInstantPowershot={hasInstantPowershot}
              isAbilityBowAnimation={isAbilityBowAnimation}
            />
          </group>
        ) : (
          <>
            <Sword
              isSwinging={isSwinging}
              isSmiting={isSmiting}
              isOathstriking={isOathstriking}
              isDivineStorming={isDivineStorming}
              isColossusStriking={isColossusStriking}
              onSwingComplete={handleSwingComplete}
              onSmiteComplete={handleSmiteComplete}
              onOathstrikeComplete={handleOathstrikeComplete}
              onDivineStormComplete={handleDivineStormComplete}
              onColossusStrikeComplete={handleColossusStrikeComplete}
              hasChainLightning={currentSubclass === WeaponSubclass.VENGEANCE}
              comboStep={swordComboStep}
              currentSubclass={currentSubclass}
              enemyData={enemyData}
              onHit={onHit}
              setDamageNumbers={setDamageNumbers}
              nextDamageNumberId={nextDamageNumberId}
              setActiveEffects={setActiveEffects}
              playerPosition={groupRef.current?.position}
            />
            {/* Shield for Divinity subclass */}
            {currentSubclass === WeaponSubclass.DIVINITY && (
              <>
                <Shield 
                  isShieldActive={shieldState.isActive}
                  isRecharging={shieldState.isRecharging}
                  rechargeProgress={shieldState.rechargeProgress}
                />
                {/* Holy Nova effect when Divine Shield is active */}
                <HolyNova
                  position={new Vector3(0, 0, 0)}
                  isActive={shieldState.isActive && !shieldState.isRecharging}
                  intensity={1.0}
                />
              </>
            )}
          </>
        )}

        {/* Enemy HP Bar */}
        {!isPlayer && (
          <Billboard
            position={[0, 2, 0]}
            lockX={false}
            lockY={false}
            lockZ={false}
          >
            <mesh>
              <planeGeometry args={[1, 0.1]} />
              <meshBasicMaterial color="#333333" />
            </mesh>
            <mesh position={[0.5 + (health / maxHealth) * 0.5, 0, 0.001]}>
              <planeGeometry args={[(health / maxHealth), 0.08]} />
            </mesh>
          </Billboard>
        )}
      </group>

      {/* Ghost Trail*/}
      <GhostTrail parentRef={groupRef} weaponType={currentWeapon} weaponSubclass={currentSubclass} />

      {/* Fireballs  */}
      {fireballs.map(fireball => (
        fireball.isCrossentropyBolt ? (
          <CrossentropyBolt
            key={fireball.id}
            position={fireball.position}
            direction={fireball.direction}
            onImpact={(impactPosition?: Vector3) => handleFireballImpact(fireball.id, impactPosition)}
          />
        ) : (
          <Fireball
            key={fireball.id}
            position={fireball.position}
            direction={fireball.direction}
            onImpact={(impactPosition?: Vector3) => handleFireballImpact(fireball.id, impactPosition)}
          />
        )
      ))}

      {smiteEffects.map(effect => (
        <Smite
          key={effect.id}
          weaponType={currentWeapon}
          position={effect.position}
          onComplete={() => handleSmiteEffectComplete(effect.id)}
        />
      ))}

      {/* DAMAGE NUMBERS  */}
      {damageNumbers.map(dn => (
        <DamageNumber
          key={dn.id}
          damage={dn.damage}
          position={dn.position}
          isCritical={dn.isCritical}
          isLightning={dn.isLightning}
          isHealing={dn.isHealing}
          isBlizzard={dn.isBlizzard}
          isBoneclaw={dn.isBoneclaw}
          isSmite={dn.isSmite}
          isSword={dn.isSword}
          isSabres={dn.isSabres}
          isOathstrike={dn.isOathstrike}
          isFirebeam={dn.isFirebeam}
          isOrbShield={dn.isOrbShield}
          isChainLightning={dn.isChainLightning}
          isFireball={dn.isFireball}
          isSummon={dn.isSummon}
          isStealthStrike={dn.isStealthStrike}
          isPyroclast={dn.isPyroclast}
          isEagleEye={dn.isEagleEye}
          isBreach={dn.isBreach}
          isBowLightning={dn.isBowLightning}
          isBarrage={dn.isBarrage}
          isGlacialShard={dn.isGlacialShard}
          isAegis={dn.isAegis}
          isCrossentropyBolt={dn.isCrossentropyBolt}
          isGuidedBolt={dn.isGuidedBolt}
          isDivineStorm={dn.isDivineStorm}
          isHolyBurn={dn.isHolyBurn}
          isColossusStrike={dn.isColossusStrike}
          isColossusLightning={dn.isColossusLightning}
          isFirestorm={dn.isFirestorm}
          isElementalBowPowershot={dn.isElementalBowPowershot}
          isElementalQuickShot={dn.isElementalQuickShot}
          isPoisonDoT={dn.isPoisonDoT}
          isRaze={dn.isRaze}
          isSoulReaper={dn.isSoulReaper}
          isLavaLash={dn.isLavaLash}
          isDragonBreath={dn.isDragonBreath}
          isLegionEmpoweredScythe={dn.isLegionEmpoweredScythe}
          onComplete={() => handleDamageNumberComplete(dn.id)}
        />
      ))}

      {/* Bow Projectiles */}
      {activeProjectiles.map(projectile => (
        <group key={projectile.id}>
          <group
            position={projectile.position.toArray()}
            rotation={[
              0,
              Math.atan2(projectile.direction.x, projectile.direction.z),
              0
            ]}
          >
            {/* Base arrow */}
            <mesh rotation={[Math.PI/2, 0, 0]}>
              <cylinderGeometry args={[0.02, 0.075, 1.75, 6]} /> {/* Segments */}
              <meshStandardMaterial
                color={currentSubclass === WeaponSubclass.VENOM ? "#00ff60" : "#00ffff"}
                emissive={currentSubclass === WeaponSubclass.VENOM ? "#00aa30" : "#00ffff"}
                emissiveIntensity={currentSubclass === WeaponSubclass.VENOM ? 1.2 : 1}
                transparent
                opacity={projectile.opacity !== undefined ? projectile.opacity : 1}
              />
            </mesh>

            {/* Arrow Rings */}
            {[...Array(3)].map((_, i) => ( 
              <mesh
                key={`ring-${i}`}
                position={[0, 0, -i * 0.45 + 0.5]}
                rotation={[Math.PI, 0, Date.now() * 0.003 + i * Math.PI / 3]}
              >
                <torusGeometry args={[0.125 + i * 0.04, 0.05, 6, 12]} /> {/* Segments */}
                <meshStandardMaterial
                  color={currentSubclass === WeaponSubclass.VENOM ? "#00ff50" : "#00ffff"}
                  emissive={currentSubclass === WeaponSubclass.VENOM ? "#00aa25" : "#00ffff"}
                  emissiveIntensity={currentSubclass === WeaponSubclass.VENOM ? 3.5 : 3}
                  transparent
                  opacity={(0.9 - i * 0.125) * (projectile.opacity !== undefined ? projectile.opacity : 1)}
                  blending={THREE.AdditiveBlending}
                />
              </mesh>
            ))}

            {/* Single light instead of two */}
            <pointLight 
              color={currentSubclass === WeaponSubclass.VENOM ? "#00ff50" : "#00ffff"}
              intensity={currentSubclass === WeaponSubclass.VENOM ? 3.5 : 3}
              distance={currentSubclass === WeaponSubclass.VENOM ? 5.5 : 5}
              decay={2}
            />
          </group>

          {/* POWERSHOT projectiles - thinner version with proper color coding */}
          {(projectile.power >= 1 || projectile.isPerfectShot) && 
           projectile.position.distanceTo(projectile.startPosition) < projectile.maxDistance && 
           !projectile.hasCollided && (
            <group
              position={projectile.position.toArray()}
              rotation={[
                0,
                Math.atan2(projectile.direction.x, projectile.direction.z),
                0
              ]}
            >
              {/* Core arrow shaft - thinner */}
              <mesh rotation={[Math.PI/2, 0, 0]}>
                <cylinderGeometry args={[0.08, 0.18, 1.5, 4]} /> {/* Thinner than original */}
                <meshStandardMaterial
                  color={
                    currentSubclass === WeaponSubclass.ELEMENTAL && abilities[WeaponType.BOW].passive.isUnlocked ? "#ff0000" :
                    currentSubclass === WeaponSubclass.VENOM ? "#00ff40" : "#EAC4D5"
                  }
                  emissive={
                    currentSubclass === WeaponSubclass.ELEMENTAL && abilities[WeaponType.BOW].passive.isUnlocked ? "#cc0000" :
                    currentSubclass === WeaponSubclass.VENOM ? "#00aa20" : "#EAC4D5"
                  }
                  emissiveIntensity={
                    currentSubclass === WeaponSubclass.ELEMENTAL && abilities[WeaponType.BOW].passive.isUnlocked ? 3.0 :
                    currentSubclass === WeaponSubclass.VENOM ? 2.0 : 1.5
                  }
                  transparent
                  opacity={0.7 * (projectile.opacity !== undefined ? projectile.opacity : 1)}
                />
              </mesh>

              {/* Reduced ethereal trails - thinner */}
              {[...Array(
                currentSubclass === WeaponSubclass.ELEMENTAL && abilities[WeaponType.BOW].passive.isUnlocked ? 4 :
                currentSubclass === WeaponSubclass.VENOM ? 3 : 3
              )].map((_, i) => { // Fewer particles
                const totalParticles = currentSubclass === WeaponSubclass.ELEMENTAL && abilities[WeaponType.BOW].passive.isUnlocked ? 4 :
                                     currentSubclass === WeaponSubclass.VENOM ? 3 : 3;
                const angle = (i / totalParticles) * Math.PI * 2;
                const radius = 0.25; // Smaller radius
                return (
                  <group 
                    key={`ghost-trail-${i}`}
                    position={[
                      Math.sin(angle + Date.now() * 0.003) * radius,
                      Math.cos(angle + Date.now() * 0.003) * radius,
                      -1.0 // Closer to arrow
                    ]}
                  >
                    <mesh>
                      <sphereGeometry args={[0.08, 3, 3]} /> {/* Smaller spheres */}
                      <meshStandardMaterial
                        color={
                          currentSubclass === WeaponSubclass.ELEMENTAL && abilities[WeaponType.BOW].passive.isUnlocked ? "#ff2200" :
                          currentSubclass === WeaponSubclass.VENOM ? "#00ff60" : "#00ffff"
                        }
                        emissive={
                          currentSubclass === WeaponSubclass.ELEMENTAL && abilities[WeaponType.BOW].passive.isUnlocked ? "#aa0000" :
                          currentSubclass === WeaponSubclass.VENOM ? "#00aa30" : "#00ffff"
                        }
                        emissiveIntensity={
                          currentSubclass === WeaponSubclass.ELEMENTAL && abilities[WeaponType.BOW].passive.isUnlocked ? 1.5 :
                          currentSubclass === WeaponSubclass.VENOM ? 1.3 : 1
                        }
                        transparent
                        opacity={0.5 * (projectile.opacity !== undefined ? projectile.opacity : 1)}
                        blending={THREE.AdditiveBlending}
                      />
                    </mesh>
                  </group>
                );
              })}

              {/* Fire particles for elemental shots - smaller */}
              {currentSubclass === WeaponSubclass.ELEMENTAL && abilities[WeaponType.BOW].passive.isUnlocked && 
                [...Array(5)].map((_, i) => { // Fewer particles
                  const angle = Math.random() * Math.PI * 2;
                  const radius = 0.15 + Math.random() * 0.2; // Smaller radius
                  const offset = -Math.random() * 1.5; // Shorter trail
                  return (
                    <group 
                      key={`fire-particle-${i}`}
                      position={[
                        Math.sin(angle) * radius,
                        Math.cos(angle) * radius,
                        offset
                      ]}
                    >
                      <mesh>
                        <sphereGeometry args={[0.05 + Math.random() * 0.06, 3, 3]} /> {/* Smaller particles */}
                        <meshStandardMaterial
                          color={i % 2 === 0 ? "#ffcc00" : "#ff4400"}
                          emissive={i % 2 === 0 ? "#ffcc00" : "#ff4400"}
                          emissiveIntensity={2}
                          transparent
                          opacity={0.7 * (projectile.opacity !== undefined ? projectile.opacity : 1)}
                          blending={THREE.AdditiveBlending}
                        />
                      </mesh>
                    </group>
                  );
                })
              }

              {/* Venom particles for venom shots - smaller */}
              {currentSubclass === WeaponSubclass.VENOM && 
                [...Array(4)].map((_, i) => { // Fewer particles
                  const angle = Math.random() * Math.PI * 2;
                  const radius = 0.15 + Math.random() * 0.2; // Smaller radius
                  const offset = -Math.random() * 1.5; // Shorter trail
                  return (
                    <group 
                      key={`venom-particle-${i}`}
                      position={[
                        Math.sin(angle) * radius,
                        Math.cos(angle) * radius,
                        offset
                      ]}
                    >
                      <mesh>
                        <sphereGeometry args={[0.05 + Math.random() * 0.06, 3, 3]} /> {/* Smaller particles */}
                        <meshStandardMaterial
                          color={i % 2 === 0 ? "#00ff40" : "#00aa20"}
                          emissive={i % 2 === 0 ? "#00ff40" : "#00aa20"}
                          emissiveIntensity={2}
                          transparent
                          opacity={0.7 * (projectile.opacity !== undefined ? projectile.opacity : 1)}
                          blending={THREE.AdditiveBlending}
                        />
                      </mesh>
                    </group>
                  );
                })
              }

              {/* Reduced ghostly wisps - smaller */}
              {[...Array(4)].map((_, i) => { // Fewer wisps
                const offset = -i * 0.2 - 1.0; // Closer spacing
                const scale = 1 - (i * 0.02);
                return (
                  <group 
                    key={`wisp-${i}`}
                    position={[0, 0, offset]}
                    rotation={[0, Date.now() * 0.001 + i, 0]}
                  >
                    <mesh scale={scale}>
                      <torusGeometry args={[0.25, 0.06, 3, 6]} /> {/* Smaller torus */}
                      <meshStandardMaterial
                        color={
                          currentSubclass === WeaponSubclass.ELEMENTAL && abilities[WeaponType.BOW].passive.isUnlocked ? "#ff4400" :
                          currentSubclass === WeaponSubclass.VENOM ? "#00ff50" : "#00ffff"
                        }
                        emissive={
                          currentSubclass === WeaponSubclass.ELEMENTAL && abilities[WeaponType.BOW].passive.isUnlocked ? "#cc0000" :
                          currentSubclass === WeaponSubclass.VENOM ? "#00aa30" : "#00ffff"
                        }
                        emissiveIntensity={
                          currentSubclass === WeaponSubclass.ELEMENTAL && abilities[WeaponType.BOW].passive.isUnlocked ? 1.5 :
                          currentSubclass === WeaponSubclass.VENOM ? 1.3 : 1
                        }
                        transparent
                        opacity={0.3 * (projectile.opacity !== undefined ? projectile.opacity : 1)}
                        blending={THREE.AdditiveBlending}
                      />
                    </mesh>
                  </group>
                );
              })}

              {/* Single light with proper color - smaller intensity */}
              <pointLight
                color={
                  currentSubclass === WeaponSubclass.ELEMENTAL && abilities[WeaponType.BOW].passive.isUnlocked ? "#ff2200" :
                  currentSubclass === WeaponSubclass.VENOM ? "#00ff40" : "#EAC4D5"
                }
                intensity={
                  currentSubclass === WeaponSubclass.ELEMENTAL && abilities[WeaponType.BOW].passive.isUnlocked ? 4 :
                  currentSubclass === WeaponSubclass.VENOM ? 3 : 2.5
                }
                distance={
                  currentSubclass === WeaponSubclass.ELEMENTAL && abilities[WeaponType.BOW].passive.isUnlocked ? 6 :
                  currentSubclass === WeaponSubclass.VENOM ? 5 : 4
                }
                decay={2}
              />
            </group>
          )}
        </group>
      ))}

      {/* Barrage Projectiles */}
      {getBarrageProjectiles().map(projectile => (
        <group key={projectile.id}>
          <group
            position={projectile.position.toArray()}
            rotation={[
              0,
              Math.atan2(projectile.direction.x, projectile.direction.z),
              0
            ]}
          >
            {/* Base arrow - slightly smaller than regular bow arrows */}
            <mesh rotation={[Math.PI/2, 0, 0]}>
              <cylinderGeometry args={[0.025, 0.1, 1.8, 6]} />
              <meshStandardMaterial
                color="#ff8800"
                emissive="#ff8800"
                emissiveIntensity={1.2}
                transparent
                opacity={projectile.opacity !== undefined ? projectile.opacity : 1}
              />
            </mesh>

            {/* Arrow Rings - fewer rings for barrage arrows */}
            {[...Array(2)].map((_, i) => ( 
              <mesh
                key={`barrage-ring-${i}`}
                position={[0, 0, -i * 0.4 + 0.4]}
                rotation={[Math.PI, 0, Date.now() * 0.004 + i * Math.PI / 2]}
              >
                <torusGeometry args={[0.1 + i * 0.03, 0.04, 6, 10]} />
                <meshStandardMaterial
                  color="#ff8800"
                  emissive="#ff8800"
                  emissiveIntensity={2.5}
                  transparent
                  opacity={(0.8 - i * 0.1) * (projectile.opacity !== undefined ? projectile.opacity : 1)}
                  blending={THREE.AdditiveBlending}
                />
              </mesh>
            ))}

            {/* Single light */}
            <pointLight 
              color="#ff8800" 
              intensity={2.5 * (projectile.opacity !== undefined ? projectile.opacity : 1)} 
              distance={4}
              decay={2}
            />
          </group>
        </group>
      ))}

      {/* Icicle Projectiles */}
      {getIcicleProjectilesRef.current && getIcicleProjectilesRef.current().map(projectile => (
        <IcicleProjectileWithTrail
          key={projectile.id}
          projectile={projectile}
        />
      ))}

      <BoneVortex parentRef={groupRef} weaponType={currentWeapon} weaponSubclass={currentSubclass} />
      <BoneAura parentRef={groupRef} />

      {/* Render boneclaw effects from the useBoneclaw hook */}
      {boneclawActiveEffects.map(effect => (
        <Boneclaw
          key={effect.id}
          position={effect.position}
          direction={effect.direction}
          parentRef={groupRef}
          enemyData={enemyData}
          level={level}
          onComplete={() => {
            removeBoneclawEffect(effect.id);
          }}
          onHitTarget={(targetId, damage, isCritical, position, isBoneclaw) => {
            onHit(targetId, damage);
            setDamageNumbers(prev => [...prev, {
              id: nextDamageNumberId.current++,
              damage,
              position: position.clone(),
              isCritical,
              isBoneclaw
            }]);
          }}
          onKillingBlow={(position) => {
            // Trigger totem summoning when BoneClaw gets a killing blow
                if (currentWeapon === WeaponType.SCYTHE && currentSubclass === WeaponSubclass.CHAOS) {
                  console.log('🎯 BoneClaw killing blow detected! Summoning Chaos Totem...');
                  
                  const summonId = Date.now();
                  
                  setActiveEffects(prev => {
                    // Get max totems based on level (1 at levels 1-2, 2 at level 3+)
                    const maxTotems = level >= 3 ? 2 : 1;
                    const currentTotems = prev.filter(effect => effect.type === 'summon').length;
                    
                    if (currentTotems >= maxTotems) {
                      console.log(`⚠️ Maximum totems (${maxTotems}) already exist, not summoning another`);
                      return prev;
                    }

                    // Start the healing effect when totem is summoned
                    console.log('🟢 [Chaos Totem] Starting healing: 2HP per second for 8 seconds');
                    startTotemHealing();

                    // Send totem effect to other players in multiplayer
                    if (isInRoom && isPlayer && groupRef.current) {
                      sendEffect({
                        type: 'totem',
                        position: position.clone(),
                        direction: new Vector3(0, 0, 1).applyQuaternion(groupRef.current.quaternion),
                        duration: 8000, // 8 second duration
                        weaponType: currentWeapon,
                        subclass: currentSubclass,
                        totemId: summonId.toString()
                      });
                    }

                    return [
                      ...prev,
                      {
                        id: summonId,
                        type: 'summon',
                        position: position.clone().setY(0.8),
                        direction: new Vector3(0, 0, 1).applyQuaternion(groupRef.current!.quaternion),
                        onComplete: () => {
                          // Stop healing when totem expires
                          console.log('🛑 [Chaos Totem] Totem expired, stopping healing');
                          stopTotemHealing();
                        },
                        onStartCooldown: () => {}
                      }
                    ];
                  });
                }
              }}
        />
      ))}

      {activeEffects.map(effect => {
        if (effect.type === 'blizzard') {
          return (
            <Blizzard
              key={effect.id}
              position={effect.position}
              enemyData={enemyData}
              parentRef={groupRef}
              level={level}
              onHitTarget={(targetId, damage, isCritical, position, isBlizzard) => {
                onHit(targetId, damage);
                setDamageNumbers(prev => [...prev, {
                  id: nextDamageNumberId.current++,
                  damage,
                  position: position.clone(),
                  isCritical,
                  isBlizzard
                }]);
              }}
              onComplete={() => {
                setActiveEffects(prev => 
                  prev.filter(e => e.id !== effect.id)
                );
              }}
            />
          );
        } else if (effect.type === 'firestorm') {
          const isFirestormActive = firestormActiveRef.current === effect.id;
          console.log('[Firestorm Debug] Rendering firestorm effect:', { 
            effectId: effect.id, 
            activeId: firestormActiveRef.current, 
            isActive: isFirestormActive 
          });
          return (
            <Firestorm
              key={effect.id}
              position={effect.position}
              enemyData={enemyData}
              parentRef={groupRef}
              isActive={isFirestormActive}
              onHitTarget={(targetId, damage, isCritical, position, isFirestorm) => {
                onHit(targetId, damage);
                setDamageNumbers(prev => [...prev, {
                  id: nextDamageNumberId.current++,
                  damage,
                  position: position.clone(),
                  isCritical,
                  isFirestorm
                }]);
              }}
              onComplete={() => {
                setActiveEffects(prev => 
                  prev.filter(e => e.id !== effect.id)
                );
                // Clear the ref if this firestorm is completing
                if (firestormActiveRef.current === effect.id) {
                  firestormActiveRef.current = null;
                }
              }}
            />
          );
        } else if (effect.type === 'divineStorm') {
          const isDivineStormActive = divineStormActiveRef.current === effect.id;
          return (
            <DivineStorm
              key={effect.id}
              position={effect.position}
              enemyData={enemyData}
              parentRef={groupRef}
              isActive={isDivineStormActive}
              onHitTarget={(targetId, damage, isCritical, position, isDivineStorm) => {
                onHit(targetId, damage);
                setDamageNumbers(prev => [...prev, {
                  id: nextDamageNumberId.current++,
                  damage,
                  position: position.clone(),
                  isCritical,
                  isDivineStorm
                }]);
              }}
              onComplete={() => {
                setActiveEffects(prev => 
                  prev.filter(e => e.id !== effect.id)
                );
                // Clear the ref if this divine storm is completing
                if (divineStormActiveRef.current === effect.id) {
                  divineStormActiveRef.current = null;
                }
              }}
            />
          );
        } else if (effect.type === 'firebeam') {
          return (
            <Firebeam
              key={effect.id}
              parentRef={effect.parentRef || groupRef}
              isActive={isFirebeaming}
              startTime={firebeamStartTime.current || Date.now()}
              onComplete={() => {
                setActiveEffects(prev => 
                  prev.filter(e => e.id !== effect.id)
                );
              }}
            />
          );
        } else if (effect.type === 'concussiveStun') {
          return (
            <ConcussiveStunEffect
              key={effect.id}
              position={effect.position}
              duration={effect.duration}
              startTime={effect.startTime}
              onComplete={() => {
                setActiveEffects(prev => 
                  prev.filter(e => e.id !== effect.id)
                );
              }}
            />
          );
        } else if (effect.type === 'concussiveLightning') {
          return (
            <ConcussiveLightningStrike
              key={effect.id}
              position={effect.position}
              onComplete={() => {
                setActiveEffects(prev => 
                  prev.filter(e => e.id !== effect.id)
                );
              }}
            />
          );
        } else if (effect.type === 'evisceratestun') {
          return (
            <EvisceratestunEffect
              key={effect.id}
              position={effect.position}
              duration={effect.duration}
              startTime={effect.startTime}
              onComplete={() => {
                setActiveEffects(prev => 
                  prev.filter(e => e.id !== effect.id)
                );
              }}
            />
          );
        } else if (effect.type === 'oathstrike') {
          return (
            <Oathstrike
              key={effect.id}
              position={effect.position}
              direction={effect.direction}
              onComplete={() => {
                setActiveEffects(prev => 
                  prev.filter(e => e.id !== effect.id)
                );
              }}
              parentRef={groupRef}
            />
          );
        } else if (effect.type === 'eviscerate-first') {
          return (
            <EviscerateSlashEffect
              key={effect.id}
              position={effect.position}
              direction={effect.direction}
              onComplete={() => {
                setActiveEffects(prev => 
                  prev.filter(e => e.id !== effect.id)
                );
              }}
              parentRef={groupRef}
              rotationOffset={0} // 0 degrees for horizontal slash
            />
          );
        } else if (effect.type === 'eviscerate-second') {
          return (
            <EviscerateSlashEffect
              key={effect.id}
              position={effect.position}
              direction={effect.direction}
              onComplete={() => {
                setActiveEffects(prev => 
                  prev.filter(e => e.id !== effect.id)
                );
              }}
              parentRef={groupRef}
              rotationOffset={Math.PI / 2} // 90 degrees for perpendicular vertical slash
            />
          );
        } else if (effect.type === 'summon') {
          return (
            <Summon
              key={effect.id}
              position={effect.position}
              enemyData={enemyData}
              onDamage={(targetId, damage, position) => {
                onHit(targetId, damage);
                const targetEnemy = enemyData.find(e => e.id === targetId);
                if (targetEnemy && targetEnemy.position) {
                  setDamageNumbers(prev => [...prev, {
                    id: nextDamageNumberId.current++,
                    damage,
                    position: position || targetEnemy.position.clone(),
                    isCritical: false,
                    isSummon: true
                  }]);
                }
              }}
              id={effect.id.toString()}
              onComplete={() => {
                setActiveEffects(prev => 
                  prev.filter(e => e.id !== effect.id)
                );
              }}
              onStartCooldown={() => {
                onAbilityUse(currentWeapon, 'active');
              }}
              setActiveEffects={setActiveEffects}
              activeEffects={activeEffects}
              setDamageNumbers={setDamageNumbers}
              nextDamageNumberId={nextDamageNumberId}
            />
          );
        } else if (effect.type === 'elemental') {
          return (
            <Elemental
              key={effect.id}
              position={effect.position}
              enemyData={enemyData}
              onDamage={(targetId, damage, position) => {
                onHit(targetId, damage);
                const targetEnemy = enemyData.find(e => e.id === targetId);
                if (targetEnemy && targetEnemy.position) {
                  setDamageNumbers(prev => [...prev, {
                    id: nextDamageNumberId.current++,
                    damage,
                    position: position || targetEnemy.position.clone(),
                    isCritical: false,
                    isSummon: true
                  }]);
                }
              }}
              setActiveEffects={setActiveEffects}
              activeEffects={activeEffects}
              setDamageNumbers={setDamageNumbers}
              nextDamageNumberId={nextDamageNumberId}
            />
          );
        } else if (effect.type === 'dragonbreath') {
          // Handle Dragon Breath damage on first render
          if (!dragonBreathDamageApplied.current.has(effect.id)) {
            // Mark damage as applied to prevent multiple applications
            dragonBreathDamageApplied.current.add(effect.id);
            
            const hits = calculateDragonBreathHits(
              effect.position,
              effect.direction,
              enemyData,
              new Set() // No hit tracking needed since it's instant
            );

            // Apply damage to all enemies hit and check for kills
            hits.forEach(hit => {
              // Get the target and store its health before damage
              const target = enemyData.find(e => e.id === hit.targetId);
              const previousHealth = target ? target.health : 0;
              
              onHit(hit.targetId, hit.damage);
              
              // Check if the enemy was killed by Dragon Breath
              if (target && previousHealth > 0 && previousHealth - hit.damage <= 0) {
                // Process kill for Dragon Breath - restore 3 orb charges
                processDragonBreathKill();
              }
              
              // Apply knockback effect (except for Fallen Titan)
              if (hit.knockbackDirection && onApplyKnockbackEffect && !hit.targetId.includes('fallen-titan')) {
                onApplyKnockbackEffect(hit.targetId, hit.knockbackDirection, 5.0);
              }
              
              // Create damage number
              setDamageNumbers(prev => [...prev, {
                id: nextDamageNumberId.current++,
                damage: hit.damage,
                position: hit.position.clone().add(new Vector3(0, 2, 0)),
                isCritical: hit.isCritical,
                isDragonBreath: true
              }]);
            });
          }

          return (
            <DragonBreath
              key={effect.id}
              parentRef={groupRef}
              isActive={true}
              startTime={Date.now()}
              onComplete={() => {
                setActiveEffects(prev => 
                  prev.filter(e => e.id !== effect.id)
                );
                // Clean up damage tracking for this effect
                dragonBreathDamageApplied.current.delete(effect.id);
              }}
            />
          );
        } else if (effect.type === 'legion') {
          // Handle Legion meteor and summon
          // If targetPosition is not set, calculate it once and store it
          if (!effect.targetPosition) {
            const validEnemies = enemyData.filter(e => e.health > 0 && !e.isDying && e.position);
            if (validEnemies.length > 0) {
              const priorityTarget = findHighestPriorityTarget(validEnemies);
              if (priorityTarget) {
                effect.targetPosition = priorityTarget.position.clone();
                console.log(`[Legion] Targeting enemy ${priorityTarget.id} at position:`, effect.targetPosition);
              } else {
                // Fallback to first valid enemy if priority function fails
                effect.targetPosition = validEnemies[0].position.clone();
                console.log(`[Legion] Targeting fallback enemy ${validEnemies[0].id} at position:`, effect.targetPosition);
              }
            } else {
              // If no enemies, target a position near the player
              const playerPos = groupRef.current?.position || new Vector3();
              effect.targetPosition = playerPos.clone().add(new Vector3(
                (Math.random() - 0.5) * 10,
                0,
                (Math.random() - 0.5) * 10
              ));
              console.log(`[Legion] No enemies found, targeting random position:`, effect.targetPosition);
            }
          }

          return (
            <Legion
              key={effect.id}
              targetPosition={effect.targetPosition}
              onImpact={(damage: number) => {
                // Damage is handled by the meteor impact area
                console.log(`[Legion] Meteor impact dealt ${damage} damage`);
              }}
              onComplete={() => {
                setActiveEffects(prev => 
                  prev.filter(e => e.id !== effect.id)
                );
              }}
              playerPosition={groupRef.current?.position || new Vector3()}
              enemyData={enemyData}
              onHit={(targetId: string, damage: number) => {
                console.log('[Unit] Legion onHit called:', { targetId, damage });
                onHit(targetId, damage);
              }}
              setDamageNumbers={setDamageNumbers}
              nextDamageNumberId={nextDamageNumberId}
              onPlayerEmpowerment={() => {
                // Activate Legion empowerment for 10 seconds
                console.log('[Unit] Legion empowerment callback received');
                if (legionEmpowermentRef.current) {
                  console.log('[Unit] Activating Legion empowerment');
                  legionEmpowermentRef.current.activateEmpowerment();
                } else {
                  console.log('[Unit] Legion empowerment ref is null');
                }
              }}
            />
          );
        } else if (effect.type === 'frostExplosion') {
          return (
            <FrostExplosion
              key={effect.id}
              position={effect.position}
              onComplete={() => {
                setActiveEffects(prev => 
                  prev.filter(e => e.id !== effect.id)
                );
              }}
            />
          );
        } else if (effect.type === 'stealthStrike') {
          return (
            <StealthStrikeEffect
              key={effect.id}
              position={effect.position}
              direction={effect.direction}
              onComplete={() => {
                setActiveEffects(prev => prev.filter(e => e.id !== effect.id));
              }}
              parentRef={groupRef}
            />
          );
        } else if (effect.type === 'pyroclastExplosion') {
          return (
            <PyroclastExplosion
              key={effect.id}
              position={effect.position}
              chargeTime={1.0} // You might want to pass the actual charge time from the missile
              explosionStartTime={effect.startTime || null}
              onComplete={() => {
                setActiveEffects(prev => 
                  prev.filter(e => e.id !== effect.id)
                );
              }}
            />
          );
        } else if (effect.type === 'holyBurn') {
          return (
            <HolyBurn
              key={effect.id}
              position={effect.position}
              duration={effect.duration || 3.0}
              targetId={effect.targetId}
              enemyData={enemyData}
              onComplete={() => {
                setActiveEffects(prev => 
                  prev.filter(e => e.id !== effect.id)
                );
              }}
            />
          );
        } else if (effect.type === 'deepFreeze') {
          return (
            <FrozenEffect
              key={effect.id}
              position={effect.position}
              duration={effect.duration || 4000}
              startTime={effect.startTime || Date.now()}
              enemyId={effect.enemyId}
              enemyData={enemyData}
              onComplete={() => {
                setActiveEffects(prev => 
                  prev.filter(e => e.id !== effect.id)
                );
              }}
            />
          );
        }
        return null;
      })}

      <Reanimate
        ref={reanimateRef}
        parentRef={groupRef}
        onHealthChange={handleHealthChange}
        charges={fireballCharges}
        setCharges={setFireballCharges}
        setDamageNumbers={setDamageNumbers}
        nextDamageNumberId={nextDamageNumberId}
        currentHealth={health}
        maxHealth={maxHealth}
      />

      {/* Aegis Projectiles */}
      <Aegis projectiles={aegisProjectiles} />

      {/* SoulReaper for Abyssal Scythe */}
      {currentWeapon === WeaponType.SCYTHE && currentSubclass === WeaponSubclass.ABYSSAL && (
        <SoulReaper
          ref={soulReaperRef}
          parentRef={groupRef}
          enemyData={enemyData}
          onDamage={onHit}
          onTakeDamage={(id, damage) => {
            // Handle skeleton taking damage - could be used for damage numbers or effects
            console.log(`Skeleton ${id} took ${damage} damage`);
          }}
          setDamageNumbers={setDamageNumbers}
          nextDamageNumberId={nextDamageNumberId}
          onSkeletonCountChange={handleSoulReaperSkeletonCountChange}
          onSkeletonUpdate={(skeletons) => {
            // Update summoned units data with skeleton information
            const skeletonUnits = skeletons.map(skeleton => ({
              id: skeleton.id,
              position: skeleton.position,
              health: skeleton.health,
              maxHealth: skeleton.maxHealth,
              type: 'skeleton' as const,
              ownerId: 'local-player'
            }));
            setSummonedUnitsData(prev => {
              // Remove old skeletons and add new ones
              const nonSkeletons = prev.filter(unit => unit.type !== 'skeleton');
              return [...nonSkeletons, ...skeletonUnits];
            });
          }}
          charges={fireballCharges}
          setCharges={setFireballCharges}
          level={level}
        />
      )}

      {/* Summoned AbyssalAbomination units */}
      {summonedUnitsData
        .filter(unit => unit.type === 'abyssal-abomination')
        .map(unit => (
          <AbyssalAbominationSummon
            key={unit.id}
            id={unit.id}
            position={unit.position}
            health={unit.health}
            maxHealth={unit.maxHealth}
            damage={16} // Default damage for AbyssalAbomination
            enemyData={enemyData}
            playerPosition={groupRef.current?.position || new Vector3(0, 0, 0)}
            onDamage={onHit}
            onDeath={(abominationId) => {
              console.log(`[Unit] AbyssalAbomination ${abominationId} died`);
              setSummonedUnitsData(prev => 
                prev.filter(unit => unit.id !== abominationId)
              );
            }}
            onTakeDamage={(id, damage) => {
              console.log(`[Unit] AbyssalAbomination ${id} took ${damage} damage`);
              // Update health in summoned units data
              setSummonedUnitsData(prev => 
                prev.map(unit => 
                  unit.id === id 
                    ? { ...unit, health: Math.max(0, unit.health - damage) }
                    : unit
                )
              );
            }}
            setDamageNumbers={setDamageNumbers}
            nextDamageNumberId={nextDamageNumberId}
          />
        ))
      }



      {currentWeapon === WeaponType.SWORD && 
       abilities[WeaponType.SWORD].passive.isUnlocked && (
        <CrusaderAura 
          ref={crusaderAuraRef}
          parentRef={groupRef} 
          onHealthChange={handleHealthChange}
          setDamageNumbers={setDamageNumbers}
          nextDamageNumberId={nextDamageNumberId}
          currentHealth={health}
          maxHealth={maxHealth}
        />
      )}

      {/* FrenzyAura for Abyssal Scythe */}
      {currentWeapon === WeaponType.SCYTHE && 
       currentSubclass === WeaponSubclass.ABYSSAL && 
       abilities[WeaponType.SCYTHE].passive.isUnlocked && (
        <FrenzyAura 
          ref={frenzyAuraRef}
          parentRef={groupRef}
          skeletonCount={skeletonCount}
          level={level}
        />
      )}

      {activeEffects.map(effect => {
        if (effect.type === 'unitFireballExplosion') {
          const elapsed = effect.startTime ? (Date.now() - effect.startTime) / 1000 : 0;
          const duration = effect.duration || 0.225;
          const fade = Math.max(0, 1 - (elapsed / duration));
          
          return (
            <group key={effect.id} position={effect.position}>
              {/* Core explosion sphere */}
              <mesh>
                <sphereGeometry args={[0.3 * (1 + elapsed * 2), 32, 32]} />
                <meshStandardMaterial
                  color="#00ff44"
                  emissive="#33ff66"
                  emissiveIntensity={2 * fade}
                  transparent
                  opacity={0.8 * fade}
                  depthWrite={false}
                  blending={THREE.AdditiveBlending}
                />
              </mesh>
              
              {/* Inner energy sphere */}
              <mesh>
                <sphereGeometry args={[0.2 * (1 + elapsed * 3), 24, 24]} />
                <meshStandardMaterial
                  color="#66ff88"
                  emissive="#ffffff"
                  emissiveIntensity={3 * fade}
                  transparent
                  opacity={0.9 * fade}
                  depthWrite={false}
                  blending={THREE.AdditiveBlending}
                />
              </mesh>

              {/* Multiple expanding rings */}
              {[0.4, 0.6, 0.8].map((size, i) => (
                <mesh key={i} rotation={[Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI]}>
                  <torusGeometry args={[size * (1 + elapsed * 3), 0.045, 16, 32]} />
                  <meshStandardMaterial
                    color="#00ff44"
                    emissive="#33ff66"
                    emissiveIntensity={0.8 * fade}
                    transparent
                    opacity={0.5 * fade * (1 - i * 0.2)}
                    depthWrite={false}
                    blending={THREE.AdditiveBlending}
                  />
                </mesh>
              ))}

              {/* Particle sparks */}
              {[...Array(8)].map((_, i) => {
                const angle = (i / 8) * Math.PI * 2;
                const radius = 0.5 * (1 + elapsed * 2);
                return (
                  <mesh
                    key={`spark-${i}`}
                    position={[
                      Math.sin(angle) * radius,
                      Math.cos(angle) * radius,
                      0
                    ]}
                  >
                    <sphereGeometry args={[0.05, 8, 8]} />
                    <meshStandardMaterial
                      color="#66ff88"
                      emissive="#ffffff"
                      emissiveIntensity={1.85 * fade}
                      transparent
                      opacity={0.85 * fade}
                      depthWrite={false}
                      blending={THREE.AdditiveBlending}
                    />
                  </mesh>
                );
              })}

              {/* Dynamic lights */}
              <pointLight
                color="#00ff44"
                intensity={2 * fade}
                distance={4}
                decay={2}
              />
              <pointLight
                color="#66ff88"
                intensity={1 * fade}
                distance={6}
                decay={1}
              />
            </group>
          );
        }
        return null;
      })}

      {isBowCharging && (
        <group 
          position={groupRef.current ? (() => {
            const forward = new Vector3(0, 0, 1)
              .applyQuaternion(groupRef.current.quaternion)
              .multiplyScalar(2);
            return [
              groupRef.current.position.x + forward.x,
              0.01,
              groupRef.current.position.z + forward.z
            ];
          })() : [0, 0.015, 0]}
          ref={el => {
            if (el && groupRef?.current) {
              el.rotation.y = groupRef.current.rotation.y;
            }
          }}
        >
          {/* Main rectangular charge area */}
          <mesh 
            rotation={[-Math.PI / 2, 0, 0]}
            position={[0, 0.15, (bowGroundEffectProgress * 15 -4.5)]}
          >
            <planeGeometry 
              args={[
                0.4,
                bowGroundEffectProgress * 30 -4,
              ]} 
            />
            <meshStandardMaterial
              color={
                currentSubclass === WeaponSubclass.ELEMENTAL && isPerfectShotWindow ? "#00ff40" : "#C18C4B"
              }
              emissive={
                currentSubclass === WeaponSubclass.ELEMENTAL && isPerfectShotWindow ? "#00ff40" : "#C18C4B"
              }
              emissiveIntensity={
                currentSubclass === WeaponSubclass.ELEMENTAL && isPerfectShotWindow ? 2.5 : 1
              }
              transparent
              opacity={0.3 + (0.4 * bowGroundEffectProgress)}
              blending={THREE.AdditiveBlending}
              depthWrite={false}
            />
          </mesh>

          {/* Side lines */}
          {[-0.4, 0.4].map((xOffset, i) => (
            <mesh 
              key={i}
              position={[xOffset, 0.1, (bowGroundEffectProgress * 7.5+3.5)]}
              rotation={[-Math.PI / 2, 0, 0]}
            >
              <planeGeometry args={[0.125, bowGroundEffectProgress * 15+10]} />
              <meshStandardMaterial
                color={
                  currentSubclass === WeaponSubclass.ELEMENTAL && isPerfectShotWindow ? "#00ff40" : "#C18C4B"
                }
                emissive={
                  currentSubclass === WeaponSubclass.ELEMENTAL && isPerfectShotWindow ? "#00ff40" : "#C18C4B"
                }
                emissiveIntensity={
                  currentSubclass === WeaponSubclass.ELEMENTAL && isPerfectShotWindow ? 3.5 : 2
                }
                transparent
                opacity={0.6 * bowGroundEffectProgress}
                blending={THREE.AdditiveBlending}
                depthWrite={false}
              />
            </mesh>
          ))}

          {/* Cross lines */}
          {[...Array(10)].map((_, i) => (
            <mesh 
              key={i}
              position={[0, 0.1, (i * 2.5 * bowGroundEffectProgress) + (bowGroundEffectProgress * 3 -2)]}
              rotation={[-Math.PI / 2, 0, 0]}
            >
              <planeGeometry args={[1, 0.1]} />
              <meshStandardMaterial
                color="#C18C4B"
                emissive="#C18C4B"
                emissiveIntensity={1.5}
                transparent
                opacity={0.4 * bowGroundEffectProgress * (1 - i * 0.07)}
                blending={THREE.AdditiveBlending}
                depthWrite={false}
              />
            </mesh>
          ))}
        </group>
      )}

      {currentWeapon === WeaponType.SWORD && 
       currentSubclass === WeaponSubclass.VENGEANCE && 
       !isSmiting && !isOathstriking && (
        <ChainLightning
          ref={chainLightningRef}
          parentRef={groupRef}
          enemies={enemyData}
          onEnemyDamage={onHit}
          setDamageNumbers={setDamageNumbers}
          nextDamageNumberId={nextDamageNumberId}
          sendEffect={sendEffect}
          isInRoom={isInRoom}
          isPlayer={isPlayer}
        />
      )}

      {currentWeapon === WeaponType.SABRES && currentSubclass === WeaponSubclass.ASSASSIN && 
       abilities[WeaponType.SABRES].passive.isUnlocked && (
        <OrbShield
          ref={orbShieldRef}
          parentRef={groupRef}
          charges={fireballCharges}
          setCharges={setFireballCharges}
        />
      )}

      {/* GlacialShard component for Frost Sabres */}
      {currentWeapon === WeaponType.SABRES && currentSubclass === WeaponSubclass.FROST && (
        <GlacialShard
          ref={glacialShardRef}
          parentRef={groupRef}
          onHit={onHit}
          enemyData={enemyData}
          setDamageNumbers={setDamageNumbers}
          nextDamageNumberId={nextDamageNumberId}
          charges={fireballCharges}
          setCharges={setFireballCharges}
          setActiveEffects={setActiveEffects}
          isEnemyFrozen={isEnemyFrozen}
          currentSubclass={currentSubclass}
          // Multiplayer props
          sendEffect={sendEffect}
          isInRoom={isInRoom}
          isPlayer={isPlayer}
        />
      )}

      {/* Add Whirlwind component */}
      {currentWeapon === WeaponType.SPEAR && (
        <Whirlwind
          parentRef={groupRef}
          isActive={isWhirlwinding}
          onHit={(targetId, damage) => {
            // Use the centralized function to check for kills
            checkForSpearKillAndProcessReignite(targetId, onHit, damage);
          }}
          enemyData={enemyData}
          setDamageNumbers={setDamageNumbers}
          nextDamageNumberId={nextDamageNumberId}
          onCriticalHit={triggerFirestorm}
          charges={fireballCharges}
          setCharges={setFireballCharges}
          reigniteRef={reigniteRef}
          level={level}
          onWhirlwindEnd={() => {
            setIsWhirlwinding(false);
            whirlwindStartTime.current = null;
            onAbilityUse(WeaponType.SPEAR, 'e');
          }}
        />
      )}

      {quickShotProjectilesRef.current.map(projectile => (
        <BoneArrow 
          key={projectile.id}
          position={projectile.position}
          direction={projectile.direction}
          opacity={projectile.opacity}
          currentSubclass={currentSubclass}
          level={level}
        />
      ))}

      {/* Unified Vault system with dash charges */}
      {activeVault.isActive && activeVault.direction && (
        <UnifiedVault
          parentRef={groupRef}
          isActive={activeVault.isActive}
          direction={activeVault.direction}
          onComplete={completeVault}
        />
      )}

      {currentWeapon === WeaponType.SPEAR && isPyroclastActive && (
        <PyrochargeEffect
          parentRef={groupRef}
          isActive={isPyroclastActive}
          chargeProgress={pyroclastChargeProgress.current}
        />
      )}

      {pyroclastMissiles.map(missile => (
        <PyroclastMissile 
          key={missile.id}
          id={missile.id}  
          position={missile.position}
          direction={missile.direction}
          chargeTime={missile.chargeTime}
          onImpact={(position) => handlePyroclastImpact(missile.id, position)}
          checkCollisions={(missileId, position) => checkPyroclastCollisions(missileId, position)}
        />
      ))}

      {/* ThrowSpear effects for Storm Spear subclass */}
      {currentWeapon === WeaponType.SPEAR && currentSubclass === WeaponSubclass.STORM && isThrowSpearCharging && (
        <ThrowSpearChargeEffect
          parentRef={groupRef}
          isActive={isThrowSpearCharging}
          chargeProgress={throwSpearChargeProgress}
        />
      )}

      {currentWeapon === WeaponType.SPEAR && currentSubclass === WeaponSubclass.STORM && (
        <ThrowSpear activeProjectiles={throwSpearProjectiles} />
      )}

      {/* Always render Reignite component but only activate its effect when using Spear with passive unlocked */}
      <Reignite
        ref={reigniteRef}
        parentRef={groupRef}
        charges={fireballCharges}
        setCharges={setFireballCharges}
        isActive={abilities[WeaponType.SPEAR].passive.isUnlocked}
        onHealthChange={handleHealthChange}
        setDamageNumbers={setDamageNumbers}
        nextDamageNumberId={nextDamageNumberId}
      />



      {currentWeapon === WeaponType.SPEAR && 
       abilities[WeaponType.SPEAR].active.isUnlocked && (
        <Breach
          parentRef={groupRef}
          isActive={isBreaching}
          onComplete={() => {
            setIsBreaching(false);
            onAbilityUse(WeaponType.SPEAR, 'active');
          }}
          enemyData={enemyData}
          onHit={onHit}
          onCriticalHit={() => {
            // Trigger Firestorm for Storm subclass on critical hits from Breach
            if (currentSubclass === WeaponSubclass.STORM) {
              triggerFirestorm();
            }
          }}
          showDamageNumber={(targetId, damage, position, isBreach, isCritical) => {
            setDamageNumbers(prev => [...prev, {
              id: nextDamageNumberId.current++,
              damage: damage,
              position: position.clone().add(new Vector3(0, 1.5, 0)),
              isCritical: isCritical || false,
              isBreach: true
            }]);
          }}
          reigniteRef={reigniteRef}
        />
      )}

      {/* BowLightning strikes */}
      {activeStrikes.map(strike => (
        <BowLightningStrike
          key={strike.id}
          position={strike.position}
          onComplete={() => removeLightningStrike(strike.id)}
        />
      ))}

      {/* BowPowershot effects */}
      {activePowershotEffects.map(effect => (
        <BowPowershot
          key={effect.id}
          position={effect.position}
          direction={effect.direction}
          subclass={effect.subclass}
          isElementalShotsUnlocked={effect.isElementalShotsUnlocked}
          isPerfectShot={effect.isPerfectShot}
          onComplete={() => removePowershotEffect(effect.id)}
        />
      ))}

      {/* ViperStingBeam effects */}
      {activeViperStingBeamEffects.map(effect => (
        <ViperStingBeam
          key={effect.id}
          position={effect.position}
          direction={effect.direction}
          isReturning={effect.isReturning}
          onComplete={() => removeViperStingBeamEffect(effect.id)}
        />
      ))}

      {/* Colossus Strike lightning */}
      {colossusStrikeLightning.map(lightning => (
        <ColossusStrikeLightning
          key={lightning.id}
          position={lightning.position}
          onComplete={() => handleColossusLightningComplete(lightning.id)}
        />
      ))}

      {currentWeapon === WeaponType.BOW && abilities[WeaponType.BOW].passive.isUnlocked && (
        <EagleEyeManager 
          ref={eagleEyeManagerRef}
          isUnlocked={abilities[WeaponType.BOW].passive.isUnlocked}
        />
      )}

      {/* MeteorSwarm effects */}
      {activeMeteorSwarms.map(swarm => (
        <MeteorSwarm
          key={swarm.id}
          targets={swarm.targets}
          startTime={swarm.startTime}
          onComplete={() => removeMeteorSwarm(swarm.id)}
          playerPosition={groupRef.current?.position || new Vector3()}
          onImpact={() => {}} // Player damage handled in Meteor component
          enemyData={enemyData}
          onHit={(targetId: string, damage: number, isCritical: boolean, position: Vector3) => {
            onHit(targetId, damage);
            setDamageNumbers(prev => [...prev, {
              id: nextDamageNumberId.current++,
              damage,
              position: position.clone(),
              isCritical: false,
              isMeteor: true,
              onComplete: () => {
                setDamageNumbers(prev => prev.filter(dn => dn.id !== nextDamageNumberId.current - 1));
              }
            }]);
          }}
        />
      ))}

      {/* GuidedBolts missiles */}
      <GuidedBolts
        missiles={getGuidedBoltMissiles()}
        enemyData={enemyData}
      />

      {/* ViperSting projectiles for VENOM bow subclass */}
      {currentWeapon === WeaponType.BOW && currentSubclass === WeaponSubclass.VENOM && (
        <ViperSting projectilePool={viperStingProjectilesRef} />
      )}

      {/* LavaLash projectiles for PYRO spear subclass */}
      {lavaLashProjectiles.map(projectile => (
        <LavaLashProjectile
          key={projectile.id}
          id={projectile.id}
          position={projectile.position}
          direction={projectile.direction}
          startPosition={projectile.startPosition}
          maxDistance={projectile.maxDistance}
          opacity={projectile.opacity}
          fadeStartTime={projectile.fadeStartTime}
          hasCollided={projectile.hasCollided}
          onImpact={() => handleLavaLashImpact(projectile.id)}
          checkCollisions={checkLavaLashCollisions}
        />
      ))}

      {/* ViperSting soul steal effects */}
      {viperStingSoulStealEffects.current.map(effect => (
        <SoulStealEffect
          key={effect.id}
          id={effect.id}
          startPosition={effect.position}
          targetPosition={effect.targetPosition}
          startTime={effect.startTime}
          duration={effect.duration}
          getCurrentPlayerPosition={() => {
            // Return current player position for dynamic tracking
            if (groupRef.current) {
              return groupRef.current.position.clone();
            }
            return effect.targetPosition; // Fallback to original target
          }}
          onComplete={() => {
            // Heal 2 HP when soul reaches player
            if (onHealthChange) {
              onHealthChange(2);
            }
            
            // Show healing damage number
            if (groupRef.current) {
              setDamageNumbers(prev => [...prev, {
                id: nextDamageNumberId.current++,
                damage: 2,
                position: groupRef.current!.position.clone().add(new Vector3(0, 1.5, 0)),
                isCritical: false,
                isHealing: true
              }]);
            }
            // Remove the effect from the array
            viperStingSoulStealEffects.current = viperStingSoulStealEffects.current.filter(e => e.id !== effect.id);
          }}
        />
      ))}

      {/* Raze effect for Elemental Bow fully charged shots */}
      {isPlayer && (
        <Raze
          enemyData={enemyData}
          onHit={(targetId: string, damage: number, isCritical?: boolean, position?: Vector3) => {
            // Note: Enemy health/death checks are handled in RazeDamage.ts
            // Trust that calculateRazeDamage already filtered out dead/dying enemies
            console.log(`[Raze Unit] Processing hit for ${targetId}, damage: ${damage}`);
            
            onHit(targetId, damage);
            // Add damage number for visual feedback
            if (position) {
              setDamageNumbers(prev => [...prev, {
                id: Date.now() + Math.random(), // Make ID more unique
                damage,
                position: position.clone(),
                isCritical: isCritical || false,
                isRaze: true
              }]);
            }
          }}
          level={level}
        />
      )}

      {/* Abyssal Slash Effects */}
      {abyssalSlashEffects.map(effect => (
        <AbyssalSlashEffect
          key={effect.id}
          startPosition={effect.position}
          direction={effect.direction}
          damage={effect.damage}
          parentRef={groupRef}
          onComplete={() => {
            setAbyssalSlashEffects(prev => prev.filter(e => e.id !== effect.id));
          }}
          onDamage={(damage) => {
            // Apply additional damage to nearby enemies
            enemyData.forEach(enemy => {
              if (enemy.health > 0 && !enemy.isDying) {
                const distance = enemy.position.distanceTo(effect.position);
                if (distance <= 2.5) { // Slash effect range
                  onHit(enemy.id, damage);
                  
                  // Add damage number
                  setDamageNumbers(prev => [...prev, {
                    id: nextDamageNumberId.current++,
                    damage,
                    position: enemy.position.clone(),
                    isCritical: false,
                    isBoneclaw: true // Green color
                  }]);
                }
              }
            });
          }}
        />
      ))}

      {/* Player Stun Effects */}
      {playerStunEffects.map(effect => (
        <PlayerStunEffect
          key={effect.id}
          position={effect.position}
          duration={effect.duration}
          startTime={effect.startTime}
          onComplete={() => removePlayerStunEffect(effect.id)}
        />
      ))}

    </>
  );
}