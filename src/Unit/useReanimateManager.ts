import { useRef, useCallback } from 'react';
import { Group } from 'three';
import { ORBITAL_COOLDOWN } from './ChargedOrbitals';

interface UseReanimateManagerProps {
  parentRef: React.RefObject<Group>;
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
  onHealthChange: (health: number) => void;
}

export function useReanimateManager({
  charges,
  setCharges,
  onHealthChange,
}: UseReanimateManagerProps) {
  const lastCastTime = useRef<number>(0);
  const HEAL_AMOUNT = 10;

  const castReanimate = useCallback(() => {
    // Find first available charge
    const availableChargeIndex = charges.findIndex(charge => charge.available);
    
    if (availableChargeIndex === -1) {
      console.log('No charges available for Reanimate');
      return false;
    }

    // Use the charge
    setCharges(prev => prev.map((charge, index) => 
      index === availableChargeIndex 
        ? { ...charge, available: false, cooldownStartTime: Date.now() }
        : charge
    ));

    // Apply healing
    onHealthChange(HEAL_AMOUNT);

    // Start cooldown recovery
    setTimeout(() => {
      setCharges(prev => prev.map((charge, index) => 
        index === availableChargeIndex
          ? { ...charge, available: true, cooldownStartTime: null }
          : charge
      ));
    }, ORBITAL_COOLDOWN);

    lastCastTime.current = Date.now();
    console.log(`Reanimate casted. Healed for ${HEAL_AMOUNT} points.`);
    return true;
  }, [charges, setCharges, onHealthChange]);

  return {
    castReanimate
  };
} 