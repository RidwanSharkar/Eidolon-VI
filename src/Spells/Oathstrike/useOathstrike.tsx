import { useState, useCallback } from 'react';
import { Vector3 } from 'three';
import * as THREE from 'three';
import { ORBITAL_COOLDOWN } from '../../color/ChargedOrbitals';
import { calculateDamage } from '@/Weapons/damage';
import { useHealing } from '@/Unit/useHealing';

interface OathstrikeControllerProps {
  onHit: (targetId: string, damage: number) => void;
  parentRef: React.RefObject<THREE.Group>;
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
  enemyData: Array<{
    id: string;
    position: Vector3;
    health: number;
  }>;
  setDamageNumbers: React.Dispatch<React.SetStateAction<Array<{
    id: number;
    damage: number;
    position: Vector3;
    isCritical: boolean;
    isOathstrike?: boolean;
  }>>>;
  nextDamageNumberId: React.MutableRefObject<number>;
}

export const useOathstrike = ({ 
  parentRef, 
  onHit, 
  charges, 
  setCharges,
  enemyData,
  onHealthChange,
  setDamageNumbers,
  nextDamageNumberId,
  currentHealth,
  maxHealth
}: OathstrikeControllerProps & {
  onHealthChange: (health: number) => void;
  currentHealth: number;
  maxHealth: number;
}) => {
  const [isActive, setIsActive] = useState(false);
  const HEAL_AMOUNT = 5;
  
  const { processHealing } = useHealing({
    currentHealth,
    maxHealth,
    onHealthChange,
    setDamageNumbers,
    nextDamageNumberId,
    healAmount: HEAL_AMOUNT
  });

  const consumeCharges = useCallback(() => {
    // Find four available charges
    const availableCharges = charges.filter(charge => charge.available);
    if (availableCharges.length < 4) {
      console.log('Not enough charges available for Oathstrike');
      return false;
    }

    // Consume four charges
    setCharges(prev => prev.map((charge, index) => {
      if (
        index === availableCharges[0].id - 1 || 
        index === availableCharges[1].id - 1 ||
        index === availableCharges[2].id - 1 ||
        index === availableCharges[3].id - 1
      ) {
        return {
          ...charge,
          available: false,
          cooldownStartTime: Date.now()
        };
      }
      return charge;
    }));

    // Start cooldown recovery for each charge individually
    for (let i = 0; i < 4; i++) {
      if (availableCharges[i].id) {
        setTimeout(() => {
          setCharges(prev => prev.map((c, index) => 
            index === availableCharges[i].id - 1
              ? { ...c, available: true, cooldownStartTime: null }
              : c
          ));
        }, ORBITAL_COOLDOWN);
      }
    }

    return true;
  }, [charges, setCharges]);

  const activateOathstrike = useCallback(() => {
    if (!parentRef.current) return null;
    
    if (!consumeCharges()) {
      return null;
    }

    const position = parentRef.current.position.clone();
    position.y += 1;

    const direction = new Vector3(0, 0, 1)
      .applyQuaternion(parentRef.current.quaternion);

    setIsActive(true);

    // Calculate arc for damage
    const forward = direction.clone();
    const DAMAGE_RANGE = 6;
    const ARC_ANGLE = Math.PI * 0.6; // 108-degree arc

    // Track if we hit any enemies
    let hitEnemies = false;

    // Check enemies in arc
    enemyData.forEach(enemy => {
      if (enemy.health <= 0) return;

      const toEnemy = enemy.position.clone().sub(position);
      const distance = toEnemy.length();

      if (distance <= DAMAGE_RANGE) {
        const angle = Math.abs(forward.angleTo(toEnemy));
        if (angle <= ARC_ANGLE / 2) {
          hitEnemies = true;
          const { damage, isCritical } = calculateDamage(47); // DAMAGE
          onHit(enemy.id, damage);
          
          setDamageNumbers(prev => [...prev, {
            id: nextDamageNumberId.current++,
            damage,
            position: enemy.position.clone(),
            isCritical,
            isOathstrike: true  // New flag for Oathstrike damage
          }]);
        }
      }
    });

    // Only heal if we hit at least one enemy
    if (hitEnemies) {
      processHealing(HEAL_AMOUNT, position);
    }
    
    return {
      position,
      direction,
      onComplete: () => {
        setIsActive(false);
      }
    };
  }, [nextDamageNumberId, setDamageNumbers, parentRef, consumeCharges, enemyData, onHit, processHealing]);

  return {
    isActive,
    activateOathstrike
  };
};
