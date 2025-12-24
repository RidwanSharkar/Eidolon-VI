// src/Versus/DeathKnight/DeathKnightUnit.tsx
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Group, Vector3, Frustum, Matrix4, Sphere } from 'three';
import { Billboard, Text } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { HEALTHBAR_GEOMETRIES, HEALTHBAR_MATERIALS } from '@/Versus/HealthBarResources';
import DeathKnightModel from './DeathKnightModel';
import DeathGrasp from './DeathGrasp';
import FrostStrike from './FrostStrike';
import DeathKnightPull from './DeathKnightPull';
import DeathKnightChargingIndicator from './DeathKnightChargingIndicator';
import DeathKnightSlashEffect from './DeathKnightSlashEffect';
import BoneVortex2 from '@/color/SpawnAnimation';
import BoneVortex from '@/color/DeathAnimation';
import { WeaponType } from '@/Weapons/weapons';
import { FrostExplosion } from '@/Spells/Avalanche/FrostExplosion';
import { stealthManager } from '../../Spells/Stealth/StealthManager';
import { globalAggroSystem, PlayerInfo, TargetInfo, isSummonedUnit } from '../AggroSystem';


interface DeathKnightUnitProps {
  id: string;
  initialPosition: Vector3;
  position: Vector3;
  health: number;
  maxHealth: number;
  onTakeDamage: (id: string, damage: number) => void;
  onPositionUpdate: (id: string, position: Vector3, rotation: number) => void;
  playerPosition?: Vector3;
  allPlayers?: Array<{
    position: Vector3;
  }>;
  summonedUnits?: import('../AggroSystem').SummonedUnitInfo[];
  onAttackPlayer: (damage: number) => void;
  onAttackSummonedUnit?: (summonId: string, damage: number) => void;
  weaponType: WeaponType;
  isFrozen?: boolean;
  isStunned?: boolean;
  isSlowed?: boolean;
  knockbackEffect?: { direction: Vector3; distance: number; progress: number; isActive: boolean } | null;
  playerRef?: React.RefObject<Group>; // Add player reference for Death Grasp pull
}

// Define DamageSource interface
interface DamageSource {
  type: WeaponType;
  hasActiveAbility?: boolean;
}



export default function DeathKnightUnit({
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
  onAttackSummonedUnit,
  weaponType,
  isFrozen = false,
  isStunned = false,
  isSlowed = false,
  knockbackEffect = null,
  playerRef
}: DeathKnightUnitProps) {
  const titanRef = useRef<Group>(null);
  const { camera } = useThree();
  const [isVisible, setIsVisible] = useState(true);
  const lastAttackTime = useRef<number>(Date.now() + 3000); // Longer initial delay
  const lastDeathGraspTime = useRef<number>(Date.now() + 5000); // Initial delay for Death Grasp
  const lastFrostStrikeTime = useRef<number>(Date.now() + 2000); // Initial delay for Frost Strike
  const attackDamageRef = useRef<boolean>(false); // Flag to prevent multiple damage calls
  const frostStrikeDamageRef = useRef<boolean>(false); // Flag to prevent multiple frost strike damage calls
  // Consolidated state for better memory management
  const [unitState, setUnitState] = useState({
    isAttacking: false,
    showDeathEffect: false,
    isDead: false,
    isSpawning: true,
    isMoving: false,
    showFrostEffect: false,
    isUsingDeathGrasp: false,
    isUsingFrostStrike: false,
    activePlayerPull: false,
    isCharging: false,
  });

  // Separate state for complex objects to reduce re-renders
  const [activeEffects, setActiveEffects] = useState<{
    deathGrasp: { id: string; startPosition: Vector3; targetPosition: Vector3 } | null;
    frostStrike: { id: string; position: Vector3; direction: Vector3 } | null;
    chargingIndicator: { id: string; position: Vector3; direction: Vector3 } | null;
    slashEffect: { id: string; position: Vector3; direction: Vector3 } | null;
  }>({
    deathGrasp: null,
    frostStrike: null,
    chargingIndicator: null,
    slashEffect: null,
  });
  const chargeStartTime = useRef<number>(0);
  const chargeTargetPosition = useRef<Vector3 | null>(null);
  
  // Use refs for position tracking
  const currentPosition = useRef(initialPosition.clone().setY(0));
  const targetPosition = useRef(initialPosition.clone().setY(0));
  const lastUpdateTime = useRef(Date.now());
  const currentHealth = useRef(health);
  
  const targetRotation = useRef(0);

  // Reusable Vector3 objects to prevent memory leaks
  const tempVector1 = useRef(new Vector3());
  const tempVector2 = useRef(new Vector3());
  const tempVector3 = useRef(new Vector3());
  const tempVector4 = useRef(new Vector3());
  
  // MEMORY FIX: Reusable objects for frustum culling to prevent GC pressure
  const reusableFrustum = useRef(new Frustum());
  const reusableMatrix = useRef(new Matrix4());
  const reusableSphere = useRef(new Sphere());
  
  // Track timeouts for cleanup
  const activeTimeouts = useRef<Set<NodeJS.Timeout>>(new Set());

  // Get the target using aggro system (can be player or summoned unit)
  const getTargetPlayer = useCallback((): TargetInfo | null => {
    // Initialize enemy in aggro system
    globalAggroSystem.initializeEnemy(id);
    
    // Convert allPlayers to PlayerInfo format if needed
    const playersInfo: PlayerInfo[] = allPlayers ? 
      allPlayers.map((player, index) => ({
        id: `player-${index}`,
        position: player.position,
        name: `Player ${index + 1}`
      })) : 
      (playerPosition ? [{
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

  // Death Knight specific constants - optimized for performance
  const ATTACK_RANGE = 3; // Melee attack range
  const ATTACK_COOLDOWN = 2800; // Increased attack cooldown to reduce frequency
  const CHARGE_DURATION = 800; // Reduced charge time for faster attacks
  const DEATH_GRASP_RANGE = 8.0; // Reduced Death Grasp range to limit complexity
  const DEATH_GRASP_COOLDOWN = 15000; // Increased cooldown to reduce frequency
  const FROST_STRIKE_RANGE = 3.25; // Reduced Frost Strike range for simplicity
  const FROST_STRIKE_COOLDOWN = 12000; // Increased cooldown to reduce frequency
  const BASE_MOVEMENT_SPEED = 2.5; // Consistent base speed like other enemies
  const POSITION_UPDATE_THRESHOLD = 0.3;
  const MINIMUM_UPDATE_INTERVAL = 30;
  const ATTACK_DAMAGE = 28; // Basic attack damage (higher than skeleton)
  const FROST_STRIKE_DAMAGE = 36; // Frost Strike damage
  const SEPARATION_RADIUS = 2.5; // Separation distance
  const SEPARATION_FORCE = 0.75; // Reduced for smoother movement
  const MOVEMENT_SMOOTHING = 0.85; // Smoothing factor for movement
  const ROTATION_SPEED = 2.5; // Rotation speed

  // Wandering behavior (slower and more lumbering)
  const wanderTarget = useRef<Vector3 | null>(null);
  const wanderStartTime = useRef<number>(Date.now());
  const WANDER_DURATION = 8000; // Longer wander duration
  const WANDER_RADIUS = 4; // Smaller wander radius (less agile)
  const WANDER_ROTATION_SPEED = 1.0; // Much slower rotation
  
  // MEMORY FIX: Reusable vector for wander target
  const tempWanderTarget = useRef(new Vector3());
  
  const getNewWanderTarget = useCallback(() => {
    if (!titanRef.current) return null;
    
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

  // Sync health changes
  useEffect(() => {
    currentHealth.current = health;
  }, [health]);

  // Handle damage with proper synchronization
  const handleDamage = useCallback((damage: number, source: DamageSource) => {
    if (currentHealth.current <= 0) return;
    
    const newHealth = Math.max(0, currentHealth.current - damage);
    onTakeDamage(`death-knight-${id}`, damage);
    
    if (newHealth === 0 && currentHealth.current > 0) {
      setUnitState(prev => ({ ...prev, isDead: true, showDeathEffect: true }));
    }

    if (source.type === WeaponType.SABRES && source.hasActiveAbility) {
      setUnitState(prev => ({ ...prev, showFrostEffect: true }));
    }
  }, [id, onTakeDamage]);

  // Improved position synchronization - prevent teleporting
  useEffect(() => {
    // Only sync position during initial spawn, not during gameplay
    if (position && unitState.isSpawning && !currentPosition.current.equals(position)) {
      const distance = currentPosition.current.distanceTo(position);
      
      // Only allow position sync if the distance is reasonable (prevents teleporting)
      if (distance < 5.0) { // Allow small corrections only
        currentPosition.current.copy(position);
        currentPosition.current.y = 0; // Force ground level
        targetPosition.current.copy(currentPosition.current);
        if (titanRef.current) {
          titanRef.current.position.copy(currentPosition.current);
        }
      }
    }
  }, [position, unitState.isSpawning]);

  const handleTitanPositionUpdate = useCallback((id: string, newPosition: Vector3) => {
    if (titanRef.current) {
      onPositionUpdate(id, newPosition.clone(), titanRef.current.rotation.y);
    }
  }, [onPositionUpdate]);

  // Death Grasp ability handlers
  const handleDeathGraspStart = useCallback(() => {
    const targetPlayerPosition = getTargetPlayerPosition();
    if (!targetPlayerPosition || !titanRef.current) return;

    // Calculate hand position for Death Grasp origin
    const handPosition = new Vector3(
      currentPosition.current.x + 0.8, // Right hand offset
      currentPosition.current.y + 2.5, // Height of raised hand
      currentPosition.current.z + 0.3
    );

    setActiveEffects(prev => ({
      ...prev,
      deathGrasp: {
        id: `death-grasp-${Date.now()}`,
        startPosition: handPosition,
        targetPosition: targetPlayerPosition.clone()
      }
    }));
  }, [getTargetPlayerPosition]);

  const handleDeathGraspPullStart = useCallback(() => {
    // Start the player pull effect
    setUnitState(prev => ({ ...prev, activePlayerPull: true }));
  }, []);

  const handleDeathGraspComplete = useCallback(() => {
    setActiveEffects(prev => ({ ...prev, deathGrasp: null }));
    setUnitState(prev => ({ ...prev, isUsingDeathGrasp: false, activePlayerPull: false }));
  }, []);

  // Frost Strike ability handlers
  const handleFrostStrikeStart = useCallback(() => {
    const targetPlayerPosition = getTargetPlayerPosition();
    if (!targetPlayerPosition || !titanRef.current) return;

    // Reset damage flag for new frost strike
    frostStrikeDamageRef.current = false;

    // Calculate direction to player for frost strike
    const direction = targetPlayerPosition.clone()
      .sub(currentPosition.current)
      .normalize();

    const spellPosition = currentPosition.current.clone();
    spellPosition.y += 1; // Slightly elevated

    setActiveEffects(prev => ({
      ...prev,
      frostStrike: {
        id: `frost-strike-${Date.now()}`,
        position: spellPosition,
        direction: direction
      }
    }));

    // Deal damage after a short delay (spell travel time) - only once per frost strike
    const currentTimeouts = activeTimeouts.current; // Capture current ref value
    const frostDamageTimeout = setTimeout(() => {
      currentTimeouts.delete(frostDamageTimeout);
      if (!frostStrikeDamageRef.current && currentHealth.current > 0) {
        frostStrikeDamageRef.current = true;
        onAttackPlayer(FROST_STRIKE_DAMAGE);
      }
    }, 300);
    currentTimeouts.add(frostDamageTimeout);
  }, [getTargetPlayerPosition, onAttackPlayer]);

  const handleFrostStrikeComplete = useCallback(() => {
    setActiveEffects(prev => ({ ...prev, frostStrike: null }));
    setUnitState(prev => ({ ...prev, isUsingFrostStrike: false }));
  }, []);

  useFrame((_, delta) => {
    if (!titanRef.current || currentHealth.current <= 0 || isFrozen || isStunned) {
      setUnitState(prev => ({ ...prev, isMoving: false, isAttacking: false }));
      return;
    }

    // MEMORY FIX: Enhanced frustum culling - reuse objects instead of creating new each frame
    reusableMatrix.current.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
    reusableFrustum.current.setFromProjectionMatrix(reusableMatrix.current);

    reusableSphere.current.center.set(
      currentPosition.current.x,
      currentPosition.current.y + 1.5,
      currentPosition.current.z
    );
    reusableSphere.current.radius = 3; // Bounding sphere radius for DeathKnight

    const isInFrustum = reusableFrustum.current.intersectsSphere(reusableSphere.current);

    // More aggressive culling: only update visibility state when it actually changes
    if (isInFrustum !== isVisible) {
      setIsVisible(isInFrustum);
    }

    // Skip all expensive operations if not visible and not in transition
    if (!isInFrustum && !isVisible) {
      return; // Skip all expensive operations if not visible
    }

    // Additional optimization: reduce update frequency when not visible
    if (!isInFrustum && isVisible) {
      // Still allow some processing for smooth transitions but at reduced frequency
      // This helps prevent stuttering when DeathKnight comes back into view
    }

    const targetPlayerPosition = getTargetPlayerPosition();
    if (!targetPlayerPosition) {
      setUnitState(prev => ({ ...prev, isMoving: false }));
      return;
    }

    const distanceToPlayer = currentPosition.current.distanceTo(targetPlayerPosition);

    // Check if player is stealthed - lumbering wandering behavior
    if (stealthManager.isUnitStealthed()) {
      setUnitState(prev => ({ ...prev, isAttacking: false }));
      
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
        setUnitState(prev => ({ ...prev, isMoving: true }));
        
        // Use consistent speed calculation like player movement  
        const baseWanderSpeed = BASE_MOVEMENT_SPEED * 0.2; // 20% of normal speed for slow wandering
        const normalizedSpeed = isSlowed ? baseWanderSpeed * 0.5 : baseWanderSpeed;
        const frameSpeed = normalizedSpeed * delta;
        
        // Calculate direction to wander target (reuse tempVector1)
        tempVector1.current.subVectors(wanderTarget.current, currentPosition.current).normalize();
        
        // Apply direct movement like player (reuse tempVector2)
        tempVector2.current.copy(tempVector1.current).multiplyScalar(frameSpeed);
        tempVector3.current.copy(currentPosition.current).add(tempVector2.current);
        
        // Apply knockback effect if active
        if (knockbackEffect && knockbackEffect.isActive) {
          const knockbackDistance = knockbackEffect.distance * (1 - knockbackEffect.progress);
          tempVector4.current.copy(knockbackEffect.direction).multiplyScalar(knockbackDistance * delta * 10);
          tempVector3.current.add(tempVector4.current);
        }
        
        // Simple interpolation for smoothness
        currentPosition.current.lerp(tempVector3.current, MOVEMENT_SMOOTHING);
        currentPosition.current.y = 0;
        titanRef.current.position.copy(currentPosition.current);
        
        // Very slow rotation for lumbering effect
        const targetRotation = Math.atan2(tempVector1.current.x, tempVector1.current.z);
        const currentRotationY = titanRef.current.rotation.y;
        let rotationDiff = targetRotation - currentRotationY;
        
        while (rotationDiff > Math.PI) rotationDiff -= Math.PI * 2;
        while (rotationDiff < -Math.PI) rotationDiff += Math.PI * 2;
        
        titanRef.current.rotation.y += rotationDiff * Math.min(1, WANDER_ROTATION_SPEED * delta);
      }
      
      return;
    }

    // Normal movement and attack behavior - stop moving when charging
    if (distanceToPlayer > ATTACK_RANGE && currentHealth.current > 0 && !unitState.isCharging) {
      setUnitState(prev => ({ ...prev, isAttacking: false, isMoving: true }));

      // Use consistent speed calculation like player movement
      const baseSpeed = isSlowed ? BASE_MOVEMENT_SPEED * 0.5 : BASE_MOVEMENT_SPEED;
      const frameSpeed = baseSpeed * delta;

      // Calculate direction to target player (reuse tempVector1)
      tempVector1.current.subVectors(targetPlayerPosition, currentPosition.current).normalize();

      // Calculate separation force (reuse tempVector2)
      tempVector2.current.set(0, 0, 0);
      const otherEnemies = titanRef.current.parent?.children
        .filter(child => 
          child !== titanRef.current && 
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

      // Apply direct movement calculation (reuse tempVector3 for movement)
      tempVector3.current.copy(tempVector1.current).multiplyScalar(frameSpeed);
      tempVector4.current.copy(currentPosition.current).add(tempVector3.current);
      
      // Apply knockback effect if active
      if (knockbackEffect && knockbackEffect.isActive) {
        const knockbackDistance = knockbackEffect.distance * (1 - knockbackEffect.progress);
        tempVector2.current.copy(knockbackEffect.direction).multiplyScalar(knockbackDistance * delta * 10);
        tempVector4.current.add(tempVector2.current);
      }
      
      // Simple smoothing for natural movement
      currentPosition.current.lerp(tempVector4.current, MOVEMENT_SMOOTHING);
      currentPosition.current.y = 0;

      // Apply position to mesh
      titanRef.current.position.copy(currentPosition.current);

      // Slow, deliberate rotation
      targetRotation.current = Math.atan2(
        targetPlayerPosition.x - currentPosition.current.x,
        targetPlayerPosition.z - currentPosition.current.z
      );

      const currentRotationY = titanRef.current.rotation.y;
      let rotationDiff = targetRotation.current - currentRotationY;
      while (rotationDiff > Math.PI) rotationDiff -= Math.PI * 2;
      while (rotationDiff < -Math.PI) rotationDiff += Math.PI * 2;
      
      titanRef.current.rotation.y += rotationDiff * Math.min(1, ROTATION_SPEED * delta);

    } else {
      // Stop moving when in attack range or when charging
      setUnitState(prev => ({ ...prev, isMoving: false }));
    }

    // Attack logic with charging - more powerful and slower
    // Performance optimization: Limit simultaneous effects
    const activeEffectCount = Object.values(activeEffects).filter(effect => effect !== null).length;

    // Enhanced DeathKnight effect monitoring
    if (process.env.NODE_ENV === 'development' && activeEffectCount > 1) {
      console.log(`⚠️ DeathKnight ${id} has ${activeEffectCount} active effects`);
    }

    if (distanceToPlayer <= ATTACK_RANGE &&
        currentHealth.current > 0 &&
        !isFrozen &&
        !isStunned &&
        !unitState.isUsingDeathGrasp &&
        !unitState.isUsingFrostStrike &&
        activeEffectCount < 2) { // Limit to 2 simultaneous effects max
      const currentTime = Date.now();

      if (!unitState.isCharging && !unitState.isAttacking && currentTime - lastAttackTime.current >= ATTACK_COOLDOWN) {
        // Start charging - stop moving during charge
        setUnitState(prev => ({ ...prev, isCharging: true, isMoving: false }));
        chargeStartTime.current = currentTime;
        chargeTargetPosition.current = targetPlayerPosition.clone();
        lastAttackTime.current = currentTime;
        
        // Calculate attack direction
        const attackDirection = new Vector3()
          .subVectors(targetPlayerPosition, currentPosition.current)
          .normalize();
        
        // Show charging indicator
        setActiveEffects(prev => ({
          ...prev,
          chargingIndicator: {
            id: `charging-${currentTime}`,
            position: currentPosition.current.clone(),
            direction: attackDirection
          }
        }));
      }
    }
    
    // Handle charging completion
    if (unitState.isCharging && !unitState.isAttacking) {
      const chargeElapsed = Date.now() - chargeStartTime.current;
      if (chargeElapsed >= CHARGE_DURATION) {
        // Charging complete, start attack animation
        setUnitState(prev => ({ ...prev, isCharging: false }));
        setActiveEffects(prev => ({ ...prev, chargingIndicator: null }));
        setUnitState(prev => ({ ...prev, isAttacking: true }));
        
        // Reset damage flag for new attack
        attackDamageRef.current = false;
        
        // Store the initial attack position and target
        const attackStartPosition = currentPosition.current.clone();
        const chargedTargetPos = chargeTargetPosition.current;
        
        // Show slash effect
        if (chargedTargetPos) {
          const slashDirection = new Vector3()
            .subVectors(chargedTargetPos, attackStartPosition)
            .normalize();
          
          setActiveEffects(prev => ({
            ...prev,
            slashEffect: {
              id: `slash-${Date.now()}`,
              position: attackStartPosition.clone().add(new Vector3(0, 1, 0)), // Slightly elevated
              direction: slashDirection
            }
          }));
        }
        
        // Deal damage after attack animation starts
        const currentTimeouts = activeTimeouts.current; // Capture current ref value
        const damageTimeout = setTimeout(() => {
          currentTimeouts.delete(damageTimeout);
          if (!attackDamageRef.current && currentHealth.current > 0 && chargedTargetPos) {
            attackDamageRef.current = true;

            // Check if targets are in the attack area (cone in front of Death Knight)
            tempVector1.current.subVectors(chargedTargetPos, attackStartPosition).normalize();

            // Check all potential targets for area damage
            const playersInfo: PlayerInfo[] = allPlayers ?
              allPlayers.map((player, index) => ({
                id: `player-${index}`,
                position: player.position,
                name: `Player ${index + 1}`
              })) :
              (playerPosition ? [{
                id: 'local-player',
                position: playerPosition,
                name: 'Player'
              }] : []);

            const allTargets = [...playersInfo, ...summonedUnits];
            const attackAngle = Math.PI * 0.7; // 70 degree cone (wider than skeleton)

            allTargets.forEach(target => {
              tempVector2.current.subVectors(target.position, currentPosition.current).normalize();

              const distanceToTarget = currentPosition.current.distanceTo(target.position);
              const angleToTarget = tempVector1.current.angleTo(tempVector2.current);

              // Check if target is within attack cone and range
              if (distanceToTarget <= ATTACK_RANGE && angleToTarget <= attackAngle / 2) {
                if (isSummonedUnit(target)) {
                  globalAggroSystem.addDamageAggro(id, target.id, ATTACK_DAMAGE, 'summoned');
                  if (onAttackSummonedUnit) {
                    onAttackSummonedUnit(target.id, ATTACK_DAMAGE);
                  }
                } else {
                  onAttackPlayer(ATTACK_DAMAGE);
                  globalAggroSystem.addDamageAggro(id, target.id, ATTACK_DAMAGE, 'player');
                }
              }
            });
          }
        }, 800);
        currentTimeouts.add(damageTimeout);

        // Reset attack state and resume movement
        const attackResetTimeout = setTimeout(() => {
          currentTimeouts.delete(attackResetTimeout);
          setUnitState(prev => ({ ...prev, isAttacking: false }));
          chargeTargetPosition.current = null;
          // Resume movement after attack completes
          if (currentHealth.current > 0) {
            const currentTarget = getTargetPlayer();
            if (currentTarget) {
              const distanceToTarget = currentPosition.current.distanceTo(currentTarget.position);
              if (distanceToTarget > ATTACK_RANGE) {
                setUnitState(prev => ({ ...prev, isMoving: true }));
              }
            }
          }
        }, 1500);
        currentTimeouts.add(attackResetTimeout);
      }
    }

    // Death Grasp ability logic - long range pull
    if (distanceToPlayer <= DEATH_GRASP_RANGE &&
        distanceToPlayer > FROST_STRIKE_RANGE &&
        currentHealth.current > 0 &&
        !isFrozen &&
        !isStunned &&
        !unitState.isUsingDeathGrasp &&
        !unitState.isUsingFrostStrike &&
        !unitState.isAttacking &&
        activeEffectCount < 2) { // Performance optimization: limit simultaneous effects
      const currentTime = Date.now();
      if (currentTime - lastDeathGraspTime.current >= DEATH_GRASP_COOLDOWN) {
        setUnitState(prev => ({ ...prev, isUsingDeathGrasp: true }));
        lastDeathGraspTime.current = currentTime;

        // Reset ability state after shorter duration
        const currentTimeouts = activeTimeouts.current; // Capture current ref value
        const deathGraspTimeout = setTimeout(() => {
          currentTimeouts.delete(deathGraspTimeout);
          if (!activeEffects.deathGrasp) {
            setUnitState(prev => ({ ...prev, isUsingDeathGrasp: false }));
          }
        }, 1500);
        currentTimeouts.add(deathGraspTimeout);
      }
    }

    // Frost Strike ability logic - prioritize when in close range
    if (distanceToPlayer <= FROST_STRIKE_RANGE &&
        currentHealth.current > 0 &&
        !isFrozen &&
        !isStunned &&
        !unitState.isUsingDeathGrasp &&
        !unitState.isUsingFrostStrike &&
        !unitState.isAttacking &&
        activeEffectCount < 2) { // Performance optimization: limit simultaneous effects
      const currentTime = Date.now();
      if (currentTime - lastFrostStrikeTime.current >= FROST_STRIKE_COOLDOWN) {
        setUnitState(prev => ({ ...prev, isUsingFrostStrike: true }));
        lastFrostStrikeTime.current = currentTime;

        // Reset ability state after shorter duration
        const currentTimeouts = activeTimeouts.current; // Capture current ref value
        const frostStrikeTimeout = setTimeout(() => {
          currentTimeouts.delete(frostStrikeTimeout);
          if (!activeEffects.frostStrike) {
            setUnitState(prev => ({ ...prev, isUsingFrostStrike: false }));
          }
        }, 1000);
        currentTimeouts.add(frostStrikeTimeout);
      }
    }

    // Update position with rate limiting
    const now = Date.now();
    if (now - lastUpdateTime.current >= MINIMUM_UPDATE_INTERVAL) {
      if (currentPosition.current.distanceTo(position) > POSITION_UPDATE_THRESHOLD) {
        handleTitanPositionUpdate(id, currentPosition.current.clone());
        lastUpdateTime.current = now;
      }
    }

    // safety cleanup - check every 2 seconds for stuck effects
    const ultraFastCleanupInterval = 2000; // 2 seconds
    if (now % ultraFastCleanupInterval < 100) { // Check roughly every 2 seconds
      const stuckEffects = Object.entries(activeEffects).filter(([, effect]) => {
        if (!effect) return false;
        // Consider effects stuck if they've been active for more than 3 seconds
        return true; // Simplified - in real implementation, track creation time
      });

      if (stuckEffects.length > 0) {
        console.warn(`🚨 DeathKnight ${id} has ${stuckEffects.length} stuck effects, forcing cleanup`);
        setActiveEffects({
          deathGrasp: null,
          frostStrike: null,
          chargingIndicator: null,
          slashEffect: null,
        });
      }
    }
  });

  useEffect(() => {
    if (health === 0 && !unitState.isDead) {
      setUnitState(prev => ({ ...prev, isDead: true, showDeathEffect: true }));
      // Remove from aggro system when enemy dies
      globalAggroSystem.removeEnemy(id);
      
      // MEMORY FIX: Clear all active effects immediately on death to prevent memory accumulation
      setActiveEffects({
        deathGrasp: null,
        frostStrike: null,
        chargingIndicator: null,
        slashEffect: null,
      });
      
      // Reset damage flags
      attackDamageRef.current = false;
      frostStrikeDamageRef.current = false;
      chargeTargetPosition.current = null;
      
      if (titanRef.current) {
        titanRef.current.visible = true;
      }
    }
  }, [health, unitState.isDead, id]);

  useEffect(() => {
    if (unitState.isDead) {
      const cleanup = setTimeout(() => {
        setUnitState(prev => ({ ...prev, showDeathEffect: false }));
        // Remove self from parent - Scene.tsx handles the main cleanup
        if (titanRef.current?.parent) {
          titanRef.current.parent.remove(titanRef.current);
        }
      }, 4000); // Longer death effect
      return () => clearTimeout(cleanup);
    }
  }, [unitState.isDead]);

    // Enhanced cleanup for ability timers and effects with immediate disposal
  useEffect(() => {
    // Capture current ref value when effect is created (not in cleanup)
    const currentTimeouts = activeTimeouts.current;

    return () => {
      // Use the captured ref value from when effect was created
      currentTimeouts.forEach(timeout => clearTimeout(timeout));
      currentTimeouts.clear();

      // Clear all pending timeouts and effects when component unmounts
      setUnitState({
        isAttacking: false,
        showDeathEffect: false,
        isDead: false,
        isSpawning: true,
        isMoving: false,
        showFrostEffect: false,
        isUsingDeathGrasp: false,
        isUsingFrostStrike: false,
        activePlayerPull: false,
        isCharging: false,
      });

      // IMMEDIATE cleanup of all active effects
      setActiveEffects({
        deathGrasp: null,
        frostStrike: null,
        chargingIndicator: null,
        slashEffect: null,
      });

      // Reset all damage flags
      attackDamageRef.current = false;
      frostStrikeDamageRef.current = false;

      // Clear refs that might hold references to effects
      chargeStartTime.current = 0;
      chargeTargetPosition.current = null;
      wanderTarget.current = null;

      console.log(`🚨 CRITICAL: DeathKnight ${id} cleanup completed - ALL effects and timeouts disposed`);
    };
  }, [id]);

  useEffect(() => {
    const handleStealthBreak = () => {
      setUnitState(prev => ({ ...prev, isMoving: true }));
    };

    window.addEventListener('stealthBreak', handleStealthBreak);
    return () => {
      window.removeEventListener('stealthBreak', handleStealthBreak);
    };
  }, []);

  return (
    <>
      <group
        ref={titanRef}
        visible={!unitState.isSpawning && currentHealth.current > 0 && isVisible}
        position={currentPosition.current}
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        {/* Performance optimization: Only render model when visible */}
        {isVisible && (
          <DeathKnightModel
            position={[0, -0.1, 0]}
            isAttacking={unitState.isAttacking || unitState.isCharging}
            isWalking={unitState.isMoving && currentHealth.current > 0}
            onHit={(damage) => handleDamage(damage, { type: weaponType })}
            isUsingDeathGrasp={unitState.isUsingDeathGrasp}
            isUsingFrostStrike={unitState.isUsingFrostStrike}
            onDeathGraspStart={handleDeathGraspStart}
            onFrostStrikeStart={handleFrostStrikeStart}
          />
        )}

        {/* Health bar - larger and higher positioned */}
        <Billboard
          position={[0, 3.5, 0]}
          follow={true}
          lockX={false}
          lockY={false}
          lockZ={false}
        >
          {currentHealth.current > 0 && !unitState.isDead && (
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

      {/* Larger spawn effect */}
      {unitState.isSpawning && (
        <BoneVortex2
          position={currentPosition.current}
          onComplete={() => {
            setUnitState(prev => ({ ...prev, isSpawning: false }));
          }}
          isSpawning={true}
        />
      )}

      {/* Larger death effect */}
      {unitState.showDeathEffect && (
        <BoneVortex 
          position={currentPosition.current}
          onComplete={() => {
            setUnitState(prev => ({ ...prev, showDeathEffect: false }));
          }}
          isSpawning={false}
          weaponType={weaponType}
          weaponSubclass={undefined}
        />
      )}

      {unitState.showFrostEffect && (
        <FrostExplosion
          position={position}
          onComplete={() => setUnitState(prev => ({ ...prev, showFrostEffect: false }))}
        />
      )}

      {/* Performance optimization: Only render effects when visible */}
      {isVisible && (
        <>
          {/* Active Death Grasp chain effect */}
          {activeEffects.deathGrasp && (
            <DeathGrasp
              startPosition={activeEffects.deathGrasp!.startPosition}
              targetPosition={activeEffects.deathGrasp!.targetPosition}
              onComplete={handleDeathGraspComplete}
              onPullStart={handleDeathGraspPullStart}
            />
          )}

          {/* Active Frost Strike effect */}
          {activeEffects.frostStrike && (
            <FrostStrike
              position={activeEffects.frostStrike.position}
              direction={activeEffects.frostStrike.direction}
              onComplete={handleFrostStrikeComplete}
              parentRef={titanRef}
            />
          )}

          {/* Charging indicator */}
          {activeEffects.chargingIndicator && (
            <DeathKnightChargingIndicator
              position={activeEffects.chargingIndicator!.position}
              direction={activeEffects.chargingIndicator!.direction}
              attackRange={ATTACK_RANGE}
              chargeDuration={CHARGE_DURATION}
              onComplete={() => setActiveEffects(prev => ({ ...prev, chargingIndicator: null }))}
            />
          )}

          {/* Slash effect */}
          {activeEffects.slashEffect && (
            <DeathKnightSlashEffect
              startPosition={activeEffects.slashEffect.position}
              direction={activeEffects.slashEffect.direction}
              onComplete={() => setActiveEffects(prev => ({ ...prev, slashEffect: null }))}
            />
          )}

          {/* Player pull effect */}
          {unitState.activePlayerPull && playerRef && (
            <DeathKnightPull
              playerRef={playerRef}
              deathKnightPosition={currentPosition.current}
              isActive={unitState.activePlayerPull}
              onComplete={() => setUnitState(prev => ({ ...prev, activePlayerPull: false }))}
            />
          )}
        </>
      )}
    </>
  );
}