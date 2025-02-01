import { useRef, useCallback, useMemo } from 'react';
import { Group, Vector3 } from 'three';
import { ORBITAL_COOLDOWN } from '../../color/ChargedOrbitals';
import { WeaponType, DEFAULT_WEAPON_ABILITIES } from '../../Weapons/weapons';

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
  setDamageNumbers: React.Dispatch<React.SetStateAction<Array<{
    id: number;
    damage: number;
    position: Vector3;
    isCritical: boolean;
    isHealing?: boolean;
  }>>>;
  nextDamageNumberId: React.MutableRefObject<number>;
}

export function useReanimateManager({
  charges,
  setCharges,
  onHealthChange,
  parentRef,
  setDamageNumbers,
  nextDamageNumberId
}: UseReanimateManagerProps) {
  const lastCastTime = useRef<number>(0);
  
  // Memoize constants
  const HEAL_AMOUNT = useMemo(() => 7, []);
  const COOLDOWN = useMemo(() => 
    DEFAULT_WEAPON_ABILITIES[WeaponType.SCYTHE].passive.cooldown * 1000, 
    []
  );

  // Memoize the position vector for reuse
  const healingPosition = useMemo(() => new Vector3(0, 2, 0), []);

  const castReanimate = useCallback(() => {
    const now = Date.now();
    if (now - lastCastTime.current < COOLDOWN) {
      return false;
    }

    const availableChargeIndex = charges.findIndex(charge => charge.available);
    if (availableChargeIndex === -1) {
      return false;
    }

    lastCastTime.current = now;

    setCharges(prev => {
      const newCharges = [...prev];
      newCharges[availableChargeIndex] = {
        ...newCharges[availableChargeIndex],
        available: false,
        cooldownStartTime: now
      };
      return newCharges;
    });

    const currentRef = parentRef?.current;
    if (currentRef) {
      setDamageNumbers(prev => [...prev, {
        id: nextDamageNumberId.current++,
        damage: HEAL_AMOUNT,
        position: currentRef.position.clone().add(healingPosition),
        isCritical: false,
        isHealing: true
      }]);
    }

    onHealthChange(HEAL_AMOUNT);

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
  }, [charges, setCharges, onHealthChange, parentRef, setDamageNumbers, nextDamageNumberId, COOLDOWN, HEAL_AMOUNT, healingPosition]);

  return { castReanimate };
} 