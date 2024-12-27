import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Group, Vector3 } from 'three';
import { Billboard, Text } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import BossModel from './BossModel';
import { Enemy } from '../enemy';

interface BossUnitProps {
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

export default function BossUnit({
  id,
  initialPosition,
  position,
  health,
  maxHealth,
  onTakeDamage,
  onPositionUpdate,
  playerPosition,
  onAttackPlayer,
}: BossUnitProps & Pick<Enemy, 'position'>) {
  const bossRef = useRef<Group>(null);
  const lastAttackTime = useRef<number>(Date.now() + 2000);
  const [isAttacking, setIsAttacking] = useState(false);
  const [isDead, setIsDead] = useState(false);
  const [isSpawning, setIsSpawning] = useState(true);

  const currentPosition = useRef(initialPosition.clone());
  const targetPosition = useRef(initialPosition.clone());
  const currentHealth = useRef(health);

  // Boss-specific constants
  const ATTACK_RANGE = 15;
  const ATTACK_COOLDOWN = 10000;
  const MOVEMENT_SPEED = 0.01;
  const SMOOTHING_FACTOR = 0.003;
  const ATTACK_DAMAGE = 50;

  // Sync health changes
  useEffect(() => {
    currentHealth.current = health;
  }, [health]);

  // Handle damage with proper synchronization
  const handleDamage = useCallback((damage: number) => {
    if (currentHealth.current <= 0) return;
    
    const newHealth = Math.max(0, currentHealth.current - damage);
    onTakeDamage(`boss-${id}`, damage);
    
    if (newHealth === 0 && currentHealth.current > 0) {
      setIsDead(true);
    }
  }, [id, onTakeDamage]);

  // Position update logic
  useEffect(() => {
    if (position) {
      currentPosition.current = position.clone();
    }
  }, [position]);

  useEffect(() => {
    if (bossRef.current) {
      bossRef.current.position.copy(currentPosition.current);
    }
  }, []);

  // Movement and attack logic
  useFrame(() => {
    if (!bossRef.current || health <= 0 || !playerPosition) return;

    const direction = new Vector3()
      .subVectors(playerPosition, currentPosition.current)
      .normalize();

    const distanceToPlayer = currentPosition.current.distanceTo(playerPosition);

    if (distanceToPlayer > ATTACK_RANGE && health > 0) {
      setIsAttacking(false);
      
      targetPosition.current.copy(currentPosition.current).add(
        direction.multiplyScalar(MOVEMENT_SPEED)
      );
      
      currentPosition.current.lerp(targetPosition.current, SMOOTHING_FACTOR);
      
      if (bossRef.current) {
        bossRef.current.position.copy(currentPosition.current);
        
        const lookTarget = new Vector3()
          .copy(playerPosition)
          .setY(currentPosition.current.y);
        bossRef.current.lookAt(lookTarget);
      }
      
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
        }, 800); // Longer attack animation
      }
    }
  });

  // Death handling
  useEffect(() => {
    if (health === 0 && !isDead) {
      console.log(`Boss ${id} died`);
      setIsDead(true);
    }
  }, [setIsDead, health, id, isDead]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsSpawning(false);
    }, 1000); // 1 second delay before showing the boss

    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <group 
        ref={bossRef} 
        visible={!isSpawning && health > 0}
        position={currentPosition.current}
        scale={[1.5, 1.5, 1.5]}
        onClick={(e) => {
          e.stopPropagation();
          if (currentHealth.current > 0) {
            handleDamage(10);
          }
        }}
        onPointerDown={(e) => {
          e.stopPropagation();
          if (currentHealth.current > 0) {
            handleDamage(10);
          }
        }}
      >
        <BossModel
          isAttacking={isAttacking}
          isWalking={!isAttacking && health > 0}
          onHit={handleDamage}
        />

        {/* Boss health bar */}
        <Billboard
          position={[0, 5, 0]}
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
              <mesh position={[-2.0 + (currentHealth.current / maxHealth) * 2, 0, 0.001]}>
                <planeGeometry args={[(currentHealth.current / maxHealth) * 4.0, 0.35]} />
                <meshBasicMaterial color="#ff0000" opacity={0.9} transparent />
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
            </>
          )}
        </Billboard>
      </group>
    </>
  );
} 