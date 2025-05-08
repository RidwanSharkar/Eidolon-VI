import { useRef, useCallback } from 'react';
import { Vector3 } from 'three';

interface UseEagleEyeProps {
  isUnlocked: boolean;
  setDamageNumbers: (callback: (prev: Array<{
    id: number;
    damage: number;
    position: Vector3;
    isCritical: boolean;
    isEagleEye?: boolean;
  }>) => Array<{
    id: number;
    damage: number;
    position: Vector3;
    isCritical: boolean;
    isEagleEye?: boolean;
  }>) => void;
  nextDamageNumberId: React.MutableRefObject<number>;
  onHit: (targetId: string, damage: number) => void;
  eagleEyeManagerRef?: React.RefObject<{
    createEagleEyeEffect: (position: Vector3) => void;
  }>;
}

export function useEagleEye({
  isUnlocked,
  setDamageNumbers,
  nextDamageNumberId,
  onHit,
  eagleEyeManagerRef
}: UseEagleEyeProps) {
  // Track consecutive hits
  const consecutiveHits = useRef(0);
  // Time of last hit for tracking consecutive hits
  const lastHitTime = useRef(0);
  // Maximum time between hits to count as consecutive (milliseconds)
  const MAX_TIME_BETWEEN_HITS = 3000; // 5 seconds
  // Eagle Eye bonus damage amount
  const EAGLE_EYE_BONUS_DAMAGE = 67;
  
  /**
   * Process a hit to count for Eagle Eye and apply bonus damage if needed
   */
  const processHit = useCallback((targetId: string, position: Vector3) => {
    if (!isUnlocked) return false;
    
    const now = Date.now();
    
    // Check if too much time has passed since last hit
    if (now - lastHitTime.current > MAX_TIME_BETWEEN_HITS) {
      consecutiveHits.current = 0;
    }
    
    // Update last hit time
    lastHitTime.current = now;
    
    // Increment hit counter
    consecutiveHits.current += 1;
    
    // Check if this is the 3rd hit
    if (consecutiveHits.current >= 3) {
      // Reset counter
      consecutiveHits.current = 0;
      
      // Apply bonus damage
      onHit(targetId, EAGLE_EYE_BONUS_DAMAGE);
      
      // Show special damage number
      setDamageNumbers(prev => [...prev, {
        id: nextDamageNumberId.current++,
        damage: EAGLE_EYE_BONUS_DAMAGE,
        position: position.clone(),
        isCritical: true,
        isEagleEye: true
      }]);
      
      // Create Eagle Eye visual effect
      if (eagleEyeManagerRef?.current) {
        eagleEyeManagerRef.current.createEagleEyeEffect(position);
      }
      
      return true;
    }
    
    return false;
  }, [isUnlocked, onHit, setDamageNumbers, nextDamageNumberId, eagleEyeManagerRef]);
  
  /**
   * Reset the consecutive hits counter
   */
  const resetCounter = useCallback(() => {
    consecutiveHits.current = 0;
  }, []);
  
  return {
    processHit,
    resetCounter
  };
} 