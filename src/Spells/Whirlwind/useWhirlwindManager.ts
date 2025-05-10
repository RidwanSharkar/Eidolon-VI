import { useRef, useCallback, useEffect } from 'react';
import { Group } from 'three';
import { ORBITAL_COOLDOWN } from '@/color/ChargedOrbitals';

interface UseWhirlwindManagerProps {
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
  isWhirlwinding: boolean;
  onWhirlwindEnd?: () => void;
}

export function useWhirlwindManager({
  charges,
  setCharges,
  isWhirlwinding,
  onWhirlwindEnd
}: UseWhirlwindManagerProps) {
  const lastChargeConsumeTime = useRef<number>(0);
  const CHARGE_CONSUME_INTERVAL = 1000; // 1 second
  const hasCalledEndCallback = useRef<boolean>(false);

  // Add check for available charges
  useEffect(() => {
    if (isWhirlwinding) {
      const hasAvailableCharges = charges.some(charge => charge.available);
      if (!hasAvailableCharges && !hasCalledEndCallback.current) {
        hasCalledEndCallback.current = true;
        onWhirlwindEnd?.();
      }
    } else {
      // Reset the flag when whirlwind is not active
      hasCalledEndCallback.current = false;
    }
  }, [charges, isWhirlwinding, onWhirlwindEnd]);

  const consumeCharge = useCallback(() => {
    const now = Date.now();
    if (now - lastChargeConsumeTime.current < CHARGE_CONSUME_INTERVAL) {
      return false;
    }

    const availableChargeIndex = charges.findIndex(charge => charge.available);
    if (availableChargeIndex === -1) {
      if (!hasCalledEndCallback.current) {
        hasCalledEndCallback.current = true;
        onWhirlwindEnd?.();
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
          onWhirlwindEnd?.();
        }
      }, 100);
    }

    return true;
  }, [charges, setCharges, onWhirlwindEnd]);

  useEffect(() => {
    if (isWhirlwinding) {
      // Check if we have any charges available before starting
      const hasAvailableCharges = charges.some(charge => charge.available);
      if (!hasAvailableCharges) {
        if (!hasCalledEndCallback.current) {
          hasCalledEndCallback.current = true;
          onWhirlwindEnd?.();
        }
        return;
      }

      // Consume first charge immediately when starting
      consumeCharge();
      
      // Set up interval for subsequent charges
      const interval = setInterval(() => {
        consumeCharge();
      }, CHARGE_CONSUME_INTERVAL);
      
      return () => clearInterval(interval);
    }
  }, [consumeCharge, isWhirlwinding, charges, onWhirlwindEnd]);

  return { consumeCharge };
} 