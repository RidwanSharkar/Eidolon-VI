import { useRef } from 'react';
import { Group, Vector3 } from 'three';
import { useFrame } from '@react-three/fiber';

interface BonespearProps {
  position: Vector3;
  direction: Vector3;
  onComplete: () => void;
}

export default function Bonespear({ position, direction, onComplete }: Omit<BonespearProps, 'onHit'>) {
  const spearRef = useRef<Group>(null);
  const progressRef = useRef(0);
  const speed = 0.8;
  const maxDistance = 30;
  const startPos = position.clone();

  useFrame((_, delta) => {
    if (!spearRef.current) return;

    const currentPos = spearRef.current.position;
    const distanceTraveled = currentPos.distanceTo(startPos);

    if (distanceTraveled >= maxDistance) {
      onComplete();
      return;
    }

    currentPos.add(direction.clone().multiplyScalar(speed));
    progressRef.current += delta;
  });

  return (
    <group ref={spearRef} position={position.clone()}>
      {/* Implement bone spear visual effects here */}
    </group>
  );
} 