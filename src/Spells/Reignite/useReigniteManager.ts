import { useCallback, useRef } from 'react';
import { Group, Vector3 } from 'three';
import { ChargeStatus } from '@/color/ChargedOrbitals';

interface UseReigniteManagerProps {
  setCharges: React.Dispatch<React.SetStateAction<Array<ChargeStatus>>>;
  onHealthChange?: (health: number) => void;
  setDamageNumbers?: React.Dispatch<React.SetStateAction<Array<{
    id: number;
    damage: number;
    position: Vector3;
    isCritical: boolean;
    isHealing?: boolean;
  }>>>;
  nextDamageNumberId?: React.MutableRefObject<number>;
  parentRef?: React.RefObject<Group>;
}

export function useReigniteManager({
  setCharges,
  onHealthChange,
  setDamageNumbers,
  nextDamageNumberId,
  parentRef
}: UseReigniteManagerProps) {
  const healingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const healingCountRef = useRef(0);
  const restoreCharge = useCallback(() => {
    try {
      
      // We'll only use the function form of setCharges to avoid stale closure issues
      setCharges(currentCharges => {
        console.log("[Reignite] Current charges state:", 
          currentCharges.map(charge => ({
            id: charge.id,
            available: charge.available,
            cooldownStartTime: charge.cooldownStartTime
          }))
        );
        
        // Find up to three unavailable charges
        const unavailableIndices = currentCharges
          .map((charge, index) => charge.available ? -1 : index)
          .filter(index => index !== -1)
          .slice(0, 3); // Always try to restore exactly 3 charges per kill
        
        
        if (unavailableIndices.length === 0) {
          return currentCharges; // No changes needed
        }
        
        // Log exactly how many orbs we're restoring
        
        // Create a new array with the updated charges
        const updatedCharges = currentCharges.map((charge, index) => 
          unavailableIndices.includes(index) ? {
            ...charge,
            available: true,
            cooldownStartTime: null
          } : charge
        );
      

        
        return updatedCharges;
      });
    } catch (error) {
      console.error("[Reignite] Error in restoreCharge:", error);
    }
  }, [setCharges]);

  const startHealing = useCallback(() => {
    // Clear any existing healing interval
    if (healingIntervalRef.current) {
      clearInterval(healingIntervalRef.current);
    }

    // Reset healing count
    healingCountRef.current = 0;

    // Start healing over time: 2HP per second for 3 seconds (6 total HP)
    healingIntervalRef.current = setInterval(() => {
      healingCountRef.current++;
      
      // Heal for 2 HP
      if (onHealthChange) {
        onHealthChange(2);
      }

      // Show healing damage number
      if (setDamageNumbers && nextDamageNumberId && parentRef?.current) {
        setDamageNumbers(prev => [...prev, {
          id: nextDamageNumberId.current++,
          damage: 2,
          position: parentRef.current!.position.clone().add(new Vector3(0, 2, 0)),
          isCritical: false,
          isHealing: true
        }]);
      }

      // Stop after 3 ticks (3 seconds)
      if (healingCountRef.current >= 3) {
        if (healingIntervalRef.current) {
          clearInterval(healingIntervalRef.current);
          healingIntervalRef.current = null;
        }
      }
    }, 1000); // Every 1 second
  }, [onHealthChange, setDamageNumbers, nextDamageNumberId, parentRef]);

  const processKill = useCallback(() => {
    // Restore charge
    restoreCharge();
    
    // Start healing over time
    startHealing();
  }, [restoreCharge, startHealing]);

  return { restoreCharge, processKill };
}
