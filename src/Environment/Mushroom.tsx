// src/components/Environment/Mushroom.tsx
import React, { useRef } from 'react';
import { Mesh } from 'three';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface MushroomProps {
  position: THREE.Vector3;
  scale: number;
}

const Mushroom: React.FC<MushroomProps> = ({ position, scale }) => {
  const mushroomRef = useRef<Mesh>(null!);

  // Slight animation (bobbing)
  useFrame((state) => {
    if (mushroomRef.current) {
      mushroomRef.current.position.y = position.y + Math.sin(state.clock.getElapsedTime()) * 0.05;
    }
  });

  return (
    <group position={position} scale={scale}>
      {/* Stem */}
      <mesh ref={mushroomRef}>
        <cylinderGeometry args={[0.1, 0.12, 0.8, 16]} />
        <meshStandardMaterial color="#ff69b4" />
      </mesh>
      {/* Cap */}
      <mesh position={[0, 0.5, 0]}>
        <sphereGeometry args={[0.3, 32, 32]} />
        <meshStandardMaterial color="#ff69b4" />
      </mesh>
    </group>
  );
};

export default Mushroom;
export type { MushroomProps };