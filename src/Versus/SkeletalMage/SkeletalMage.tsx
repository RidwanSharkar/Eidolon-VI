// src/versus/SkeletalMage/SkeletalMage.tsx
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Group, Vector3, SphereGeometry, MeshStandardMaterial, MeshBasicMaterial } from 'three';
import { Billboard, Text } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { HEALTHBAR_GEOMETRIES, HEALTHBAR_MATERIALS } from '@/Versus/HealthBarResources';
import CustomSkeletonMage from '@/Versus/SkeletalMage/CustomSkeletonMage';
import BoneVortex2 from '@/color/SpawnAnimation';
import { Enemy } from '@/Versus/enemy';
import BoneVortex from '@/color/DeathAnimation';
import { WeaponType } from '@/Weapons/weapons';
import MageFireball from '@/Versus/SkeletalMage/MageFireball';
import { stealthManager } from '@/Spells/Stealth/StealthManager';
import StealthStrikeEffect from '@/Spells/Stealth/StealthStrikeEffect';
import { globalAggroSystem, PlayerInfo, TargetInfo } from '../AggroSystem';
import { SkeletalMageProps } from './SkeletalMageProps';
import MageLightningStrike from './MageLightningStrike';
import LightningWarningIndicator from './LightningWarningIndicator';

// MEMORY FIX: Pre-create shared geometries and materials for casting effects at module level
const FIREBALL_HAND_GEOMETRY = new SphereGeometry(0.125, 16, 16);
const FIREBALL_HAND_MATERIAL = new MeshStandardMaterial({
  color: "#8A2BE2",
  emissive: "#8A2BE2",
  emissiveIntensity: 1.5,
  transparent: true,
  opacity: 0.8
});
const FIREBALL_HAND_MATERIAL_LEFT = new MeshStandardMaterial({
  color: "#8A2BE2",
  emissive: "#8A2BE2",
  emissiveIntensity: 1.5,
  transparent: true,
  opacity: 0.7
});

const LIGHTNING_CORE_GEOMETRY = new SphereGeometry(0.15, 16, 16);
const LIGHTNING_CORE_MATERIAL = new MeshStandardMaterial({
  color: "#00bbff",
  emissive: "#0088ff",
  emissiveIntensity: 2,
  transparent: true,
  opacity: 0.8
});

const LIGHTNING_SPARK_GEOMETRY = new SphereGeometry(0.05, 8, 8);
const LIGHTNING_SPARK_MATERIAL = new MeshBasicMaterial({
  color: "#B6EAFF",
  transparent: true,
  opacity: 0.7
});

// Define DamageSource interface locally
interface DamageSource {
  type: WeaponType;
  hasActiveAbility?: boolean;
}



export default function SkeletalMage({
  id,
  initialPosition,
  position,
  health,
  maxHealth,
  onTakeDamage,
  onPositionUpdate,
  playerPosition,
  allPlayers,
  summonedUnits = [],
  onAttackPlayer,
  weaponType,
  isFrozen = false,
  isStunned = false,
  isSlowed = false,
  level = 1,
  playerStunRef,
  getCurrentPlayerPosition,
}: SkeletalMageProps & Pick<Enemy, 'position'>) {
  const enemyRef = useRef<Group>(null);
  const [showDeathEffect, setShowDeathEffect] = useState(false);
  const [isDead, setIsDead] = useState(false);
  const [isSpawning, setIsSpawning] = useState(true);
  const [isMoving, setIsMoving] = useState(false);
  const [isCastingFireball, setIsCastingFireball] = useState(false);
  const [isCastingLightning, setIsCastingLightning] = useState(false);
  const lastFireballTime = useRef<number>(Date.now() + 2000);
  const lastLightningTime = useRef<number>(Date.now() + 2000);
  const [activeFireballs, setActiveFireballs] = useState<Array<{
    id: number;
    position: Vector3;
    target: Vector3;
    playerPosition: Vector3;
    startTime: number;
  }>>([]);
  const [activeLightningWarnings, setActiveLightningWarnings] = useState<Array<{
    id: number;
    position: Vector3;
    startTime: number;
  }>>([]);
  const [activeLightningStrikes, setActiveLightningStrikes] = useState<Array<{
    id: number;
    position: Vector3;
    startTime: number;
    onDamageCheck?: () => void;
  }>>([]);
  
  // Add to existing state declarations
  const [activeEffects, setActiveEffects] = useState<Array<{
    id: number;
    type: string;
    position: Vector3;
    direction: Vector3;
    duration: number;
    startTime: number;
  }>>([]);
  
  // Use refs for position tracking
  const currentPosition = useRef(initialPosition.clone());
  const targetPosition = useRef(initialPosition.clone());
  const lastUpdateTime = useRef(Date.now());
  const currentHealth = useRef(health);
  
  // Store the latest player position in a ref for damage calculations
  const latestPlayerPosition = useRef(playerPosition?.clone() || currentPosition.current);
  const latestAllPlayers = useRef(allPlayers);

  // Reusable Vector3 objects to prevent massive memory leaks (CRITICAL for performance)
  const tempVector1 = useRef(new Vector3());
  const tempVector2 = useRef(new Vector3());
  const tempVector3 = useRef(new Vector3());
  
  // Track timeouts for cleanup
  const activeTimeouts = useRef<Set<NodeJS.Timeout>>(new Set());

  // Get the target using aggro system (can be player or summoned unit)
  const getTargetPlayer = useCallback((): TargetInfo | null => {
    // Initialize enemy in aggro system
    globalAggroSystem.initializeEnemy(id);
    
    // Convert allPlayers to PlayerInfo format if needed
    const playersInfo: PlayerInfo[] = allPlayers || (playerPosition ? [{
      id: 'local-player',
      position: playerPosition,
      name: 'Player'
    }] : []);
    
    if (playersInfo.length === 0 && summonedUnits.length === 0) return null;
    
    // Get highest aggro target (including summoned units)
    return globalAggroSystem.getHighestAggroTarget(id, currentPosition.current, playersInfo, summonedUnits);
  }, [allPlayers, playerPosition, summonedUnits, id]);

  // Get the target player position (using aggro system)
  const getTargetPlayerPosition = useCallback(() => {
    const targetPlayer = getTargetPlayer();
    return targetPlayer?.position || currentPosition.current;
  }, [getTargetPlayer]);

  // Get the LATEST player position using refs (for damage calculations)
  const getLatestPlayerPosition = useCallback(() => {
    // For damage calculations, we want the most current position
    // First try to use the latest player position from props/refs
    if (latestPlayerPosition.current) {
      return latestPlayerPosition.current.clone();
    }
    
    // Fallback to aggro-based targeting if no direct player position
    const targetPlayer = getTargetPlayer();
    return targetPlayer?.position || currentPosition.current;
  }, [getTargetPlayer]);

  const ATTACK_RANGE = 20;
  const BASE_MOVEMENT_SPEED = 2.25; // Consistent base speed like other enemies
  const POSITION_UPDATE_THRESHOLD = 0.1;
  const MINIMUM_UPDATE_INTERVAL = 15;
  const SEPARATION_RADIUS = 1.25;
  const SEPARATION_FORCE = 0.1; // Reduced for smoother movement
  const FIREBALL_COOLDOWN = 7000;
  const FIREBALL_DAMAGE = 22;
  const LIGHTNING_COOLDOWN = 8000;
  const LIGHTNING_DAMAGE = 40;
  const LIGHTNING_WARNING_DURATION = 2.0; // 2 seconds warning
  const LIGHTNING_DAMAGE_RADIUS = 2.0;
  const MOVEMENT_SMOOTHING = 0.85; // Smoothing factor for movement
  const ROTATION_SPEED = 4.0;

  // Add these constants near the other ones (after line 89)
  const WANDER_DURATION = 4500;
  const WANDER_RADIUS = 5; // Slightly smaller for the mage
  const WANDER_ROTATION_SPEED = 4.0;

  // Add these refs near the other refs
  const wanderTarget = useRef<Vector3 | null>(null);
  const wanderStartTime = useRef<number>(Date.now());

  // Sync health changes
  useEffect(() => {
    currentHealth.current = health;
  }, [health]);

  // Sync player position changes to ref for fresh damage calculations
  useEffect(() => {
    if (playerPosition) {
      latestPlayerPosition.current = playerPosition.clone();
    }
  }, [playerPosition]);

  // Sync allPlayers changes to ref for fresh damage calculations in multiplayer
  useEffect(() => {
    latestAllPlayers.current = allPlayers;
  }, [allPlayers]);

  // Handle damage with proper synchronization
  const handleDamage = useCallback((damage: number, source: DamageSource) => {
    if (currentHealth.current <= 0) return;
    
    const newHealth = Math.max(0, currentHealth.current - damage);
    onTakeDamage(`enemy-${id}`, damage);
    
    // Add stealth strike effect
    if (source.type && stealthManager.hasShadowStrikeBuff()) {
      const targetPlayerPos = getTargetPlayerPosition();
      const effectDirection = new Vector3().subVectors(
        currentPosition.current,
        targetPlayerPos
      ).normalize();
      
      setActiveEffects(prev => [...prev, {
        id: Date.now(),
        type: 'stealthStrike',
        position: currentPosition.current.clone(),
        direction: effectDirection,
        duration: 0.2,
        startTime: Date.now()
      }]);
    }
    
    if (newHealth === 0 && currentHealth.current > 0) {
      setIsDead(true);
      setShowDeathEffect(true);
    }
  }, [id, onTakeDamage, getTargetPlayerPosition]);

  // Improved position synchronization - prevent teleporting
  useEffect(() => {
    // Only sync position during initial spawn or when distance is reasonable
    if (position && !currentPosition.current.equals(position)) {
      const distance = currentPosition.current.distanceTo(position);
      
      // Only allow position sync if the distance is reasonable (prevents teleporting)
      if (distance < 5.0) { // Allow small corrections only
        targetPosition.current.copy(position);
        targetPosition.current.y = 0;
        // For SkeletalMage, also update current position if it's far off
        if (distance > 2.0) {
          currentPosition.current.copy(position);
          currentPosition.current.y = 0;
        }
      }
    }
  }, [position]);

  // Cast fireball with telegraph
  const castFireball = useCallback(() => {
    if (!isCastingFireball && !isDead) {
      setIsCastingFireball(true);
      
      // Telegraph animation for 1 second before launching fireball
      const currentTimeouts = activeTimeouts.current; // Capture current ref value
      const launchTimeout = setTimeout(() => {
        currentTimeouts.delete(launchTimeout);
        if (enemyRef.current) {
          const startPos = currentPosition.current.clone();
          startPos.y += 2.25; // Adjust height to match mage's casting position

          // Get the CURRENT player position at the exact moment of launch
          const currentTargetPos = getLatestPlayerPosition();
          // Set target height to match player's center mass
          const adjustedTargetPos = currentTargetPos.clone();
          adjustedTargetPos.y = 1.5; // Player's approximate center height


          setActiveFireballs(prev => [...prev, {
            id: Date.now(),
            position: startPos,
            target: adjustedTargetPos,
            playerPosition: currentTargetPos.clone(),
            startTime: Date.now(),
          }]);
        }

        // Reset casting state after fireball is launched
        const resetTimeout = setTimeout(() => {
          currentTimeouts.delete(resetTimeout);
          setIsCastingFireball(false);
        }, 500);
        currentTimeouts.add(resetTimeout);
      }, 1000);
      currentTimeouts.add(launchTimeout);
    }
  }, [isCastingFireball, isDead, getLatestPlayerPosition]);

  // Cast lightning strike with warning
  const castLightningStrike = useCallback(() => {
    if (!isCastingLightning && !isDead) {
      setIsCastingLightning(true);
      
      // Get target player position for the lightning strike
      const targetPlayerPos = getTargetPlayerPosition();
      const strikePosition = targetPlayerPos.clone();
      strikePosition.y = 0; // Strike the ground
      
      // Create warning indicator
      const warningId = Date.now();
      setActiveLightningWarnings(prev => [...prev, {
        id: warningId,
        position: strikePosition,
        startTime: Date.now()
      }]);
      
      // After warning duration, execute lightning strike
      const currentTimeouts = activeTimeouts.current; // Capture current ref value
      const strikeTimeout = setTimeout(() => {
        currentTimeouts.delete(strikeTimeout);
        // Remove warning
        setActiveLightningWarnings(prev => prev.filter(w => w.id !== warningId));

        // Capture the player position at the moment the warning ends (for comparison)
        let warningEndPlayerPos: Vector3;
        if (getCurrentPlayerPosition) {
          // Use the real-time position function if available
          warningEndPlayerPos = getCurrentPlayerPosition().clone();
        } else if (allPlayers && allPlayers.length > 0) {
          warningEndPlayerPos = allPlayers[0].position.clone();
        } else if (playerPosition) {
          warningEndPlayerPos = playerPosition.clone();
        } else {
          warningEndPlayerPos = getLatestPlayerPosition();
        }
        warningEndPlayerPos.y = 0;


        // Create lightning strike effect with damage check callback
        const strikeId = Date.now();
        let damageProcessed = false; // Prevent multiple damage/stun applications from same strike

        setActiveLightningStrikes(prev => [...prev, {
          id: strikeId,
          position: strikePosition,
          startTime: Date.now(),
          onDamageCheck: () => {
            // Prevent multiple calls to damage check for the same strike
            if (damageProcessed) {
              console.log(`[Lightning Strike] Damage already processed for strike ${strikeId}, skipping`);
              return;
            }
            damageProcessed = true;
            // Get the player position at the exact moment of impact (50ms after strike starts)
            let impactPlayerPos: Vector3;

            // Try multiple sources for the most current position, prioritizing real-time function
            if (getCurrentPlayerPosition) {
              // Use the real-time position function if available (most accurate)
              impactPlayerPos = getCurrentPlayerPosition().clone();
            } else if (allPlayers && allPlayers.length > 0) {
              // Multiplayer: use the first player's position (should be most current)
              impactPlayerPos = allPlayers[0].position.clone();
            } else if (playerPosition) {
              // Single player: use the current playerPosition prop
              impactPlayerPos = playerPosition.clone();
            } else {
              // Fallback to the ref
              impactPlayerPos = getLatestPlayerPosition();
            }

            impactPlayerPos.y = 0; // Compare ground positions
            const distance = strikePosition.distanceTo(impactPlayerPos);

            if (distance <= LIGHTNING_DAMAGE_RADIUS) {

              onAttackPlayer(LIGHTNING_DAMAGE);
              globalAggroSystem.addDamageAggro(id, 'local-player', LIGHTNING_DAMAGE, 'player');

              // Trigger player stun effect (2 seconds) - only if still in range
              if (playerStunRef?.current) {
                playerStunRef.current.triggerStun(2000);
              }
            }
          }
        }]);

        // Reset casting state
        const resetTimeout = setTimeout(() => {
          currentTimeouts.delete(resetTimeout);
          setIsCastingLightning(false);
        }, 500);
        currentTimeouts.add(resetTimeout);
      }, LIGHTNING_WARNING_DURATION * 1000);
      currentTimeouts.add(strikeTimeout);
    }
  }, [playerStunRef, isCastingLightning, isDead, getTargetPlayerPosition, getLatestPlayerPosition, onAttackPlayer, id, allPlayers, playerPosition, getCurrentPlayerPosition]);

  // MEMORY FIX: Reusable vector for wander target
  const tempWanderTarget = useRef(new Vector3());
  
  // Add the getNewWanderTarget function after the constants
  const getNewWanderTarget = useCallback(() => {
    if (!enemyRef.current) return null;
    
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * WANDER_RADIUS;
    
    // MEMORY FIX: Reuse tempWanderTarget instead of creating new Vector3
    tempWanderTarget.current.set(
      currentPosition.current.x + Math.cos(angle) * distance,
      0,
      currentPosition.current.z + Math.sin(angle) * distance
    );
    
    return tempWanderTarget.current.clone();
  }, []);

  // Update frame logic
  useFrame((_, delta) => {
    if (!enemyRef.current || currentHealth.current <= 0 || isFrozen || isStunned) {
      setIsMoving(false);
      setIsCastingFireball(false);
      return;
    }

    // Get the target player position
    const targetPlayerPosition = getTargetPlayerPosition();

    // Add stealth check
    if (stealthManager.isUnitStealthed()) {
      setIsMoving(false);
      setIsCastingFireball(false);
      
      const now = Date.now();
      if (!wanderTarget.current || now - wanderStartTime.current > WANDER_DURATION) {
        if (!wanderTarget.current) {
          wanderTarget.current = getNewWanderTarget();
        } else {
          // MEMORY FIX: Reuse tempVector1 for direction calculation instead of creating new Vector3
          tempVector1.current
            .subVectors(wanderTarget.current, currentPosition.current)
            .normalize();
          
          // MEMORY FIX: Reuse tempWanderTarget for new target instead of creating new Vector3
          tempWanderTarget.current
            .copy(currentPosition.current)
            .add(tempVector1.current.multiplyScalar(WANDER_RADIUS));
          
          wanderTarget.current = tempWanderTarget.current.clone();
        }
        wanderStartTime.current = now;
      }
      
      if (wanderTarget.current) {
        setIsMoving(true);
        
        // Use consistent speed calculation like player movement
        const baseWanderSpeed = BASE_MOVEMENT_SPEED * 0.3; // 30% of normal speed for wandering
        const normalizedSpeed = isSlowed ? baseWanderSpeed * 0.5 : baseWanderSpeed;
        const frameSpeed = normalizedSpeed * delta;
        
        // Calculate direction to wander target (reuse tempVector1)
        tempVector1.current.subVectors(wanderTarget.current, currentPosition.current).normalize();
        
        // Apply direct movement like player (reuse tempVector2)
        tempVector2.current.copy(tempVector1.current).multiplyScalar(frameSpeed);
        tempVector3.current.copy(currentPosition.current).add(tempVector2.current);
        
        // Simple interpolation for smoothness
        currentPosition.current.lerp(tempVector3.current, MOVEMENT_SMOOTHING);
        currentPosition.current.y = 0;
        enemyRef.current.position.copy(currentPosition.current);
        
        const targetRotation = Math.atan2(tempVector1.current.x, tempVector1.current.z);
        const currentRotationY = enemyRef.current.rotation.y;
        let rotationDiff = targetRotation - currentRotationY;
        
        while (rotationDiff > Math.PI) rotationDiff -= Math.PI * 2;
        while (rotationDiff < -Math.PI) rotationDiff += Math.PI * 2;
        
        enemyRef.current.rotation.y += rotationDiff * Math.min(1, WANDER_ROTATION_SPEED * delta);
      }
      
      return;
    }

    const distanceToPlayer = currentPosition.current.distanceTo(targetPlayerPosition);

    if (distanceToPlayer > ATTACK_RANGE && currentHealth.current > 0) {
      setIsMoving(true);

      // Use consistent speed calculation like player movement
      const baseSpeed = isSlowed ? BASE_MOVEMENT_SPEED * 0.5 : BASE_MOVEMENT_SPEED;
      const frameSpeed = baseSpeed * delta;

      // Calculate direction to player (reuse tempVector1)
      tempVector1.current.subVectors(targetPlayerPosition, currentPosition.current).normalize();

      // Calculate separation force (reuse tempVector2)
      tempVector2.current.set(0, 0, 0);
      const otherEnemies = enemyRef.current.parent?.children
        .filter(child => 
          child !== enemyRef.current && 
          child.position && 
          child.position.distanceTo(currentPosition.current) < SEPARATION_RADIUS
        ) || [];

      if (otherEnemies.length > 0) {
        otherEnemies.forEach(enemy => {
          // Use tempVector3 for diff calculation
          tempVector3.current.subVectors(currentPosition.current, enemy.position)
            .normalize()
            .multiplyScalar(SEPARATION_FORCE);
          tempVector2.current.add(tempVector3.current);
        });
        tempVector2.current.normalize().multiplyScalar(0.3); // Limit separation influence
      }

      // Combine direction and separation (reuse tempVector1)
      tempVector1.current.add(tempVector2.current).normalize();
      tempVector1.current.y = 0;

      // Apply direct movement calculation (reuse tempVector2 for movement)
      tempVector2.current.copy(tempVector1.current).multiplyScalar(frameSpeed);
      tempVector3.current.copy(currentPosition.current).add(tempVector2.current);
      
      // Simple smoothing for natural movement
      currentPosition.current.lerp(tempVector3.current, MOVEMENT_SMOOTHING);
      currentPosition.current.y = 0;

      // Apply position to mesh
      enemyRef.current.position.copy(currentPosition.current);

      // Smooth rotation
      const targetRotation = Math.atan2(
        targetPlayerPosition.x - currentPosition.current.x,
        targetPlayerPosition.z - currentPosition.current.z
      );

      // Interpolate rotation
      const currentRotationY = enemyRef.current.rotation.y;
      let rotationDiff = targetRotation - currentRotationY;
      while (rotationDiff > Math.PI) rotationDiff -= Math.PI * 2;
      while (rotationDiff < -Math.PI) rotationDiff += Math.PI * 2;
      
      enemyRef.current.rotation.y += rotationDiff * Math.min(1, ROTATION_SPEED * delta);

    } else {
      setIsMoving(false);
      // Simple deceleration - enemies stop when in attack range
      
      // Make sure mage is facing the player when within attack range
      const targetRotation = Math.atan2(
        targetPlayerPosition.x - currentPosition.current.x,
        targetPlayerPosition.z - currentPosition.current.z
      );

      // Interpolate rotation smoothly
      const currentRotationY = enemyRef.current.rotation.y;
      let rotationDiff = targetRotation - currentRotationY;
      while (rotationDiff > Math.PI) rotationDiff -= Math.PI * 2;
      while (rotationDiff < -Math.PI) rotationDiff += Math.PI * 2;
      
      enemyRef.current.rotation.y += rotationDiff * Math.min(1, ROTATION_SPEED * delta);
    }

    // Check if we should cast a spell (50% chance for each at level 2+)
    const currentTime = Date.now();
    const canCastFireball = currentTime - lastFireballTime.current >= FIREBALL_COOLDOWN;
    const canCastLightning = level >= 2 && currentTime - lastLightningTime.current >= LIGHTNING_COOLDOWN;
    
    if (distanceToPlayer <= ATTACK_RANGE && !isFrozen && !isStunned && !isCastingFireball && !isCastingLightning) {
      if (level >= 2) {
        // Level 2+: 50% chance for each spell
        if (canCastFireball && canCastLightning) {
          if (Math.random() < 0.5) {
            castFireball();
            lastFireballTime.current = currentTime;
          } else {
            castLightningStrike();
            lastLightningTime.current = currentTime;
          }
        } else if (canCastFireball) {
          castFireball();
          lastFireballTime.current = currentTime;
        } else if (canCastLightning) {
          castLightningStrike();
          lastLightningTime.current = currentTime;
        }
      } else {
        // Level 1: Only fireball
        if (canCastFireball) {
          castFireball();
          lastFireballTime.current = currentTime;
        }
      }
    }

    // MEMORY FIX: Clean up old fireballs with hard limit (older than 10 seconds OR exceeds limit)
    setActiveFireballs(prev => {
      const filtered = prev.filter(fireball => Date.now() - fireball.startTime < 10000);
      // Hard limit: keep only the most recent 5 fireballs max
      return filtered.length > 5 ? filtered.slice(-5) : filtered;
    });

    // MEMORY FIX: Clean up old lightning strikes with hard limit (older than 3 seconds OR exceeds limit)
    setActiveLightningStrikes(prev => {
      const filtered = prev.filter(strike => Date.now() - strike.startTime < 3000);
      // Hard limit: keep only the most recent 3 lightning strikes max
      return filtered.length > 3 ? filtered.slice(-3) : filtered;
    });
    
    // MEMORY FIX: Clean up old lightning warnings with hard limit
    setActiveLightningWarnings(prev => {
      const filtered = prev.filter(warning => Date.now() - warning.startTime < 3000);
      // Hard limit: keep only the most recent 3 warnings max
      return filtered.length > 3 ? filtered.slice(-3) : filtered;
    });
    
    // MEMORY FIX: Clean up old active effects
    setActiveEffects(prev => {
      const filtered = prev.filter(effect => {
        const age = Date.now() - effect.startTime;
        return age < (effect.duration || 2000);
      });
      // Hard limit: keep only the most recent 5 effects max
      return filtered.length > 5 ? filtered.slice(-5) : filtered;
    });

    // Update position with rate limiting
    const now = Date.now();
    if (now - lastUpdateTime.current >= MINIMUM_UPDATE_INTERVAL) {
      if (currentPosition.current.distanceTo(position) > POSITION_UPDATE_THRESHOLD) {
        onPositionUpdate(id, currentPosition.current.clone());
        lastUpdateTime.current = now;
      }
    }
  });

  useEffect(() => {
    if (health === 0 && !isDead) {
      setIsDead(true);
      setShowDeathEffect(true);
      // Remove from aggro system when enemy dies
      globalAggroSystem.removeEnemy(id);
      
      // MEMORY FIX: Clear all effect arrays immediately on death to prevent memory accumulation
      setActiveFireballs([]);
      setActiveLightningWarnings([]);
      setActiveLightningStrikes([]);
      setActiveEffects([]);
      
      if (enemyRef.current) {
        enemyRef.current.visible = true;
      }
    }
  }, [health, isDead, id]);

  useEffect(() => {
    if (isDead) {
      const currentTimeouts = activeTimeouts.current; // Capture current ref value
      const cleanup = setTimeout(() => {
        currentTimeouts.delete(cleanup);
        setShowDeathEffect(false);
        if (enemyRef.current?.parent) {
          enemyRef.current.parent.remove(enemyRef.current);
        }
      }, 3000);
      currentTimeouts.add(cleanup);
      return () => {
        clearTimeout(cleanup);
        currentTimeouts.delete(cleanup);
      };
    }
  }, [isDead]);

  // Cleanup timeouts on unmount to prevent massive memory leaks
  useEffect(() => {
    // Capture current ref value when effect is created (not in cleanup)
    const currentTimeouts = activeTimeouts.current;

    return () => {
      // Use the captured ref value from when effect was created
      currentTimeouts.forEach(timeout => clearTimeout(timeout));
      currentTimeouts.clear();
      
      // MEMORY FIX: Clear all effect arrays on unmount
      setActiveFireballs([]);
      setActiveLightningWarnings([]);
      setActiveLightningStrikes([]);
      setActiveEffects([]);
      
      console.log(`🧹 SkeletalMage ${id} cleanup: All timeouts and effects cleared`);
    };
  }, [id]);

  // 1. Update position sync to only happen during spawning
  useEffect(() => {
    if (position && isSpawning) {
      currentPosition.current.copy(position);
      currentPosition.current.y = 0;
      targetPosition.current.copy(currentPosition.current);
      if (enemyRef.current) {
        enemyRef.current.position.copy(currentPosition.current);
      }
    }
  }, [position, isSpawning]);

  return (
    <>
      <group 
        ref={enemyRef} 
        visible={!isSpawning && currentHealth.current > 0}
        position={currentPosition.current}
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        <CustomSkeletonMage
          position={[0, 0.735, 0]}
          isAttacking={isCastingFireball || isCastingLightning}
          isWalking={isMoving && currentHealth.current > 0}
          onHit={(damage) => handleDamage(damage, { type: weaponType })}
        />

        {/* Visual telegraph when casting - MEMORY FIX: Use shared geometries */}
        {isCastingFireball && (
          <group position={[0.4, 1.975, 0]}>
            <mesh geometry={FIREBALL_HAND_GEOMETRY} material={FIREBALL_HAND_MATERIAL} />
            <pointLight color="#ff3333" intensity={2} distance={3} />
          </group>
        )}

                {/* Visual telegraph when casting - MEMORY FIX: Use shared geometries */}
                {isCastingFireball && (
          <group position={[-.4, 1.975, -0.05]}>
            <mesh geometry={FIREBALL_HAND_GEOMETRY} material={FIREBALL_HAND_MATERIAL_LEFT} />
            <pointLight color="#ff3333" intensity={2} distance={3} />
          </group>
        )}

        {/* Visual telegraph when casting lightning - MEMORY FIX: Use shared geometries */}
        {isCastingLightning && (
          <group position={[0, 2.65, 0]}>
            <mesh geometry={LIGHTNING_CORE_GEOMETRY} material={LIGHTNING_CORE_MATERIAL} />
            <pointLight color="#80D9FF" intensity={3} distance={4} />
            
            {/* Electric crackling around mage - MEMORY FIX: Use shared geometry and material */}
            {[...Array(6)].map((_, i) => {
              // Clone material for dynamic opacity per spark
              const sparkMaterial = LIGHTNING_SPARK_MATERIAL.clone();
              sparkMaterial.opacity = 0.7 + Math.sin(Date.now() * 0.015 + i) * 0.3;
              
              return (
                <mesh
                  key={i}
                  position={[
                    Math.sin(Date.now() * 0.01 + i) * 0.5,
                    Math.sin(Date.now() * 0.008 + i) * 0.3,
                    Math.cos(Date.now() * 0.01 + i) * 0.5
                  ]}
                  geometry={LIGHTNING_SPARK_GEOMETRY}
                  material={sparkMaterial}
                />
              );
            })}
          </group>
        )}

        <Billboard
          position={[0, 3.5, 0]}
          follow={true}
          lockX={false}
          lockY={false}
          lockZ={false}
        >
          {currentHealth.current > 0 && (
            <>
              {/* MEMORY FIX: Use cached geometries and materials */}
              <mesh 
                position={[0, 0, 0]}
                geometry={HEALTHBAR_GEOMETRIES.background}
                material={HEALTHBAR_MATERIALS.background}
              />
              <mesh 
                position={[-1.0 + (currentHealth.current / maxHealth), 0, 0.001]}
                scale={[(currentHealth.current / maxHealth) * 2.0, 1, 1]}
                geometry={HEALTHBAR_GEOMETRIES.fill}
                material={HEALTHBAR_MATERIALS.fill}
              />
              <Text
                position={[0, 0, 0.002]}
                fontSize={0.2}
                color="#ffffff"
                anchorX="center"
                anchorY="middle"
                fontWeight="bold"
              >
                {`${Math.ceil(currentHealth.current)}/${maxHealth}`}
              </Text>
            </>
          )}
        </Billboard>
      </group>

      {isSpawning && (
        <BoneVortex2 
          position={currentPosition.current}
          onComplete={() => {
            setIsSpawning(false);
          }}
          isSpawning={true}
        />
      )}

      {showDeathEffect && (
        <BoneVortex 
          position={currentPosition.current}
          onComplete={() => {
            setShowDeathEffect(false);
          }}
          isSpawning={false}
          weaponType={weaponType}
          weaponSubclass={undefined}
        />
      )}

      {/* Render active fireballs */}
      {activeFireballs.map(fireball => (
        <MageFireball
          key={fireball.id}
          position={fireball.position}
          target={fireball.target}
          playerPosition={fireball.playerPosition}
          getCurrentPlayerPosition={getLatestPlayerPosition}
          onHit={(didHitPlayer) => {
            
            if (didHitPlayer) {
              onAttackPlayer(FIREBALL_DAMAGE);
              globalAggroSystem.addDamageAggro(id, 'local-player', FIREBALL_DAMAGE, 'player');
            }
            
            // Delay fireball removal to allow explosion animation to complete
            const currentTimeouts = activeTimeouts.current; // Capture current ref value
            const removeTimeout = setTimeout(() => {
              currentTimeouts.delete(removeTimeout);
              setActiveFireballs(prev => 
                prev.filter(f => f.id !== fireball.id)
              );
            }, 50); // Minimal delay to ensure damage is processed
            currentTimeouts.add(removeTimeout);
          }}
        />
      ))}

      {/* Add stealth strike effect */}
      {activeEffects.map(effect => {
        if (effect.type === 'stealthStrike') {
          return (
            <StealthStrikeEffect
              key={effect.id}
              position={effect.position}
              direction={effect.direction}
              onComplete={() => {
                setActiveEffects(prev => prev.filter(e => e.id !== effect.id));
              }}
              parentRef={enemyRef}
            />
          );
        }
        return null;
      })}

      {/* Render lightning warning indicators */}
      {activeLightningWarnings.map(warning => (
        <LightningWarningIndicator
          key={warning.id}
          position={warning.position}
          duration={LIGHTNING_WARNING_DURATION}
          onComplete={() => {
            setActiveLightningWarnings(prev => prev.filter(w => w.id !== warning.id));
          }}
        />
      ))}

      {/* Render lightning strikes */}
      {activeLightningStrikes.map(strike => (
        <MageLightningStrike
          key={strike.id}
          position={strike.position}
          onDamageCheck={strike.onDamageCheck}
          onComplete={() => {
            setActiveLightningStrikes(prev => prev.filter(s => s.id !== strike.id));
          }}
        />
      ))}
    </>
  );
} 