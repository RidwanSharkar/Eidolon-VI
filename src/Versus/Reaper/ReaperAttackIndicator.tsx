// src/versus/Reaper/ReaperAttackIndicator.tsx
import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface ReaperAttackIndicatorProps {
  position: THREE.Vector3;
  duration: number;
  range: number;
}

export default function ReaperAttackIndicator({ position, duration, range }: ReaperAttackIndicatorProps) {
  const ringRef = useRef<THREE.Mesh>(null);
  const startTime = useRef(Date.now());

  useFrame(() => {
    if (!ringRef.current) return;

    const elapsed = (Date.now() - startTime.current) / 1000;
    const progress = Math.min(elapsed / duration, 1);

    // Pulse for attack warning
    const scale = 0.65 + Math.sin(elapsed * 8) * 0.15;
    ringRef.current.scale.setScalar(scale);

    // Fade out near the end
    if (progress > 0.7) {
      const opacity = 1 - ((progress - 0.7) / 0.3);
      (ringRef.current.material as THREE.MeshBasicMaterial).opacity = opacity * 0.6;
    }
  });

  return (
    <group position={[position.x, 0.5, position.z]}>
      {/* Main warning ring */}
      <mesh
        ref={ringRef}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <ringGeometry args={[range - 0.2, range, 64]} />
        <meshBasicMaterial 
          color="#00BBFF"
          transparent 
          opacity={0.35}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Inner pulse ring */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <ringGeometry args={[range - 0.65, range - 0.6, 64]} />
        <meshBasicMaterial 
          color="#66D9FF"
          transparent 
          opacity={0.35}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
} 