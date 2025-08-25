// src/Versus/FallenTitan/FallenTitanUnit.tsx
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Group, Vector3 } from 'three';
import { Billboard, Text } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import FallenTitanModel from './FallenTitanModel';
import BoneVortex2 from '@/color/SpawnAnimation';
import BoneVortex from '@/color/DeathAnimation';
import { WeaponType } from '@/Weapons/weapons';
import { FrostExplosion } from '@/Spells/Avalanche/FrostExplosion';
import { stealthManager } from '../../Spells/Stealth/StealthManager';
import { globalAggroSystem, PlayerInfo, TargetInfo } from '../AggroSystem';


interface FallenTitanUnitProps {
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
}

// Define DamageSource interface
interface DamageSource {
  type: WeaponType;
  hasActiveAbility?: boolean;
}



export default function FallenTitanUnit({
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
}: FallenTitanUnitProps) {
  const titanRef = useRef<Group>(null);
  const lastAttackTime = useRef<number>(Date.now() + 3000); // Longer initial delay
  const [isAttacking, setIsAttacking] = useState(false);
  const [showDeathEffect, setShowDeathEffect] = useState(false);
  const [isDead, setIsDead] = useState(false);
  const [isSpawning, setIsSpawning] = useState(true);
  const [isMoving, setIsMoving] = useState(false);
  const [showFrostEffect, setShowFrostEffect] = useState(false);
  
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

  // Fallen Titan specific constants - slower and more powerful
  const ATTACK_RANGE = 4.0; // Longer reach due to size
  const ATTACK_COOLDOWN = 2500; // Slower attacks
  const BASE_MOVEMENT_SPEED = 2.1; // Consistent base speed like other enemies but slower
  const POSITION_UPDATE_THRESHOLD = 0.3;
  const MINIMUM_UPDATE_INTERVAL = 30;
  const ATTACK_DAMAGE = 52; // High damage
  const SEPARATION_RADIUS = 2.5; // Larger separation
  const SEPARATION_FORCE = 0.15; // Reduced for smoother movement
  const MOVEMENT_SMOOTHING = 0.85; // Smoothing factor for movement
  const ROTATION_SPEED = 2.5; // Slower rotation

  // Wandering behavior (slower and more lumbering)
  const wanderTarget = useRef<Vector3 | null>(null);
  const wanderStartTime = useRef<number>(Date.now());
  const WANDER_DURATION = 8000; // Longer wander duration
  const WANDER_RADIUS = 4; // Smaller wander radius (less agile)
  const WANDER_ROTATION_SPEED = 1.0; // Much slower rotation
  
  const getNewWanderTarget = useCallback(() => {
    if (!titanRef.current) return null;
    
    const angle = Math.random() * Math.PI * 2;
    const distance = Math.random() * WANDER_RADIUS;
    
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
    onTakeDamage(`fallen-titan-${id}`, damage);
    
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
        if (titanRef.current) {
          titanRef.current.position.copy(currentPosition.current);
        }
      }
    }
  }, [position, isSpawning]);

  const handleTitanPositionUpdate = useCallback((id: string, newPosition: Vector3) => {
    if (titanRef.current) {
      onPositionUpdate(id, newPosition.clone(), titanRef.current.rotation.y);
    }
  }, [onPositionUpdate]);

  useFrame((_, delta) => {
    if (!titanRef.current || currentHealth.current <= 0 || isFrozen || isStunned) {
      setIsMoving(false);
      setIsAttacking(false);
      return;
    }

    const targetPlayerPosition = getTargetPlayerPosition();
    if (!targetPlayerPosition) {
      setIsMoving(false);
      return;
    }

    const distanceToPlayer = currentPosition.current.distanceTo(targetPlayerPosition);

    // Check if player is stealthed - lumbering wandering behavior
    if (stealthManager.isUnitStealthed()) {
      setIsAttacking(false);
      
      const now = Date.now();
      if (!wanderTarget.current || now - wanderStartTime.current > WANDER_DURATION) {
        if (!wanderTarget.current) {
          wanderTarget.current = getNewWanderTarget();
        } else {
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
        const baseWanderSpeed = BASE_MOVEMENT_SPEED * 0.15; // 15% of normal speed for very slow wandering
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
        titanRef.current.position.copy(currentPosition.current);
        
        // Very slow rotation for lumbering effect
        const targetRotation = Math.atan2(direction.x, direction.z);
        const currentRotationY = titanRef.current.rotation.y;
        let rotationDiff = targetRotation - currentRotationY;
        
        while (rotationDiff > Math.PI) rotationDiff -= Math.PI * 2;
        while (rotationDiff < -Math.PI) rotationDiff += Math.PI * 2;
        
        titanRef.current.rotation.y += rotationDiff * Math.min(1, WANDER_ROTATION_SPEED * delta);
      }
      
      return;
    }

    // Normal movement and attack behavior
    if (distanceToPlayer > ATTACK_RANGE && currentHealth.current > 0) {
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
      const otherEnemies = titanRef.current.parent?.children
        .filter(child => 
          child !== titanRef.current && 
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
      
      // Simple smoothing for natural movement
      currentPosition.current.lerp(newPosition, MOVEMENT_SMOOTHING);
      currentPosition.current.y = 0;

      // Apply position to mesh
      titanRef.current.position.copy(currentPosition.current);

      // Slow, deliberate rotation
      const lookTarget = new Vector3()
        .copy(targetPlayerPosition)
        .setY(currentPosition.current.y);
      targetRotation.current = Math.atan2(
        lookTarget.x - currentPosition.current.x,
        lookTarget.z - currentPosition.current.z
      );

      const currentRotationY = titanRef.current.rotation.y;
      let rotationDiff = targetRotation.current - currentRotationY;
      while (rotationDiff > Math.PI) rotationDiff -= Math.PI * 2;
      while (rotationDiff < -Math.PI) rotationDiff += Math.PI * 2;
      
      titanRef.current.rotation.y += rotationDiff * Math.min(1, ROTATION_SPEED * delta);

    } else {
      setIsMoving(false);
      // Simple deceleration - enemies stop when in attack range
    }

    // Attack logic - more powerful and slower
    if (distanceToPlayer <= ATTACK_RANGE && currentHealth.current > 0 && !isFrozen && !isStunned) {
      const currentTime = Date.now();
      if (currentTime - lastAttackTime.current >= ATTACK_COOLDOWN) {
        setIsAttacking(true);
        
        const attackStartPosition = currentPosition.current.clone();
        
        // Longer telegraph for powerful attack
        setTimeout(() => {
          const finalTargetPlayerPosition = getTargetPlayerPosition();
          const finalDistanceToPlayer = currentPosition.current.distanceTo(finalTargetPlayerPosition);
          
          // More lenient conditions due to size and power
          if (currentHealth.current > 0 && 
              finalDistanceToPlayer <= ATTACK_RANGE && 
              attackStartPosition.distanceTo(currentPosition.current) < 1.0) {
            onAttackPlayer(ATTACK_DAMAGE);
          }
        }, 1800); // Longer telegraph
        
        lastAttackTime.current = currentTime;

        setTimeout(() => {
          setIsAttacking(false);
        }, 800); // Longer attack animation
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
  });

  useEffect(() => {
    if (health === 0 && !isDead) {
      setIsDead(true);
      setShowDeathEffect(true);
      // Remove from aggro system when enemy dies
      globalAggroSystem.removeEnemy(id);
      if (titanRef.current) {
        titanRef.current.visible = true;
      }
    }
  }, [health, isDead, id]);

  useEffect(() => {
    if (isDead) {
      const cleanup = setTimeout(() => {
        setShowDeathEffect(false);
        if (titanRef.current?.parent) {
          titanRef.current.parent.remove(titanRef.current);
        }
      }, 4000); // Longer death effect
      return () => clearTimeout(cleanup);
    }
  }, [isDead]);

  useEffect(() => {
    const handleStealthBreak = () => {
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
        ref={titanRef} 
        visible={!isSpawning && currentHealth.current > 0}
        position={currentPosition.current}
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        <FallenTitanModel
          position={[0, 0, 0]}
          isAttacking={isAttacking}
          isWalking={isMoving && currentHealth.current > 0}
          onHit={(damage) => handleDamage(damage, { type: weaponType })}
        />

        {/* Health bar - larger and higher positioned */}
        <Billboard
          position={[0, 6.5, 0]}
          follow={true}
          lockX={false}
          lockY={false}
          lockZ={false}
        >
          {currentHealth.current > 0 && (
            <>
              <mesh position={[0, 0, 0]}>
                <planeGeometry args={[4.0, 0.4]} />
                <meshBasicMaterial color="#333333" opacity={0.8} transparent />
              </mesh>
              <mesh position={[-2.0 + (currentHealth.current / maxHealth) * 2.0, 0, 0.001]}>
                <planeGeometry args={[(currentHealth.current / maxHealth) * 4.0, 0.36]} />
                <meshBasicMaterial color="#cc2222" opacity={0.9} transparent />
              </mesh>
              <Text
                position={[0, 0, 0.002]}
                fontSize={0.3}
                color="#ffffff"
                anchorX="center"
                anchorY="middle"
                fontWeight="bold"
              >
                {`${Math.ceil(currentHealth.current)}/${maxHealth}`}
              </Text>
              {/* Titan label */}
              <Text
                position={[0, 0.5, 0.002]}
                fontSize={0.25}
                color="#ff6666"
                anchorX="center"
                anchorY="middle"
                fontWeight="bold"
              >
                FALLEN TITAN
              </Text>
            </>
          )}
        </Billboard>
      </group>

      {/* Larger spawn effect */}
      {isSpawning && (
        <BoneVortex2 
          position={currentPosition.current}
          onComplete={() => {
            setIsSpawning(false);
          }}
          isSpawning={true}
        />
      )}

      {/* Larger death effect */}
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

      {showFrostEffect && (
        <FrostExplosion 
          position={position}
          onComplete={() => setShowFrostEffect(false)}
        />
      )}
    </>
  );
}