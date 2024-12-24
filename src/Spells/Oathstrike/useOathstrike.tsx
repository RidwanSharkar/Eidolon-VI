import { useState, useCallback } from 'react';
import { Vector3 } from 'three';
import * as THREE from 'three';

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
}

export const useOathstrike = ({ 
  parentRef, 
  onHit, 
  charges, 
  setCharges,
  enemyData 
}: OathstrikeControllerProps) => {
  const [isActive, setIsActive] = useState(false);

  const consumeCharges = useCallback(() => {
    const availableCharges = charges.filter(charge => charge.available);
    if (availableCharges.length < 2) return false;

    setCharges(prev => prev.map((charge, index) => {
      if (index === availableCharges[0].id - 1 || index === availableCharges[1].id - 1) {
        return { ...charge, available: false, cooldownStartTime: Date.now() };
      }
      return charge;
    }));

    return true;
  }, [charges, setCharges]);

  const activateOathstrike = useCallback(() => {
    if (!parentRef.current || !consumeCharges()) return null;

    const position = parentRef.current.position.clone();
    position.y += 1;

    const direction = new Vector3(0, 0, 1)
      .applyQuaternion(parentRef.current.quaternion);

    setIsActive(true);

    // Calculate arc for damage
    const forward = direction.clone();
    const DAMAGE_RANGE = 6.0;
    const ARC_ANGLE = Math.PI * 0.6; // 108-degree arc

    // Check enemies in arc
    enemyData.forEach(enemy => {
      if (enemy.health <= 0) return;

      const toEnemy = enemy.position.clone().sub(position);
      const distance = toEnemy.length();

      if (distance <= DAMAGE_RANGE) {
        const angle = Math.abs(forward.angleTo(toEnemy));
        if (angle <= ARC_ANGLE / 2) {
          onHit(enemy.id, 50);
        }
      }
    });
    
    return {
      position,
      direction,
      onComplete: () => setIsActive(false)
    };
  }, [parentRef, consumeCharges, enemyData, onHit]);

  const deactivateOathstrike = useCallback(() => {
    setIsActive(false);
  }, []);

  return {
    isActive,
    activateOathstrike,
    deactivateOathstrike
  };
};
