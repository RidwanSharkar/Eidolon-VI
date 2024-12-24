// src/components/Environment/Mushroom.tsx
import React, { useRef } from 'react';
import { Mesh } from 'three';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface MushroomProps {
  position: THREE.Vector3;
  scale: number;
}

const Mushroom: React.FC<MushroomProps> = ({ position, scale = 1 }) => {
  const mushroomRef = useRef<Mesh>(null!);
  
  // Increase base size by adjusting these dimensions
  const stemRadius = 0.08 * scale;
  const stemHeight = 0.8 * scale;
  const capRadius = 0.35 * scale;

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
        <cylinderGeometry args={[stemRadius, stemRadius * 1.2, stemHeight, 16]} />
        <meshStandardMaterial 
          color="#ff1493"
          emissive="#ff69b4"
          emissiveIntensity={2}
          toneMapped={false}
        />
      </mesh>

      {/* Rounded Cap (using sphere segments) */}
      <mesh position={[0, stemHeight/2, 0]}>
        <sphereGeometry 
          args={[capRadius, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2]} // Half sphere
        />
        <meshStandardMaterial 
          color="#ff1493"
          emissive="#ff69b4"
          emissiveIntensity={2}
          toneMapped={false}
        />
      </mesh>

      {/* Under-cap (optional: adds more detail) */}
      <mesh position={[0, stemHeight/2, 0]}>
        <ringGeometry args={[stemRadius, capRadius, 16]} />
        <meshStandardMaterial 
          color="#ff1493"
          emissive="#ff69b4"
          emissiveIntensity={1.5}
          toneMapped={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Add point light for extra glow effect */}
      <pointLight 
        color="#ff69b4"
        intensity={0.05}
        distance={1.5}
        decay={2}
        position={[0, stemHeight/2, 0]}
      />
    </group>
  );
};

export default Mushroom;
export type { MushroomProps };