import { useRef } from 'react';
import { Group, Vector3 } from 'three';
import { useFrame } from '@react-three/fiber';

interface BlizzardProps {
  position: Vector3;
  onComplete: () => void;
  onHit?: (targetId: string) => void;
}

export default function Blizzard({ position, onComplete, onHit }: BlizzardProps) {
  const stormRef = useRef<Group>(null);
  const progressRef = useRef(0);
  const duration = 3.0;

  useFrame((_, delta) => {
    if (!stormRef.current) return;

    progressRef.current += delta;
    if (progressRef.current >= duration) {
      onComplete();
      return;
    }

    // Rotate the storm effect
    stormRef.current.rotation.y += delta * 2;
  });

  return (
    <group ref={stormRef} position={position}>
      {/* Implement blizzard storm visual effects here */}
    </group>
  );
} 