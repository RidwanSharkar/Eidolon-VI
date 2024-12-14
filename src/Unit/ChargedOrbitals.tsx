import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Mesh, Group } from 'three';

interface OrbitalParticlesProps {
  parentRef: React.RefObject<Group>;
  fireballCharges: Array<{ id: number; available: boolean; cooldownStartTime: number | null }>;
}

export default function OrbitalParticles({ parentRef, fireballCharges }: OrbitalParticlesProps) {
  const particlesRef = useRef<Mesh[]>([]);
  const particleCount = 8;
  const orbitRadius = 0.6;
  const orbitSpeed = 1.2;
  const particleSize = 0.08;

  useFrame(() => {
    if (!parentRef.current) return;
    particlesRef.current.forEach((particle, i) => {
      const angle = (i / particleCount) * Math.PI * 2 + Date.now() * 0.001 * orbitSpeed;
      const x = Math.cos(angle) * orbitRadius;
      const z = Math.sin(angle) * orbitRadius;
      const y = Math.sin(Date.now() * 0.002 + i) * 0.1;
      particle.position.set(x, y, z);
    });
  });

  return (
    <>
      {Array.from({ length: particleCount }).map((_, i) => {
        const chargeStatus = fireballCharges[i];
        return (
          <mesh
            key={i}
            ref={(el) => { if (el) particlesRef.current[i] = el; }}
          >
            <sphereGeometry args={[particleSize, 8, 8]} />
            <meshStandardMaterial
              color={chargeStatus?.available ? "#00ff44" : "#333333"}
              emissive={chargeStatus?.available ? "#00ff44" : "#333333"}
              emissiveIntensity={chargeStatus?.available ? 2 : 0.5}
              transparent
              opacity={chargeStatus?.available ? 0.8 : 0.4}
            />
          </mesh>
        );
      })}
    </>
  );
}
