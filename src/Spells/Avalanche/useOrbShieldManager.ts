import { useCallback } from 'react';
import { ORBITAL_COOLDOWN, ChargeStatus } from '@/color/ChargedOrbitals';

interface UseOrbShieldManagerProps {
  charges: Array<ChargeStatus>;
  setCharges: React.Dispatch<React.SetStateAction<Array<ChargeStatus>>>;
}

// DAMAGE SCALING BY ORB COUNT
const DAMAGE_BY_ORB_COUNT: Record<number, number> = {
  1: 17,
  2: 29,
  3: 41,
  4: 59,
  5: 67,
  6: 79,
  7: 89,
  8: 97
};

export function useOrbShieldManager({
  charges,
  setCharges,
}: UseOrbShieldManagerProps) {
  const calculateBonusDamage = useCallback((): number => {
    const availableCharges = charges.filter(charge => charge.available);
    return DAMAGE_BY_ORB_COUNT[availableCharges.length] || 0;
  }, [charges]);

  const consumeOrb = useCallback(() => {
    const availableCharges = charges.filter(charge => charge.available);
    if (availableCharges.length === 0) return;

    // Consume one orb
    const orbToConsume = availableCharges[0];
    setCharges(prev => prev.map(charge => 
      charge.id === orbToConsume.id ? {
        ...charge,
        available: false,
        cooldownStartTime: Date.now() + 200
      } : charge
    ));

    // Handle cooldown recovery with adjusted timing
    setTimeout(() => {
      setCharges(prev => prev.map(c => 
        c.id === orbToConsume.id
          ? { ...c, available: true, cooldownStartTime: null }
          : c
      ));
    }, ORBITAL_COOLDOWN + 200);
  }, [charges, setCharges]);

  return { calculateBonusDamage, consumeOrb };
}
