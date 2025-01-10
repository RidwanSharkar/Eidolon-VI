import React, { useRef, useState } from 'react';
import { Group } from 'three';
import { useFrame } from '@react-three/fiber';
import { SummonProps } from './SummonProps';
import { Enemy } from '@/versus/enemy';

export default function Summon({ position, enemyData, onDamage, onComplete }: SummonProps) {
  const groupRef = useRef<Group>(null);
  const [currentTarget, setCurrentTarget] = useState<Enemy | null>(null);
  const lastAttackTime = useRef(0);
  const ATTACK_COOLDOWN = 1250; // 1 second between attacks
  const DAMAGE = 15;
  const RANGE = 10;
  const DURATION = 200000; // 30 seconds duration
  const startTime = useRef(Date.now());

  useFrame(() => {
    if (!groupRef.current) return;

    // Check duration
    if (Date.now() - startTime.current > DURATION) {
      onComplete();
      return;
    }

    // Find nearest enemy if no current target or current target is dead
    if (!currentTarget || currentTarget.health <= 0) {
      const nearestEnemy = enemyData
        .filter(enemy => enemy.health > 0)
        .reduce((nearest, enemy) => {
          const distance = position.distanceTo(enemy.position);
          if (!nearest || distance < position.distanceTo(nearest.position)) {
            return enemy;
          }
          return nearest;
        }, null as Enemy | null);

      setCurrentTarget(nearestEnemy);
      return;
    }

    // Attack logic
    const now = Date.now();
    if (now - lastAttackTime.current >= ATTACK_COOLDOWN) {
      const distanceToTarget = position.distanceTo(currentTarget.position);
      
      if (distanceToTarget <= RANGE) {
        onDamage(currentTarget.id, DAMAGE, currentTarget.position.clone());
        lastAttackTime.current = now;
      }
    }

    // Move towards target
    if (currentTarget && groupRef.current) {
      const direction = currentTarget.position.clone().sub(position);
      if (direction.length() > 3) { // Keep some distance
        direction.normalize();
        groupRef.current.position.add(direction.multiplyScalar(0.1));
      }
    }
  });

  return (
    <group ref={groupRef} position={position.clone()}>
      {/* Add your summon model/mesh here */}
      <mesh>
        <boxGeometry args={[1, 2, 1]} />
        <meshStandardMaterial color="purple" />
      </mesh>
    </group>
  );
}