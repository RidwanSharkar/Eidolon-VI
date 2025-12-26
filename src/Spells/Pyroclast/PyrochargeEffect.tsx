// src/Spells/Pyroclast/PyrochargeEffect.tsx
import { useRef, useState, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import {
  AdditiveBlending,
  DoubleSide,
  Group,
  Material,
  Mesh,
  MeshStandardMaterial,
  DodecahedronGeometry,
  RingGeometry,
  CylinderGeometry
} from 'three';

// Import shared geometries for pyrocharge effect - prevents memory leaks
import {
  MULTIPLAYER_EFFECT_GEOMETRIES
} from '@/Scene/SharedGeometries';

// Use shared geometries for pyrocharge effect - prevents memory leaks
const pyrochargeGeometries = {
  particle: MULTIPLAYER_EFFECT_GEOMETRIES.pyrochargeParticle,
  groundRing: MULTIPLAYER_EFFECT_GEOMETRIES.pyrochargeRing, // Will be scaled dynamically
  centerPillar: MULTIPLAYER_EFFECT_GEOMETRIES.pyrochargePillar // Will be scaled dynamically
};

// Note: Using SHARED geometries from SharedGeometries.ts
// These should NOT be disposed as they are shared across the entire application

interface PyrochargeEffectProps {
  parentRef: React.RefObject<Group>;
  isActive: boolean;
  chargeProgress: number;
}

export default function PyrochargeEffect({
  parentRef,
  isActive,
  chargeProgress
}: PyrochargeEffectProps) {
  const flameParticlesRef = useRef<Group>(null);
  const lastUpdateTime = useRef(0);
  // Add state to track if we should show the effect (with a short delay)
  const [shouldShowEffect, setShouldShowEffect] = useState(false);

  // Note: Using shared geometries - no resource management needed

  // Shared materials - memoized to avoid recreation
  const materials = useMemo(() => ({
    particle: new MeshStandardMaterial({
      color: "#FF8800",
      emissive: "#FF8800",
      emissiveIntensity: 1,
      transparent: true,
      opacity: 0.6,
      blending: AdditiveBlending,
      depthWrite: false
    }),
    particleAlt1: new MeshStandardMaterial({
      color: "#FF4400",
      emissive: "#FF4400",
      emissiveIntensity: 1,
      transparent: true,
      opacity: 0.6,
      blending: AdditiveBlending,
      depthWrite: false
    }),
    particleAlt2: new MeshStandardMaterial({
      color: "#FF2200",
      emissive: "#FF2200",
      emissiveIntensity: 1,
      transparent: true,
      opacity: 0.6,
      blending: AdditiveBlending,
      depthWrite: false
    }),
    groundRing: new MeshStandardMaterial({
      color: "#FF3000",
      emissive: "#FF6000",
      emissiveIntensity: 2,
      transparent: true,
      opacity: 0.3,
      blending: AdditiveBlending,
      depthWrite: false,
      side: DoubleSide
    }),
    centerPillar: new MeshStandardMaterial({
      color: "#FF4000",
      emissive: "#FF6000",
      emissiveIntensity: 3,
      transparent: true,
      opacity: 0.5,
      blending: AdditiveBlending,
      depthWrite: false
    })
  }), []);

  // Pre-generate particle positions to avoid recalculating every render
  // This must be called before any conditional returns to follow Rules of Hooks
  const particlePositions = useMemo(() => {
    const particleCount = 12;
    return Array(particleCount).fill(null).map((_, i) => {
      const angle = (i / particleCount) * Math.PI * 2;
      const radius = 0.8 + (Math.random() * 0.3);
      const offsetX = Math.sin(angle) * radius;
      const offsetZ = Math.cos(angle) * radius;
      const height = (Math.random() * 0.6) + 0.2;
      const rotation = Math.random() * Math.PI * 2;
      return { offsetX, offsetZ, height, rotation };
    });
  }, []); // Empty dependency array since we want this to be stable

  // Cleanup materials on unmount
  useEffect(() => {
    return () => {
      Object.values(materials).forEach((mat) => mat.dispose());
    };
  }, [materials]);

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
    if (!shouldShowEffect || !parentRef.current || !flameParticlesRef.current) return;

    // Position the effect at the player's position
    flameParticlesRef.current.position.copy(parentRef.current.position);
    flameParticlesRef.current.position.y += -0.5; // Position slightly above the ground

    // Rotate particles randomly for more dynamic effect
    const now = Date.now();
    if (now - lastUpdateTime.current > 50) { // Update rotation every 50ms
      // Rotate the flame particles for effect
      Array.from(flameParticlesRef.current.children).forEach((child) => {
        const mesh = child as Mesh;
        mesh.rotation.y += (Math.random() * 0.2 - 0.1);
        mesh.rotation.x += (Math.random() * 0.1 - 0.05);

        // Scale based on charge progress
        const baseScale = 0.1 + (chargeProgress * 0.7); // Scale from 0.3 to 1.0
        const randomScale = baseScale * (0.8 + Math.random() * 0.4); // Add some randomness
        mesh.scale.set(randomScale, randomScale, randomScale);

        // Adjust opacity based on charge progress
        if (mesh.material instanceof Material) {
          const material = mesh.material as MeshStandardMaterial;
          material.opacity = 0.6 + (chargeProgress * 0.4);
          material.emissiveIntensity = 1 + (chargeProgress * 4);
        }
      });
      lastUpdateTime.current = now;
    }
  });

  // Don't render anything if we shouldn't show the effect yet
  if (!shouldShowEffect) return null;

  // Generate random particles around the player
  const particleCount = 12;
  const particles = [];

  // Get particle material with different colors (using shared materials)
  const getParticleMaterial = (i: number) => {
    const materialIndex = i % 3;
    const material = materialIndex === 0 ? materials.particle :
                     materialIndex === 1 ? materials.particleAlt1 :
                     materials.particleAlt2;

    // Update material properties based on charge progress
    material.emissiveIntensity = 1 + (chargeProgress * 4);
    material.opacity = 0.6 + (chargeProgress * 0.4);

    return material;
  };

  for (let i = 0; i < particleCount; i++) {
    const pos = particlePositions[i];
    particles.push(
      <mesh
        key={i}
        position={[pos.offsetX, pos.height, pos.offsetZ]}
        rotation={[0, pos.rotation, 0]}
        geometry={pyrochargeGeometries.particle}
        material={getParticleMaterial(i)}
      />
    );
  }

  // Add ground ring effect
  const groundRingRadius = 0.8 + (chargeProgress * 1.375);
  const pillarHeight = 2 * chargeProgress;

  // Update material properties dynamically
  materials.groundRing.opacity = 0.3 + (chargeProgress * 0.6);
  materials.groundRing.emissiveIntensity = 2 + (chargeProgress * 4);
  materials.centerPillar.opacity = 0.5 + (chargeProgress * 0.4);
  materials.centerPillar.emissiveIntensity = 3 + (chargeProgress * 3);

  return (
    <group ref={flameParticlesRef}>
      {/* Flame particles */}
      {particles}

      {/* Ground fire ring */}
      <mesh
        position={[0, 0, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        scale={[groundRingRadius, groundRingRadius, 1]}
        geometry={pyrochargeGeometries.groundRing}
        material={materials.groundRing}
      />

      {/* Center fire pillar */}
      <mesh
        position={[0, -0.4, 0]}
        geometry={pyrochargeGeometries.centerPillar}
        material={materials.centerPillar}
        scale={[1, pillarHeight, 1]}
      />
      
      {/* Light source */}
      <pointLight
        color="#FF6000"
        intensity={2 + (chargeProgress * 6)}
        distance={4 + (chargeProgress * 4)}
        decay={2}
      />
    </group>
  );
}