import React, { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Group } from 'three';
import * as THREE from 'three';

interface ThrowSpearChargeEffectProps {
  parentRef: React.RefObject<Group>;
  isActive: boolean;
  chargeProgress: number; // 0-1
}

export default function ThrowSpearChargeEffect({ 
  parentRef, 
  isActive, 
  chargeProgress 
}: ThrowSpearChargeEffectProps) {
  const effectGroupRef = useRef<THREE.Group>(null);
  const [shouldShowEffect, setShouldShowEffect] = useState(false);
  const particleRefs = useRef<THREE.Mesh[]>([]);
  
  // Add effect to handle the activation delay
  useEffect(() => {
    if (isActive) {
      // Add a small delay before showing the effect to prevent flickering
      const timer = setTimeout(() => {
        setShouldShowEffect(true);
      }, 100); // 100ms delay
      
      return () => {
        clearTimeout(timer);
      };
    } else {
      setShouldShowEffect(false);
    }
  }, [isActive]);

  useFrame(() => {
    if (!shouldShowEffect || !parentRef.current || !effectGroupRef.current) return;

    // Position the effect at the player's position
    effectGroupRef.current.position.copy(parentRef.current.position);
    effectGroupRef.current.position.y += 0.5; // Position slightly above the ground

    // Animate particles based on charge progress
    particleRefs.current.forEach((particle, index) => {
      if (!particle) return;
      
      const time = Date.now() * 0.001;
      const offset = index * 0.5;
      
      // Orbital motion around player
      const radius = 1.5 + Math.sin(time + offset) * 0.3;
      const angle = time * 2 + offset;
      const height = Math.sin(time * 3 + offset) * 0.5;
      
      particle.position.set(
        Math.cos(angle) * radius,
        height,
        Math.sin(angle) * radius
      );
      
      // Scale and intensity based on charge progress
      const scale = 0.5 + chargeProgress * 1.5;
      particle.scale.setScalar(scale);
      
      // Rotate particles
      particle.rotation.x += 0.02;
      particle.rotation.y += 0.03;
    });
  });

  if (!shouldShowEffect) return null;

  // Color intensity based on charge progress
  const baseIntensity = 1 + chargeProgress * 3;
  const lightningColor = new THREE.Color(0xFF0000); // Red lightning
  const coreColor = new THREE.Color(0xFFFF00); // Yellow core

  return (
    <group ref={effectGroupRef}>
      {/* Central charging orb */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.2 + chargeProgress * 0.3, 16, 16]} />
        <meshStandardMaterial
          color={coreColor}
          emissive={coreColor}
          emissiveIntensity={baseIntensity * 2}
          transparent
          opacity={0.8}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      
      {/* Outer energy shell */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[0.4 + chargeProgress * 0.5, 12, 12]} />
        <meshStandardMaterial
          color={lightningColor}
          emissive={lightningColor}
          emissiveIntensity={baseIntensity}
          transparent
          opacity={0.4 + chargeProgress * 0.3}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Orbiting energy particles */}
      {[...Array(6)].map((_, i) => (
        <mesh
          key={`particle-${i}`}
          ref={el => {
            if (el) particleRefs.current[i] = el;
          }}
        >
          <sphereGeometry args={[0.08, 8, 8]} />
          <meshStandardMaterial
            color={lightningColor}
            emissive={lightningColor}
            emissiveIntensity={baseIntensity * 1.5}
            transparent
            opacity={0.7}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      ))}

      {/* Lightning arcs - more intense with higher charge */}
      {chargeProgress > 0.3 && [...Array(Math.floor(chargeProgress * 8))].map((_, i) => (
        <mesh
          key={`arc-${i}`}
          position={[
            (Math.random() - 0.5) * 2,
            (Math.random() - 0.5) * 1,
            (Math.random() - 0.5) * 2
          ]}
          rotation={[
            Math.random() * Math.PI,
            Math.random() * Math.PI,
            Math.random() * Math.PI
          ]}
        >
          <cylinderGeometry args={[0.02, 0.02, 0.5 + Math.random() * 0.5, 4]} />
          <meshStandardMaterial
            color={lightningColor}
            emissive={lightningColor}
            emissiveIntensity={baseIntensity * 2}
            transparent
            opacity={0.6}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      ))}

      {/* Ground energy rings */}
      {[...Array(3)].map((_, i) => (
        <mesh
          key={`ring-${i}`}
          position={[0, -0.4, 0]}
          rotation={[Math.PI / 2, 0, Date.now() * 0.001 * (i + 1)]}
        >
          <torusGeometry args={[0.8 + i * 0.3 + chargeProgress * 0.5, 0.05, 8, 16]} />
          <meshStandardMaterial
            color={lightningColor}
            emissive={lightningColor}
            emissiveIntensity={baseIntensity}
            transparent
            opacity={0.5 - i * 0.1}
            blending={THREE.AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      ))}

      {/* Point light for scene illumination */}
      <pointLight 
        color={lightningColor}
        intensity={chargeProgress * 4 + 1}
        distance={5}
        decay={2}
      />
    </group>
  );
}
