import { useCallback } from 'react';
import { Vector3 } from 'three';
import * as THREE from 'three';

interface FirebeamControllerProps {
  onHit: (targetId: string, damage: number) => void;
  parentRef: React.RefObject<THREE.Group>;
}

export const useFirebeam = ({ parentRef }: FirebeamControllerProps) => {
  const activateFirebeam = useCallback(() => {

    if (!parentRef.current) return;

    const position = parentRef.current.position.clone();
    position.y += 1;

    const direction = new Vector3(0, 0, 1)
      .applyQuaternion(parentRef.current.quaternion);


    
    const baseDamage = 37; // DAMAGE
    
    return {
      position,
      direction,
      onComplete: () => {},
      damage: baseDamage
    };
  }, [parentRef]);

  const deactivateFirebeam = useCallback(() => {

  }, []);

  return {
    activateFirebeam,
    deactivateFirebeam
  };
}; 