import { useState, useCallback, useRef } from 'react';
import { Vector3, Group } from 'three';
import { calculateDragonBreathHits } from './DragonBreathDamage';
import { DamageNumber } from '@/Unit/useDamageNumbers';

interface DragonBreathState {
  position: Vector3;
  direction: Vector3;
  startTime: number;
}

interface UseDragonBreathProps {
  parentRef: React.RefObject<Group>;
  onHit: (targetId: string, damage: number) => void;
  enemyData: Array<{ id: string; position: Vector3; health: number; isDying?: boolean }>;
  setDamageNumbers: (fn: (prev: DamageNumber[]) => DamageNumber[]) => void;
  nextDamageNumberId: { current: number };
}

interface UseDragonBreathReturn {
  isActive: boolean;
  dragonBreathState: DragonBreathState | null;
  activateDragonBreath: () => boolean;
}

export function useDragonBreath({
  parentRef,
  onHit,
  enemyData,
  setDamageNumbers,
  nextDamageNumberId
}: UseDragonBreathProps): UseDragonBreathReturn {
  const [isActive, setIsActive] = useState(false);
  const [dragonBreathState, setDragonBreathState] = useState<DragonBreathState | null>(null);
  const hitEnemiesRef = useRef<Set<string>>(new Set());

  const activateDragonBreath = useCallback(() => {
    if (!parentRef.current || isActive) return false;

    const position = parentRef.current.position.clone();
    position.y += 1.5; // Breath originates from mouth level

    const direction = new Vector3(0, 0, 1)
      .applyQuaternion(parentRef.current.quaternion)
      .normalize();

    const startTime = Date.now();

    // Clear previous hit tracking
    hitEnemiesRef.current.clear();

    // Calculate immediate damage to all enemies in cone
    const hits = calculateDragonBreathHits(position, direction, enemyData, hitEnemiesRef.current);

    // Apply damage and create damage numbers
    hits.forEach(hit => {
      // Mark enemy as hit to prevent multiple hits
      hitEnemiesRef.current.add(hit.targetId);
      
      // Apply damage
      onHit(`enemy-${hit.targetId}`, hit.damage);
      
      // Create damage number
      setDamageNumbers(prev => [...prev, {
        id: nextDamageNumberId.current++,
        damage: hit.damage,
        position: hit.position.clone().add(new Vector3(0, 2, 0)),
        isCritical: hit.isCritical,
        isDragonBreath: true
      }]);
    });

    setDragonBreathState({
      position,
      direction,
      startTime
    });

    setIsActive(true);

    // Auto-deactivate after breath duration
    setTimeout(() => {
      setIsActive(false);
      setDragonBreathState(null);
      hitEnemiesRef.current.clear();
    }, 1500); // Slightly longer than visual effect to ensure completion

    return true;
  }, [parentRef, onHit, enemyData, setDamageNumbers, nextDamageNumberId, isActive]);

  return {
    isActive,
    dragonBreathState,
    activateDragonBreath
  };
}
