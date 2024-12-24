import React, { useRef } from 'react';
import { Mesh, Group } from 'three';
import { useFrame } from '@react-three/fiber';
import { WeaponType } from '../Weapons/weapons';

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
  weaponType: WeaponType;
}

export default function ChargedOrbitals({ 
  parentRef,
  charges,
  orbitRadius = 0.55,
  orbitSpeed = 0.8,
  particleSize = 0.08,
  particleCount = 8,
  weaponType
}: ChargedOrbitalsProps) {
  const particlesRef = useRef<Mesh[]>([]);

  const getOrbitalColor = () => {
    switch (weaponType) {
      case WeaponType.SCYTHE:
        return '#00ff44';
      case WeaponType.SWORD:
        return '#8783D1';
      case WeaponType.SABRES:
      case WeaponType.SABRES2:
        return '#73EEDC';
      default:
        return '#00ff44';  // Default to scythe color
    }
  };

  const activeColor = getOrbitalColor();

  useFrame(() => {
    if (!parentRef.current) return;

    particlesRef.current.forEach((particle, i) => {
      const angle = (i / particleCount) * Math.PI * 2 + Date.now() * 0.001 * orbitSpeed;
      const x = Math.cos(angle) * orbitRadius;
      const z = Math.sin(angle) * orbitRadius;
      const y = Math.sin(Date.now() * 0.002 + i) * 0.05;

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
              color={chargeStatus?.available ? activeColor : "#333333"}
              emissive={chargeStatus?.available ? activeColor : "#333333"}
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