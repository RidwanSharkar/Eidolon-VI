import React, { useRef } from 'react';
import { Group } from 'three';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface GlacialShardShieldProps {
  parentRef: React.RefObject<Group>;
  absorption: number;
}

export default function GlacialShardShield({ parentRef, absorption }: GlacialShardShieldProps) {
  const shieldRef = useRef<Group>(null);
  const timeRef = useRef(0);

  useFrame(() => {
    if (!shieldRef.current || !parentRef.current) return;

    timeRef.current += 0.05;

    // Follow the parent's position
    shieldRef.current.position.copy(parentRef.current.position);
    shieldRef.current.position.y += 0.1;

    // Rotate for dynamic effect
    shieldRef.current.rotation.y = timeRef.current * 0.5;

    // Pulse based on remaining absorption
    const pulseIntensity = 1 + Math.sin(timeRef.current * 4) * 0.3;
    const opacityMultiplier = Math.max(0.3, absorption / 50); // Fade as shield weakens
    
    // Update materials if needed (this is a simplified approach)
    shieldRef.current.children.forEach(child => {
      if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
        child.material.opacity = opacityMultiplier * pulseIntensity * 0.6;
        child.material.emissiveIntensity = pulseIntensity * 1.5;
      }
    });
  });

  const maxAbsorption = 40;
  const shieldStrength = absorption / maxAbsorption;

  return (
    <group ref={shieldRef}>
      {/* Main shield sphere */}
      <mesh>
        <sphereGeometry args={[0.875, 32, 32]} />
        <meshStandardMaterial
          color="#4DDDFF"
          emissive="#4DDDFF"
          emissiveIntensity={0.4 * shieldStrength}
          transparent
          opacity={0.175 * shieldStrength}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Inner ice layer */}
      <mesh>
        <sphereGeometry args={[0.7, 24, 24]} />
        <meshStandardMaterial
          color="#AAEEFF"
          emissive="#AAEEFF"
          emissiveIntensity={0.7 * shieldStrength}
          transparent
          opacity={0.125 * shieldStrength}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>


      {/* Shield light */}
      <pointLight
        color="#4DDDFF"
        intensity={1.0 * shieldStrength}
        distance={8}
        decay={1.5}
      />
    </group>
  );
} 