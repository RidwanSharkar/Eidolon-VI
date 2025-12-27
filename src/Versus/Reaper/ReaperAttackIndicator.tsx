// src/versus/Reaper/ReaperAttackIndicator.tsx
import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { DoubleSide, Mesh, MeshBasicMaterial, RingGeometry, Vector3 } from 'three';

// MEMORY FIX: Static shared geometries - use scale for range
const INDICATOR_GEOMETRIES = {
  mainRing: new RingGeometry(0.8, 1.0, 64),   // Unit size, scale by range
  innerRing: new RingGeometry(0.35, 0.4, 64), // Unit size, scale by range
};

interface ReaperAttackIndicatorProps {
  position: Vector3;
  duration: number;
  range: number;
}

export default function ReaperAttackIndicator({ position, duration, range }: ReaperAttackIndicatorProps) {
  const ringRef = useRef<Mesh>(null);
  const startTime = useRef(Date.now());

  useFrame(() => {
    if (!ringRef.current) return;

    const elapsed = (Date.now() - startTime.current) / 1000;
    const progress = Math.min(elapsed / duration, 1);

    // Pulse for attack warning
    const scale = 0.65 + Math.sin(elapsed * 8) * 0.15;
    ringRef.current.scale.setScalar(scale * range);

    // Fade out near the end
    if (progress > 0.7) {
      const opacity = 1 - ((progress - 0.7) / 0.3);
      (ringRef.current.material as MeshBasicMaterial).opacity = opacity * 0.6;
    }
  });

  return (
    <group position={[position.x, 0.5, position.z]}>
      {/* Main warning ring - FIXED: Use shared geometry with scale */}
      <mesh
        ref={ringRef}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={range}
      >
        <primitive object={INDICATOR_GEOMETRIES.mainRing} />
        <meshBasicMaterial 
          color="#00BBFF"
          transparent 
          opacity={0.35}
          side={DoubleSide}
        />
      </mesh>

      {/* Inner pulse ring - FIXED: Use shared geometry with scale */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        scale={range}
      >
        <primitive object={INDICATOR_GEOMETRIES.innerRing} />
        <meshBasicMaterial 
          color="#66D9FF"
          transparent 
          opacity={0.35}
          side={DoubleSide}
        />
      </mesh>
    </group>
  );
}
