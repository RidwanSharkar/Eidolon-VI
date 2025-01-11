import React, { useRef, useState } from 'react';
import { Group, Vector3 } from 'three';
import { useFrame } from '@react-three/fiber';
import { SummonProps } from '@/Spells/Summon/SummonProps';
import { Enemy } from '@/Versus/enemy';
import TotemModel from '@/Spells/Summon/TotemModel';
import Fireball from '../Fireball/Fireball';
import { calculateDamage } from '@/Weapons/damage';

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
    }>
  >([]);

  // Handle fireball impact with explosion effect
  const handleFireballImpact = (id: number, impactPosition?: Vector3) => {
    // Find the fireball based on the id to retrieve targetId
    const fireball = fireballs.find(fb => fb.id === id);
    if (!fireball) {
      console.warn(`Fireball with id ${id} not found.`);
      return;
    }

    const { targetId } = fireball;

    // Remove the fireball from the state
    setFireballs(prev => prev.filter(fb => fb.id !== id));

    // Find the target enemy
    const targetEnemy = enemyData.find(enemy => enemy.id === targetId);
    if (!targetEnemy || targetEnemy.health <= 0) return;

    // Calculate distance to target
    const distanceToTarget = impactPosition?.distanceTo(targetEnemy.position) || 0;
    const HIT_RADIUS = 1.0; // Increased hit radius for better hit detection

    // Only deal damage if within hit radius
    if (distanceToTarget <= HIT_RADIUS) {
      const { damage } = calculateDamage(FIREBALL_DAMAGE);
      onDamage(targetId, damage, targetEnemy.position);

      setActiveEffects(prev => [
        ...prev,
        {
          id: Date.now(),
          type: 'fireballExplosion',
          position: targetEnemy.position.clone().setY(1.5),
          direction: new Vector3(),
          duration: 0.2,
          startTime: Date.now(),
        },
      ]);
    }
  };

  useFrame(() => {
    if (!groupRef.current) return;

    // Duration check
    if (Date.now() - startTime.current > DURATION) {
      onComplete();
      onStartCooldown();
      return;
    }

    // Target finding logic - prioritize closest living enemy
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
      if (nearestEnemy) {
        console.log('New Target:', {
          id: nearestEnemy.id,
          position: nearestEnemy.position,
          health: nearestEnemy.health,
        });
      }
      return;
    }

    // Attack logic - Create new fireball with proper targeting
    const now = Date.now();
    if (now - lastAttackTime.current >= ATTACK_COOLDOWN && currentTarget) {
      const distanceToTarget = position.distanceTo(currentTarget.position);

      if (distanceToTarget <= RANGE) {
        const startPosition = position.clone().add(new Vector3(0, 1.5, 0));
        const targetPosition = currentTarget.position.clone();
        targetPosition.y = 1.5; // Adjust height to target enemy center mass

        const direction = targetPosition.clone().sub(startPosition).normalize();

        console.log('Firing at:', {
          startPos: startPosition,
          targetPos: targetPosition,
          direction: direction,
        });

        setFireballs(prev => [
          ...prev,
          {
            id: Date.now(),
            position: startPosition.clone(),
            startPosition: startPosition.clone(),
            direction: direction,
            maxDistance: 35,
            targetId: currentTarget.id, // Ensure targetId is set
          },
        ]);

        lastAttackTime.current = now;
      }
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
          onImpact={(impactPosition?: Vector3) =>
            handleFireballImpact(fireball.id, impactPosition)
          }
        />
      ))}
    </group>
  );
}