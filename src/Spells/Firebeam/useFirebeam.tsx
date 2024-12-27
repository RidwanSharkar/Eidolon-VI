import { useState, useCallback } from 'react';
import { Vector3 } from 'three';
import * as THREE from 'three';

interface FirebeamControllerProps {
  onHit: (targetId: string, damage: number) => void;
  parentRef: React.RefObject<THREE.Group>;
}

export const useFirebeam = ({ parentRef }: FirebeamControllerProps) => {
  const [isActive, setIsActive] = useState(false);

  const activateFirebeam = useCallback(() => {
    if (!parentRef.current) return;

    const position = parentRef.current.position.clone();
    position.y += 1;

    const direction = new Vector3(0, 0, 1)
      .applyQuaternion(parentRef.current.quaternion);

    setIsActive(true);
    
    const baseDamage = 41; // 10 damage per tick
    
    return {
      position,
      direction,
      onComplete: () => setIsActive(false),
      damage: baseDamage
    };
  }, [parentRef]);

  const deactivateFirebeam = useCallback(() => {
    setIsActive(false);
  }, []);

  return {
    isActive,
    activateFirebeam,
    deactivateFirebeam
  };
}; 