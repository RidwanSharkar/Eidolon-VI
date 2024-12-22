import React, { useRef } from 'react';
import { Mesh, Group } from 'three';
import { useFrame } from '@react-three/fiber';

export const ORBITAL_COOLDOWN = 9000; // Moved cooldown constant here

interface ChargeStatus {
  id: number;
  available: boolean;
  cooldownStartTime: number | null;
}

interface ChargedOrbitalsProps {
  parentRef: React.RefObject<Group>;
  charges: Array<ChargeStatus>;
  orbitRadius?: number;
  orbitSpeed?: number;
  particleSize?: number;
  particleCount?: number;
  activeColor?: string;
  inactiveColor?: string;
  activeEmissiveIntensity?: number;
  inactiveEmissiveIntensity?: number;
  activeOpacity?: number;
  inactiveOpacity?: number;
}

export default function ChargedOrbitals({ 
  parentRef,
  charges,
  orbitRadius = 0.6,
  orbitSpeed = 1.2,
  particleSize = 0.09,
  particleCount = 8,
  activeColor = "#00ff44",
  inactiveColor = "#333333",
  activeEmissiveIntensity = 2,
  inactiveEmissiveIntensity = 0.5,
  activeOpacity = 0.8,
  inactiveOpacity = 0.4
}: ChargedOrbitalsProps) {
  const particlesRef = useRef<Mesh[]>([]);

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
        const chargeStatus = charges[i];
        
        return (
          <mesh
            key={i}
            ref={(el) => {
              if (el) particlesRef.current[i] = el;
            }}
          >
            <sphereGeometry args={[particleSize, 8, 8]} />
            <meshStandardMaterial
              color={chargeStatus?.available ? activeColor : inactiveColor}
              emissive={chargeStatus?.available ? activeColor : inactiveColor}
              emissiveIntensity={chargeStatus?.available ? activeEmissiveIntensity : inactiveEmissiveIntensity}
              transparent
              opacity={chargeStatus?.available ? activeOpacity : inactiveOpacity}
            />
          </mesh>
        );
      })}
    </>
  );
}