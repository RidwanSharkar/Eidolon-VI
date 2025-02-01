import { useRef, useCallback, useEffect, useMemo } from 'react';
import { Vector3 } from 'three';
import { useFirebeam } from '@/Spells/Firebeam/useFirebeam';
import { Enemy } from '@/Versus/enemy';
import * as THREE from 'three';
import { ORBITAL_COOLDOWN } from '../../color/ChargedOrbitals'; // @/Color/ChargedOrbitals
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

  // Cache vector instances to prevent garbage collection
  const beamPos2D = useMemo(() => new Vector3(), []);
  const enemyPos2D = useMemo(() => new Vector3(), []);
  const beamDirection2D = useMemo(() => new Vector3(), []);
  const enemyDirection = useMemo(() => new Vector3(), []);
  const projectedPoint = useMemo(() => new Vector3(), []);

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
    if (currentTime - lastFireTime.current < 725) return undefined;
    if (!consumeCharge()) return undefined;

    const firebeamData = activateFirebeam();
    if (!firebeamData) return undefined;

    const { position, direction, damage } = firebeamData;
    const effectId = nextEffectId.current++;

    currentEffectId.current = effectId;
    lastFireTime.current = currentTime;

    setActiveEffects(prev => [...prev, {
      id: effectId,
      type: 'firebeam',
      position,
      direction
    }]);

    // Optimize enemy hit detection
    enemyData.forEach(enemy => {
      if (enemy.health <= 0) return;
      
      // Reuse vector instances
      beamPos2D.set(position.x, 0, position.z);
      enemyPos2D.set(enemy.position.x, 0, enemy.position.z);
      beamDirection2D.copy(direction).setY(0).normalize();
      enemyDirection.copy(enemyPos2D).sub(beamPos2D);
      
      const projectedDistance = enemyDirection.dot(beamDirection2D);
      if (projectedDistance <= 0 || projectedDistance > 20) return;
      
      projectedPoint.copy(beamPos2D).add(beamDirection2D.multiplyScalar(projectedDistance));
      const perpendicularDistance = enemyPos2D.distanceTo(projectedPoint);
      
      if (perpendicularDistance < 1.375) {
        onHit(enemy.id, damage);
        setDamageNumbers(prev => [...prev, {
          id: nextDamageNumberId.current++,
          damage,
          position: enemy.position.clone(),
          isCritical: false,
          isFirebeam: true
        }]);
      }
    });

    return setTimeout(stopFirebeam, 6000);
  }, [ nextDamageNumberId, beamPos2D, enemyPos2D, beamDirection2D, enemyDirection, projectedPoint, setDamageNumbers, activateFirebeam, enemyData, onHit, setActiveEffects, consumeCharge, stopFirebeam]);

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