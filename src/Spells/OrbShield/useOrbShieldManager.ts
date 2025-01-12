import { useCallback } from 'react';
import { ORBITAL_COOLDOWN, ChargeStatus } from '@/color/ChargedOrbitals';

interface UseOrbShieldManagerProps {
  charges: Array<ChargeStatus>;
  setCharges: React.Dispatch<React.SetStateAction<Array<ChargeStatus>>>;
}

export function useOrbShieldManager({
  charges,
  setCharges,
}: UseOrbShieldManagerProps) {
  const DAMAGE_BONUS_PER_ORB = 6;

  const calculateBonusDamage = useCallback((): number => {
    const availableCharges = charges.filter(charge => charge.available);
    return availableCharges.length * DAMAGE_BONUS_PER_ORB;
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
        cooldownStartTime: Date.now()
      } : charge
    ));

    // Handle cooldown recovery
    setTimeout(() => {
      setCharges(prev => prev.map(c => 
        c.id === orbToConsume.id
          ? { ...c, available: true, cooldownStartTime: null }
          : c
      ));
    }, ORBITAL_COOLDOWN);
  }, [charges, setCharges]);

  return { calculateBonusDamage, consumeOrb };
}
