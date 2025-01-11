import { useState, useCallback } from 'react';
import { Vector3 } from 'three';
import { calculateBoneclawHits } from '@/Spells/Boneclaw/BoneclawDamage';

interface UseBoneclawProps {
  onHit: (targetId: string, damage: number, isCritical: boolean, position: Vector3, isBoneclaw?: boolean) => void;
  enemyData: Array<{ id: string; position: Vector3; health: number }>;
}

export function useBoneclaw({ onHit, enemyData }: UseBoneclawProps) {
  const [activeEffects, setActiveEffects] = useState<Array<{
    id: number;
    position: Vector3;
    direction: Vector3;
  }>>([]);
  
  const [activeScratchEffects, setActiveScratchEffects] = useState<Array<{
    id: number;
    position: Vector3;
    direction: Vector3;
  }>>([]);

  const triggerBoneclaw = useCallback((position: Vector3, direction: Vector3) => {
    const hits = calculateBoneclawHits(position, direction, enemyData);
    
    hits.forEach(hit => {
      onHit(
        hit.targetId, 
        hit.damage, 
        hit.isCritical, 
        hit.position,
        true // Add isBoneclaw flag
      );
    });

    setActiveEffects(prev => [...prev, {
      id: Date.now(),
      position: position.clone(),
      direction: direction.clone()
    }]);
  }, [enemyData, onHit]);

  const createScratchEffect = useCallback((position: Vector3, direction: Vector3) => {
    setActiveScratchEffects(prev => [...prev, {
      id: Date.now(),
      position: position.clone().add(direction.clone().multiplyScalar(2)),
      direction: direction.clone()
    }]);
  }, []);

  const removeEffect = useCallback((id: number) => {
    setActiveEffects(prev => prev.filter(effect => effect.id !== id));
  }, []);

  const removeScratchEffect = useCallback((id: number) => {
    setActiveScratchEffects(prev => prev.filter(effect => effect.id !== id));
  }, []);

  return {
    activeEffects,
    activeScratchEffects,
    triggerBoneclaw,
    createScratchEffect,
    removeEffect,
    removeScratchEffect
  };
}