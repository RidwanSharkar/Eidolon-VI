import React, { useRef, useEffect, useState } from 'react';
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

  // Initialize with initialPosition if position is undefined
  const currentPosition = useRef(initialPosition.clone());
  const targetPosition = useRef(initialPosition.clone());

  const ATTACK_RANGE = 2.23;
  const ATTACK_COOLDOWN = 2000;
  const MOVEMENT_SPEED = 0.8;
  const SMOOTHING_FACTOR = 0.005; // Add smoothing for movement
  const ATTACK_DAMAGE = 5;

  // Update current position when position prop changes
  useEffect(() => {
    if (position) {
      currentPosition.current = position.clone();
    }
  }, [position]);

  useEffect(() => {
    if (enemyRef.current) {
      enemyRef.current.position.copy(currentPosition.current);
    }
  }, []);

  useFrame(() => {
    if (!enemyRef.current || health <= 0 || !playerPosition) return;

    const direction = new Vector3()
      .subVectors(playerPosition, currentPosition.current)
      .normalize();

    const distanceToPlayer = currentPosition.current.distanceTo(playerPosition);

    if (distanceToPlayer > ATTACK_RANGE && health > 0) {
      setIsAttacking(false);
      
      // Update target position
      targetPosition.current.copy(currentPosition.current).add(
        direction.multiplyScalar(MOVEMENT_SPEED)
      );
      
      // Smooth movement with controlled lerp
      currentPosition.current.lerp(targetPosition.current, SMOOTHING_FACTOR);
      
      // Update position only once
      if (enemyRef.current) {
        enemyRef.current.position.copy(currentPosition.current);
        
        // Smooth rotation separately
        const lookTarget = new Vector3()
          .copy(playerPosition)
          .setY(currentPosition.current.y); // Keep Y level consistent
        enemyRef.current.lookAt(lookTarget);
      }
      
      // Only update position if it has changed significantly
      if (currentPosition.current.distanceTo(position) > 0.01) {
        onPositionUpdate(id, currentPosition.current.clone());
      }
    } else if (health > 0) {
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
      console.log(`Enemy ${id} died`);
      setIsDead(true);
      setShowDeathEffect(true);
    }
  }, [health, id, isDead]);

  return (
    <>
      <group 
        ref={enemyRef} 
        visible={health > 0}
        position={currentPosition.current}
        onClick={(e) => {
          e.stopPropagation();
          if (health > 0) {
            console.log(`Clicked enemy ${id}`);
            onTakeDamage(`enemy-${id}`, 10);
          }
        }}
      >
        <CustomSkeleton
          position={[0, 0, 0]}
          isAttacking={isAttacking}
          isWalking={!isAttacking && health > 0}
          onHit={(damage: number) => {
            if (health > 0) {
              onTakeDamage(`enemy-${id}`, damage);
            }
          }}
        />

        <Billboard
          position={[0, 3.5, 0]}
          follow={true}
          lockX={false}
          lockY={false}
          lockZ={false}
        >
          {health > 0 && (
            <>
              <mesh position={[0, 0, 0]}>
                <planeGeometry args={[2.0, 0.25]} />
                <meshBasicMaterial color="#333333" opacity={0.8} transparent />
              </mesh>
              <mesh position={[-1.0 + (health / maxHealth), 0, 0.001]}>
                <planeGeometry args={[(health / maxHealth) * 2.0, 0.23]} />
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
                {`${Math.ceil(health)}/${maxHealth}`}
              </Text>
            </>
          )}
        </Billboard>
      </group>

      {showDeathEffect && (
        <BoneVortex 
          position={currentPosition.current}
          onComplete={() => {
            setShowDeathEffect(false);
          }}
        />
      )}
    </>
  );
} 