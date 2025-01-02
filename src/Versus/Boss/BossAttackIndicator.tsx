import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface BossAttackIndicatorProps {
  position: THREE.Vector3;
  duration: number;
  range: number;
}

export default function BossAttackIndicator({ position, duration, range }: BossAttackIndicatorProps) {
  const ringRef = useRef<THREE.Mesh>(null);
  const startTime = useRef(Date.now());

  useFrame(() => {
    if (!ringRef.current) return;

    const elapsed = (Date.now() - startTime.current) / 1000;
    const progress = Math.min(elapsed / duration, 1);

    // Faster pulse for attack warning
    const scale = 1 + Math.sin(elapsed * 8) * 0.15;
    ringRef.current.scale.setScalar(scale);

    // Fade out near the end
    if (progress > 0.7) {
      const opacity = 1 - ((progress - 0.7) / 0.3);
      (ringRef.current.material as THREE.MeshBasicMaterial).opacity = opacity * 0.6;
    }
  });

  return (
    <group position={[position.x, 1.15, position.z]}>
      {/* Main warning ring */}
      <mesh
        ref={ringRef}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <ringGeometry args={[range - 0.2, range, 64]} />
        <meshBasicMaterial 
          color="#ff3300"
          transparent 
          opacity={0.6}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Inner pulse ring */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <ringGeometry args={[range - 0.8, range - 0.6, 64]} />
        <meshBasicMaterial 
          color="#ff4400"
          transparent 
          opacity={0.2}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  );
} 