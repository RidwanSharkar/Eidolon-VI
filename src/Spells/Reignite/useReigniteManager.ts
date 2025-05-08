import { useCallback } from 'react';
import { ChargeStatus } from '@/color/ChargedOrbitals';

interface UseReigniteManagerProps {
  setCharges: React.Dispatch<React.SetStateAction<Array<ChargeStatus>>>;
}

export function useReigniteManager({
  setCharges,
}: UseReigniteManagerProps) {
  const restoreCharge = useCallback(() => {
    console.log("[Reignite] processKill called");
    
    // We'll only use the function form of setCharges to avoid stale closure issues
    setCharges(currentCharges => {
      // Find up to two unavailable charges
      const unavailableIndices = currentCharges
        .map((charge, index) => charge.available ? -1 : index)
        .filter(index => index !== -1)
        .slice(0, 3); // Restore up to 2 charges per kill
      
      console.log("[Reignite] Found unavailable indices:", unavailableIndices);
      
      if (unavailableIndices.length === 0) {
        console.log("[Reignite] No unavailable charges found");
        return currentCharges; // No changes needed
      }
      
      console.log("[Reignite] Restoring charges at indices:", unavailableIndices);
      
      // Create a new array with the updated charges
      return currentCharges.map((charge, index) => 
        unavailableIndices.includes(index) ? {
          ...charge,
          available: true,
          cooldownStartTime: null
        } : charge
      );
    });
  }, [setCharges]);

  return { restoreCharge };
}
