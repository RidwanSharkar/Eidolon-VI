// src/versus/EnemyUnit.tsx
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Group, Vector3 } from 'three';
import { Billboard, Text } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import CustomSkeleton from '@/Versus/CustomSkeleton';
import SkeletonChargingIndicator from '@/Versus/SkeletonChargingIndicator';
import BoneVortex2 from '@/color/SpawnAnimation';
import { Enemy } from '@/Versus/enemy';
import BoneVortex from '@/color/DeathAnimation';
import { WeaponType } from '@/Weapons/weapons';
import { FrostExplosion } from '@/Spells/Avalanche/FrostExplosion';
import { stealthManager } from '../Spells/Stealth/StealthManager';
import { globalAggroSystem, PlayerInfo, TargetInfo, isSummonedUnit } from './AggroSystem';
import { EnemyUnitProps } from './EnemyUnitProps';

// Define DamageSource interface locally since it doesn't exist in the damage module
interface DamageSource {
  type: WeaponType;
  hasActiveAbility?: boolean;
}



export default function EnemyUnit({
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
}: EnemyUnitProps & Pick<Enemy, 'position'>) {
  const enemyRef = useRef<Group>(null);
  const lastAttackTime = useRef<number>(Date.now() + 2000);
  const [isAttacking, setIsAttacking] = useState(false);
  const [showDeathEffect, setShowDeathEffect] = useState(false);
  const [isDead, setIsDead] = useState(false);
  const [isSpawning, setIsSpawning] = useState(true);
  const [isMoving, setIsMoving] = useState(false);
  const [showFrostEffect, setShowFrostEffect] = useState(false);
  
  // Charging state
  const [isCharging, setIsCharging] = useState(false);
  const [chargingIndicator, setChargingIndicator] = useState<{
    id: string;
    position: Vector3;
    direction: Vector3;
  } | null>(null);
  const chargeStartTime = useRef<number>(0);
  const chargeTargetPosition = useRef<Vector3 | null>(null);
  
  // Use refs for position tracking
  const currentPosition = useRef(initialPosition.clone().setY(0));
  const targetPosition = useRef(initialPosition.clone().setY(0));
  const lastUpdateTime = useRef(Date.now());
  const currentHealth = useRef(health);
  
  const targetRotation = useRef(0);

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

  // Store current target for consistent tracking
  const currentTargetRef = useRef<TargetInfo | null>(null);

  const ATTACK_RANGE = 2.65;
  const ATTACK_COOLDOWN = 2000;
  const CHARGE_DURATION = 1000; // 1 second charge time
  const BASE_MOVEMENT_SPEED = 2.6; // Consistent base speed like player
  const POSITION_UPDATE_THRESHOLD = 0.2;
  const MINIMUM_UPDATE_INTERVAL = 20;
  const ATTACK_DAMAGE = 8;
  const SEPARATION_RADIUS = 2.5;
  const SEPARATION_FORCE = 2.75; // Reduced for smoother movement
  const MOVEMENT_SMOOTHING = 0.85; // Smoothing factor for movement
  const ROTATION_SPEED = 4.0;

  // Add new refs for wandering behavior
  const wanderTarget = useRef<Vector3 | null>(null);
  const wanderStartTime = useRef<number>(Date.now());
  const WANDER_DURATION = 4500; 
  const WANDER_RADIUS = 6;
  const WANDER_ROTATION_SPEED = 2.5;
  
  const getNewWanderTarget = useCallback(() => {
    if (!enemyRef.current) return null;
    
    // Get random angle and distance within WANDER_RADIUS
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * WANDER_RADIUS;
    
    // Calculate new position
    const newTarget = new Vector3(
      currentPosition.current.x + Math.cos(angle) * distance,
      0,
      currentPosition.current.z + Math.sin(angle) * distance
    );
    
    return newTarget;
  }, []);

  // Sync health changes
  useEffect(() => {
    currentHealth.current = health;
  }, [health]);

  // Handle damage with proper synchronization
  const handleDamage = useCallback((damage: number, source: DamageSource) => {
    if (currentHealth.current <= 0) return;
    
    const newHealth = Math.max(0, currentHealth.current - damage);
    onTakeDamage(`enemy-${id}`, damage);
    
    if (newHealth === 0 && currentHealth.current > 0) {
      setIsDead(true);
      setShowDeathEffect(true);
    }

    if (source.type === WeaponType.SABRES && source.hasActiveAbility) {
      setShowFrostEffect(true);
    }
  }, [id, onTakeDamage]);

  // Improved position synchronization - prevent teleporting
  useEffect(() => {
    // Only sync position during initial spawn, not during gameplay
    if (position && isSpawning && !currentPosition.current.equals(position)) {
      const distance = currentPosition.current.distanceTo(position);
      
      // Only allow position sync if the distance is reasonable (prevents teleporting)
      if (distance < 5.0) { // Allow small corrections only
        currentPosition.current.copy(position);
        currentPosition.current.y = 0; // Force ground level
        targetPosition.current.copy(currentPosition.current);
        if (enemyRef.current) {
          enemyRef.current.position.copy(currentPosition.current);
        }
      }
    }
  }, [position, isSpawning]);

  const handleEnemyPositionUpdate = useCallback((id: string, newPosition: Vector3) => {
    if (enemyRef.current) {
      onPositionUpdate(id, newPosition.clone(), enemyRef.current.rotation.y);
    }
  }, [onPositionUpdate]);

  useFrame((_, delta) => {
    if (!enemyRef.current || currentHealth.current <= 0 || isFrozen || isStunned) {
      setIsMoving(false);
      setIsAttacking(false);
      return;
    }

    // Get the current target and always use fresh position
    const currentTarget = getTargetPlayer();
    currentTargetRef.current = currentTarget;
    
    if (!currentTarget) {
      setIsMoving(false);
      return;
    }

    // Always use the most up-to-date target position
    const targetPlayerPosition = currentTarget.position;
    const distanceToPlayer = currentPosition.current.distanceTo(targetPlayerPosition);

    // Check if player is stealthed
    if (stealthManager.isUnitStealthed()) {
      setIsAttacking(false);
      
      // Update wander target periodically with smooth transitions
      const now = Date.now();
      if (!wanderTarget.current || now - wanderStartTime.current > WANDER_DURATION) {
        // Keep the current target if it exists, just update the time
        if (!wanderTarget.current) {
          wanderTarget.current = getNewWanderTarget();
        } else {
          // Smoothly transition to new target by keeping current direction for a while
          const currentDir = new Vector3()
            .subVectors(wanderTarget.current, currentPosition.current)
            .normalize();
          
          const newTarget = new Vector3()
            .copy(currentPosition.current)
            .add(currentDir.multiplyScalar(WANDER_RADIUS));
          
          wanderTarget.current = newTarget;
        }
        wanderStartTime.current = now;
      }
      
      if (wanderTarget.current) {
        setIsMoving(true);
        
        // Use consistent speed calculation like player movement
        const baseWanderSpeed = BASE_MOVEMENT_SPEED * 0.25; // 30% of normal speed for wandering
        const normalizedSpeed = isSlowed ? baseWanderSpeed * 0.5 : baseWanderSpeed;
        const frameSpeed = normalizedSpeed * delta;
        
        // Calculate direction to wander target
        const direction = new Vector3()
          .subVectors(wanderTarget.current, currentPosition.current)
          .normalize();
        
        // Apply direct movement like player (no complex velocity smoothing)
        const movement = direction.multiplyScalar(frameSpeed);
        const newPosition = currentPosition.current.clone().add(movement);
        
        // Simple interpolation for smoothness
        currentPosition.current.lerp(newPosition, MOVEMENT_SMOOTHING);
        currentPosition.current.y = 0;
        enemyRef.current.position.copy(currentPosition.current);
        
        // Smoother rotation with reduced speed
        const targetRotation = Math.atan2(direction.x, direction.z);
        const currentRotationY = enemyRef.current.rotation.y;
        let rotationDiff = targetRotation - currentRotationY;
        
        // Normalize rotation difference
        while (rotationDiff > Math.PI) rotationDiff -= Math.PI * 2;
        while (rotationDiff < -Math.PI) rotationDiff += Math.PI * 2;
        
        // Apply smoother rotation
        enemyRef.current.rotation.y += rotationDiff * Math.min(1, WANDER_ROTATION_SPEED * delta);
      }
      
      return; // Skip normal chase/attack behavior while player is stealthed
    }

    // Add stealth check
    if (stealthManager.isUnitStealthed()) {
      setIsMoving(false);
      setIsAttacking(false);
      return;
    }

    if (distanceToPlayer > ATTACK_RANGE-0.25 && currentHealth.current > 0 && !isCharging) {
      setIsAttacking(false);
      setIsMoving(true);

      // Use consistent speed calculation like player movement
      const baseSpeed = isSlowed ? BASE_MOVEMENT_SPEED * 0.5 : BASE_MOVEMENT_SPEED;
      const frameSpeed = baseSpeed * delta;

      // Calculate direction to target player
      const direction = new Vector3()
        .subVectors(targetPlayerPosition, currentPosition.current)
        .normalize();

      // Calculate separation force (simplified)
      const separationForce = new Vector3();
      const otherEnemies = enemyRef.current.parent?.children
        .filter(child => 
          child !== enemyRef.current && 
          child.position && 
          child.position.distanceTo(currentPosition.current) < SEPARATION_RADIUS
        ) || [];

      if (otherEnemies.length > 0) {
        otherEnemies.forEach(enemy => {
          const diff = new Vector3()
            .subVectors(currentPosition.current, enemy.position)
            .normalize()
            .multiplyScalar(SEPARATION_FORCE);
          separationForce.add(diff);
        });
        separationForce.normalize().multiplyScalar(0.3); // Limit separation influence
      }

      // Combine direction and separation (like player movement)
      const finalDirection = direction.add(separationForce).normalize();
      finalDirection.y = 0;

      // Apply direct movement calculation (like player)
      const movement = finalDirection.multiplyScalar(frameSpeed);
      const newPosition = currentPosition.current.clone().add(movement);
      
      // Apply knockback effect if active
      if (knockbackEffect && knockbackEffect.isActive) {
        const knockbackDistance = knockbackEffect.distance * (1 - knockbackEffect.progress);
        const knockbackMovement = knockbackEffect.direction.clone().multiplyScalar(knockbackDistance * delta * 10);
        newPosition.add(knockbackMovement);
      }
      
      // Simple smoothing for natural movement
      currentPosition.current.lerp(newPosition, MOVEMENT_SMOOTHING);
      currentPosition.current.y = 0;

      // Apply position to mesh
      enemyRef.current.position.copy(currentPosition.current);

      // Smooth rotation
      const lookTarget = new Vector3()
        .copy(targetPlayerPosition)
        .setY(currentPosition.current.y);
      targetRotation.current = Math.atan2(
        lookTarget.x - currentPosition.current.x,
        lookTarget.z - currentPosition.current.z
      );

      // Interpolate rotation
      const currentRotationY = enemyRef.current.rotation.y;
      let rotationDiff = targetRotation.current - currentRotationY;
      while (rotationDiff > Math.PI) rotationDiff -= Math.PI * 2;
      while (rotationDiff < -Math.PI) rotationDiff += Math.PI * 2;
      
      enemyRef.current.rotation.y += rotationDiff * Math.min(1, ROTATION_SPEED * delta);

    } else {
      // Stop moving when in attack range or when charging
      setIsMoving(false);
    }

    // Attack logic with charging
    if (distanceToPlayer <= ATTACK_RANGE && currentHealth.current > 0 && !isFrozen && !isStunned) {
      const currentTime = Date.now();
      
      if (!isCharging && !isAttacking && currentTime - lastAttackTime.current >= ATTACK_COOLDOWN) {
        // Start charging - stop moving during charge
        setIsCharging(true);
        setIsMoving(false);
        chargeStartTime.current = currentTime;
        chargeTargetPosition.current = targetPlayerPosition.clone();
        lastAttackTime.current = currentTime;
        
        // Calculate attack direction
        const attackDirection = new Vector3()
          .subVectors(targetPlayerPosition, currentPosition.current)
          .normalize();
        
        // Show charging indicator
        setChargingIndicator({
          id: `charging-${currentTime}`,
          position: currentPosition.current.clone(),
          direction: attackDirection
        });
      }
    }
    
    // Handle charging completion
    if (isCharging && !isAttacking) {
      const chargeElapsed = Date.now() - chargeStartTime.current;
      if (chargeElapsed >= CHARGE_DURATION) {
        // Charging complete, start attack animation
        setIsCharging(false);
        setChargingIndicator(null);
        setIsAttacking(true);
        
        // Store the initial attack position and target
        const attackStartPosition = currentPosition.current.clone();
        const chargedTargetPos = chargeTargetPosition.current;
        
        // Deal damage after attack animation starts (similar to original timing)
        setTimeout(() => {
          // Use the stored target from when attack started
          const attackTarget = currentTargetRef.current;
          if (!attackTarget || !chargedTargetPos) return;
          
          // Check if targets are in the attack area (cone in front of skeleton)
          const attackDirection = new Vector3()
            .subVectors(chargedTargetPos, attackStartPosition)
            .normalize();
          
          // Check all potential targets for area damage
          const playersInfo: PlayerInfo[] = allPlayers || (playerPosition ? [{
            id: 'local-player',
            position: playerPosition,
            name: 'Player'
          }] : []);
          
          const allTargets = [...playersInfo, ...summonedUnits];
          const attackAngle = Math.PI * 0.6; // 60 degree cone
          
          allTargets.forEach(target => {
            const targetDirection = new Vector3()
              .subVectors(target.position, currentPosition.current)
              .normalize();
            
            const distanceToTarget = currentPosition.current.distanceTo(target.position);
            const angleToTarget = attackDirection.angleTo(targetDirection);
            
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
        }, 500); // Match original damage timing
        
        // Reset attack state and resume movement
        setTimeout(() => {
          setIsAttacking(false);
          chargeTargetPosition.current = null;
          // Resume movement after attack completes
          if (currentHealth.current > 0) {
            const currentTarget = getTargetPlayer();
            if (currentTarget) {
              const distanceToTarget = currentPosition.current.distanceTo(currentTarget.position);
              if (distanceToTarget > ATTACK_RANGE - 0.25) {
                setIsMoving(true);
              }
            }
          }
        }, 1000); // Longer duration for full attack animation
      }
    }

    // Update position with rate limiting
    const now = Date.now();
    if (now - lastUpdateTime.current >= MINIMUM_UPDATE_INTERVAL) {
      if (currentPosition.current.distanceTo(position) > POSITION_UPDATE_THRESHOLD) {
        handleEnemyPositionUpdate(id, currentPosition.current.clone());
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
      if (enemyRef.current) {
        enemyRef.current.visible = true;
      }
    }
  }, [health, isDead, id]);

  useEffect(() => {
    if (isDead) {
      const cleanup = setTimeout(() => {
        setShowDeathEffect(false);
        if (enemyRef.current?.parent) {
          enemyRef.current.parent.remove(enemyRef.current);
        }
      }, 3000);
      return () => clearTimeout(cleanup);
    }
  }, [isDead]);

  useEffect(() => {
    const handleStealthBreak = () => {
      // Immediately re-enable targeting when stealth breaks
      setIsMoving(true);
    };

    window.addEventListener('stealthBreak', handleStealthBreak);
    return () => {
      window.removeEventListener('stealthBreak', handleStealthBreak);
    };
  }, []);

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
        <CustomSkeleton
          position={[0, 0.735, 0]}
          isAttacking={isAttacking || isCharging}
          isWalking={isMoving && currentHealth.current > 0}
          onHit={(damage) => handleDamage(damage, { type: weaponType })}
        />

        <Billboard
          position={[0, 3.5, 0]}
          follow={true}
          lockX={false}
          lockY={false}
          lockZ={false}
        >
          {currentHealth.current > 0 && (
            <>
              <mesh position={[0, 0, 0]}>
                <planeGeometry args={[2.0, 0.25]} />
                <meshBasicMaterial color="#333333" opacity={0.8} transparent />
              </mesh>
              <mesh position={[-1.0 + (currentHealth.current / maxHealth), 0, 0.001]}>
                <planeGeometry args={[(currentHealth.current / maxHealth) * 2.0, 0.23]} />
                <meshBasicMaterial color="#ff3333" opacity={0.9} transparent />
              </mesh>
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

      {/* Charging indicator */}
      {chargingIndicator && (
        <SkeletonChargingIndicator
          position={chargingIndicator.position}
          direction={chargingIndicator.direction}
          attackRange={ATTACK_RANGE}
          chargeDuration={CHARGE_DURATION}
          onComplete={() => setChargingIndicator(null)}
        />
      )}

      {showFrostEffect && (
        <FrostExplosion 
          position={position}
          onComplete={() => setShowFrostEffect(false)}
        />
      )}
    </>
  );
} 