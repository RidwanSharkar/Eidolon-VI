// src/unit/Unit.tsx
import { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { Vector3, Group } from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import Fireball from '../Spells/Fireball/Fireball';
import * as THREE from 'three';
import { WeaponType, WEAPON_DAMAGES, WEAPON_ORB_COUNTS } from '../Weapons/weapons';

import Scythe from '@/Weapons/Scythe';
import Sword from '@/Weapons/Sword';
import Sabres from '@/Weapons/Sabres';
import EtherealBow from '@/Weapons/EtherBow';
import Spear from '@/Weapons/Spear';

import Smite from '@/Spells/Smite/Smite';
import DamageNumber from '@/Interface/DamageNumber';
import Billboard from '@/Interface/Billboard';
import GhostTrail from '@/color/GhostTrail';
import BoneWings from '@/gear/BoneWings';
import BoneAura from '@/color/BoneAura';
import BonePlate from '@/gear/BonePlate';
import BoneTail from '@/gear/BoneTail';
import BoneVortex from '@/color/BoneVortex';
import { UnitProps } from '@/Unit/UnitProps';
import { useUnitControls } from '@/Unit/useUnitControls';
import { calculateDamage } from '@/Weapons/damage';
import Boneclaw from '@/Spells/Boneclaw/Boneclaw';
import Blizzard from '@/Spells/Blizzard/Blizzard';
import { useAbilityKeys } from '@/Unit/useAbilityKeys';
import { useFirebeamManager } from '@/Spells/Firebeam/useFirebeamManager';
import Firebeam from '@/Spells/Firebeam/Firebeam';
import ChargedOrbitals, { ORBITAL_COOLDOWN } from '@/color/ChargedOrbitals';
import Reanimate, { ReanimateRef } from '../Spells/Reanimate/Reanimate';
import Oathstrike from '@/Spells/Oathstrike/Oathstrike';
import { useOathstrike } from '../Spells/Oathstrike/useOathstrike';
import CrusaderAura from '../Spells/CrusaderAura/CrusaderAura';
import Summon from '@/Spells/Summon/Summon';
import { OrbShieldRef } from '@/Spells/Avalanche/OrbShield';
import ChainLightning from '@/Spells/ChainLightning/ChainLightning';
import OrbShield from '@/Spells/Avalanche/OrbShield';
import { FrostExplosion } from '@/Spells/Avalanche/FrostExplosion';
import { DragonHorns } from '@/gear/DragonHorns';
import Whirlwind from '@/Spells/Whirlwind/Whirlwind';
import { useStealthEffect } from '../Spells/Stealth/useStealthEffect';
import { stealthManager } from '../Spells/Stealth/StealthManager';
import { useStealthHealing } from '@/Spells/Stealth/useStealthHealing';
import StealthMistEffect from '../Spells/Stealth/StealthMistEffect';
import StealthStrikeEffect from '@/Spells/Stealth/StealthStrikeEffect';
import { useQuickShot } from '../Spells/QuickShot/QuickShot';
import BoneArrow from '@/Spells/QuickShot/BoneArrow';
import Vault from '@/Spells/Vault/Vault';
import VaultNorth from '@/Spells/Vault/VaultNorth';
import VaultEast from '@/Spells/Vault/VaultEast';
import VaultWest from '@/Spells/Vault/VaultWest';
import { usePyroclast } from '../Spells/Pyroclast/usePyroclast';
import PyroclastMissile from '../Spells/Pyroclast/PyroclastMissile';
import Reignite, { ReigniteRef } from '../Spells/Reignite/Reignite';
import PyrochargeEffect from '../Spells/Pyroclast/PyrochargeEffect';
import PyroclastExplosion from '@/Spells/Pyroclast/PyroclastExplosion';
import Breach from '@/Spells/Breach/Breach';
import { useBreachController } from '@/Spells/Breach/useBreachController';
import { useBowLightning } from '@/Spells/BowLightning/useBowLightning';
import BowLightningStrike from '@/Spells/BowLightning/BowLightningStrike';
import EagleEyeManager from '@/Spells/EagleEye/EagleEyeManager';

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
}

//=====================================================================================================

// EXPORT UNIT
export default function Unit({
  onHit,
  controlsRef,
  currentWeapon,
  health,
  maxHealth,
  isPlayer = false,
  abilities,
  onAbilityUse,
  onPositionUpdate,
  enemyData,
  onHealthChange,
  fireballManagerRef,
}: UnitProps) {
  const groupRef = useRef<Group>(null);
  const [isSwinging, setIsSwinging] = useState(false);
  const [fireballs, setFireballs] = useState<FireballData[]>([]);
  const nextFireballId = useRef(0);
  const { camera } = useThree();
  const [isBowCharging, setIsBowCharging] = useState(false);
  
  // DAMAGE NUMBERS 
  const [damageNumbers, setDamageNumbers] = useState<{
    id: number;
    damage: number;
    position: Vector3;
    isCritical: boolean;
    isLightning?: boolean;
    isHealing?: boolean;
    isBlizzard?: boolean;
    isBoneclaw?: boolean;
    isSmite?: boolean;
    isOathstrike?: boolean;
    isFirebeam?: boolean;
    isOrbShield?: boolean;
    isChainLightning?: boolean;
    isFireball?: boolean;
    isSummon?: boolean;
    isStealthStrike?: boolean;
    isPyroclast?: boolean;
    isEagleEye?: boolean;
    isBreach?: boolean;
  }[]>([]);
  
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
  
  const [activeEffects, setActiveEffects] = useState<Array<{
    id: number;
    type: string;
    position: Vector3;
    direction: Vector3;
    duration?: number;
    startTime?: number;
  }>>([]);
  
  // BEFORE usePyroclast initialization
  const reigniteRef = useRef<ReigniteRef>(null);

  // Add this memoized function before usePyroclast
  const pyroclastCheckForSpearKillAndProcessReignite = useCallback((
    targetId: string, 
    damageFn: (id: string, damage: number) => void, 
    damage: number, 
    bypassWeaponCheck: boolean
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
      
      // Apply the damage
      damageFn(targetId, damage);
      
      // Need to find the target again to get updated health
      const updatedTarget = enemyData.find(e => e.id === targetId);
      if (!updatedTarget) {
        return;
      }
      
      // Check if the enemy was killed by this hit
      if (previousHealth > 0 && updatedTarget.health <= 0) {
        // Pass a fresh clone of the position
        const killPosition = updatedTarget.position.clone();
        console.log(`[${bypassWeaponCheck ? 'Pyroclast' : 'SpearKill'}] Kill detected! Processing Reignite at position:`, killPosition);
        reigniteRef.current.processKill(killPosition);
      }
    } else {
      // Just apply damage if reigniteRef is not available
      console.log(`[${bypassWeaponCheck ? 'Pyroclast' : 'SpearKill'}] reigniteRef is not available, just applying damage`);
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
      }
    },
    charges: fireballCharges,
    setCharges: setFireballCharges,
    reigniteRef: reigniteRef,
    // Use the memoized function instead of an inline function
    checkForSpearKillAndProcessReignite: pyroclastCheckForSpearKillAndProcessReignite
  });

  const { keys: movementKeys } = useUnitControls({
    groupRef,
    controlsRef,
    camera: camera!,
    onPositionUpdate,
    health,
    isCharging: isBowCharging || isPyroclastActive,
    onMovementUpdate: (direction: Vector3) => {
      movementDirection.copy(direction);
    },
    currentWeapon,
    abilities
  });

  // SMITE 
  const [isSmiting, setIsSmiting] = useState(false);
  const [smiteEffects, setSmiteEffects] = useState<{ id: number; position: Vector3 }[]>([]);
  const nextSmiteId = useRef(0);
  
 
  const [hitCountThisSwing, setHitCountThisSwing] = useState<Record<string, number | boolean>>({});

  // BOW CHARGING
  const [bowChargeProgress, setBowChargeProgress] = useState(0);
  const bowChargeStartTime = useRef<number | null>(null);
  const bowChargeLineOpacity = useRef(0);

  // PROJECTILES 
  const [activeProjectiles, setActiveProjectiles] = useState<Array<{
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
  }>>([]);

  const pendingLightningTargets = useRef<Set<string>>(new Set()); 
  const [collectedBones, ] = useState<number>(15); // LATER

  const [isOathstriking, setIsOathstriking] = useState(false);
  const [hasHealedThisSwing, setHasHealedThisSwing] = useState(false);
  const crusaderAuraRef = useRef<{ processHealingChance: () => void }>(null);
  const [bowGroundEffectProgress, setBowGroundEffectProgress] = useState(0);
  const [movementDirection] = useState(() => new Vector3());
  const chainLightningRef = useRef<{ processChainLightning: () => void }>(null);
  const lastFrostExplosionTime = useRef(0);
  const FROST_EXPLOSION_COOLDOWN = 1000; // 1 second cooldown between frost explosions
  
  // Track Pyroclast charge progress
  const pyroclastChargeProgress = useRef(0);

  // ref for frame-by-frame fireball updates
  const activeFireballsRef = useRef<{
    id: number;
    position: Vector3;
    direction: Vector3;
    startPosition: Vector3;
    maxDistance: number;
  }[]>([]);

  // ref for projectiles
  const activeProjectilesRef = useRef<Array<{
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
  }>>([]);

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

  const { handleStealthKillHeal } = useStealthHealing({
    currentHealth: health,
    maxHealth: maxHealth,
    onHealthChange: (health: number) => onHealthChange?.(health),
    setDamageNumbers,
    nextDamageNumberId
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
          
          // Use requestAnimationFrame to ensure UI updates happen on the next frame
          requestAnimationFrame(() => {
            setIsStealthed(false);
            setHasShadowStrikeBuff(false);
          });

          // Calculate and apply damage
          if (dotProduct > 0.5) {
            stealthBonusAmount = 221;
            finalDamage += stealthBonusAmount;
            isCritical = true;
            
            if (target.health <= finalDamage) {
              handleStealthKillHeal(target.position, true);
            }
          } else {
            stealthBonusAmount = 110;
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
            console.log(`[Attack] Reignite processKill at position:`, {
              x: killPosition.x.toFixed(3),
              y: killPosition.y.toFixed(3),
              z: killPosition.z.toFixed(3)
            });
            reigniteRef.current.processKill(killPosition);
          }
        }
      }
    },
    [onHit, setIsStealthed, setHasShadowStrikeBuff, enemyData, handleStealthKillHeal, currentWeapon, abilities]
  );

  // Add new state for whirlwind
  const [isWhirlwinding, setIsWhirlwinding] = useState(false);

  // Add ref to track whirlwind duration
  const whirlwindStartTime = useRef<number | null>(null);
  const WHIRLWIND_MAX_DURATION = 15000; // 1.5 seconds max duration

  const { shootQuickShot, projectilePool: quickShotProjectilesRef, resetEagleEyeCounter, eagleEyeManagerRef } = useQuickShot({
    parentRef: groupRef,
    onHit,
    enemyData,
    setDamageNumbers,
    nextDamageNumberId,
    charges: fireballCharges,
    setCharges: setFireballCharges,
    isEagleEyeUnlocked: abilities[WeaponType.BOW].passive.isUnlocked
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
  }

  interface PooledFireball {
    id: number;
    position: Vector3;
    direction: Vector3;
    startPosition: Vector3;
    maxDistance: number;
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

  // Modify shootFireball to reuse vectors
  const shootFireball = useCallback(() => {
    if (!groupRef.current) return;

    const availableChargeIndex = fireballCharges.findIndex(charge => charge.available);
    if (availableChargeIndex === -1) return;

    // Reuse tempVec3 for unit position
    tempVec3.copy(groupRef.current.position);
    tempVec3.y += 1;

    // Reuse tempVec3_2 for direction
    tempVec3_2.set(0, 0, 1);
    tempVec3_2.applyQuaternion(groupRef.current.quaternion);
    tempVec3_2.normalize();

    setFireballCharges(prev => prev.map((charge, index) => 
      index === availableChargeIndex
        ? { ...charge, available: false, cooldownStartTime: Date.now() }
        : charge
    ));

    const newFireball = fireballPool.acquire();
    newFireball.id = nextFireballId.current++;
    newFireball.position.copy(tempVec3);
    newFireball.startPosition.copy(tempVec3);
    newFireball.direction.copy(tempVec3_2);
    newFireball.maxDistance = 45;

    activeFireballsRef.current.push(newFireball);
    setFireballs(prev => [...prev, newFireball]);
  }, [groupRef, fireballCharges, tempVec3, tempVec3_2, fireballPool]);

  // Add state declaration at the top with component's other states
  const [lastBowShotTime, setLastBowShotTime] = useState<number>(0);

  // Now the releaseBowShot callback can use lastBowShotTime safely
  const releaseBowShot = useCallback((power: number) => {
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
    newProjectile.maxDistance = 40;
    newProjectile.startPosition.copy(tempVec3);
    newProjectile.hasCollided = false;

    // Store additional projectile data for debuff checking
    newProjectile.isFullyCharged = power >= 0.95;

    // Update both ref and state
    activeProjectilesRef.current.push(newProjectile);
    setActiveProjectiles(prev => [...prev, newProjectile]);

    setIsBowCharging(false);
    setBowChargeProgress(0);
    bowChargeStartTime.current = null;
    onAbilityUse(currentWeapon, 'e');
  }, [groupRef, lastBowShotTime, tempVec3, tempVec3_2, currentWeapon, onAbilityUse, projectilePool]);

  // Modify handleFireballImpact to return fireball to pool
  const handleFireballImpact = (id: number, impactPosition?: Vector3) => {

    
    // Find and release the fireball back to the pool
    const fireball = activeFireballsRef.current.find(f => f.id === id);
    if (fireball) {
      // Store the final position before releasing
      const finalPosition = fireball.position.clone();
      fireballPool.release(fireball);
      
      // Add explosion effect at the final position if no impact position was provided
      if (!impactPosition) {
        setActiveEffects(prev => [...prev, {
          id: Date.now(),
          type: 'unitFireballExplosion',
          position: finalPosition,
          direction: new Vector3(),
          duration: 0.225,
          startTime: Date.now()
        }]);
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
    if (!groupRef.current || !isSwinging) return;

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

    const maxHits = isEnemy 
      ? (currentWeapon === WeaponType.SABRES ? 2 : 1)
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
      // SPEAR STRAIGHT LINE CHECK
      if (currentWeapon === WeaponType.SPEAR) {
        const toTarget = new Vector3()
          .subVectors(target.position, groupRef.current.position)
          .normalize();
        const forward = new Vector3(0, 0, 1)
          .applyQuaternion(groupRef.current.quaternion);
        
        const angle = toTarget.angleTo(forward);
        
        // DEADZONE
        const closeRange = weaponRange * 0.6; // 40% of max range
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
      
      const baseDamage = WEAPON_DAMAGES[currentWeapon].normal;
      
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

          const { damage: lightningDamage, isCritical: lightningCrit } = calculateDamage(59);
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
        // Calculate if the hit is within 80-100% of max range
        const maxRange = WEAPON_DAMAGES[WeaponType.SPEAR].range;
        const sweetSpotStart = maxRange * 0.8;
        
        // Guaranteed critical at 80-100% of max range
        if (distance >= sweetSpotStart && distance <= maxRange) {
          isCritical = true;
          damage = baseDamage * 2;
        } else {
          // Normal damage calculation for non-sweet spot hits
          const result = calculateDamage(baseDamage);
          damage = result.damage;
          isCritical = result.isCritical;
        }
      } else if (currentWeapon === WeaponType.SABRES) {
        // Calculate damage independently for each hit
        // Calculate and store critical status for this specific hit
        const currentHitIndex = currentHits;
        isCritical = Math.random() < 0.25; // 17% crit chance for Sabres
        
        // Store the critical hit status for this specific hit
        setHitCountThisSwing(prev => ({
          ...prev,
          [`${target.id}_crit_${currentHitIndex}`]: isCritical
        }));
        
        damage = isCritical ? baseDamage * 2 : baseDamage;
      } else {
        // Normal damage calculation for other weapons
        const result = calculateDamage(baseDamage);
        damage = result.damage;
        isCritical = result.isCritical;
      }
      
      // Add orb shield bonus damage for Sabres
      let totalDamage = damage;
      if (currentWeapon === WeaponType.SABRES && orbShieldRef.current && 
        abilities[WeaponType.SABRES].active.isUnlocked) {
        const bonusDamage = orbShieldRef.current.calculateBonusDamage();
        if (bonusDamage > 0) {
          totalDamage += bonusDamage;
          
          // Display bonus damage number separately
          setDamageNumbers(prev => {
            console.log('Creating OrbShield damage number:', {
              damage: bonusDamage,
              isOrbShield: true
            });
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
      }

      // Only display damage number if target is still alive
      if (targetAfterDamage > 0) {
        // Special handling for Sabres to offset damage numbers
        if (currentWeapon === WeaponType.SABRES) {
          const offset = currentHits === 0 ? -0.4 : 0.4;
          // Use the stored critical hit status for this specific hit
          const critValue = hitCountThisSwing[`${target.id}_crit_${currentHits}`];
          const hitIsCritical = typeof critValue === 'boolean' && critValue === true;
          
          console.log(`Sabre hit ${currentHits} critical status:`, hitIsCritical, critValue);
          
          setDamageNumbers(prev => [...prev, {
            id: nextDamageNumberId.current++,
            damage,
            position: new Vector3(
              target.position.x + offset,
              target.position.y,
              target.position.z
            ),
            isCritical: hitIsCritical
          }]);
        } else {
          setDamageNumbers(prev => [...prev, {
            id: nextDamageNumberId.current++,
            damage,
            position: target.position.clone(),
            isCritical
          }]);
        }
      }

      if (currentWeapon === WeaponType.SWORD && 
          abilities[WeaponType.SWORD].active.isUnlocked && 
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
        console.log(`[Weapon] Reignite processKill at position:`, {
          x: killPosition.x.toFixed(3),
          y: killPosition.y.toFixed(3),
          z: killPosition.z.toFixed(3)
        });
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
  };

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    if (isSwinging && groupRef.current) {
      enemyData.forEach(enemy => {
        handleWeaponHit(enemy.id);
      });
    }

    // BOW CHARGING 
    if (isBowCharging && bowChargeStartTime.current !== null) {
      const chargeTime = (Date.now() - bowChargeStartTime.current) / 1000;
      const progress = Math.min(chargeTime / 1.675, 1); // BOWCHARGE CHARGETIME - 1.5 no movemvent
      setBowChargeProgress(progress);
      setBowGroundEffectProgress(progress); // Update ground effect progress

      // Smooth charge line opacity using delta
      const targetOpacity = progress;
      const currentOpacity = bowChargeLineOpacity.current;
      bowChargeLineOpacity.current += (targetOpacity - currentOpacity) * delta * 5;

      if (progress >= 1) {
        releaseBowShot(1);
      }
    }

    // Update projectiles with optimized frame-by-frame movement
    activeProjectilesRef.current = activeProjectilesRef.current.filter(projectile => {
      const distanceTraveled = projectile.position.distanceTo(projectile.startPosition);
      
      if (distanceTraveled < projectile.maxDistance && !projectile.hasCollided) {
        const speed = projectile.power >= 1 ? 0.5 : 0.375;
        projectile.position.add(
          projectile.direction
            .clone()
            .multiplyScalar(speed)
        );

        // Initialize hitEnemies array if it doesn't exist
        if (!projectile.hitEnemies) {
          projectile.hitEnemies = new Set();
        }

        // Check collisions
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
            
            // Only set hasCollided if it's not a fully charged shot
            if (projectile.power < 1) {
              projectile.hasCollided = true;
              return false;
            }
            // Fully charged shots continue through enemies
          }
        }
        
        return true;
      }
      return false;
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
            handleFireballHit(fireball.id, enemy.id, );
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
        
        // Auto-release after 6 seconds (max charge)
        if (chargeTime >= 4) {
          releasePyroclastCharge();
          onAbilityUse(WeaponType.SPEAR, 'r');
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
  });

  // FROST LANCE
  const {  startFirebeam, stopFirebeam } = useFirebeamManager({
    parentRef: groupRef,
    onHit,
    enemyData,
    setActiveEffects,
    charges: fireballCharges,
    setCharges: setFireballCharges,
    setDamageNumbers,
    nextDamageNumberId
  });

  // ABILITY KEYS 
  const reanimateRef = useRef<ReanimateRef>(null);

  const handleHealthChange = useCallback((healAmount: number) => {
    if (onHealthChange) {
      // Pass the delta amount directly
      onHealthChange(healAmount);
    }
  }, [onHealthChange]);

  const orbShieldRef = useRef<OrbShieldRef>(null);
  const { activateOathstrike } = useOathstrike({
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

  const [isVaulting, setIsVaulting] = useState(false);
  const [isVaultingNorth, setIsVaultingNorth] = useState(false);
  const [isVaultingEast, setIsVaultingEast] = useState(false);
  const [isVaultingWest, setIsVaultingWest] = useState(false);
  // Add global vault state to prevent concurrent vault abilities
  const [isAnyVaultActive, setIsAnyVaultActive] = useState(false);
  // Add isBreaching state before useAbilityKeys call
  const [isBreaching, setIsBreaching] = useState(false);


  // In the Unit component, add this before useAbilityKeys initialization
  const { activateBreach } = useBreachController({
    parentRef: groupRef,
    charges: fireballCharges,
    setCharges: setFireballCharges,
    reigniteRef
  });

  // First, add this near the top of the component:
  const { activeStrikes, createLightningStrike, removeLightningStrike } = useBowLightning();

  useAbilityKeys({
    keys: movementKeys,
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
    setBowChargeStartTime: (value) => { bowChargeStartTime.current = value; },
    setSmiteEffects,
    setActiveEffects, 
    onAbilityUse,
    shootFireball,
    releaseBowShot,
    startFirebeam,
    stopFirebeam,
    castReanimate: () => {
      reanimateRef.current?.castReanimate();
    },
    reanimateRef,
    health,
    maxHealth,
    onHealthChange,
    activateOathstrike,
    setIsOathstriking,
    orbShieldRef,
    isWhirlwinding,
    setIsWhirlwinding,
    whirlwindStartTime,
    fireballCharges,
    activateStealth,
    shootQuickShot,
    setIsVaulting,
    isVaulting,
    setIsVaultingNorth,
    isVaultingNorth,
    setIsVaultingEast,
    isVaultingEast,
    setIsVaultingWest,
    isVaultingWest,
    startPyroclastCharge,
    releasePyroclastCharge,
    isPyroclastActive,
    isBreaching,
    setIsBreaching,
    activateBreach,  // Add this new prop
    isAnyVaultActive,
    setIsAnyVaultActive
  });

  //=====================================================================================================

  // SMITE COMPLETE 
  const handleSmiteComplete = () => {
    setIsSmiting(false);
    setIsSwinging(false);
    setHitCountThisSwing({});
  };

  const handleSmiteEffectComplete = (id: number) => {
    setSmiteEffects(prev => prev.filter(effect => effect.id !== id));
  };

  // DAMAGE NUMBERS COMPLETE 
  const handleDamageNumberComplete = (id: number) => {
    setDamageNumbers(prev => prev.filter(dn => dn.id !== id));
  };

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
    if (projectile.power >= 0.99) { // Fully charged
      baseDamage = 137;
      
      // Add bonus damage from Elemental Shots (active ability) if it's unlocked
      if (abilities[WeaponType.BOW].active.isUnlocked) {
        const randomBonus = Math.floor(Math.random() * 121) + 120; // 80-200 range
        baseDamage += randomBonus;
      }
    } else {
      // Minimum damage of 41, scaling up with charge
      baseDamage = 36 + Math.floor((projectile.power * 108));
      
      // Add bonus damage from Elemental Shots for non-fully charged shots
      if (abilities[WeaponType.BOW].active.isUnlocked) {
        baseDamage += Math.floor(Math.random() * (111 - 59 + 1)) + 59; // Add random bonus damage (59-111) to non-fully charged shots
        
        // Create lightning strike effect
        createLightningStrike(projectilePosition);
      }
    }
    
    // Apply critical hit calculation
    const { damage, isCritical } = calculateDamage(baseDamage);
    
    // Create damage number with proper flags
    setDamageNumbers(prev => [
      ...prev,
      {
        id: nextDamageNumberId.current++,
        damage: damage,
        position: projectilePosition.clone().add(new Vector3(0, 0, 0)),
        isCritical: isCritical, 
        isLightning: false,
        isBowLightning: !projectile.isFullyCharged && abilities[WeaponType.BOW].active.isUnlocked,
        isHealing: false,
        isBlizzard: false,
        isBoneclaw: false,
        isOathstrike: false,
        isFirebeam: false,
        isOrbShield: false,
        isChainLightning: false,
        isFireball: false,
        isSummon: false,
        isStealthStrike: false,
        isPyroclast: false,
        isEagleEye: false,
        isBreach: false
      }
    ]);
    
    // Handle damage effects
    onHit(targetId, damage);
    
    // Only set hasCollided for non-fully charged shots
    // This allows fully charged shots to pierce through enemies
    if (!projectile.isFullyCharged) {
      projectile.hasCollided = true;
    }
  };

  // FIREBALL HIT 
  const handleFireballHit = (fireballId: number, targetId: string) => {
    const isEnemy = targetId.startsWith('enemy');
    if (!isEnemy) return;

    const enemy = enemyData.find(e => e.id === targetId);
    if (!enemy) return;

    const { damage, isCritical } = calculateDamage(61); // Fixed fireball damage
    
    onHit(targetId, damage);

    // Check if target is still alive before adding damage number
    const targetAfterDamage = enemy.health - damage;
    if (targetAfterDamage > 0) {
      setDamageNumbers(prev => [...prev, {
        id: nextDamageNumberId.current++,
        damage,
        position: enemy.position.clone(),
        isCritical,
        isFireball: true
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
      onPositionUpdate(position, isStealthed); // Pass stealth state to parent
    }
  });

  // OATHSTRIKE COMPLETE
  const handleOathstrikeComplete = () => {
    setIsOathstriking(false);
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
    
    setActiveProjectiles(prev => prev.filter(projectile => {
      const distanceTraveled = projectile.position.distanceTo(projectile.startPosition);
      return distanceTraveled < projectile.maxDistance;
    }));
  });

  // Add cleanup for expired effects
  useEffect(() => {
    const cleanup = setInterval(() => {
      setActiveEffects(prev => 
        prev.filter(effect => {
          if (effect.type !== 'unitFireballExplosion') return true;
          if (!effect.startTime) return false;
          return Date.now() - effect.startTime < effect.duration! * 1000;
        })
      );
    }, 100);

    return () => {
      clearInterval(cleanup);
      // Only clear unit-specific effects on unmount
      setActiveEffects(prev => 
        prev.filter(effect => effect.type !== 'unitFireballExplosion')
      );
    };
  }, []);

  // Add additional cleanup for unmounting
  useEffect(() => {
    return () => {
      setActiveEffects(prev => prev.filter(effect => 
        effect.type !== 'fireballExplosion'
      )); 
    };
  }, []);

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

  useEffect(() => {
    return () => {
      setActiveEffects(prev => prev.filter(effect => 
        effect.type === 'boneclaw' || effect.type === 'blizzard'
      ));
    };
  }, []);

  useEffect(() => {
    const cleanupEffects = () => {
      setActiveEffects(prev => 
        prev.filter(effect => {
          if (effect.type !== 'fireballExplosion') return true;
          const elapsed = effect.startTime ? (Date.now() - effect.startTime) / 1000 : 0;
          const duration = effect.duration || 0.225;
          return elapsed < duration;
        })
      );
    };

    const cleanupInterval = setInterval(cleanupEffects, 100);
    return () => clearInterval(cleanupInterval);
  }, [setActiveEffects]);

      // ============================== AVALANCHE CLEANER TEST
  useEffect(() => {
    const cleanupFrostEffects = () => {
      setActiveEffects(prev => 
        prev.filter(effect => {
          if (effect.type !== 'frostExplosion') return true;
          const elapsed = effect.startTime ? (Date.now() - effect.startTime) / 1000 : 0;
          const duration = effect.duration || 0.25;
          return elapsed < duration;
        })
      );
    };

    const cleanupInterval = setInterval(cleanupFrostEffects, 100);
    return () => clearInterval(cleanupInterval);
  }, [setActiveEffects]);

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
    };
  }, [projectilePool, fireballPool]);

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

  return (
    <>
      <group ref={groupRef} position={[0, 1, 0]}>

        {/* DRAGON HORNS */}
        <group scale={[0.335, 0.335, 0.335]} position={[-0.05, 0.215, 0.35]} rotation={[+0.15, 0, -5]}>
          <DragonHorns isLeft={true} />
        </group>

       <group scale={[0.335, 0.335, 0.335]} position={[0.05, 0.215, 0.35]} rotation={[+0.15, 0, 5]}>
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
        />
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
            hasActiveAbility={abilities[WeaponType.SABRES].active.isUnlocked}
          />
        ) : currentWeapon === WeaponType.SCYTHE ? (
          <Scythe 
            parentRef={groupRef}
            isSwinging={isSwinging} 
            onSwingComplete={handleSwingComplete} 
          />
        ) : currentWeapon === WeaponType.SPEAR ? (
          <Spear
            isSwinging={isSwinging}
            onSwingComplete={handleSwingComplete}
            enemyData={enemyData}
            onHit={onHit}
            setDamageNumbers={setDamageNumbers}
            nextDamageNumberId={nextDamageNumberId}
            isWhirlwinding={isWhirlwinding}
            fireballCharges={fireballCharges}
          />
        ) : currentWeapon === WeaponType.BOW ? (
          <group position={[0, 0.1, 0.3]}>
            <EtherealBow
              position={new Vector3()}
              direction={new Vector3(0, 0, 1).applyQuaternion(groupRef.current?.quaternion || new THREE.Quaternion())}
              chargeProgress={bowChargeProgress}
              isCharging={isBowCharging}
              onRelease={releaseBowShot}
            />
          </group>
        ) : (
          <Sword
            isSwinging={isSwinging}
            isSmiting={isSmiting}
            isOathstriking={isOathstriking}
            onSwingComplete={handleSwingComplete}
            onSmiteComplete={handleSmiteComplete}
            onOathstrikeComplete={handleOathstrikeComplete}
            hasChainLightning={abilities[WeaponType.SWORD].active.isUnlocked}
          />
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
      <GhostTrail parentRef={groupRef} weaponType={currentWeapon} />

      {/* Fireballs  */}
      {fireballs.map(fireball => (
        <Fireball
          key={fireball.id}
          position={fireball.position}
          direction={fireball.direction}
          onImpact={(impactPosition?: Vector3) => handleFireballImpact(fireball.id, impactPosition)}
        />
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
              <cylinderGeometry args={[0.03, 0.125, 2.1, 6]} /> {/* Segments */}
              <meshStandardMaterial
                color="#00ffff"
                emissive="#00ffff"
                emissiveIntensity={1}
                transparent
                opacity={1}
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
                  color="#00ffff"
                  emissive="#00ffff"
                  emissiveIntensity={3}
                  transparent
                  opacity={0.9 - i * 0.125}
                  blending={THREE.AdditiveBlending}
                />
              </mesh>
            ))}

            {/* Single light instead of two */}
            <pointLight 
              color="#00ffff" 
              intensity={3} 
              distance={5}
              decay={2}
            />
          </group>

          {/* POWERSHOT - Optimized */}
          {projectile.power >= 1 && 
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
              {/* Core arrow shaft */}
              <mesh rotation={[Math.PI/2, 0, 0]}>
                <cylinderGeometry args={[0.15, 0.35, 2, 4]} /> {/* Reduced segments */}
                <meshStandardMaterial
                  color={abilities[WeaponType.BOW].active.isUnlocked ? "#ff6a00" : "#EAC4D5"}
                  emissive={abilities[WeaponType.BOW].active.isUnlocked ? "#ff3300" : "#EAC4D5"}
                  emissiveIntensity={abilities[WeaponType.BOW].active.isUnlocked ? 2.5 : 1.5}
                  transparent
                  opacity={0.7}
                />
              </mesh>

              {/* Reduced ethereal trails */}
              {[...Array(abilities[WeaponType.BOW].active.isUnlocked ? 6 : 4)].map((_, i) => { // More particles if ability unlocked
                const angle = (i / (abilities[WeaponType.BOW].active.isUnlocked ? 6 : 4)) * Math.PI * 2;
                const radius = 0.4;
                return (
                  <group 
                    key={`ghost-trail-${i}`}
                    position={[
                      Math.sin(angle + Date.now() * 0.003) * radius,
                      Math.cos(angle + Date.now() * 0.003) * radius,
                      -1.4
                    ]}
                  >
                    <mesh>
                      <sphereGeometry args={[0.125, 3, 3]} /> {/* Reduced segments */}
                      <meshStandardMaterial
                        color={abilities[WeaponType.BOW].active.isUnlocked ? "#ff5500" : "#00ffff"}
                        emissive={abilities[WeaponType.BOW].active.isUnlocked ? "#ff3300" : "#00ffff"}
                        emissiveIntensity={abilities[WeaponType.BOW].active.isUnlocked ? 1.5 : 1}
                        transparent
                        opacity={0.5}
                        blending={THREE.AdditiveBlending}
                      />
                    </mesh>
                  </group>
                );
              })}

              {/* Fire particles for elemental shots */}
              {abilities[WeaponType.BOW].active.isUnlocked && 
                [...Array(8)].map((_, i) => {
                  const angle = Math.random() * Math.PI * 2;
                  const radius = 0.25 + Math.random() * 0.3;
                  const offset = -Math.random() * 2.5;
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
                        <sphereGeometry args={[0.07 + Math.random() * 0.1, 3, 3]} />
                        <meshStandardMaterial
                          color={i % 2 === 0 ? "#ffcc00" : "#ff4400"}
                          emissive={i % 2 === 0 ? "#ffcc00" : "#ff4400"}
                          emissiveIntensity={2}
                          transparent
                          opacity={0.7}
                          blending={THREE.AdditiveBlending}
                        />
                      </mesh>
                    </group>
                  );
                })
              }

              {/* Reduced ghostly wisps */}
              {[...Array(6)].map((_, i) => { // Reduced from 12 to 6
                const offset = -i * 0.3 - 1.5;
                const scale = 1 - (i * 0.015);
                return (
                  <group 
                    key={`wisp-${i}`}
                    position={[0, 0, offset]}
                    rotation={[0, Date.now() * 0.001 + i, 0]}
                  >
                    <mesh scale={scale}>
                      <torusGeometry args={[0.4, 0.1, 3, 6]} /> {/* Reduced segments */}
                      <meshStandardMaterial
                        color={abilities[WeaponType.BOW].active.isUnlocked ? "#ff7700" : "#00ffff"}
                        emissive={abilities[WeaponType.BOW].active.isUnlocked ? "#ff5500" : "#00ffff"}
                        emissiveIntensity={abilities[WeaponType.BOW].active.isUnlocked ? 1.5 : 1}
                        transparent
                        opacity={0.3}
                        blending={THREE.AdditiveBlending}
                      />
                    </mesh>
                  </group>
                );
              })}

              {/* Single light with proper color */}
              <pointLight
                color={abilities[WeaponType.BOW].active.isUnlocked ? "#ff5500" : "#EAC4D5"}
                intensity={abilities[WeaponType.BOW].active.isUnlocked ? 5 : 3}
                distance={abilities[WeaponType.BOW].active.isUnlocked ? 7 : 5}
                decay={2}
              />
            </group>
          )}
        </group>
      ))}

      <BoneVortex parentRef={groupRef} weaponType={currentWeapon} />
      <BoneAura parentRef={groupRef} />

      {activeEffects.map(effect => {
        if (effect.type === 'boneclaw') {
          return (
            <Boneclaw
              key={effect.id}
              position={effect.position}
              direction={effect.direction}
              parentRef={groupRef}
              enemyData={enemyData}
              onComplete={() => {
                setActiveEffects(prev => 
                  prev.filter(e => e.id !== effect.id)
                );
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
            />
          );
        } else if (effect.type === 'blizzard') {
          return (
            <Blizzard
              key={effect.id}
              position={effect.position}
              enemyData={enemyData}
              parentRef={groupRef}
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
        } else if (effect.type === 'firebeam') {
          return (
            <Firebeam
              key={effect.id}
              position={effect.position}
              direction={effect.direction}
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
              color="#C18C4B"
              emissive="#C18C4B"
              emissiveIntensity={1}
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
                color="#C18C4B"
                emissive="#C18C4B"
                emissiveIntensity={2}
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
       abilities[WeaponType.SWORD].active.isUnlocked && (
        <ChainLightning
          ref={chainLightningRef}
          parentRef={groupRef}
          enemies={enemyData}
          onEnemyDamage={onHit}
          setDamageNumbers={setDamageNumbers}
          nextDamageNumberId={nextDamageNumberId}
        />
      )}

      {currentWeapon === WeaponType.SABRES && 
       abilities[WeaponType.SABRES].active.isUnlocked && (
        <OrbShield
          ref={orbShieldRef}
          parentRef={groupRef}
          charges={fireballCharges}
          setCharges={setFireballCharges}
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
          charges={fireballCharges}
          setCharges={setFireballCharges}
          reigniteRef={reigniteRef}
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
        />
      ))}

      {/* Vault is now available for all weapons */}
      <Vault
        parentRef={groupRef}
        isActive={isVaulting}
        onComplete={() => {
          setIsVaulting(false);
          setIsAnyVaultActive(false);
          onAbilityUse(currentWeapon, 'vault');
        }}
      />

      {/* VaultNorth is now available for all weapons */}
      <VaultNorth
        parentRef={groupRef}
        isActive={isVaultingNorth}
        onComplete={() => {
          setIsVaultingNorth(false);
          setIsAnyVaultActive(false);
          onAbilityUse(currentWeapon, 'vaultNorth');
        }}
      />

      {/* VaultEast is now available for all weapons */}
      <VaultEast
        parentRef={groupRef}
        isActive={isVaultingEast}
        onComplete={() => {
          setIsVaultingEast(false);
          setIsAnyVaultActive(false);
          onAbilityUse(currentWeapon, 'vaultEast');
        }}
      />

      {/* VaultWest is now available for all weapons */}
      <VaultWest
        parentRef={groupRef}
        isActive={isVaultingWest}
        onComplete={() => {
          setIsVaultingWest(false);
          setIsAnyVaultActive(false);
          onAbilityUse(currentWeapon, 'vaultWest');
        }}
      />

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

      {/* Always render Reignite component but only activate its effect when using Spear with passive unlocked */}
      <Reignite
        ref={reigniteRef}
        parentRef={groupRef}
        charges={fireballCharges}
        setCharges={setFireballCharges}
        isActive={abilities[WeaponType.SPEAR].passive.isUnlocked}
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
          showDamageNumber={(targetId, damage, position) => {
            setDamageNumbers(prev => [...prev, {
              id: nextDamageNumberId.current++,
              damage: damage,
              position: position.clone().add(new Vector3(0, 1.5, 0)),
              isCritical: false,
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

      {currentWeapon === WeaponType.BOW && abilities[WeaponType.BOW].passive.isUnlocked && (
        <EagleEyeManager 
          ref={eagleEyeManagerRef}
          isUnlocked={abilities[WeaponType.BOW].passive.isUnlocked}
        />
      )}
    </>
  );
}