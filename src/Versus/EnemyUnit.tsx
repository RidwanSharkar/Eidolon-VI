import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Group, Vector3 } from 'three';
import { Billboard, Text } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import CustomSkeleton from './CustomSkeleton';
import BoneVortex from './DeathAnimation';
import { Enemy } from './enemy';

interface EnemyUnitProps {
  id: string;
  initialPosition: Vector3;
  position: Vector3;
  health: number;
  maxHealth: number;
  onTakeDamage: (id: string, damage: number) => void;
  onPositionUpdate: (id: string, position: Vector3) => void;
  playerPosition: Vector3;
  onAttackPlayer: (damage: number) => void;
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
}: EnemyUnitProps & Pick<Enemy, 'position'>) {
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

  const ATTACK_RANGE = 1.4;
  const ATTACK_COOLDOWN = 2000;
  const MOVEMENT_SPEED = 0.14;                         // 0.15 BOTH IDEAL
  const SMOOTHING_FACTOR = 0.14;
  const POSITION_UPDATE_THRESHOLD = 0.1;
  const MINIMUM_UPDATE_INTERVAL = 50;
  const ATTACK_DAMAGE = 5;

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

      // Update target position
      const movement = direction.multiplyScalar(MOVEMENT_SPEED * delta * 60);
      targetPosition.current.copy(currentPosition.current).add(movement);

      // Smooth movement
      currentPosition.current.lerp(targetPosition.current, SMOOTHING_FACTOR);

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
        onAttackPlayer(ATTACK_DAMAGE);
        lastAttackTime.current = currentTime;

        setTimeout(() => {
          setIsAttacking(false);
        }, 500);
      }
    }
  });

  useEffect(() => {
    if (health === 0 && !isDead) {
      setIsDead(true);
      setShowDeathEffect(true);
    }
  }, [health, isDead]);

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
          position={[0, 0, 0]}
          isAttacking={isAttacking}
          isWalking={isMoving && currentHealth.current > 0}
          onHit={handleDamage}
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
        <BoneVortex 
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
        />
      )}
    </>
  );
} 