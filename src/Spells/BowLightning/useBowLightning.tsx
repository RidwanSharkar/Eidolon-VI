import { useState, useCallback, useRef } from 'react';
import { Vector3 } from 'three';

interface LightningStrike {
  id: number;
  position: Vector3;
}

export function useBowLightning() {
  const [activeStrikes, setActiveStrikes] = useState<LightningStrike[]>([]);
  const nextStrikeId = useRef(1);
  const [lastLightningTarget, setLastLightningTarget] = useState<string | null>(null);
  
  const createLightningStrike = useCallback((position: Vector3, targetId?: string) => {
    const newStrike = {
      id: nextStrikeId.current++,
      position: position.clone()
    };
    
    // Track the target if provided
    if (targetId) {
      setLastLightningTarget(targetId);
    }
    
    setActiveStrikes(prev => [...prev, newStrike]);
    return newStrike.id;
  }, []);
  
  const removeLightningStrike = useCallback((id: number) => {
    setActiveStrikes(prev => prev.filter(strike => strike.id !== id));
  }, []);
  
  return {
    activeStrikes,
    createLightningStrike,
    removeLightningStrike,
    lastLightningTarget
  };
}
