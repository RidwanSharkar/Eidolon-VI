// src/Versus/Reaper/ReaperSubmergeEffect.tsx
import { useRef, useEffect, useState, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Mesh, AdditiveBlending, CircleGeometry, RingGeometry } from 'three';
import { Material, MeshStandardMaterial, SphereGeometry, Vector3 } from 'three';
import { geometryPools, materialPools } from '@/Scene/EffectPools';

// MEMORY FIX: Shared geometries to prevent recreation on every render
const SUBMERGE_CIRCLE_GEOMETRY = new CircleGeometry(2.5, 24);
const SUBMERGE_RING_GEOMETRY = new RingGeometry(1.0, 2.0, 16);

interface ReaperSubmergeEffectProps {
  position: Vector3;
  duration?: number;
  onComplete?: () => void;
}

export default function ReaperSubmergeEffect({
  position,
  duration = 4000, // 4 second animation - longer duration
  onComplete
}: ReaperSubmergeEffectProps) {
  const particles = useRef<Mesh[]>([]);
  const startTime = useRef(Date.now());
  const isCompleted = useRef(false);
  const [progress, setProgress] = useState(0);

  // Use pooled geometries and materials
  const pooledResources = useMemo(() => {
    const geometries = [];
    const materials = [];

    // Acquire resources for all 40 particles
    for (let i = 0; i < 40; i++) {
      geometries.push(geometryPools.reaperSubmergeParticle.acquire());
      materials.push(materialPools.reaperSubmerge.acquire());
    }

    return { geometries, materials };
  }, []);

  // Return resources to pool on cleanup
  useEffect(() => {
    return () => {
      const { geometries, materials } = pooledResources;

      // Return geometries to pool
      geometries.forEach(geo => geometryPools.reaperSubmergeParticle.release(geo));

      // Return materials to pool
      materials.forEach(mat => materialPools.reaperSubmerge.release(mat));
    };
  }, [pooledResources]);

  // Initialize particle positions once
  const particlePositions = useMemo(() =>
    Array(40).fill(null).map(() => ({
      angle: Math.random() * Math.PI * 2,
      radius: 0.5 + Math.random() * 1.0, // Larger initial radius
      height: 0.5 + Math.random() * 1.0 // Start higher
    })), []
  );

  useEffect(() => {
    // Initialize 40 particle meshes for a more dramatic effect
    particles.current = Array(40).fill(null).map((_, i) => {
      const mesh = new Mesh(
        pooledResources.geometries[i],
        pooledResources.materials[i]
      );

      // Set initial positions using pre-calculated values
      const particle = particlePositions[i];
      mesh.position.set(
        Math.cos(particle.angle) * particle.radius,
        particle.height,
        Math.sin(particle.angle) * particle.radius
      );

      return mesh;
    });

    return () => {
      particles.current = [];
    };
  }, [pooledResources, particlePositions]);

  useFrame(() => {
    if (isCompleted.current) return;

    const elapsed = Date.now() - startTime.current;
    const currentProgress = Math.min(elapsed / duration, 1);
    setProgress(currentProgress);

    particles.current.forEach((particle, i) => {
      // Spiral downward movement (opposite of stealth mist)
      const angle = (i / particles.current.length) * Math.PI * 2 + currentProgress * Math.PI * 3;
      const radius = 1.5 * currentProgress; // Expand much more outward
      
      particle.position.x = Math.cos(angle) * radius;
      particle.position.z = Math.sin(angle) * radius;
      particle.position.y = Math.max(particle.position.y - 0.015, 0.1); // Sink slower, don't go below ground

      // Fade out more gradually
      const material = particle.material as MeshStandardMaterial;
      material.opacity = 0.9 * (1 - currentProgress * 0.8); // Stay visible longer
      
      // Scale up more dramatically as they disperse
      const scale = 1 + currentProgress * 0.8;
      particle.scale.setScalar(scale);
    });

    if (currentProgress >= 1 && !isCompleted.current) {
      isCompleted.current = true;
      onComplete?.();
    }
  });

  useEffect(() => {
    return () => {
      if (onComplete && !isCompleted.current) {
        onComplete();
      }
    };
  }, [onComplete]);

  return (
    <group position={[position.x, position.y, position.z]}>
      {particles.current.map((particle, i) => (
        <primitive key={i} object={particle} />
      ))}
      
      {/* Add central bright light for dramatic effect */}
      <pointLight 
        color="#FF4500"
        intensity={3.0}
        distance={6}
        decay={1.5}
      />
      
      {/* Ground effect circle - larger and more visible - MEMORY FIX: Use shared geometry */}
      <mesh position={[0, 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <primitive object={SUBMERGE_CIRCLE_GEOMETRY} attach="geometry" />
        <meshBasicMaterial 
          color="#8B0000"
          transparent 
          opacity={0.8 * (1 - progress * 0.7)}
        />
      </mesh>
      
      {/* Additional pulsing ring effect - MEMORY FIX: Use shared geometry */}
      <mesh position={[0, 0.15, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <primitive object={SUBMERGE_RING_GEOMETRY} attach="geometry" />
        <meshBasicMaterial 
          color="#FF4500"
          transparent 
          opacity={0.6 * (1 - progress) * Math.sin(progress * Math.PI * 4)}
        />
      </mesh>
    </group>
  );
}
