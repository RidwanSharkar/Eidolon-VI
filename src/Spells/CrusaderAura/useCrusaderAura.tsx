import { useCallback } from 'react';
import { Group, Vector3 } from 'three';

interface CrusaderAuraProps {
  parentRef: React.RefObject<Group>;
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

export const useCrusaderAura = ({ 
  onHealthChange,
  parentRef,
  setDamageNumbers,
  nextDamageNumberId
}: CrusaderAuraProps) => {
  const HEAL_AMOUNT = 3;
  const HEAL_CHANCE = 0.20;

  const processHealingChance = useCallback(() => {
    if (!parentRef.current) return;
    
    if (Math.random() < HEAL_CHANCE) {
      // Apply healing - note that the actual clamping to maxHealth 
      // should be handled by the parent component's onHealthChange
      onHealthChange(HEAL_AMOUNT);

      // Show healing number
      setDamageNumbers(prev => [...prev, {
        id: nextDamageNumberId.current++,
        damage: HEAL_AMOUNT,
        position: parentRef.current!.position.clone().add(new Vector3(0, 2, 0)),
        isCritical: false,
        isHealing: true
      }]);
    }
  }, [onHealthChange, parentRef, setDamageNumbers, nextDamageNumberId]);

  return {
    processHealingChance,
  };
}; 