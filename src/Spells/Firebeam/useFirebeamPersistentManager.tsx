import { useRef, useCallback, useEffect } from 'react';
import { Group } from 'three';
import { ORBITAL_COOLDOWN } from '@/color/ChargedOrbitals';

interface UseFirebeamPersistentManagerProps {
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
  isFirebeaming: boolean;
  onFirebeamEnd?: () => void;
}

export function useFirebeamPersistentManager({
  charges,
  setCharges,
  isFirebeaming,
  onFirebeamEnd
}: UseFirebeamPersistentManagerProps) {
  const lastChargeConsumeTime = useRef<number>(0);
  const CHARGE_CONSUME_INTERVAL = 1000; // 1 second
  const hasCalledEndCallback = useRef<boolean>(false);

  // Add check for available charges
  useEffect(() => {
    if (isFirebeaming) {
      const hasAvailableCharges = charges.some(charge => charge.available);

      if (!hasAvailableCharges && !hasCalledEndCallback.current) {

        hasCalledEndCallback.current = true;
        onFirebeamEnd?.();
      }
    } else {
      // Reset the flag when firebeam is not active
      if (hasCalledEndCallback.current) {

        hasCalledEndCallback.current = false;
      }
    }
  }, [charges, isFirebeaming, onFirebeamEnd]);

  const consumeCharge = useCallback(() => {
    const now = Date.now();
    if (now - lastChargeConsumeTime.current < CHARGE_CONSUME_INTERVAL) {
      return false;
    }

    const availableChargeIndex = charges.findIndex(charge => charge.available);
    if (availableChargeIndex === -1) {

      if (!hasCalledEndCallback.current) {

        hasCalledEndCallback.current = true;
        onFirebeamEnd?.();
      }
      return false;
    }

    lastChargeConsumeTime.current = now;



    setCharges(prev => {
      const newCharges = [...prev];
      newCharges[availableChargeIndex] = {
        ...newCharges[availableChargeIndex],
        available: false,
        cooldownStartTime: now
      };
      return newCharges;
    });

    // Start cooldown for consumed charge
    setTimeout(() => {

      setCharges(prev => {
        const newCharges = [...prev];
        newCharges[availableChargeIndex] = {
          ...newCharges[availableChargeIndex],
          available: true,
          cooldownStartTime: null
        };
        return newCharges;
      });
    }, ORBITAL_COOLDOWN);

    // Check if this was the last available charge
    const remainingCharges = charges.filter((charge, idx) => 
      idx !== availableChargeIndex && charge.available
    ).length;



    if (remainingCharges === 0) {
      // This was the last charge, schedule the end callback

      setTimeout(() => {
        if (!hasCalledEndCallback.current) {

          hasCalledEndCallback.current = true;
          onFirebeamEnd?.();
        }
      }, 100);
    }

    return true;
  }, [charges, setCharges, onFirebeamEnd]);

  useEffect(() => {
    if (isFirebeaming) {

      // Check if we have any charges available before starting
      const hasAvailableCharges = charges.some(charge => charge.available);
      if (!hasAvailableCharges) {

        if (!hasCalledEndCallback.current) {
          hasCalledEndCallback.current = true;
          onFirebeamEnd?.();
        }
        return;
      }

      // Consume first charge immediately when starting

      consumeCharge();
      
      // Set up interval for subsequent charges
      const interval = setInterval(() => {

        consumeCharge();
      }, CHARGE_CONSUME_INTERVAL);
      
      return () => {

        clearInterval(interval);
      };
    }
  }, [consumeCharge, isFirebeaming, charges, onFirebeamEnd]);

  return { consumeCharge };
} 