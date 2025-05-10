import { useCallback } from 'react';
import { ChargeStatus } from '@/color/ChargedOrbitals';

interface UseReigniteManagerProps {
  setCharges: React.Dispatch<React.SetStateAction<Array<ChargeStatus>>>;
}

export function useReigniteManager({
  setCharges,
}: UseReigniteManagerProps) {
  const restoreCharge = useCallback(() => {
    try {
      console.log("[Reignite] restoreCharge called");
      
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
        
        console.log("[Reignite] Found unavailable indices to restore:", unavailableIndices);
        
        if (unavailableIndices.length === 0) {
          console.log("[Reignite] No unavailable charges found, all charges are already available");
          return currentCharges; // No changes needed
        }
        
        // Log exactly how many orbs we're restoring
        console.log(`[Reignite] Restoring exactly ${unavailableIndices.length} orbs at indices:`, unavailableIndices);
        
        // Create a new array with the updated charges
        const updatedCharges = currentCharges.map((charge, index) => 
          unavailableIndices.includes(index) ? {
            ...charge,
            available: true,
            cooldownStartTime: null
          } : charge
        );
        
        // Count how many charges are now available after restoration
        const availableCount = updatedCharges.filter(charge => charge.available).length;
        const totalCount = updatedCharges.length;
        
        console.log(`[Reignite] After restoration: ${availableCount}/${totalCount} charges are available`);
        console.log("[Reignite] Updated charges state:", 
          updatedCharges.map(charge => ({
            id: charge.id,
            available: charge.available,
            cooldownStartTime: charge.cooldownStartTime
          }))
        );
        
        return updatedCharges;
      });
    } catch (error) {
      console.error("[Reignite] Error in restoreCharge:", error);
    }
  }, [setCharges]);

  return { restoreCharge };
}
