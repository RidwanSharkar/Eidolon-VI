import { useCallback, useRef } from 'react';
import { Group, Vector3 } from 'three';

interface UseChaosTotemHealingProps {
  onHealthChange?: (health: number) => void;
  setDamageNumbers?: React.Dispatch<React.SetStateAction<Array<{
    id: number;
    damage: number;
    position: Vector3;
    isCritical: boolean;
    isHealing?: boolean;
  }>>>;
  nextDamageNumberId?: React.MutableRefObject<number>;
  parentRef?: React.RefObject<Group>;
}

export function useChaosTotemHealing({
  onHealthChange,
  setDamageNumbers,
  nextDamageNumberId,
  parentRef
}: UseChaosTotemHealingProps) {
  const healingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const healingCountRef = useRef(0);

  const startTotemHealing = useCallback(() => {
    // Clear any existing healing interval
    if (healingIntervalRef.current) {
      clearInterval(healingIntervalRef.current);
    }

    // Reset healing count
    healingCountRef.current = 0;

    console.log('🟢 [Chaos Totem] Starting healing: 2HP per second for 8 seconds');

    // Start healing over time: 2HP per second for 8 seconds (16 total HP)
    healingIntervalRef.current = setInterval(() => {
      healingCountRef.current++;
      
      // Heal for 2 HP
      if (onHealthChange) {
        onHealthChange(2);
      }

      // Show healing damage number
      if (setDamageNumbers && nextDamageNumberId && parentRef?.current) {
        setDamageNumbers(prev => [...prev, {
          id: nextDamageNumberId.current++,
          damage: 2,
          position: parentRef.current!.position.clone().add(new Vector3(0, 2, 0)),
          isCritical: false,
          isHealing: true
        }]);
      }

      console.log(`💚 [Chaos Totem] Heal tick ${healingCountRef.current}/8: +2 HP`);

      // Stop after 8 ticks (8 seconds)
      if (healingCountRef.current >= 8) {
        if (healingIntervalRef.current) {
          clearInterval(healingIntervalRef.current);
          healingIntervalRef.current = null;
        }
        console.log('✅ [Chaos Totem] Healing complete: 16 total HP restored');
      }
    }, 1000); // Every 1 second
  }, [onHealthChange, setDamageNumbers, nextDamageNumberId, parentRef]);

  const stopTotemHealing = useCallback(() => {
    if (healingIntervalRef.current) {
      clearInterval(healingIntervalRef.current);
      healingIntervalRef.current = null;
      console.log('🛑 [Chaos Totem] Healing stopped early');
    }
  }, []);

  return { startTotemHealing, stopTotemHealing };
}
