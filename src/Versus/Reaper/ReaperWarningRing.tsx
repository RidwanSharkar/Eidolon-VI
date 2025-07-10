// src/versus/Reaper/ReaperWarningRing.tsx
import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface ReaperWarningRingProps {
  position: THREE.Vector3;
  duration: number;
}

export default function ReaperWarningRing({ position, duration }: ReaperWarningRingProps) {
  const ringRef = useRef<THREE.Mesh>(null);
  const startTime = useRef(Date.now());

  useFrame(() => {
    if (!ringRef.current) return;

    const elapsed = (Date.now() - startTime.current) / 1000;
    const progress = Math.min(elapsed / duration, 1);

    // Pulse effect - faster than boss
    const scale = 1 + Math.sin(elapsed * 6) * 0.12;
    ringRef.current.scale.setScalar(scale * 2.4); // Smaller diameter than boss

    // Fade out near the end
    if (progress > 0.8) {
      const opacity = 1 - ((progress - 0.8) / 0.2);
      (ringRef.current.material as THREE.MeshBasicMaterial).opacity = opacity;
    }
  });

  return (
    <mesh
      ref={ringRef}
      position={[position.x, 0.08, position.z]}
      rotation={[-Math.PI / 2, 0, 0]}
    >
      <ringGeometry args={[2.2, 2.4, 48]} />  {/* Smaller than boss */}
      <meshBasicMaterial 
        color="#ff0000" 
        transparent 
        opacity={0.5}
        side={THREE.DoubleSide}
      />
    </mesh>
  );
} 