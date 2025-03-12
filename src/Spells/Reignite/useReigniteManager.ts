import { useCallback } from 'react';
import { ChargeStatus } from '@/color/ChargedOrbitals';

interface UseReigniteManagerProps {
  charges: Array<ChargeStatus>;
  setCharges: React.Dispatch<React.SetStateAction<Array<ChargeStatus>>>;
}

export function useReigniteManager({
  charges,
  setCharges,
}: UseReigniteManagerProps) {
  const restoreCharge = useCallback(() => {
    // Find the first unavailable charge
    const unavailableChargeIndex = charges.findIndex(charge => !charge.available);
    if (unavailableChargeIndex === -1) return; // All charges are available

    // Instantly restore the charge
    setCharges(prev => prev.map((charge, index) => 
      index === unavailableChargeIndex ? {
        ...charge,
        available: true,
        cooldownStartTime: null
      } : charge
    ));
  }, [charges, setCharges]);

  return { restoreCharge };
}
