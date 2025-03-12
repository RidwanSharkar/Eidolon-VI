// src/versus/EnemyUnit.tsx
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Group, Vector3 } from 'three';
import { Billboard, Text } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import CustomSkeleton from '@/Versus/CustomSkeleton';
import BoneVortex2 from '@/color/SpawnAnimation';
import { Enemy } from '@/Versus/enemy';
import BoneVortex from '@/color/DeathAnimation';
import { WeaponType } from '@/Weapons/weapons';
import { FrostExplosion } from '@/Spells/Avalanche/FrostExplosion';
import { stealthManager } from '../Spells/Stealth/StealthManager';
import * as THREE from 'three';


interface EnemyUnitProps {
  id: string;
  initialPosition: Vector3;
  position: Vector3;
  health: number;
  maxHealth: number;
  onTakeDamage: (id: string, damage: number) => void;
  onPositionUpdate: (id: string, position: Vector3, rotation: number) => void;
  playerPosition: Vector3;
  onAttackPlayer: (damage: number) => void;
  weaponType: WeaponType;
  isDying?: boolean;
}

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
  onAttackPlayer,
  weaponType,
}: EnemyUnitProps & Pick<Enemy, 'position'>) {
  const enemyRef = useRef<Group>(null);
  const lastAttackTime = useRef<number>(Date.now() + 2000);
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
  
  const velocity = useRef(new Vector3());
  const targetRotation = useRef(0);

  const ATTACK_RANGE = 2.5;
  const ATTACK_COOLDOWN = 2500;
  const MOVEMENT_SPEED = 0.075;
  const POSITION_UPDATE_THRESHOLD = 0.15;
  const MINIMUM_UPDATE_INTERVAL = 37.5;
  const ATTACK_DAMAGE = 12;
  const SEPARATION_RADIUS = 1.25;
  const SEPARATION_FORCE = 0.155;
  const ACCELERATION = 3.0;
  const DECELERATION = 4.0;
  const ROTATION_SPEED = 5.0;

  // Add new refs for wandering behavior
  const wanderTarget = useRef<Vector3 | null>(null);
  const wanderStartTime = useRef<number>(Date.now());
  const WANDER_DURATION = 4500; // Increased from 3000 to make changes less frequent
  const WANDER_RADIUS = 5;
  const WANDER_ROTATION_SPEED = 2.5;
  const WANDER_MOVEMENT_SPEED = 0.015;
  
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

  // Immediately sync with provided position
  useEffect(() => {
    if (position) {
      targetPosition.current.copy(position);
      targetPosition.current.y = 0;
    }
  }, [position]);

  const handleEnemyPositionUpdate = useCallback((id: string, newPosition: Vector3) => {
    if (enemyRef.current) {
      onPositionUpdate(id, newPosition.clone(), enemyRef.current.rotation.y);
    }
  }, [onPositionUpdate]);

  useFrame((_, delta) => {
    if (!enemyRef.current || currentHealth.current <= 0 || !playerPosition) {
      setIsMoving(false);
      return;
    }

    const distanceToPlayer = currentPosition.current.distanceTo(playerPosition);

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
        
        const normalizedSpeed = WANDER_MOVEMENT_SPEED * 60; // Slower wandering speed
        const currentFrameSpeed = normalizedSpeed * delta;
        
        // Calculate direction to wander target with smooth interpolation
        const direction = new Vector3()
          .subVectors(wanderTarget.current, currentPosition.current)
          .normalize();
        
        // Apply movement with gentler acceleration
        const targetVelocity = direction.multiplyScalar(currentFrameSpeed);
        velocity.current.lerp(targetVelocity, (ACCELERATION * 0.5) * delta);
        
        // Update position
        currentPosition.current.add(velocity.current);
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

    if (distanceToPlayer > ATTACK_RANGE && currentHealth.current > 0) {
      setIsAttacking(false);
      setIsMoving(true);

      const normalizedSpeed = MOVEMENT_SPEED * 60;
      const currentFrameSpeed = normalizedSpeed * delta;

      // Calculate direction to player
      const direction = new Vector3()
        .subVectors(playerPosition, currentPosition.current)
        .normalize();

      // Calculate separation force
      const separationForce = new Vector3();
      const otherEnemies = enemyRef.current.parent?.children
        .filter(child => 
          child !== enemyRef.current && 
          child.position && 
          child.position.distanceTo(currentPosition.current) < SEPARATION_RADIUS
        ) || [];

      otherEnemies.forEach(enemy => {
        const currentGroundPos = currentPosition.current.clone().setY(0);
        const enemyGroundPos = enemy.position.clone().setY(0);
        
        const diff = new Vector3()
          .subVectors(currentGroundPos, enemyGroundPos)
          .normalize()
          .multiplyScalar(SEPARATION_FORCE / Math.max(0.1, enemyGroundPos.distanceTo(currentGroundPos)));
        separationForce.add(diff);
      });

      // Combine forces and normalize
      const finalDirection = direction.add(separationForce).normalize();
      finalDirection.y = 0;

      // Add velocity smoothing
      const currentSpeed = velocity.current.length();
      const targetSpeed = currentFrameSpeed;
      const smoothedSpeed = THREE.MathUtils.lerp(currentSpeed, targetSpeed, ACCELERATION * delta);
      
      // Calculate target velocity with smoothed speed
      const targetVelocity = finalDirection.multiplyScalar(smoothedSpeed);
      
      // Add additional position smoothing
      velocity.current.lerp(targetVelocity, ACCELERATION * delta * 0.5);
      
      // Update position with additional smoothing
      const newPosition = currentPosition.current.clone().add(velocity.current);
      currentPosition.current.lerp(newPosition, 0.8);
      currentPosition.current.y = 0;

      // Apply position to mesh
      enemyRef.current.position.copy(currentPosition.current);

      // Smooth rotation
      const lookTarget = new Vector3()
        .copy(playerPosition)
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
      setIsMoving(false);
      // Decelerate smoothly
      velocity.current.multiplyScalar(1 - DECELERATION * delta);
      
      if (velocity.current.length() > 0.001) {
        currentPosition.current.add(velocity.current);
        enemyRef.current.position.copy(currentPosition.current);
      }
    }

    // Attack logic
    if (distanceToPlayer <= ATTACK_RANGE && currentHealth.current > 0) {
      const currentTime = Date.now();
      if (currentTime - lastAttackTime.current >= ATTACK_COOLDOWN) {
        setIsAttacking(true);
        
        // Store the initial attack position
        const attackStartPosition = currentPosition.current.clone();
        
        // Add delay before dealing damage
        setTimeout(() => {
          // Get the current positions at time of damage
          const finalDistanceToPlayer = currentPosition.current.distanceTo(playerPosition);
          
          // ONE SECOND TELEGRAPH
          // 1. Enemy is still alive
          // 2. Player is still in range
          // 3. Enemy hasn't moved too far from attack start position
          if (currentHealth.current > 0 && 
              finalDistanceToPlayer <= ATTACK_RANGE && 
              attackStartPosition.distanceTo(currentPosition.current) < 0.75) { // leeway distance 
            onAttackPlayer(ATTACK_DAMAGE);
          }
        }, 935); // REACTION TIME 
        
        lastAttackTime.current = currentTime;

        setTimeout(() => {
          setIsAttacking(false);
        }, 500);
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
      if (enemyRef.current) {
        enemyRef.current.visible = true;
      }
    }
  }, [health, isDead]);

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
          position={[0, 0.795, 0]}
          isAttacking={isAttacking}
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