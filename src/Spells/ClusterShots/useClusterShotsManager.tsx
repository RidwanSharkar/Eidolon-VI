import { useCallback } from 'react';

// This is a placeholder value - replace with your actual orbital cooldown value
const ORBITAL_COOLDOWN = 5000; // 5 seconds

interface UseClusterShotsManagerProps {
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

export function useClusterShotsManager({
  charges,
  setCharges,
}: UseClusterShotsManagerProps) {
  const consumeCharges = useCallback((count: number): boolean => {
    const availableCharges = charges.filter(charge => charge.available);
    if (availableCharges.length < count) return false;

    // Consume the required number of charges
    const chargesToConsume = availableCharges.slice(0, count);
    
    setCharges(prev => prev.map(charge => {
      const matchingCharge = chargesToConsume.find(c => c.id === charge.id);
      if (matchingCharge) {
        return {
          ...charge,
          available: false,
          cooldownStartTime: Date.now()
        };
      }
      return charge;
    }));

    // Handle cooldown recovery for each consumed charge
    chargesToConsume.forEach(charge => {
      setTimeout(() => {
        setCharges(prev => prev.map(c => 
          c.id === charge.id
            ? { ...c, available: true, cooldownStartTime: null }
            : c
        ));
      }, ORBITAL_COOLDOWN);
    });

    return true;
  }, [charges, setCharges]);

  return { consumeCharges };
} 