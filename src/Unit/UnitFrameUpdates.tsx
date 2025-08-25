import React, { useRef, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group, Vector3 } from 'three';
import { WeaponType, WeaponSubclass, AbilityType } from '../Weapons/weapons';
import { SynchronizedEffect } from '../Multiplayer/MultiplayerContext';
import { DamageNumber as DamageNumberType } from './useDamageNumbers';

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

interface UnitFrameUpdatesProps {
  groupRef: React.RefObject<Group>;
  currentWeapon: WeaponType;
  currentSubclass?: WeaponSubclass;
  level: number;
  
  // Animation states
  isSwinging: boolean;
  isBowCharging: boolean;
  bowChargeStartTime: React.MutableRefObject<number | null>;
  bowChargeProgress: number;
  setBowChargeProgress: (progress: number) => void;
  setBowGroundEffectProgress: (progress: number) => void;
  bowChargeLineOpacity: React.MutableRefObject<number>;
  isPerfectShotWindow: boolean;
  setIsPerfectShotWindow: (isPerfect: boolean) => void;
  hasAutoReleasedBowShot: boolean;
  setHasAutoReleasedBowShot: (released: boolean) => void;
  isAbilityBowAnimation: boolean;
  abilityBowAnimationStartTime: React.MutableRefObject<number | null>;
  
  // Player state
  isPlayerStunned: boolean;
  setIsPlayerStunned: (stunned: boolean) => void;
  stunEndTime: React.MutableRefObject<number>;
  isStealthed: boolean;
  movementDirection: Vector3;
  
  // Whirlwind state
  isWhirlwinding: boolean;
  setIsWhirlwinding: (whirlwinding: boolean) => void;
  whirlwindStartTime: React.MutableRefObject<number | null>;
  WHIRLWIND_MAX_DURATION: number;
  
  // Pyroclast state
  isPyroclastActive: boolean;
  chargeStartTime: React.MutableRefObject<number | null>;
  pyroclastChargeProgress: React.MutableRefObject<number>;
  releasePyroclastCharge: () => void;
  
  // Projectiles and fireballs
  activeProjectilesRef: React.MutableRefObject<PooledProjectile[]>;
  setActiveProjectiles: React.Dispatch<React.SetStateAction<PooledProjectile[]>>;
  activeFireballsRef: React.MutableRefObject<FireballData[]>;
  setFireballs: React.Dispatch<React.SetStateAction<FireballData[]>>;
  
  // Effects
  setActiveEffects: React.Dispatch<React.SetStateAction<ActiveEffect[]>>;
  setDamageNumbers: React.Dispatch<React.SetStateAction<DamageNumberType[]>>;
  nextDamageNumberId: React.MutableRefObject<number>;
  
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
  
  // DoT tracking
  venomDoTEnemies: React.MutableRefObject<Record<string, {
    startTime: number;
    lastTickTime: number;
    duration: number;
  }>>;
  viperStingDoTEnemies: React.MutableRefObject<Record<string, {
    startTime: number;
    lastTickTime: number;
    duration: number;
  }>>;
  
  // Callback functions
  handleWeaponHit: (targetId: string) => void;
  releaseBowShot: (progress: number) => void;
  onHit: (targetId: string, damage: number) => void;
  onAbilityUse: (weapon: WeaponType, abilityType: AbilityType) => void;
  handleProjectileHit: (projectileId: number, targetId: string, power: number, projectilePosition: Vector3) => void;
  handleFireballHit: (fireballId: number, targetId: string) => void;
  handleFireballImpact: (id: number, impactPosition?: Vector3) => void;
  checkPyroclastCollisions: (missileId: number, position: Vector3) => void;
  updateBarrageProjectiles: () => void;
  updateIcicleProjectilesRef: React.MutableRefObject<(() => void) | null>;
  updateGuidedBoltMissiles: () => void;
  updateLavaLashProjectiles: () => void;
  updateAegisProjectiles: () => void;
  onPositionUpdate: (position: Vector3, isStealthed?: boolean, rotation?: Vector3, movementDirection?: Vector3) => void;
  
  // Pyroclast missiles
  pyroclastMissiles: Array<{
    id: number;
    position: Vector3;
  }>;
  
  // Multiplayer
  isInRoom: boolean;
  isPlayer: boolean;
  sendEffect?: (effect: Omit<SynchronizedEffect, 'id' | 'startTime'>) => void;
  
  // Constants
  ORBITAL_COOLDOWN: number;
}

const UnitFrameUpdates: React.FC<UnitFrameUpdatesProps> = ({
  groupRef,
  currentWeapon,
  currentSubclass,
  level,
  isSwinging,
  isBowCharging,
  bowChargeStartTime,
  bowChargeProgress,
  setBowChargeProgress,
  setBowGroundEffectProgress,
  bowChargeLineOpacity,
  isPerfectShotWindow,
  setIsPerfectShotWindow,
  hasAutoReleasedBowShot,
  setHasAutoReleasedBowShot,
  isAbilityBowAnimation,
  abilityBowAnimationStartTime,
  isPlayerStunned,
  setIsPlayerStunned,
  stunEndTime,
  isStealthed,
  movementDirection,
  isWhirlwinding,
  setIsWhirlwinding,
  whirlwindStartTime,
  WHIRLWIND_MAX_DURATION,
  isPyroclastActive,
  chargeStartTime,
  pyroclastChargeProgress,
  releasePyroclastCharge,
  activeProjectilesRef,
  setActiveProjectiles,
  activeFireballsRef,
  setFireballs,
  setActiveEffects,
  setDamageNumbers,
  nextDamageNumberId,
  fireballCharges,
  setFireballCharges,
  enemyData,
  venomDoTEnemies,
  viperStingDoTEnemies,
  handleWeaponHit,
  releaseBowShot,
  onHit,
  onAbilityUse,
  handleProjectileHit,
  handleFireballHit,
  handleFireballImpact,
  checkPyroclastCollisions,
  updateBarrageProjectiles,
  updateIcicleProjectilesRef,
  updateGuidedBoltMissiles,
  updateLavaLashProjectiles,
  updateAegisProjectiles,
  onPositionUpdate,
  pyroclastMissiles,
  isInRoom,
  isPlayer,
  sendEffect,
  ORBITAL_COOLDOWN
}) => {
  
  // Frame counters for frequency control
  const highFreqCounter = useRef(0);
  const mediumFreqCounter = useRef(0);
  const lowFreqCounter = useRef(0);

  // Suppress unused variables
  void currentWeapon;
  void bowChargeProgress;
  void isPerfectShotWindow;
  void isWhirlwinding;
  void setIsWhirlwinding;
  void whirlwindStartTime;
  void WHIRLWIND_MAX_DURATION;
  void isPyroclastActive;
  void chargeStartTime;
  void pyroclastChargeProgress;
  void releasePyroclastCharge;
  void fireballCharges;
  void onAbilityUse;
  void isInRoom;
  void isPlayer;
  void sendEffect;
  void lowFreqCounter;
  
  // High frequency updates (60fps) - Critical animations, player input, weapon hits
  const highFrequencyUpdates = useCallback((delta: number) => {
    if (!groupRef.current) return;
    
    // Player stun management
    if (isPlayerStunned && stunEndTime.current > 0 && Date.now() >= stunEndTime.current) {
      console.log(`[Player Stun] 🔄 Backup stun clear triggered - setTimeout may have failed`);
      setIsPlayerStunned(false);
      stunEndTime.current = 0;
    }
    
    // Failsafe: Clear stun if it's been active for more than 5 seconds
    if (isPlayerStunned && stunEndTime.current > 0 && Date.now() - stunEndTime.current > 3000) {
      console.log(`[Player Stun] 🚨 FAILSAFE: Clearing stun that has been active too long`);
      setIsPlayerStunned(false);
      stunEndTime.current = 0;
    }

    // Weapon hit detection
    if (isSwinging && groupRef.current) {
      enemyData.forEach(enemy => {
        handleWeaponHit(enemy.id);
      });
    }

    // BOW CHARGING - Critical for responsive charging
    if (isBowCharging && bowChargeStartTime.current !== null) {
      const chargeTime = (Date.now() - bowChargeStartTime.current) / 1000;
      const progress = Math.min(chargeTime / 1.375, 1);
      setBowChargeProgress(progress);
      setBowGroundEffectProgress(progress);

      // Perfect shot window detection for Elemental bow
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
      const animationProgress = Math.min(animationTime / 0.5, 1);
      const targetProgress = 0.75;
      setBowChargeProgress(targetProgress * animationProgress);
      setBowGroundEffectProgress(targetProgress * animationProgress);
    }

    // Position updates - Critical for smooth movement
    if (groupRef.current) {
      const position = groupRef.current.position.clone();
      const rotation = groupRef.current.rotation;
      const rotationVector = new Vector3(rotation.x, rotation.y, rotation.z);
      onPositionUpdate(position, isStealthed, rotationVector, movementDirection);
    }
  }, [
    groupRef, isPlayerStunned, stunEndTime, setIsPlayerStunned, isSwinging, enemyData, handleWeaponHit,
    isBowCharging, bowChargeStartTime, setBowChargeProgress, setBowGroundEffectProgress, currentSubclass,
    setIsPerfectShotWindow, bowChargeLineOpacity, hasAutoReleasedBowShot, releaseBowShot, setHasAutoReleasedBowShot,
    isAbilityBowAnimation, abilityBowAnimationStartTime, onPositionUpdate, isStealthed, movementDirection
  ]);

  // Medium frequency updates (30fps) - Projectiles, game logic, collisions
  const mediumFrequencyUpdates = useCallback(() => {
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
        const fadeProgress = fadeElapsed / 1000;
        projectile.opacity = Math.max(0, 1 - fadeProgress);
        
        if (fadeProgress >= 1) {
          return false;
        }
      }
      
      if (distanceTraveled < projectile.maxDistance && !projectile.hasCollided && !projectile.fadeStartTime) {
        const speed = (projectile.power >= 1 || projectile.isPerfectShot) ? 0.925 : 0.55;
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
          
          if (distanceToEnemy < 1.3 && !projectile.hitEnemies.has(enemy.id)) {
            projectile.hitEnemies.add(enemy.id);
            
            handleProjectileHit(projectile.id, enemy.id, projectile.power, projectile.position);
            
            if (projectile.power < 1 && !projectile.isPerfectShot) {
              projectile.hasCollided = true;
              return false;
            }
          }
        }
        
        return true;
      }
      
      return projectile.fadeStartTime !== null;
    });

    // Sync React state with ref only when projectiles are added/removed
    if (activeProjectilesRef.current.length !== setActiveProjectiles.length) {
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
          if (enemy.health <= 0 || enemy.isDying) continue;
          
          const fireballPos2D = new Vector3(
            fireball.position.x,
            0,
            fireball.position.z
          );
          const enemyPos2D = new Vector3(
            enemy.position.x,
            0,
            enemy.position.z
          );
          const distanceToEnemy = fireballPos2D.distanceTo(enemyPos2D);
          
          if (distanceToEnemy < 1.5) {
            handleFireballHit(fireball.id, enemy.id);
            return false;
          }
        }
        
        return true;
      } else {
        handleFireballImpact(fireball.id);
        return false;
      }
    });

    // Sync fireball state
    setFireballs([...activeFireballsRef.current]);

    // Update other projectile systems
    updateBarrageProjectiles();
    if (updateIcicleProjectilesRef.current) {
      updateIcicleProjectilesRef.current();
    }
    updateGuidedBoltMissiles();
    updateLavaLashProjectiles();
    updateAegisProjectiles();

    // Pyroclast collision checks
    pyroclastMissiles.forEach(missile => {
      checkPyroclastCollisions(missile.id, missile.position);
    });
  }, [
    activeProjectilesRef, setActiveProjectiles, activeFireballsRef, setFireballs, enemyData,
    handleProjectileHit, handleFireballHit, handleFireballImpact, updateBarrageProjectiles,
    updateIcicleProjectilesRef, updateGuidedBoltMissiles, updateLavaLashProjectiles,
    updateAegisProjectiles, pyroclastMissiles, checkPyroclastCollisions
  ]);

  // Low frequency updates (20fps) - DoT effects, cleanup, charge cooldowns
  const lowFrequencyUpdates = useCallback(() => {
    const currentTime = Date.now();

    // Handle Venom DoT ticks
    Object.entries(venomDoTEnemies.current).forEach(([enemyId, dotData]) => {
      const timeElapsed = currentTime - dotData.startTime;
      const timeSinceLastTick = currentTime - dotData.lastTickTime;
      
      if (timeElapsed >= dotData.duration) {
        delete venomDoTEnemies.current[enemyId];
        return;
      }
      
      if (timeSinceLastTick >= 1000) {
        const enemy = enemyData.find(e => e.id === enemyId);
        if (enemy && enemy.health > 0) {
          const poisonDamage = level >= 3 ? 71 : 37;
          onHit(enemyId, poisonDamage);
          
          setDamageNumbers(prev => [...prev, {
            id: nextDamageNumberId.current++,
            damage: poisonDamage,
            position: enemy.position.clone(),
            isCritical: false,
            isPoisonDoT: true
          }]);
          
          dotData.lastTickTime = currentTime;
        } else {
          delete venomDoTEnemies.current[enemyId];
        }
      }
    });

    // Handle Viper Sting DoT ticks
    Object.entries(viperStingDoTEnemies.current).forEach(([enemyId, dotData]) => {
      const timeElapsed = currentTime - dotData.startTime;
      const timeSinceLastTick = currentTime - dotData.lastTickTime;
      
      if (timeElapsed >= dotData.duration) {
        delete viperStingDoTEnemies.current[enemyId];
        return;
      }
      
      if (timeSinceLastTick >= 1000) {
        const enemy = enemyData.find(e => e.id === enemyId);
        if (enemy && enemy.health > 0) {
          const viperPoisonDamage = 53;
          onHit(enemyId, viperPoisonDamage);
          
          setDamageNumbers(prev => [...prev, {
            id: nextDamageNumberId.current++,
            damage: viperPoisonDamage,
            position: enemy.position.clone(),
            isCritical: false,
            isPoisonDoT: false,
            isViperSting: true
          }]);
          
          dotData.lastTickTime = currentTime;
        } else {
          delete viperStingDoTEnemies.current[enemyId];
        }
      }
    });

    // Update fireball charge cooldowns
    setFireballCharges(prev => prev.map(charge => {
      if (!charge.available && charge.cooldownStartTime) {
        const elapsed = currentTime - charge.cooldownStartTime;
        if (elapsed >= ORBITAL_COOLDOWN) {
          return {
            ...charge,
            available: true,
            cooldownStartTime: null
          };
        }
      }
      return charge;
    }));

    // Cleanup expired effects
    setActiveEffects(prev => 
      prev.filter(effect => {
        if (effect.type !== 'unitFireballExplosion') return true;
        if (!effect.startTime) return false;
        return currentTime - effect.startTime < effect.duration! * 1000;
      })
    );
  }, [
    venomDoTEnemies, viperStingDoTEnemies, enemyData, level, onHit, setDamageNumbers,
    nextDamageNumberId, setFireballCharges, ORBITAL_COOLDOWN, setActiveEffects
  ]);

  // Main useFrame loop with frequency separation
  useFrame((_, delta) => {
    // High frequency updates (60fps) - every frame
    highFrequencyUpdates(delta);
    
    // Medium frequency updates (30fps) - every 2nd frame
    highFreqCounter.current++;
    if (highFreqCounter.current >= 2) {
      highFreqCounter.current = 0;
      mediumFrequencyUpdates();
    }
    
    // Low frequency updates (20fps) - every 3rd frame
    mediumFreqCounter.current++;
    if (mediumFreqCounter.current >= 3) {
      mediumFreqCounter.current = 0;
      lowFrequencyUpdates();
    }
  });

  return null; // This component only handles frame updates, no rendering
};

export default UnitFrameUpdates;