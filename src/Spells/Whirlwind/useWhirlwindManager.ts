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
  const CHARGE_CONSUME_INTERVAL = 980; // 1 second

  // Add check for available charges
  useEffect(() => {
    if (isWhirlwinding) {
      const hasAvailableCharges = charges.some(charge => charge.available);
      if (!hasAvailableCharges) {
        onWhirlwindEnd?.();
      }
    }
  }, [charges, isWhirlwinding, onWhirlwindEnd]);

  const consumeCharge = useCallback(() => {
    const now = Date.now();
    if (now - lastChargeConsumeTime.current < CHARGE_CONSUME_INTERVAL) {
      return false;
    }

    const availableChargeIndex = charges.findIndex(charge => charge.available);
    if (availableChargeIndex === -1) {
      onWhirlwindEnd?.();
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

    return true;
  }, [charges, setCharges, onWhirlwindEnd]);

  useEffect(() => {
    if (isWhirlwinding) {
      // Check if we have any charges available before starting
      const hasAvailableCharges = charges.some(charge => charge.available);
      if (!hasAvailableCharges) {
        onWhirlwindEnd?.();
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