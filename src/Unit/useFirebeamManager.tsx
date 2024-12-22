import { useRef, useCallback, useEffect } from 'react';
import { Vector3 } from 'three';
import { useFirebeam } from '../Spells/Firebeam/useFirebeam';
import { Enemy } from '../Versus/enemy';
import * as THREE from 'three';
import { ORBITAL_COOLDOWN } from './ChargedOrbitals';

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
}

export const useFirebeamManager = ({
  parentRef,
  onHit,
  enemyData,
  setActiveEffects,
  charges,
  setCharges
}: FirebeamManagerProps) => {
  const nextEffectId = useRef(0);
  const currentEffectId = useRef<number | null>(null);
  const damageIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const durationRef = useRef(0);
  const lastChargeTimeRef = useRef(Date.now());
  const { isActive, activateFirebeam, deactivateFirebeam } = useFirebeam({ onHit, parentRef });

  const stopFirebeam = useCallback((damageInterval?: NodeJS.Timeout) => {
    if (damageInterval) {
      clearInterval(damageInterval);
    }
    if (damageIntervalRef.current) {
      clearInterval(damageIntervalRef.current);
      damageIntervalRef.current = null;
    }
    if (currentEffectId.current !== null) {
      setActiveEffects(prev => prev.filter(effect => effect.id !== currentEffectId.current));
      currentEffectId.current = null;
    }
    deactivateFirebeam();
  }, [deactivateFirebeam, setActiveEffects]);


  //=====================================================================================================
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

    // Start cooldown recovery for this charge
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
    // Check if we have at least one charge available
    if (!consumeCharge()) {
      return;
    }

    const firebeamData = activateFirebeam();
    if (!firebeamData) return;

    const { position, direction, damage } = firebeamData;
    const effectId = nextEffectId.current++;

    currentEffectId.current = effectId;
    durationRef.current = 0;
    lastChargeTimeRef.current = Date.now();

    setActiveEffects(prev => [...prev, {
      id: effectId,
      type: 'firebeam',
      position,
      direction
    }]);

    // Damage interval (every 0.5 seconds)
    damageIntervalRef.current = setInterval(() => {
      if (!isActive) {
        stopFirebeam();
        return;
      }

      // Check duration for charge consumption (every 1 second)
      const currentTime = Date.now();
      if (currentTime - lastChargeTimeRef.current >= 1000) {
        if (!consumeCharge()) {
          stopFirebeam();
          return;
        }
        lastChargeTimeRef.current = currentTime;
      }

      enemyData.forEach(enemy => {
        if (enemy.health <= 0) return;
        const enemyDir = enemy.position.clone().sub(position);
        const angle = direction.angleTo(enemyDir);
        const distance = enemyDir.length();

        if (angle < 0.3 && distance < 20) {
          onHit(enemy.id, damage);
        }
      });
    }, 500);

    return damageIntervalRef.current;
  }, [  stopFirebeam, activateFirebeam, enemyData, onHit, setActiveEffects, isActive, consumeCharge]);


  useEffect(() => {
    return () => {
      if (damageIntervalRef.current) {
        clearInterval(damageIntervalRef.current);
      }
    };
  }, []);

  return {
    isActive,
    startFirebeam,
    stopFirebeam
  };
}; 