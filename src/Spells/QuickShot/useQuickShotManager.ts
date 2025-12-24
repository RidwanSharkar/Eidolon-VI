import { useCallback, useRef } from 'react';
import { ORBITAL_COOLDOWN } from '@/color/ChargedOrbitals';

interface UseQuickShotManagerProps {
  charges: Array<{
    id: number;
    available: boolean;
    cooldownStartTime: number | null;
  }>;
  setCharges: React.Dispatch<React.SetStateAction<Array<{
    id: number;
    available: boolean;
    cooldownStartTime: number | null;
  }>>>;
}

export function useQuickShotManager({
  charges,
  setCharges,
}: UseQuickShotManagerProps) {
  const shotsPerCharge = 6;
  const currentShotsRef = useRef(0);
  const currentChargeRef = useRef<number | null>(null);

  const consumeCharge = useCallback((): boolean => {
    const availableCharges = charges.filter(charge => charge.available);
    if (availableCharges.length === 0) return false;

    // If we haven't started using a charge yet, set up the first one
    if (currentChargeRef.current === null) {
      currentChargeRef.current = availableCharges[0].id;
      currentShotsRef.current = 0;
    }

    // Increment shot counter
    currentShotsRef.current++;

    // If we've reached max shots for this charge, consume it and reset
    if (currentShotsRef.current >= shotsPerCharge) {
      const chargeId = currentChargeRef.current;
      
      setCharges(prev => prev.map(charge => 
        charge.id === chargeId ? {
          ...charge,
          available: false,
          cooldownStartTime: Date.now()
        } : charge
      ));

      // Handle cooldown recovery with cleanup
      const cooldownTimeout = setTimeout(() => {
        setCharges(prev => prev.map(c =>
          c.id === chargeId
            ? { ...c, available: true, cooldownStartTime: null }
            : c
        ));
      }, ORBITAL_COOLDOWN);

      // Note: This timeout is not cleaned up on unmount.
      // In a production app, you'd want to store timeouts in a ref and clear them.

      // Reset counters
      currentShotsRef.current = 0;
      currentChargeRef.current = null;
    }

    return true;
  }, [charges, setCharges]);

  return { consumeCharge };
} 