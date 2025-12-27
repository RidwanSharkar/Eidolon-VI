import React, { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { AdditiveBlending, Color, CylinderGeometry, Group, Mesh, SphereGeometry, TorusGeometry } from 'three';

// Pre-allocated colors for performance - avoids new Color() on every render
const LIGHTNING_COLOR = new Color(0xFF0000); // Red lightning
const CORE_COLOR = new Color(0xFFFF00); // Yellow core

// MEMORY FIX: Static shared geometries - use scale instead of dynamic args
const CHARGE_GEOMETRIES = {
  coreOrb: new SphereGeometry(0.2, 16, 16),       // Base size, scale by (1 + chargeProgress * 1.5)
  outerShell: new SphereGeometry(0.4, 12, 12),   // Base size, scale by (1 + chargeProgress * 1.25)
  particle: new SphereGeometry(0.08, 8, 8),
  arc: new CylinderGeometry(0.02, 0.02, 0.5, 4), // Fixed size for lightning arcs
  ring0: new TorusGeometry(0.8, 0.05, 8, 16),    // Scale for chargeProgress
  ring1: new TorusGeometry(1.1, 0.05, 8, 16),
  ring2: new TorusGeometry(1.4, 0.05, 8, 16),
};

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
  const effectGroupRef = useRef<Group>(null);
  const [shouldShowEffect, setShouldShowEffect] = useState(false);
  const particleRefs = useRef<Mesh[]>([]);
  
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

  // MEMORY FIX: Calculate scales once instead of using dynamic geometry args
  const coreScale = 1 + chargeProgress * 1.5;
  const shellScale = 1 + chargeProgress * 1.25;
  const ringScale = 1 + chargeProgress * 0.5;

  return (
    <group ref={effectGroupRef}>
      {/* Central charging orb - FIXED: Use scale instead of dynamic geometry */}
      <mesh position={[0, 0, 0]} scale={coreScale}>
        <primitive object={CHARGE_GEOMETRIES.coreOrb} />
        <meshStandardMaterial
          color={CORE_COLOR}
          emissive={CORE_COLOR}
          emissiveIntensity={baseIntensity * 2}
          transparent
          opacity={0.8}
          blending={AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      
      {/* Outer energy shell - FIXED: Use scale instead of dynamic geometry */}
      <mesh position={[0, 0, 0]} scale={shellScale}>
        <primitive object={CHARGE_GEOMETRIES.outerShell} />
        <meshStandardMaterial
          color={LIGHTNING_COLOR}
          emissive={LIGHTNING_COLOR}
          emissiveIntensity={baseIntensity}
          transparent
          opacity={0.4 + chargeProgress * 0.3}
          blending={AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* Orbiting energy particles - FIXED: Use shared geometry */}
      {[...Array(6)].map((_, i) => (
        <mesh
          key={`particle-${i}`}
          ref={el => {
            if (el) particleRefs.current[i] = el;
          }}
        >
          <primitive object={CHARGE_GEOMETRIES.particle} />
          <meshStandardMaterial
            color={LIGHTNING_COLOR}
            emissive={LIGHTNING_COLOR}
            emissiveIntensity={baseIntensity * 1.5}
            transparent
            opacity={0.7}
            blending={AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      ))}

      {/* Lightning arcs - FIXED: Use shared geometry with fixed size */}
      {chargeProgress > 0.3 && [...Array(Math.floor(chargeProgress * 8))].map((_, i) => (
        <mesh
          key={`arc-${i}`}
          position={[
            (Math.sin(i * 1.3) * 0.5) * 2,
            (Math.cos(i * 0.7) * 0.5) * 1,
            (Math.sin(i * 2.1) * 0.5) * 2
          ]}
          rotation={[
            i * 0.5,
            i * 0.7,
            i * 0.3
          ]}
          scale={[1, 1 + (i % 3) * 0.3, 1]}
        >
          <primitive object={CHARGE_GEOMETRIES.arc} />
          <meshStandardMaterial
            color={LIGHTNING_COLOR}
            emissive={LIGHTNING_COLOR}
            emissiveIntensity={baseIntensity * 2}
            transparent
            opacity={0.6}
            blending={AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      ))}

      {/* Ground energy rings - FIXED: Use shared geometries with scale */}
      {[CHARGE_GEOMETRIES.ring0, CHARGE_GEOMETRIES.ring1, CHARGE_GEOMETRIES.ring2].map((ringGeom, i) => (
        <mesh
          key={`ring-${i}`}
          position={[0, -0.4, 0]}
          rotation={[Math.PI / 2, 0, Date.now() * 0.001 * (i + 1)]}
          scale={ringScale}
        >
          <primitive object={ringGeom} />
          <meshStandardMaterial
            color={LIGHTNING_COLOR}
            emissive={LIGHTNING_COLOR}
            emissiveIntensity={baseIntensity}
            transparent
            opacity={0.5 - i * 0.1}
            blending={AdditiveBlending}
            depthWrite={false}
          />
        </mesh>
      ))}

      {/* Point light for scene illumination */}
      <pointLight 
        color={LIGHTNING_COLOR}
        intensity={chargeProgress * 4 + 1}
        distance={5}
        decay={2}
      />
    </group>
  );
}
