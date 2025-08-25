// src/Spells/Firestorm/useFirestorm.ts
import { useState, useCallback } from 'react';
import { Vector3 } from 'three';
import { calculateFirestormDamage } from '@/Spells/Firestorm/FirestormDamage';

interface UseFirestormProps {
  onHit: (targetId: string, damage: number) => void;
  enemyData: Array<{ id: string; position: Vector3; health: number }>;
}

export function useFirestorm({ onHit, enemyData }: UseFirestormProps) {
  const [activeFirestorms, setActiveFirestorms] = useState<Array<{
    id: number;
    position: Vector3;
    startTime: number;
  }>>([]);

  const triggerFirestorm = useCallback((position: Vector3) => {
    const firestormId = Date.now();
    
    setActiveFirestorms(prev => [...prev, {
      id: firestormId,
      position: position.clone(),
      startTime: Date.now()
    }]);

    // Set up damage interval
    const damageInterval = setInterval(() => {
      const hits = calculateFirestormDamage(position, enemyData);
      hits.forEach(hit => {
        onHit(hit.targetId, hit.damage);
      });
    }, 333); // Damage tick every 500ms

    // Clean up after 3 seconds (since it refreshes on criticals)
    setTimeout(() => {
      clearInterval(damageInterval);
      setActiveFirestorms(prev => prev.filter(f => f.id !== firestormId));
    }, 4500);
  }, [enemyData, onHit]);

  return {
    activeFirestorms,
    triggerFirestorm
  };
}