import { useRef, useCallback, useEffect } from 'react';
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
    if (currentTime - lastFireTime.current < 600) { 
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
      
      // Create 2D positions by ignoring Y axis (similar to projectile hit detection)
      const beamPos2D = new Vector3(position.x, 0, position.z);
      const enemyPos2D = new Vector3(enemy.position.x, 0, enemy.position.z);
      
      // Project enemy position onto beam line
      const beamDirection2D = direction.clone().setY(0).normalize();
      const enemyDirection = enemyPos2D.clone().sub(beamPos2D);
      const projectedDistance = enemyDirection.dot(beamDirection2D);
      
      // Only hit enemies in front of beam origin and within max range
      if (projectedDistance <= 0 || projectedDistance > 20) return;
      
      // Calculate perpendicular distance from enemy to beam line
      const projectedPoint = beamPos2D.clone().add(beamDirection2D.multiplyScalar(projectedDistance));
      const perpendicularDistance = enemyPos2D.distanceTo(projectedPoint);
      
      // Check if enemy is within beam width (using similar width as projectiles)
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

    // Automatically stop the beam effect after a short duration
    setTimeout(() => {
      stopFirebeam();
    }, 6000);

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