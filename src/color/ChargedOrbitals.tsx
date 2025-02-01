import React, { useRef } from 'react';
import { Group } from 'three';
import { useFrame } from '@react-three/fiber';
import { WeaponType } from '../Weapons/weapons';
import * as THREE from 'three';

export interface ChargeStatus {
  id: number;
  available: boolean;
  cooldownStartTime: number | null;
}

export const ORBITAL_COOLDOWN = 8250; // ORB CHARGE COOLDOWN

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
  const particlesRef = useRef<Group[]>([]);

  const getOrbitalColor = () => {
    switch (weaponType) {
      case WeaponType.SCYTHE:
        return '#00FF37';
      case WeaponType.SWORD:
        return '#FF831D'; //  FF9C50
      case WeaponType.SABRES:
        return '#0091FF'; // 78F6FF
      default:
        return '#00ff44';  // Default to scythe 78F6FF
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
          <group 
            key={i}
            ref={(el) => {
              if (el) particlesRef.current[i] = el;
            }}
          >
            {/* Inner glowing sphere */}
            <mesh>
              <sphereGeometry args={[particleSize, 8, 8]} />
              <meshStandardMaterial
                color={chargeStatus?.available ? activeColor : "#333333"}
                emissive={chargeStatus?.available ? activeColor : "#333333"}
                emissiveIntensity={chargeStatus?.available ? 1.25 : 0.4}
                transparent
                opacity={chargeStatus?.available ? 0.8 : 0.4}
              />
            </mesh>

            {/* Outer opaque layer */}
            <mesh>
              <sphereGeometry args={[particleSize*1.225, 32, 32]} />
              <meshStandardMaterial
                color={chargeStatus?.available ? activeColor : "#333333"}
                emissive={chargeStatus?.available ? activeColor : "#333333"}
                emissiveIntensity={chargeStatus?.available ? .5 : 0.1}
                transparent
                opacity={chargeStatus?.available ? 0.4 : 0.15}
                depthWrite={false}
                side={THREE.DoubleSide}
                blending={THREE.AdditiveBlending}
              />
            </mesh>
          </group>
        );
      })}
    </>
  );
}