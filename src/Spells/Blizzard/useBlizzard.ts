// src/Spells/Blizzard/useBlizzard.ts
import { useState, useCallback } from 'react';
import { Vector3 } from 'three';
import { calculateBlizzardDamage } from '@/Spells/Blizzard/BlizzardDamage';

interface UseBlizzardProps {
  onHit: (targetId: string, damage: number) => void;
  enemyData: Array<{ id: string; position: Vector3; health: number }>;
}

export function useBlizzard({ onHit, enemyData }: UseBlizzardProps) {
  const [activeBlizzards, setActiveBlizzards] = useState<Array<{
    id: number;
    position: Vector3;
    startTime: number;
  }>>([]);

  const triggerBlizzard = useCallback((position: Vector3) => {
    const blizzardId = Date.now();
    
    setActiveBlizzards(prev => [...prev, {
      id: blizzardId,
      position: position.clone(),
      startTime: Date.now()
    }]);

    // Set up damage interval
    const damageInterval = setInterval(() => {
      const hits = calculateBlizzardDamage(position, enemyData);
      hits.forEach(hit => {
        onHit(hit.targetId, hit.damage);
      });
    }, 500); // Damage tick every second

    // Clean up after 20 seconds
    setTimeout(() => {
      clearInterval(damageInterval);
      setActiveBlizzards(prev => prev.filter(b => b.id !== blizzardId));
    }, 8000);
  }, [enemyData, onHit]);

  return {
    activeBlizzards,
    triggerBlizzard
  };
}