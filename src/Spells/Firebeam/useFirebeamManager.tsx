import { useRef, useCallback, useEffect } from 'react';
import { Vector3 } from 'three';
import { useFirebeam } from './useFirebeam';
import { Enemy } from '../../Versus/enemy';
import * as THREE from 'three';
import { ORBITAL_COOLDOWN } from '../../Unit/ChargedOrbitals';
import { DamageNumber } from '../../Unit/useDamageNumbers';

interface FirebeamManagerProps {
  parentRef: React.RefObject<THREE.Group>;
  onHit: (targetId: string, damage: number) => void;
  enemyData: Enemy[];
  setActiveEffects: React.Dispatch<React.SetStateAction<Array<{
    id: number;
    type: string;
    position: Vector3;
    direction: Vector3;
  }>>>;
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
  setDamageNumbers: React.Dispatch<React.SetStateAction<DamageNumber[]>>;
  nextDamageNumberId: React.MutableRefObject<number>;
}

export const useFirebeamManager = ({
  parentRef,
  onHit,
  enemyData,
  setActiveEffects,
  charges,
  setCharges,
  setDamageNumbers,
  nextDamageNumberId
}: FirebeamManagerProps) => {
  const nextEffectId = useRef(0);
  const currentEffectId = useRef<number | null>(null);
  const lastFireTime = useRef(0);
  const { isActive, activateFirebeam, deactivateFirebeam } = useFirebeam({ onHit, parentRef });

  const stopFirebeam = useCallback(() => {
    if (currentEffectId.current !== null) {
      setActiveEffects(prev => prev.filter(effect => effect.id !== currentEffectId.current));
      currentEffectId.current = null;
    }
    deactivateFirebeam();
  }, [deactivateFirebeam, setActiveEffects]);

  const consumeCharge = useCallback(() => {
    const availableChargeIndex = charges.findIndex(charge => charge.available);
    if (availableChargeIndex === -1) {
      return false;
    }

    setCharges(prev => prev.map((charge, index) => 
      index === availableChargeIndex
        ? { ...charge, available: false, cooldownStartTime: Date.now() }
        : charge
    ));

    setTimeout(() => {
      setCharges(prev => prev.map((charge, index) => 
        index === availableChargeIndex
          ? { ...charge, available: true, cooldownStartTime: null }
          : charge
      ));
    }, ORBITAL_COOLDOWN);

    return true;
  }, [charges, setCharges]);


  const startFirebeam = useCallback(() => {
    const currentTime = Date.now();
    if (currentTime - lastFireTime.current < 500) { 
      return; // Enforce 1-second cooldown between shots
    }

    if (!consumeCharge()) {
      return;
    }

    const firebeamData = activateFirebeam();
    if (!firebeamData) return;

    const { position, direction, damage } = firebeamData;
    const effectId = nextEffectId.current++;

    currentEffectId.current = effectId;
    lastFireTime.current = currentTime;

    // Add visual effect
    setActiveEffects(prev => [...prev, {
      id: effectId,
      type: 'firebeam',
      position,
      direction
    }]);

    // Do instant damage to enemies in the beam's path
    enemyData.forEach(enemy => {
      if (enemy.health <= 0) return;
      const enemyDir = enemy.position.clone().sub(position);
      const angle = direction.angleTo(enemyDir);
      const distance = enemyDir.length();

      if (angle < 0.3 && distance < 20) {
        onHit(enemy.id, damage);
        
        // Add damage number
        setDamageNumbers(prev => [...prev, {
          id: nextDamageNumberId.current++,
          damage,
          position: enemy.position.clone(),
          isCritical: false,
          isFirebeam: true
        }]);
      }
    });

    // Automatically stop the beam effect after a short duration
    setTimeout(() => {
      stopFirebeam();
    }, 3000); 

    return undefined; // No longer returning an interval
  }, [ nextDamageNumberId, setDamageNumbers, activateFirebeam, enemyData, onHit, setActiveEffects, consumeCharge, stopFirebeam]);

  useEffect(() => {
    return () => {
      stopFirebeam();
    };
  }, [stopFirebeam]);

  return {
    isActive,
    startFirebeam,
    stopFirebeam
  };
}; 