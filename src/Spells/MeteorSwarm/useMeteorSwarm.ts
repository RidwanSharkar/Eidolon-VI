import { useState, useCallback, useRef } from 'react';
import { Vector3 } from 'three';
import { Enemy } from '@/Versus/enemy';

interface MeteorTarget {
  position: Vector3;
  targetId: string;
  delay: number;
}

interface UseMeteorSwarmProps {
  enemyData: Enemy[];
  onHit: (targetId: string, damage: number, isCritical: boolean, position: Vector3) => void;
  playerPosition: Vector3;
}

interface MeteorSwarmEffect {
  id: number;
  targets: MeteorTarget[];
  startTime: number;
}

export function useMeteorSwarm({ enemyData, playerPosition }: UseMeteorSwarmProps) {
  const [activeMeteorSwarms, setActiveMeteorSwarms] = useState<MeteorSwarmEffect[]>([]);
  const lastCastTime = useRef<number>(0);
  
  // Constants
  const METEOR_COUNT = 5;

  const METEOR_DELAY_INTERVAL = 200; // 0.2 seconds in milliseconds

  const COOLDOWN = 15000; // 15 seconds

  const findClosestEnemies = useCallback((count: number): Enemy[] => {
    if (enemyData.length === 0) return [];

    // Filter out dead and dying enemies first
    const livingEnemies = enemyData.filter(enemy => enemy.health > 0 && !enemy.isDying);
    
    if (livingEnemies.length === 0) return [];

    // Calculate distances and sort by proximity
    const enemiesWithDistance = livingEnemies.map(enemy => ({
      enemy,
      distance: playerPosition.distanceTo(new Vector3(enemy.position.x, 0, enemy.position.z))
    }));

    enemiesWithDistance.sort((a, b) => a.distance - b.distance);
    
    // Return up to 'count' closest enemies
    return enemiesWithDistance.slice(0, count).map(item => item.enemy);
  }, [enemyData, playerPosition]);

  const distributeMeteorstToTargets = useCallback((targetCount: number): MeteorTarget[] => {
    const closestEnemies = findClosestEnemies(Math.min(targetCount, METEOR_COUNT));
    
    if (closestEnemies.length === 0) return [];

    const targets: MeteorTarget[] = [];
    
    // Distribute all 5 meteors among available enemies
    for (let i = 0; i < METEOR_COUNT; i++) {
      const targetEnemy = closestEnemies[i % closestEnemies.length];
      targets.push({
        position: new Vector3(targetEnemy.position.x, 0, targetEnemy.position.z),
        targetId: targetEnemy.id,
        delay: i * METEOR_DELAY_INTERVAL // 0ms, 200ms, 400ms, 600ms, 800ms
      });
    }

    return targets;
  }, [findClosestEnemies]);

  const castMeteorSwarm = useCallback(() => {
    const now = Date.now();
    if (now - lastCastTime.current < COOLDOWN) {
      return false;
    }

    if (enemyData.length === 0) {
      return false; // No enemies to target
    }

    lastCastTime.current = now;

    const targets = distributeMeteorstToTargets(enemyData.length);
    
    if (targets.length === 0) {
      return false;
    }

    const meteorSwarmEffect: MeteorSwarmEffect = {
      id: Date.now(),
      targets,
      startTime: now
    };

    setActiveMeteorSwarms(prev => [...prev, meteorSwarmEffect]);

    // Note: Damage is now handled directly in the Meteor component on impact
    // This ensures proper timing and target tracking

    // Clean up the effect after all meteors have fallen and impacts completed
    const totalDuration = 1000 + (METEOR_COUNT - 1) * METEOR_DELAY_INTERVAL + 2000; // Extra time for impact effects
    setTimeout(() => {
      setActiveMeteorSwarms(prev => 
        prev.filter(effect => effect.id !== meteorSwarmEffect.id)
      );
    }, totalDuration);

    return true;
  }, [enemyData, distributeMeteorstToTargets]);

  const removeMeteorSwarm = useCallback((id: number) => {
    setActiveMeteorSwarms(prev => prev.filter(effect => effect.id !== id));
  }, []);

  return {
    activeMeteorSwarms,
    castMeteorSwarm,
    removeMeteorSwarm
  };
} 