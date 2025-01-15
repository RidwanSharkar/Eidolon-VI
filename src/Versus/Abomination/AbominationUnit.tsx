// src/versus/Abomination/AbominationUnit.tsx
import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Group, Vector3 } from 'three';
import { Billboard, Text } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import CustomAbomination from './CustomAbomination';
import BoneVortex2 from '../../color/SpawnAnimation';
import { Enemy } from '../enemy';
import BoneVortex from '../../color/DeathAnimation';
import { WeaponType } from '../../Weapons/weapons';


interface AbominationUnitProps {
  id: string;
  initialPosition: Vector3;
  position: Vector3;
  health: number;
  maxHealth: number;
  onTakeDamage: (id: string, damage: number) => void;
  onPositionUpdate: (id: string, position: Vector3) => void;
  playerPosition: Vector3;
  onAttackPlayer: (damage: number) => void;
  weaponType: WeaponType;
  isDying?: boolean;
}

export default function AbominationUnit({
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
}: AbominationUnitProps & Pick<Enemy, 'position'>) {
  const enemyRef = useRef<Group>(null);
  const lastAttackTime = useRef<number>(Date.now() + 2000);
  const [isAttacking, setIsAttacking] = useState(false);
  const [showDeathEffect, setShowDeathEffect] = useState(false);
  const [isDead, setIsDead] = useState(false);
  const [isSpawning, setIsSpawning] = useState(true);
  const [isMoving, setIsMoving] = useState(false);
  
  // Use refs for position tracking
  const currentPosition = useRef(initialPosition.clone());
  const targetPosition = useRef(initialPosition.clone());
  const lastUpdateTime = useRef(Date.now());
  const currentHealth = useRef(health);

  const ATTACK_RANGE = 2.65;
  const ATTACK_COOLDOWN = 2000;
  const MOVEMENT_SPEED = 0.1775;                         // 0.15 BOTH IDEAL
  const SMOOTHING_FACTOR = 0.1775;
  const POSITION_UPDATE_THRESHOLD = 0.1;
  const MINIMUM_UPDATE_INTERVAL = 50;
  const ATTACK_DAMAGE = 8;
  const SEPARATION_RADIUS = 4; // Minimum distance between enemies
  const SEPARATION_FORCE = 0.15; // Strength of the separation force
  const ARM_DELAY = 150;    // 0.15 seconds between arm strikes
  const TOTAL_ARMS = 6;     // Total number of arms

  // Sync health changes
  useEffect(() => {
    currentHealth.current = health;
  }, [health]);

  // Handle damage with proper synchronization
  const handleDamage = useCallback((damage: number) => {
    if (currentHealth.current <= 0) return;
    
    const newHealth = Math.max(0, currentHealth.current - damage);
    onTakeDamage(`enemy-${id}`, damage);
    
    if (newHealth === 0 && currentHealth.current > 0) {
      setIsDead(true);
      setShowDeathEffect(true);
    }
  }, [id, onTakeDamage]);

  // Immediately sync with provided position
  useEffect(() => {
    if (position) {
      currentPosition.current.copy(position);
      targetPosition.current.copy(position);
      if (enemyRef.current) {
        enemyRef.current.position.copy(position);
      }
    }
  }, [position]);

  useFrame((_, delta) => {
    if (!enemyRef.current || currentHealth.current <= 0 || !playerPosition) {
      setIsMoving(false);
      return;
    }

    const distanceToPlayer = currentPosition.current.distanceTo(playerPosition);

    if (distanceToPlayer > ATTACK_RANGE && currentHealth.current > 0) {
      setIsAttacking(false);
      setIsMoving(true);

      // Calculate direction to player
      const direction = new Vector3()
        .subVectors(playerPosition, currentPosition.current)
        .normalize();

      // Get all other enemy positions from the scene
      const otherEnemies = enemyRef.current.parent?.children
        .filter(child => 
          child !== enemyRef.current && 
          child.position && 
          child.position.distanceTo(currentPosition.current) < SEPARATION_RADIUS
        ) || [];

      // Calculate separation force
      const separationForce = new Vector3();
      otherEnemies.forEach(enemy => {
        // Create a ground-plane version of positions for separation calculation
        const currentGroundPos = currentPosition.current.clone().setY(0);
        const enemyGroundPos = enemy.position.clone().setY(0);
        
        const diff = new Vector3()
          .subVectors(currentGroundPos, enemyGroundPos)
          .normalize()
          .multiplyScalar(SEPARATION_FORCE / Math.max(0.1, enemyGroundPos.distanceTo(currentGroundPos)));
        separationForce.add(diff);
      });

      // Combine forces and ensure Y remains 0 - FIXES WALK ANIMATION
      const finalDirection = direction.add(separationForce).normalize();
      finalDirection.y = 0; // Force movement to stay on ground plane

      // Update target position with combined forces
      const movement = finalDirection.multiplyScalar(MOVEMENT_SPEED * delta * 60);
      targetPosition.current.copy(currentPosition.current).add(movement);
      targetPosition.current.y = 0; // Ensure target position stays on ground

      // Smooth movement
      currentPosition.current.lerp(targetPosition.current, SMOOTHING_FACTOR);
      currentPosition.current.y = 0; // Force current position to stay on ground

      // Apply position to mesh
      enemyRef.current.position.copy(currentPosition.current);

      // Handle rotation smoothly
      const lookTarget = new Vector3()
        .copy(playerPosition)
        .setY(currentPosition.current.y);
      enemyRef.current.lookAt(lookTarget);

      // Update position with rate limiting
      const now = Date.now();
      if (now - lastUpdateTime.current >= MINIMUM_UPDATE_INTERVAL) {
        if (currentPosition.current.distanceTo(position) > POSITION_UPDATE_THRESHOLD) {
          onPositionUpdate(id, currentPosition.current.clone());
          lastUpdateTime.current = now;
        }
      }
    } else {
      setIsMoving(false);
      // Smoothly stop at current position
      targetPosition.current.copy(currentPosition.current);
    }

    // Attack logic
    if (distanceToPlayer <= ATTACK_RANGE && currentHealth.current > 0) {
      const currentTime = Date.now();
      if (currentTime - lastAttackTime.current >= ATTACK_COOLDOWN) {
        setIsAttacking(true);
        
        // Store the initial attack position
        const attackStartPosition = currentPosition.current.clone();
        
        // Schedule damage for each arm with delays
        for (let i = 0; i < TOTAL_ARMS; i++) {
          setTimeout(() => {
            // Check conditions for each arm's damage
            const finalDistanceToPlayer = currentPosition.current.distanceTo(playerPosition);
            
            if (currentHealth.current > 0 && 
                finalDistanceToPlayer <= ATTACK_RANGE && 
                attackStartPosition.distanceTo(currentPosition.current) < 0.65) {
              onAttackPlayer(ATTACK_DAMAGE);
            }
          }, 850 + (i * ARM_DELAY)); // 850ms initial telegraph + staggered delays
        }
        
        lastAttackTime.current = currentTime;

        // Reset attack animation after all arms have completed
        setTimeout(() => {
          setIsAttacking(false);
        }, 1050 + (TOTAL_ARMS * ARM_DELAY));
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
        <CustomAbomination
          position={[0, 0.765, 0]}
          isAttacking={isAttacking}
          isWalking={isMoving && currentHealth.current > 0}
          onHit={handleDamage}
        />

        <Billboard
          position={[0, 5.5, 0]}
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
          scale={1.75}
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
          scale={1.75}
        />
      )}
    </>
  );
} 