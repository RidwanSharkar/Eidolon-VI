import { useRef } from 'react';
import { Group } from 'three';
import { useFrame } from '@react-three/fiber';

interface RapidfireProps {
  parentRef: React.RefObject<Group>;
  isActive: boolean;
}

export default function Rapidfire({ parentRef, isActive }: RapidfireProps) {
  const effectRef = useRef<Group>(null);

  useFrame(() => {
    if (!effectRef.current || !parentRef.current) return;
    
    // Update position to follow parent
    effectRef.current.position.copy(parentRef.current.position);
  });

  return (
    <group ref={effectRef} visible={isActive}>
      {/* Implement rapidfire visual effects here */}
    </group>
  );
} 