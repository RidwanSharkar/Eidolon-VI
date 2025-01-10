import React, { useRef, useState } from 'react';
import { Group } from 'three';
import { useFrame } from '@react-three/fiber';
import { SummonProps } from './SummonProps';
import { Enemy } from '@/versus/enemy';
import SummonedMage from './SummonedMage';

export default function SummonedHandler({ position, enemyData, onDamage, onComplete, onStartCooldown }: SummonProps) {
  const groupRef = useRef<Group>(null);
  const [currentTarget, setCurrentTarget] = useState<Enemy | null>(null);
  const lastAttackTime = useRef(0);
  const ATTACK_COOLDOWN = 1250; // 1.25 seconds between attacks
  const DAMAGE = 15;
  const RANGE = 10;
  const DURATION = 200000; // Fixed 30 second duration (as specified in the tooltip)
  const startTime = useRef(Date.now());
  const FOLLOW_RANGE = 10; // Maximum distance from original position
  const originalPosition = useRef(position.clone()); // Store the original summoning position

  useFrame(() => {
    if (!groupRef.current) return;

    // Check duration
    if (Date.now() - startTime.current > DURATION) {
      onComplete();
      onStartCooldown();
      return;
    }

    // Find nearest enemy if no current target or current target is dead
    if (!currentTarget || currentTarget.health <= 0) {
      const nearestEnemy = enemyData
        .filter(enemy => enemy.health > 0)
        .reduce<Enemy | null>((nearest, enemy) => {
          const distance = position.distanceTo(enemy.position);
          if (!nearest || distance < position.distanceTo(nearest.position)) {
            return enemy;
          }
          return nearest;
        }, null);

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

    // Modified movement logic
    if (currentTarget && groupRef.current) {
      const direction = currentTarget.position.clone().sub(position);
      direction.y = 0; // Force movement to stay on ground plane
      
      // Check if moving towards target would exceed FOLLOW_RANGE
      const distanceToOrigin = originalPosition.current.distanceTo(groupRef.current.position);
      const potentialNewPosition = groupRef.current.position.clone().add(direction.normalize().multiplyScalar(0.1));
      const potentialDistanceToOrigin = originalPosition.current.distanceTo(potentialNewPosition);

      // Only move if:
      // 1. We're too far from the target (> 3 units) AND
      // 2. Moving wouldn't take us too far from the original position OR we're currently too far from the original position
      if (direction.length() > 3 && 
          (potentialDistanceToOrigin < FOLLOW_RANGE || distanceToOrigin > FOLLOW_RANGE)) {
        
        // If we're too far from original position, move back towards it instead of towards target
        if (distanceToOrigin > FOLLOW_RANGE) {
          const returnDirection = originalPosition.current.clone()
            .sub(groupRef.current.position)
            .normalize()
            .multiplyScalar(0.1);
          groupRef.current.position.add(returnDirection);
        } else {
          // Normal movement towards target
          groupRef.current.position.copy(potentialNewPosition);
        }

        // Maintain a fixed Y position
        groupRef.current.position.y = 0;
      }
    }
  });

  return (
    <group ref={groupRef} position={position.toArray()}>
      <SummonedMage
        position={[0, 0, 0]}
        isAttacking={!!currentTarget && currentTarget.position && 
          position.distanceTo(currentTarget.position) <= RANGE}
        isWalking={!!currentTarget && currentTarget.position && 
          position.distanceTo(currentTarget.position) > RANGE}
        onHit={(targetId, damage, position) => {
          onDamage(targetId, damage, position);
        }}
      />
    </group>
  );
}