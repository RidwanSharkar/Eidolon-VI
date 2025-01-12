import React, { useRef, useState } from 'react';
import { Group, Vector3 } from 'three';
import { useFrame } from '@react-three/fiber';
import { SummonProps } from '@/Spells/Summon/SummonProps';
import { Enemy } from '@/Versus/enemy';
import TotemModel from '@/Spells/Summon/TotemModel';
import Fireball from '../Fireball/Fireball';
import { calculateDamage } from '@/Weapons/damage';

const FIREBALL_SPEED = 0.3; // Match the speed from Fireball.tsx

export default function SummonedHandler({
  position,
  enemyData,
  onDamage,
  onComplete,
  onStartCooldown,
  setActiveEffects,
}: SummonProps) {
  const groupRef = useRef<Group>(null);
  const [currentTarget, setCurrentTarget] = useState<Enemy | null>(null);
  const lastAttackTime = useRef(0);
  const ATTACK_COOLDOWN = 3000;
  const RANGE = 40;
  const DURATION = 30000;
  const FIREBALL_DAMAGE = 53;
  const startTime = useRef(Date.now());
  const [fireballs, setFireballs] = useState<
    Array<{
      id: number;
      position: Vector3;
      direction: Vector3;
      startPosition: Vector3;
      maxDistance: number;
      targetId: string;
      predictedImpactPosition?: Vector3;
    }>
  >([]);

  const predictTargetPosition = (target: Enemy): Vector3 => {
    return target.position.clone().setY(1.5);
  };

  const handleFireballImpact = (id: number) => {
    const fireball = fireballs.find(fb => fb.id === id);
    if (!fireball) return;

    const { targetId } = fireball;
    const targetEnemy = enemyData.find(enemy => 
      enemy.id === targetId && enemy.health > 0
    );
    
    if (!targetEnemy) {
      setFireballs(prev => prev.filter(fb => fb.id !== id));
      return;
    }

    // Increase hit radius and use 3D distance check
    const actualImpactPos = targetEnemy.position.clone().setY(1.5);
    const distanceToTarget = fireball.position.distanceTo(targetEnemy.position);
    const HIT_RADIUS = 2.0; // Increased from 1.5

    if (distanceToTarget <= HIT_RADIUS) {
      const { damage } = calculateDamage(FIREBALL_DAMAGE);
      onDamage(targetId, damage, actualImpactPos);

      setActiveEffects(prev => [...prev, {
        id: Date.now(),
        type: 'fireballExplosion',
        position: actualImpactPos,
        direction: new Vector3(),
        duration: 0.2,
        startTime: Date.now(),
      }]);
    }

    setFireballs(prev => prev.filter(fb => fb.id !== id));
  };

  useFrame((_, delta) => {
    if (!groupRef.current) return;

    // Duration check
    if (Date.now() - startTime.current > DURATION) {
      onComplete();
      onStartCooldown();
      return;
    }

    // Update fireball positions
    setFireballs(prev => prev.map(fireball => {
      const movement = fireball.direction.clone().multiplyScalar(FIREBALL_SPEED * delta * 60);
      fireball.position.add(movement);
      return fireball;
    }));

    // Improved target finding with prediction
    if (!currentTarget || currentTarget.health <= 0) {
      const viableTargets = enemyData
        .filter(enemy => enemy.health > 0)
        .map(enemy => ({
          enemy,
          predictedPos: predictTargetPosition(enemy),
          distance: position.distanceTo(enemy.position)
        }))
        .filter(({ distance }) => distance <= RANGE)
        .sort((a, b) => a.distance - b.distance); // Sort by distance

      const bestTarget = viableTargets[0];
      setCurrentTarget(bestTarget?.enemy || null);
    }

    // Improved fireball creation
    const now = Date.now();
    if (now - lastAttackTime.current >= ATTACK_COOLDOWN && currentTarget) {
      const predictedPosition = predictTargetPosition(currentTarget);
      const startPosition = position.clone().add(new Vector3(0, 1.4, 0));
      
      const direction = predictedPosition
        .clone()
        .sub(startPosition)
        .normalize();

      setFireballs(prev => [...prev, {
        id: Date.now(),
        position: startPosition.clone(),
        startPosition: startPosition.clone(),
        direction: direction,
        maxDistance: RANGE,
        targetId: currentTarget.id,
        predictedImpactPosition: predictedPosition
      }]);

      lastAttackTime.current = now;
    }
  });

  console.log('Enemy Data in Summon:', {
    totalEnemies: enemyData.length,
    livingEnemies: enemyData.filter(enemy => enemy.health > 0).length,
    enemyPositions: enemyData.map(e => ({
      id: e.id,
      health: e.health,
      position: e.position.toArray(),
    })),
  });

  return (
    <group ref={groupRef} position={position.toArray()}>
      <TotemModel
        isAttacking={
          !!currentTarget && position.distanceTo(currentTarget.position) <= RANGE
        }
      />
      {currentTarget && (
        <mesh position={[0, 2, 0]}>
          <sphereGeometry args={[0.1, 8, 8]} />
          <meshBasicMaterial color="red" />
          <pointLight color="red" intensity={1} distance={2} />
        </mesh>
      )}
      {fireballs.map(fireball => (
        <Fireball
          key={fireball.id}
          position={fireball.position}
          direction={fireball.direction}
          onImpact={() => handleFireballImpact(fireball.id)}
        />
      ))}
    </group>
  );
}