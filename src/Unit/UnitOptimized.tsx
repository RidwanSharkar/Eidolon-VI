import React, { useRef, useState, useCallback, useMemo, useEffect } from 'react';
import { Vector3, Group } from 'three';
import * as THREE from 'three';

// Import weapon and subclass types
import { WEAPON_ORB_COUNTS, WEAPON_DAMAGES, getWeaponDamage, WeaponType, WeaponSubclass } from '../Weapons/weapons';
import { UnitProps, AllSummonedUnitInfo } from './UnitProps';
import { DamageNumber as DamageNumberType } from './useDamageNumbers';
import { useMultiplayer } from '../Multiplayer/MultiplayerContext';
import { calculateDamage } from '../Weapons/damage';

// Import hooks
import { useDivineShield } from './useDivineShield';
import { useChaosTotemHealing } from '../Spells/Summon/useChaosTotemHealing';
import { useStealthEffect } from '../Spells/Stealth/useStealthEffect';
import { useStealthHealing } from '../Spells/Stealth/useStealthHealing';
import { useLegionEmpowerment } from '../Spells/Legion/useLegionEmpowerment';
import { useBlizzardShield } from '../Spells/Blizzard/useBlizzardShield';
import { useBoneclaw } from '../Spells/Boneclaw/useBoneclaw';

// Import decomposed components
import UnitWeaponSystem from './UnitWeaponSystem';
import UnitEffectsSystem from './UnitEffectsSystem';
import UnitMovementSystem from './UnitMovementSystem';
import UnitFrameUpdates from './UnitFrameUpdates';
import UnitAbilitySystem, { UnitAbilitySystemRef } from './UnitAbilitySystem';

// Import visual components
import Billboard from '@/Interface/Billboard';
import BoneWings from '@/gear/BoneWings';
import BonePlate from '@/gear/BonePlate';
import BoneTail from '@/gear/BoneTail';
import { DragonHorns } from '@/gear/DragonHorns';
import { IcicleCharge } from '@/Spells/Firebeam/IcicleOrbitals';
import { VaultDirection } from '@/Spells/Vault/UnifiedVault';
import { FrenzyAuraRef } from '@/Spells/FrenzyAura/FrenzyAura';
import { ReanimateRef } from '@/Spells/Reanimate/Reanimate';
import { ReigniteRef } from '@/Spells/Reignite/Reignite';
import { SoulReaperRef } from '@/Spells/SoulReaper/SoulReaper';
import { GlacialShardRef } from '@/Spells/GlacialShard/GlacialShard';
import { OrbShieldRef } from '@/Spells/Avalanche/OrbShield';

// Interfaces
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

interface FireballData {
  id: number;
  position: Vector3;
  direction: Vector3;
  startPosition: Vector3;
  maxDistance: number;
  isCrossentropyBolt?: boolean;
}

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

export default function UnitOptimized({
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
  level = 1,
  onFreezeStateCheck,
  canVault,
  consumeDashCharge,
  onApplySlowEffect,
  onApplyKnockbackEffect,
  // Additional required props from UnitProps
  onWeaponSelect,
  onFireballDamage,
  onDamage,
  onEnemyDeath,
  fireballManagerRef,
  onSmiteDamage,
  parentRef,
  isAegisActive: externalIsAegisActive,
  onAegisDamageBlock,
  onAegisStateChange,
  onFrozenEnemyIdsUpdate,
  onApplyStunEffect,
  onStealthKillCountChange,
  onGlacialShardKillCountChange,
  onSkeletonCountChange,
  glacialShardRef: externalGlacialShardRef,
  onShieldStateChange,
  onSummonedUnitsUpdate,
  playerStunRef,
  onEviscerateLashesChange,
  onBoneclawChargesChange,
  onIncinerateStacksChange,
  onResetAbilityCooldown,
}: UnitProps) {
  // Main group ref
  const groupRef = useRef<Group>(null);

  // Multiplayer context
  const { sendEffect, isInRoom, healAllies } = useMultiplayer();

  // Missing state from original Unit.tsx
  const [skeletonCount, setSkeletonCount] = useState(0);
  const [soulReaperSkeletons, setSoulReaperSkeletons] = useState(0);
  const nextFireballId = useRef(0);
  
  // Hit detection state
  const lastHitDetectionTime = useRef<Record<string, number>>({});
  const [hitCountThisSwing, setHitCountThisSwing] = useState<Record<string, number | string>>({});
  const pendingLightningTargets = useRef<Set<string>>(new Set());

  // Core animation states
  const [isSwinging, setIsSwinging] = useState(false);
  const [isSmiting, setIsSmiting] = useState(false);
  const [isBowCharging, setIsBowCharging] = useState(false);
  const [bowChargeStartTime, setBowChargeStartTime] = useState<number | null>(null);
  const [bowChargeProgress, setBowChargeProgress] = useState(0);
  const [bowGroundEffectProgress, setBowGroundEffectProgress] = useState(0);
  const bowChargeLineOpacity = useRef<number>(0);
  const [isPerfectShotWindow, setIsPerfectShotWindow] = useState(false);
  const [hasAutoReleasedBowShot, setHasAutoReleasedBowShot] = useState(false);
  const [isAbilityBowAnimation] = useState(false);
  const abilityBowAnimationStartTime = useRef<number | null>(null);

  // Player state
  const [isPlayerStunned, setIsPlayerStunned] = useState(false);
  const stunEndTime = useRef<number>(0);
  const [movementDirection] = useState(() => new Vector3());

  // Whirlwind state
  const [isWhirlwinding, setIsWhirlwinding] = useState(false);
  const whirlwindStartTime = useRef<number | null>(null);
  const WHIRLWIND_MAX_DURATION = 15000;

  // Pyroclast state
  const [isPyroclastActive, setIsPyroclastActive] = useState(false);
  const chargeStartTime = useRef<number | null>(null);
  const pyroclastChargeProgress = useRef<number>(0);

  // Firebeam state
  const [isFirebeaming, setIsFirebeaming] = useState(false);
  const firebeamStartTime = useRef<number | null>(null);

  // Breach state
  const [isBreaching, setIsBreaching] = useState(false);

  // Oathstrike and Divine Storm states
  const [isOathstriking, setIsOathstriking] = useState(false);
  const [isDivineStorming, setIsDivineStorming] = useState(false);
  const [isColossusStriking, setIsColossusStriking] = useState(false);

  // Combo states
  const [swordComboStep, setSwordComboStep] = useState<1 | 2 | 3>(1);
  const lastSwordSwingTime = useRef<number>(0);
  const [icicleComboStep, setIcicleComboStep] = useState<1 | 2 | 3>(1);
  const lastIcicleShootTime = useRef<number>(0);

  // Throw spear states
  const [isThrowSpearCharging] = useState(false);
  const [throwSpearChargeProgress] = useState(0);
  const [isSpearThrown] = useState(false);

  // Effects and damage numbers
  const [activeEffects, setActiveEffects] = useState<ActiveEffect[]>([]);
  const [damageNumbers, setDamageNumbers] = useState<DamageNumberType[]>([]);
  const nextDamageNumberId = useRef(0);
  const [smiteEffects, setSmiteEffects] = useState<Array<{ id: number; position: Vector3 }>>([]);
  const nextSmiteId = useRef(0);
  const [colossusLightningEffects, setColossusLightningEffects] = useState<Array<{ id: number; position: Vector3 }>>([]);

  // Projectiles and fireballs
  const [activeProjectiles, setActiveProjectiles] = useState<PooledProjectile[]>([]);
  const activeProjectilesRef = useRef<PooledProjectile[]>([]);
  const [fireballs, setFireballs] = useState<FireballData[]>([]);
  const activeFireballsRef = useRef<FireballData[]>([]);

  // Charges
  const [fireballCharges, setFireballCharges] = useState<Array<{
    id: number;
    available: boolean;
    cooldownStartTime: number | null;
  }>>(() => {
    const orbCount = WEAPON_ORB_COUNTS[currentWeapon] || 8;
    return Array.from({ length: orbCount }, (_, i) => ({
      id: i,
      available: true,
      cooldownStartTime: null
    }));
  });

  const [icicleCharges] = useState<Array<IcicleCharge>>(() => {
    return Array.from({ length: 8 }, (_, i) => ({
      id: i,
      available: true,
      cooldownStartTime: null
    }));
  });

  // Summoned units
  const [summonedUnitsData] = useState<AllSummonedUnitInfo[]>([]);

  // DoT tracking
  const venomDoTEnemies = useRef<Record<string, {
    startTime: number;
    lastTickTime: number;
    duration: number;
  }>>({});

  const viperStingDoTEnemies = useRef<Record<string, {
    startTime: number;
    lastTickTime: number;
    duration: number;
  }>>({});

  // Keys ref for movement
  const keys = useRef<Record<string, boolean>>({});

  // Legion empowerment
  const legionEmpowerment = useLegionEmpowerment();

  // Vault state
  const [activeVault, setActiveVault] = useState<{ isActive: boolean; direction: VaultDirection | null }>({
    isActive: false,
    direction: null
  });

  // Additional effect states
  const [abyssalSlashEffects, setAbyssalSlashEffects] = useState<Array<{
    id: string;
    position: Vector3;
    direction: Vector3;
    damage: number;
  }>>([]);

  const [playerStunEffects] = useState<Array<{
    id: string;
    position: Vector3;
    duration: number;
    startTime: number;
  }>>([]);
  // setPlayerStunEffects unused in optimized version

  // Stealth state - now managed by useStealthEffect hook
  const [isIncinerateEmpowered] = useState(false);

  // Aegis state
  const [isAegisActive] = useState(false);
  const aegisBlockedDamage = useRef<number>(0);

  // Lightning target tracking
  const [lastLightningTarget] = useState<string | null>(null);

  // Instant powershot for Venom Bow
  const [hasInstantPowershot, setHasInstantPowershot] = useState(false);

  // Collected bones for visual effects - set to show wings by default
  const [collectedBones] = useState(15); // Show full wings (15 bones)

  // Additional refs and state - properly typed for compatibility
  const frenzyAuraRef = useRef<FrenzyAuraRef | null>(null);
  const reanimateRef = useRef<ReanimateRef | null>(null);
  const reigniteRef = useRef<ReigniteRef | null>(null);
  const soulReaperRef = useRef<SoulReaperRef | null>(null);
  const glacialShardRef = useRef<GlacialShardRef | null>(null);
  const eagleEyeManagerRef = useRef<{ createEagleEyeEffect: (position: Vector3) => void } | null>(null);
  const orbShieldRef = useRef<OrbShieldRef | null>(null);
  const abilitySystemRef = useRef<UnitAbilitySystemRef>(null);

  // Update refs
  const updateIcicleProjectilesRef = useRef<(() => void) | null>(null);
  const firestormActiveRef = useRef<number | null>(null);
  const divineStormActiveRef = useRef<number | null>(null);
  const dragonBreathDamageApplied = useRef<Set<number>>(new Set());
  
  // Dragon Breath kill processing function
  const processDragonBreathKill = useCallback(() => {
    // Restore 3 orb charges when Dragon Breath gets a kill
    setFireballCharges(prev => {
      let restoredCount = 0;
      return prev.map(charge => {
        if (!charge.available && restoredCount < 3) {
          restoredCount++;
          return { ...charge, available: true, cooldownStartTime: null };
        }
        return charge;
      });
    });
    console.log('Dragon Breath kill - restored 3 orb charges');
  }, [setFireballCharges]);

  // Suppress unused variable warnings for refs used by child components
  void frenzyAuraRef;
  void soulReaperRef;
  void glacialShardRef;
  void eagleEyeManagerRef;
  void firestormActiveRef;
  void divineStormActiveRef;
  void dragonBreathDamageApplied;

  // Constants
  const ORBITAL_COOLDOWN = 3000;

  // Initialize hooks
  const { shieldState } = useDivineShield(
    currentWeapon,
    currentSubclass
  );

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

  const { startTotemHealing, stopTotemHealing } = useChaosTotemHealing({
    onHealthChange: onHealthChange || (() => {}),
  });

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

          return [...prev, {
            id: summonId,
            type: 'summon',
            position: position.clone(),
            direction: new Vector3(0, 0, 1).applyQuaternion(groupRef.current?.quaternion || new THREE.Quaternion()),
            duration: 8000,
            startTime: Date.now()
          }];
        });
      }
    }
  });

  // Suppress unused variable warnings for hooks used by child components
  void startTotemHealing;
  void stopTotemHealing;
  void boneclawActiveEffects;
  void triggerBoneclaw;
  void boneclawCharges;
  void setBoneclawCharges;
  void removeBoneclawEffect;

  const {
    activateStealth,
    isStealthed,
    setIsStealthed,
    setHasShadowStrikeBuff
  } = useStealthEffect({
    onStealthStart: () => {
      setIsStealthed(true);
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
      setIsStealthed(false);
      setActiveEffects(prev => 
        prev.filter(effect => effect.type !== 'stealth')
      );
    }
  });

  // Stealth healing functionality
  const { handleStealthKillHeal, getStealthBonusDamage, resetStealthKillCount, stealthKillCount } = useStealthHealing({
    currentHealth: health,
    maxHealth: maxHealth,
    onHealthChange: (health: number) => onHealthChange?.(health),
    currentSubclass,
    setDamageNumbers,
    nextDamageNumberId
  });

  // Suppress unused stealth variables for now
  void setHasShadowStrikeBuff;
  void handleStealthKillHeal;
  void getStealthBonusDamage;
  void resetStealthKillCount;
  void stealthKillCount;
  
  // Placeholder functions for barrage and icicle projectiles
  const getBarrageProjectiles = useCallback(() => {
    // TODO: Implement barrage projectile system
    return [];
  }, []);
  
  const getIcicleProjectilesRef = useRef<(() => Array<{
    id: number;
    position: Vector3;
    direction: Vector3;
    opacity: number;
  }>) | null>(null);

  // Combined shield absorption function that handles Divine Shield, Blizzard, and Glacial Shard shields
  const combinedAbsorbDamage = useCallback((damage: number): number => {
    let remainingDamage = damage;
    
    // First, try Divine Shield
    if (shieldState.isActive && shieldState.currentShield > 0) {
      const absorbed = Math.min(remainingDamage, shieldState.currentShield);
      remainingDamage -= absorbed;
      console.log(`[Combined Shield] Divine Shield absorbed ${absorbed} damage, ${remainingDamage} damage remaining`);
    }
    
    // Then, try Blizzard Shield
    if (remainingDamage > 0 && hasBlizzardShield && blizzardShieldAbsorption > 0) {
      const absorbed = absorbBlizzardDamage(remainingDamage);
      remainingDamage -= absorbed;
      console.log(`[Combined Shield] Blizzard Shield absorbed ${absorbed} damage, ${remainingDamage} damage remaining`);
    }
    
    // Finally, try Glacial Shard Shield
    if (remainingDamage > 0 && glacialShardRef.current?.hasShield) {
      const absorbed = glacialShardRef.current.absorbDamage(remainingDamage);
      remainingDamage -= absorbed;
      console.log(`[Combined Shield] Glacial Shard Shield absorbed ${absorbed} damage, ${remainingDamage} damage remaining`);
    }
    
    return remainingDamage;
  }, [shieldState.isActive, shieldState.currentShield, hasBlizzardShield, blizzardShieldAbsorption, absorbBlizzardDamage, glacialShardRef]);

  // Suppress unused props and variables
  void onWeaponSelect;
  void onFireballDamage;
  void onDamage;
  void onEnemyDeath;
  void fireballManagerRef;
  void onSmiteDamage;
  void parentRef;
  void externalIsAegisActive;
  void onAegisDamageBlock;
  void onAegisStateChange;
  void onFrozenEnemyIdsUpdate;
  void onApplyStunEffect;
  void onStealthKillCountChange;
  void onGlacialShardKillCountChange;
  void onSkeletonCountChange;
  void externalGlacialShardRef;
  void onShieldStateChange;
  void onSummonedUnitsUpdate;
  void playerStunRef;
  void onEviscerateLashesChange;
  void onBoneclawChargesChange;
  void onIncinerateStacksChange;
  void onResetAbilityCooldown;
  void skeletonCount;
  void setSkeletonCount;
  void soulReaperSkeletons;
  void setSoulReaperSkeletons;
  void nextFireballId;
  void hasBlizzardShield;
  void blizzardShieldAbsorption;
  void activateBlizzardShield;
  void absorbBlizzardDamage;
  void cleanupBlizzardShield;
  void combinedAbsorbDamage;

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

  // Memoized callback functions
  const handleFireballImpact = useCallback((id: number, impactPosition?: Vector3) => {
    // impactPosition is optional and may be used for effects
    void impactPosition; // Suppress unused parameter warning
    activeFireballsRef.current = activeFireballsRef.current.filter(f => f.id !== id);
    setFireballs([...activeFireballsRef.current]);
  }, []);

  const handleFireballHit = useCallback((fireballId: number, targetId: string) => {
    // Find the fireball to check if it's a CrossEntropy bolt
    const fireball = activeFireballsRef.current.find(f => f.id === fireballId);
    const isCrossentropyBolt = fireball?.isCrossentropyBolt || false;
    
    // Calculate damage based on fireball type
    let baseDamage = 100; // Default fireball damage
    if (isCrossentropyBolt) {
      // CrossEntropy bolt does significantly more damage
      baseDamage = level >= 3 ? 211 : 179; // Level-based CrossEntropy damage
    }
    
    // Use damage calculation system for crits and runes
    const { damage, isCritical } = calculateDamage(baseDamage);
    onHit(targetId, damage);
    
    // Create damage number
    const target = enemyData.find(e => e.id === targetId);
    if (target) {
      setDamageNumbers(prev => [...prev, {
        id: nextDamageNumberId.current++,
        damage,
        position: target.position.clone(),
        isCritical,
        isFireball: !isCrossentropyBolt,
        isCrossentropyBolt
      }]);
    }
    
    handleFireballImpact(fireballId);
  }, [onHit, handleFireballImpact, activeFireballsRef, level, enemyData, setDamageNumbers, nextDamageNumberId]);

  const handleProjectileHit = useCallback((projectileId: number, targetId: string, power: number, projectilePosition: Vector3) => {
    // projectilePosition may be used for effects
    void projectilePosition; // Suppress unused parameter warning
    const damage = Math.floor(power * 100);
    onHit(targetId, damage);
  }, [onHit]);

  const handleWeaponHit = useCallback((targetId: string) => {
    if (!groupRef.current || !isSwinging || isDivineStorming) return;

    const HIT_DETECTION_DEBOUNCE = currentWeapon === WeaponType.SCYTHE ? 120 : 200; // ms
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
          legionEmpowerment.isEmpowered) {
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
      
      // SMITE LOGIC
      if (isSmiting && currentWeapon === WeaponType.SWORD) {
        const currentPendingTargets = pendingLightningTargets.current;
        
        if (currentPendingTargets.has(target.id)) {
          return;
        }
        
        // Check if target is alive before initial hit
        if (target.health <= 0) return;
        
        currentPendingTargets.add(target.id);
        
        const { damage, isCritical } = calculateDamage(baseDamage);
        onHit(target.id, damage);
        
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

      // NORMAL WEAPON HIT HANDLING
      let isCritical = false;
      let damage = baseDamage;
      
      if (currentWeapon === WeaponType.SPEAR) {
        // Use subclass-specific damage
        const spearDamage = getWeaponDamage(WeaponType.SPEAR, currentSubclass, undefined);
        
        // Calculate if the hit is within 80-100% of max range
        const maxRange = WEAPON_DAMAGES[WeaponType.SPEAR].range;
        const sweetSpotStart = maxRange * 0.75;
        
        if (distance >= sweetSpotStart) {
          // Sweet spot hit - 1.5x damage multiplier
          damage = Math.floor(spearDamage * 1.5);
        } else {
          damage = spearDamage;
        }
        
        const result = calculateDamage(damage);
        damage = result.damage;
        isCritical = result.isCritical;
      } else {
        const result = calculateDamage(baseDamage + empoweredDamage);
        damage = result.damage;
        isCritical = result.isCritical;
      }

      // Apply damage
      onHit(target.id, damage);
      
      // Create damage number
      setDamageNumbers(prev => [...prev, {
        id: nextDamageNumberId.current++,
        damage,
        position: target.position.clone(),
        isCritical,
        isLegionEmpoweredScythe: isLegionEmpowered,
        isSword: currentWeapon === WeaponType.SWORD,
        isSabres: currentWeapon === WeaponType.SABRES,
        isSpear: currentWeapon === WeaponType.SPEAR,
        isScythe: currentWeapon === WeaponType.SCYTHE
      }]);

      // Trigger abyssal slash effect if empowered
      if (shouldTriggerSlashEffect && groupRef.current) {
        setAbyssalSlashEffects(prev => [...prev, {
          id: `slash-${Date.now()}`,
          position: target.position.clone(),
          direction: new Vector3(0, 0, 1).applyQuaternion(groupRef.current!.quaternion),
          damage: empoweredDamage
        }]);
      }
    }
  }, [
    groupRef, isSwinging, isDivineStorming, currentWeapon, enemyData, hitCountThisSwing, 
    currentSubclass, level, frenzyAuraRef, legionEmpowerment, isSmiting, pendingLightningTargets,
    nextDamageNumberId, onHit, setDamageNumbers, stealthKillCount
  ]);

  const releaseBowShot = useCallback((progress: number, isPerfectShot?: boolean) => {
    // Bow shot release logic - progress and isPerfectShot used for damage calculation
    console.log('Bow shot released:', progress, isPerfectShot);
  }, []);

  const shootFireball = useCallback(() => {
    if (!groupRef.current) return;

    // Find an available charge
    const availableCharge = fireballCharges.find(charge => charge.available);
    if (!availableCharge) return;

    // Mark charge as used
    setFireballCharges(prev => prev.map(charge => 
      charge.id === availableCharge.id 
        ? { ...charge, available: false, cooldownStartTime: Date.now() }
        : charge
    ));

    // Determine if this should be a Crossentropy Bolt (for Chaos Scythe level 2+)
    const weaponCheck = currentWeapon === WeaponType.SCYTHE;
    const chaosCheck = currentSubclass === WeaponSubclass.CHAOS;
    const levelCheck = level >= 2;
    const randomCheck = Math.random() < 0.5; // 50% chance
    const isCrossentropyBolt = weaponCheck && chaosCheck && levelCheck && randomCheck;

    // Calculate fireball spawn position and direction
    const spawnPosition = groupRef.current.position.clone();
    spawnPosition.y += 0.5; // Spawn slightly above player

    const direction = new Vector3(0, 0, 1)
      .applyQuaternion(groupRef.current.quaternion)
      .normalize();

    // Create new fireball
    const newFireball: FireballData = {
      id: nextFireballId.current++,
      position: spawnPosition.clone(),
      direction: direction.clone(),
      startPosition: spawnPosition.clone(),
      maxDistance: 30,
      isCrossentropyBolt
    };

    // Add to active fireballs
    activeFireballsRef.current.push(newFireball);
    setFireballs(prev => [...prev, newFireball]);

    // Send multiplayer effect
    if (isInRoom && isPlayer && sendEffect) {
      sendEffect({
        type: isCrossentropyBolt ? 'crossentropy' : 'fireball',
        position: spawnPosition.clone(),
        direction: direction.clone(),
        duration: 10000,
        speed: isCrossentropyBolt ? 0.3 : 0.4, // CrossEntropy is slower
        weaponType: currentWeapon,
        subclass: currentSubclass
      });
    }

    console.log(`Shot ${isCrossentropyBolt ? 'Crossentropy Bolt' : 'Fireball'} from ${currentWeapon} ${currentSubclass}`);
  }, [groupRef, fireballCharges, setFireballCharges, currentWeapon, currentSubclass, level,
      activeFireballsRef, setFireballs, nextFireballId, isInRoom, isPlayer, sendEffect]);

  // Glacial Shard function for Frost Sabres
  const shootGlacialShard = useCallback(() => {
    return glacialShardRef.current?.shootGlacialShard?.() || false;
  }, [glacialShardRef]);

  // Suppress unused function
  void shootGlacialShard;

  const castGuidedBolts = useCallback((targetId: string) => {
    // targetId used for guided bolt targeting
    console.log('Casting guided bolts at:', targetId);
    return true;
  }, []);

  const activateVault = useCallback((direction: VaultDirection) => {
    if (!canVault || !canVault()) return;
    
    setActiveVault({ isActive: true, direction });
  }, [canVault]);

  const triggerDivineStorm = useCallback(() => {
    if (!groupRef.current) return;
    
    // Create Divine Storm effect
    const newDivineStormId = Date.now();
    
    setActiveEffects(prev => [...prev, {
      id: newDivineStormId,
      type: 'divineStorm',
      position: groupRef.current!.position.clone(),
      direction: new Vector3(),
      startTime: Date.now(),
      duration: 1200 // 1.2 seconds duration
    }]);
    
    // Send multiplayer effect
    if (isInRoom && isPlayer && sendEffect) {
      sendEffect({
        type: 'divineStorm',
        position: groupRef.current.position.clone(),
        direction: new Vector3(0, 0, 1).applyQuaternion(groupRef.current.quaternion),
        duration: 1200
      });
    }
    
    console.log('Divine Storm triggered');
  }, [groupRef, setActiveEffects, isInRoom, isPlayer, sendEffect]);

  const activateColossusStrike = useCallback(() => {
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
      if (distance < closestDistance && distance <= 15) { // 15 unit range
        closestDistance = distance;
        closestEnemy = enemy;
      }
    }

    if (!closestEnemy) return false;

    // Consume one orb charge
    setFireballCharges(prev => {
      const firstAvailable = prev.find(charge => charge.available);
      if (!firstAvailable) return prev;
      
      return prev.map(charge => 
        charge.id === firstAvailable.id 
          ? { ...charge, available: false, cooldownStartTime: Date.now() }
          : charge
      );
    });

    // Set Colossus Strike state
    setIsColossusStriking(true);
    
    // Send multiplayer effect
    if (isInRoom && isPlayer && sendEffect) {
      sendEffect({
        type: 'colossusStrike',
        position: groupRef.current.position.clone(),
        direction: new Vector3(0, 0, 1).applyQuaternion(groupRef.current.quaternion),
        targetPosition: closestEnemy.position.clone(),
        duration: 1000
      });
    }

    return true;
  }, [groupRef, isColossusStriking, isSwinging, isSmiting, fireballCharges, enemyData, 
      setFireballCharges, setIsColossusStriking, isInRoom, isPlayer, sendEffect]);

  const activateOathstrike = useCallback(() => {
    return null;
  }, []);

  const handleDamageNumberComplete = useCallback((id: number) => {
    setDamageNumbers(prev => prev.filter(dn => dn.id !== id));
  }, []);

  const handleSmiteEffectComplete = useCallback((id: number) => {
    setSmiteEffects(prev => prev.filter(e => e.id !== id));
  }, []);

  const handleColossusLightningComplete = useCallback((id: number) => {
    setColossusLightningEffects(prev => prev.filter(e => e.id !== id));
  }, []);

  const handleIcicleComboComplete = useCallback(() => {
    setIcicleComboStep(1);
  }, []);

  const releasePyroclastCharge = useCallback(() => {
    setIsPyroclastActive(false);
  }, []);

  // Missing ability functions that need to be implemented
  const startFirebeam = useCallback(() => {
    if (!groupRef.current || isFirebeaming) return false;
    
    setIsFirebeaming(true);
    firebeamStartTime.current = Date.now();
    
    // Create firebeam effect
    setActiveEffects(prev => [...prev, {
      id: Date.now(),
      type: 'firebeam',
      position: groupRef.current!.position.clone(),
      direction: new Vector3(0, 0, 1).applyQuaternion(groupRef.current!.quaternion),
      parentRef: groupRef,
      startTime: Date.now()
    }]);
    
    // Send multiplayer effect
    if (isInRoom && isPlayer && sendEffect) {
      sendEffect({
        type: 'firebeam',
        position: groupRef.current.position.clone(),
        direction: new Vector3(0, 0, 1).applyQuaternion(groupRef.current.quaternion),
        duration: 3000 // 3 second duration
      });
    }
    
    return true;
  }, [groupRef, isFirebeaming, setIsFirebeaming, setActiveEffects, isInRoom, isPlayer, sendEffect]);

  const stopFirebeam = useCallback(() => {
    setIsFirebeaming(false);
    firebeamStartTime.current = null;
    
    // Remove firebeam effects
    setActiveEffects(prev => prev.filter(effect => effect.type !== 'firebeam'));
  }, [setIsFirebeaming, setActiveEffects]);

  const startBurstSequence = useCallback(() => {
    // Storm spear burst sequence logic
    console.log('Starting burst sequence for Storm spear');
  }, []);

  const shootLavaLash = useCallback(() => {
    // Pyro spear lava lash logic
    console.log('Shooting lava lash for Pyro spear');
  }, []);

  const shootIcicle = useCallback(() => {
    // Frost sabres icicle logic
    console.log('Shooting icicle for Frost sabres');
    return true;
  }, []);

  const shootQuickShot = useCallback(() => {
    // Bow quick shot logic
    console.log('Shooting quick shot');
  }, []);

  const shootBarrage = useCallback(() => {
    // Bow barrage logic
    console.log('Shooting barrage');
  }, []);

  const shootViperSting = useCallback(() => {
    // Venom bow viper sting logic
    console.log('Shooting viper sting');
    return true;
  }, []);

  const castSoulReaper = useCallback(() => {
    // Soul reaper logic
    console.log('Casting soul reaper');
    return true;
  }, []);

  const activateAegis = useCallback(() => {
    // Aegis activation logic
    console.log('Activating aegis');
    return true;
  }, []);

  const onEviscerate = useCallback(() => {
    // Eviscerate logic
    console.log('Eviscerate triggered');
  }, []);

  const onBoneclaw = useCallback(() => {
    if (!groupRef.current) return;
    
    // Trigger boneclaw with player position and forward direction
    const position = groupRef.current.position.clone();
    const direction = new Vector3(0, 0, 1).applyQuaternion(groupRef.current.quaternion);
    
    // Use the boneclaw hook's trigger function
    triggerBoneclaw(position, direction);
    
    console.log('Boneclaw triggered at position:', position);
  }, [groupRef, triggerBoneclaw]);

  const startThrowSpearCharge = useCallback(() => {
    // Throw spear charge logic
    console.log('Starting throw spear charge');
  }, []);

  const releaseThrowSpearCharge = useCallback(() => {
    // Release throw spear charge logic
    console.log('Releasing throw spear charge');
  }, []);

  // Memoized component props to prevent unnecessary re-renders
  const weaponSystemProps = useMemo(() => ({
    groupRef,
    currentWeapon,
    currentSubclass,
    abilities,
    level,
    isSwinging,
    isBowCharging,
    bowChargeProgress,
    bowGroundEffectProgress,
    bowChargeLineOpacity,
    isPerfectShotWindow,
    isAbilityBowAnimation,
    swordComboStep,
    icicleComboStep,
    isWhirlwinding,
    isPyroclastActive,
    pyroclastChargeProgress,
    isThrowSpearCharging,
    throwSpearChargeProgress,
    isSpearThrown,
    isFirebeaming,
    isBreaching,
    isSmiting,
    isOathstriking,
    isDivineStorming,
    isColossusStriking,
    shieldState,
    legionEmpowerment,
    hasInstantPowershot,
    enemyData,
    fireballCharges,
    onSwingComplete: () => {
      setIsSwinging(false);
      setHitCountThisSwing({});
      setIsSmiting(false);
      
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
              duration: 600,
              comboStep: nextStep
            });
          }
          
          return nextStep;
        });
      }
    },
    onSmiteComplete: () => setIsSmiting(false),
    onOathstrikeComplete: () => setIsOathstriking(false),
    onDivineStormComplete: () => setIsDivineStorming(false),
    onColossusStrikeComplete: () => {
      if (!groupRef.current) {
        setIsColossusStriking(false);
        return;
      }

      // Find the closest enemy target again (same logic as activation)
      let closestEnemy = null;
      let closestDistance = Infinity;
      const playerPosition = groupRef.current.position;

      for (const enemy of enemyData) {
        if (enemy.health <= 0 || enemy.isDying) continue;
        
        const distance = playerPosition.distanceTo(enemy.position);
        if (distance < closestDistance && distance <= 15) {
          closestDistance = distance;
          closestEnemy = enemy;
        }
      }

      if (closestEnemy) {
        // Apply initial sword damage (100 base damage)
        const { damage: baseDamage, isCritical: baseIsCritical } = calculateDamage(100);
        onHit(closestEnemy.id, baseDamage);

        setDamageNumbers(prev => [...prev, {
          id: nextDamageNumberId.current++,
          damage: baseDamage,
          position: closestEnemy.position.clone(),
          isCritical: baseIsCritical,
          isColossusStrike: true
        }]);

        // Calculate lightning damage: 100 + (20% of enemy's max health)
        const lightningDamage = 100 + Math.floor(closestEnemy.maxHealth * 0.2);

        // Apply lightning damage after a short delay
        setTimeout(() => {
          const { damage: finalLightningDamage, isCritical: lightningIsCritical } = calculateDamage(lightningDamage);
          onHit(closestEnemy.id, finalLightningDamage);

          setDamageNumbers(prev => [...prev, {
            id: nextDamageNumberId.current++,
            damage: finalLightningDamage,
            position: closestEnemy.position.clone(),
            isCritical: lightningIsCritical,
            isColossusLightning: true
          }]);
        }, 100);

        // Create the yellow lightning effect
        setColossusLightningEffects(prev => [...prev, {
          id: Date.now(),
          position: closestEnemy.position.clone()
        }]);

        // Heal the player for 20 HP (only for Vengeance subclass)
        if (currentSubclass === WeaponSubclass.VENGEANCE && onHealthChange) {
          const currentHealth = health;
          const newHealth = Math.min(currentHealth + 20, maxHealth);
          onHealthChange(newHealth);
          
          // Create healing damage number
          setDamageNumbers(prev => [...prev, {
            id: nextDamageNumberId.current++,
            damage: 20,
            position: groupRef.current!.position.clone().add(new Vector3(0, 1, 0)),
            isCritical: false,
            isHealing: true
          }]);
        }
      }

      setIsColossusStriking(false);
    },
    releaseBowShot,
    onHit,
    setDamageNumbers,
    nextDamageNumberId,
    setActiveEffects
  }), [
    groupRef, currentWeapon, currentSubclass, abilities, level, isSwinging, isBowCharging,
    bowChargeProgress, bowGroundEffectProgress, bowChargeLineOpacity, isPerfectShotWindow,
    isAbilityBowAnimation, swordComboStep, icicleComboStep, isWhirlwinding, isPyroclastActive,
    pyroclastChargeProgress, isThrowSpearCharging, throwSpearChargeProgress, isSpearThrown,
    isFirebeaming, isBreaching, isSmiting, isOathstriking, isDivineStorming, isColossusStriking,
    shieldState, legionEmpowerment, hasInstantPowershot, enemyData, fireballCharges,
    releaseBowShot, onHit, isInRoom, isPlayer, sendEffect, health, maxHealth, onHealthChange
  ]);

  const effectsSystemProps = useMemo(() => ({
    groupRef,
    currentWeapon,
    currentSubclass,
    abilities,
    level,
    health,
    maxHealth,
    isPlayer,
    isStealthed,
    isIncinerateEmpowered,
    collectedBones,
    movementDirection,
    activeEffects,
    setActiveEffects,
    damageNumbers,
    setDamageNumbers,
    nextDamageNumberId,
    fireballs,
    activeProjectiles,
    fireballCharges,
    icicleCharges,
    isFirebeaming,
    firebeamStartTime,
    isBreaching,
    isThrowSpearCharging,
    throwSpearChargeProgress,
    isSpearThrown,
    icicleComboStep,
    onHit,
    onHealthChange,
    onAbilityUse,
    handleFireballImpact,
    handleDamageNumberComplete,
    handleSmiteEffectComplete,
    handleColossusLightningComplete,
    handleIcicleComboComplete,
    onFreezeStateCheck,
    onApplySlowEffect,
    onApplyKnockbackEffect,
    enemyData,
    summonedUnitsData,
    smiteEffects,
    colossusLightningEffects,
    abyssalSlashEffects,
    playerStunEffects,
    activeVault,
    isInRoom,
    sendEffect
  }), [
    groupRef, currentWeapon, currentSubclass, abilities, level, health, maxHealth, isPlayer,
    isStealthed, isIncinerateEmpowered, collectedBones, movementDirection, activeEffects,
    damageNumbers, fireballs, activeProjectiles, fireballCharges, icicleCharges, isFirebeaming,
    firebeamStartTime, isBreaching, isThrowSpearCharging, throwSpearChargeProgress, isSpearThrown,
    icicleComboStep, onHit, onHealthChange, onAbilityUse, handleFireballImpact,
    handleDamageNumberComplete, handleSmiteEffectComplete, handleColossusLightningComplete,
    handleIcicleComboComplete, onFreezeStateCheck, onApplySlowEffect, onApplyKnockbackEffect,
    enemyData, summonedUnitsData, smiteEffects, colossusLightningEffects, abyssalSlashEffects,
    playerStunEffects, activeVault, isInRoom, sendEffect
  ]);

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

        {/* Outer glow sphere layer */}
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

        {/* Bone Plate and Tail */}
        <group scale={[0.8, 0.55, 0.8]} position={[0, 0.04, -0.015]} rotation={[0.4, 0, 0]}>
          <BonePlate />
        </group>
        <group scale={[0.85, 0.85, 0.85]} position={[0, 0.05, +0.1]}>
          <BoneTail movementDirection={movementDirection} />
        </group>

        {/* Weapon System */}
        <UnitWeaponSystem {...weaponSystemProps} />

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

      {/* Effects System */}
      <UnitEffectsSystem 
        {...effectsSystemProps}
        frenzyAuraRef={frenzyAuraRef}
        reanimateRef={reanimateRef}
        reigniteRef={reigniteRef}
        soulReaperRef={soulReaperRef}
        glacialShardRef={glacialShardRef}
        eagleEyeManagerRef={eagleEyeManagerRef}
        boneclawActiveEffects={boneclawActiveEffects?.map(effect => ({
          ...effect,
          id: effect.id.toString()
        }))}
        removeBoneclawEffect={(id: string) => removeBoneclawEffect(parseInt(id))}
        dragonBreathDamageApplied={dragonBreathDamageApplied}
        processDragonBreathKill={processDragonBreathKill}
        getBarrageProjectiles={getBarrageProjectiles}
        getIcicleProjectilesRef={getIcicleProjectilesRef}
      />

      {/* Movement System */}
      <UnitMovementSystem
        groupRef={groupRef}
        controlsRef={controlsRef}
        currentWeapon={currentWeapon}
        currentSubclass={currentSubclass}
        level={level}
        health={health}
        keys={keys}
        isPlayerStunned={isPlayerStunned}
        movementDirection={movementDirection}
        isBowCharging={isBowCharging}
        isPyroclastActive={isPyroclastActive}
        isFirebeaming={isFirebeaming}
        activeVault={activeVault}
        setActiveVault={setActiveVault}
        canVault={canVault || (() => false)}
        consumeDashCharge={consumeDashCharge || (() => false)}
        onPositionUpdate={onPositionUpdate}
        isStealthed={isStealthed}
      />

      {/* Frame Updates System */}
      <UnitFrameUpdates
        groupRef={groupRef}
        currentWeapon={currentWeapon}
        currentSubclass={currentSubclass}
        level={level}
        isSwinging={isSwinging}
        isBowCharging={isBowCharging}
        bowChargeStartTime={useRef(bowChargeStartTime)}
        bowChargeProgress={bowChargeProgress}
        setBowChargeProgress={setBowChargeProgress}
        setBowGroundEffectProgress={setBowGroundEffectProgress}
        bowChargeLineOpacity={bowChargeLineOpacity}
        isPerfectShotWindow={isPerfectShotWindow}
        setIsPerfectShotWindow={setIsPerfectShotWindow}
        hasAutoReleasedBowShot={hasAutoReleasedBowShot}
        setHasAutoReleasedBowShot={setHasAutoReleasedBowShot}
        isAbilityBowAnimation={isAbilityBowAnimation}
        abilityBowAnimationStartTime={abilityBowAnimationStartTime}
        isPlayerStunned={isPlayerStunned}
        setIsPlayerStunned={setIsPlayerStunned}
        stunEndTime={stunEndTime}
        isStealthed={isStealthed}
        movementDirection={movementDirection}
        isWhirlwinding={isWhirlwinding}
        setIsWhirlwinding={setIsWhirlwinding}
        whirlwindStartTime={whirlwindStartTime}
        WHIRLWIND_MAX_DURATION={WHIRLWIND_MAX_DURATION}
        isPyroclastActive={isPyroclastActive}
        chargeStartTime={chargeStartTime}
        pyroclastChargeProgress={pyroclastChargeProgress}
        releasePyroclastCharge={releasePyroclastCharge}
        activeProjectilesRef={activeProjectilesRef}
        setActiveProjectiles={setActiveProjectiles}
        activeFireballsRef={activeFireballsRef}
        setFireballs={setFireballs}
        setActiveEffects={setActiveEffects}
        setDamageNumbers={setDamageNumbers}
        nextDamageNumberId={nextDamageNumberId}
        fireballCharges={fireballCharges}
        setFireballCharges={setFireballCharges}
        enemyData={enemyData}
        venomDoTEnemies={venomDoTEnemies}
        viperStingDoTEnemies={viperStingDoTEnemies}
        handleWeaponHit={handleWeaponHit}
        releaseBowShot={releaseBowShot}
        onHit={onHit}
        onAbilityUse={onAbilityUse}
        handleProjectileHit={handleProjectileHit}
        handleFireballHit={handleFireballHit}
        handleFireballImpact={handleFireballImpact}
        checkPyroclastCollisions={() => {}}
        updateBarrageProjectiles={() => {}}
        updateIcicleProjectilesRef={updateIcicleProjectilesRef}
        updateGuidedBoltMissiles={() => {}}
        updateLavaLashProjectiles={() => {}}
        updateAegisProjectiles={() => {}}
        onPositionUpdate={onPositionUpdate}
        pyroclastMissiles={[]}
        isInRoom={isInRoom}
        isPlayer={isPlayer}
        sendEffect={sendEffect}
        ORBITAL_COOLDOWN={ORBITAL_COOLDOWN}
      />

      {/* Ability System */}
      <UnitAbilitySystem
        ref={abilitySystemRef}
        groupRef={groupRef}
        currentWeapon={currentWeapon}
        currentSubclass={currentSubclass}
        abilities={abilities}
        level={level}
        health={health}
        maxHealth={maxHealth}
        keys={keys}
        isSwinging={isSwinging}
        setIsSwinging={setIsSwinging}
        isSmiting={isSmiting}
        setIsSmiting={setIsSmiting}
        isBowCharging={isBowCharging}
        setIsBowCharging={setIsBowCharging}
        setBowChargeStartTime={setBowChargeStartTime}
        bowChargeProgress={bowChargeProgress}
        isWhirlwinding={isWhirlwinding}
        setIsWhirlwinding={setIsWhirlwinding}
        whirlwindStartTime={whirlwindStartTime}
        isFirebeaming={isFirebeaming}
        setIsFirebeaming={setIsFirebeaming}
        firebeamStartTime={firebeamStartTime}
        isBreaching={isBreaching}
        setIsBreaching={setIsBreaching}
        isOathstriking={isOathstriking}
        setIsOathstriking={setIsOathstriking}
        isDivineStorming={isDivineStorming}
        setIsDivineStorming={setIsDivineStorming}
        isPerfectShotWindow={isPerfectShotWindow}
        hasAutoReleasedBowShot={hasAutoReleasedBowShot}
        setHasAutoReleasedBowShot={setHasAutoReleasedBowShot}
        isAbilityBowAnimation={isAbilityBowAnimation}
        swordComboStep={swordComboStep}
        setSwordComboStep={setSwordComboStep}
        lastSwordSwingTime={lastSwordSwingTime}
        icicleComboStep={icicleComboStep}
        setIcicleComboStep={setIcicleComboStep}
        lastIcicleShootTime={lastIcicleShootTime}
        setActiveEffects={setActiveEffects}
        setSmiteEffects={setSmiteEffects}
        nextSmiteId={nextSmiteId}
        fireballCharges={fireballCharges}
        setFireballCharges={setFireballCharges}
        enemyData={enemyData}
        reanimateRef={reanimateRef}
        orbShieldRef={orbShieldRef}
        reigniteRef={reigniteRef}
        onAbilityUse={onAbilityUse}
        onHealthChange={onHealthChange}
        shootFireball={shootFireball}
        releaseBowShot={releaseBowShot}
        activateOathstrike={activateOathstrike}
        triggerDivineStorm={triggerDivineStorm}
        activateColossusStrike={activateColossusStrike}
        castGuidedBolts={castGuidedBolts}
        lastLightningTarget={lastLightningTarget}
        activateVault={activateVault}
        activeVault={activeVault}
        canVault={canVault || (() => false)}
        isAegisActive={isAegisActive}
        aegisBlockedDamage={aegisBlockedDamage}
        activateStealth={activateStealth}
        hasInstantPowershot={hasInstantPowershot}
        setHasInstantPowershot={setHasInstantPowershot}
        isPlayerStunned={isPlayerStunned}
        isInRoom={isInRoom || false}
        isPlayer={isPlayer}
        sendEffect={sendEffect}
        healAllies={(amount: number, position: Vector3, source: string) => {
          if (source === 'reanimate' || source === 'oathstrike') {
            healAllies(amount, position, source as 'reanimate' | 'oathstrike');
          }
        }}
        startFirebeam={startFirebeam}
        stopFirebeam={stopFirebeam}
        startBurstSequence={startBurstSequence}
        shootLavaLash={shootLavaLash}
        shootIcicle={shootIcicle}
        shootQuickShot={shootQuickShot}
        shootBarrage={shootBarrage}
        shootGlacialShard={shootGlacialShard}
        shootViperSting={shootViperSting}
        castSoulReaper={castSoulReaper}
        activateAegis={activateAegis}
        onEviscerate={onEviscerate}
        onBoneclaw={onBoneclaw}
        startThrowSpearCharge={startThrowSpearCharge}
        releaseThrowSpearCharge={releaseThrowSpearCharge}
      />
    </>
  );
}