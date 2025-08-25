import { useState, useCallback } from 'react';
import { Group } from 'three';
import { ORBITAL_COOLDOWN } from '@/color/ChargedOrbitals';
import { ReigniteRef } from '../Reignite/Reignite';

interface UseBreachControllerProps {
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
  reigniteRef?: React.RefObject<ReigniteRef>;
}

export const useBreachController = ({
  parentRef,
  charges,
  setCharges,
  reigniteRef
}: UseBreachControllerProps) => {
  const [isActive, setIsActive] = useState(false);


  const consumeCharges = useCallback(() => {
    // Find two available charges
    const availableCharges = charges.filter(charge => charge.available);
    if (availableCharges.length < 2) {
      return false;
    }

    // Consume two charges
    setCharges(prev => prev.map((charge, index) => {
      if (
        index === availableCharges[0].id - 1 || 
        index === availableCharges[1].id - 1
      ) {
        return {
          ...charge,
          available: false,
          cooldownStartTime: Date.now()
        };
      }
      return charge;
    }));

    // Start cooldown recovery for each charge individually
    for (let i = 0; i < 2; i++) {
      if (availableCharges[i].id) {
        setTimeout(() => {
          setCharges(prev => prev.map((c, index) => 
            index === availableCharges[i].id - 1
              ? { ...c, available: true, cooldownStartTime: null }
              : c
          ));
        }, ORBITAL_COOLDOWN);
      }
    }

    return true;
  }, [charges, setCharges]);

  const activateBreach = useCallback(() => {
    if (!parentRef.current) return false;
    
    if (!consumeCharges()) {
      return false;
    }

    setIsActive(true);
    return true;
  }, [parentRef, consumeCharges]);

  return {
    isActive,
    setIsActive,
    activateBreach,
    reigniteRef // Return reigniteRef so it can be passed to Breach component
  };
};