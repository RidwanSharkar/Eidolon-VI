import React, { useRef, useEffect, useState } from 'react';
import { Group, Vector3 } from 'three';
import { Billboard, Text } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import CustomSkeleton from './CustomSkeleton';
import BoneVortex from '../Effects/BoneVortex';

interface EnemyUnitProps {
  id: string;
  initialPosition: Vector3;
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
  health,
  maxHealth,
  onTakeDamage,
  onPositionUpdate,
  playerPosition,
  onAttackPlayer,
}: EnemyUnitProps) {
  const enemyRef = useRef<Group>(null);
  const lastAttackTime = useRef<number>(Date.now() + 2000);
  const [isAttacking, setIsAttacking] = useState(false);
  const [showDeathEffect, setShowDeathEffect] = useState(false);
  const [isDead, setIsDead] = useState(false);
  const currentPosition = useRef(initialPosition.clone());

  const ATTACK_RANGE = 2;
  const ATTACK_COOLDOWN = 2000;
  const MOVEMENT_SPEED = 0.02;
  const ATTACK_DAMAGE = 5;

  useEffect(() => {
    if (enemyRef.current) {
      enemyRef.current.position.copy(initialPosition);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (health === 0 && !isDead) {
      console.log(`Enemy ${id} died`);
      setIsDead(true);
      setShowDeathEffect(true);
    }
  }, [health, id, isDead]);

  useFrame(() => {
    if (!enemyRef.current || health <= 0 || !playerPosition) return;

    const direction = new Vector3()
      .subVectors(playerPosition, enemyRef.current.position)
      .normalize();

    const distanceToPlayer = enemyRef.current.position.distanceTo(playerPosition);

    if (distanceToPlayer > ATTACK_RANGE && health > 0) {
      setIsAttacking(false);
      enemyRef.current.position.add(direction.multiplyScalar(MOVEMENT_SPEED));
      enemyRef.current.lookAt(playerPosition);
      currentPosition.current.copy(enemyRef.current.position);
      onPositionUpdate(id, currentPosition.current);
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
    console.log(`EnemyUnit ${id} health updated:`, health);
  }, [health, id]);

  return (
    <>
      <group 
        ref={enemyRef} 
        visible={health > 0}
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
                position={[0, 0, 0]}
                fontSize={0.2}
                color="white"
                anchorX="center"
                anchorY="middle"
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