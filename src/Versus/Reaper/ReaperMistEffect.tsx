// src/Versus/Reaper/ReaperMistEffect.tsx
import { useRef, useState, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { geometryPools, materialPools } from '@/Scene/EffectPools';

interface ReaperMistEffectProps {
  position: THREE.Vector3;
  duration?: number;
  onComplete?: () => void;
}

interface ParticleData {
  initialAngle: number;
  initialRadius: number;
  initialY: number;
}

export default function ReaperMistEffect({ 
  position, 
  duration = 1000, // 1 second animation like stealth mist
  onComplete 
}: ReaperMistEffectProps) {
  const startTime = useRef(Date.now());
  const isCompleted = useRef(false);
  
  console.log('🌫️ ReaperMistEffect rendering at position:', position);
  
  // Initialize particle data once
  const [particleData] = useState<ParticleData[]>(() => 
    Array(30).fill(null).map(() => ({ // Increased from 20 to 35 particles
      initialAngle: Math.random() * Math.PI * 2,
      initialRadius: 0.5 + Math.random() * 1.0, // Doubled the radius range (was 0.5 + 0.5)
      initialY: 0.5 + Math.random() * 1
    }))
  );

  const [progress, setProgress] = useState(0);

  // Use pooled resources for all particles
  const pooledResources = useMemo(() => {
    const geometries = [];
    const materials = [];
    
    // Acquire resources for all particles
    for (let i = 0; i < particleData.length; i++) {
      geometries.push(geometryPools.reaperMistParticle.acquire());
      materials.push(materialPools.reaperMist.acquire());
    }
    
    return { geometries, materials };
  }, [particleData.length]);

  // Return resources to pool on cleanup
  useEffect(() => {
    return () => {
      const { geometries, materials } = pooledResources;
      
      // Return geometries to pool
      geometries.forEach(geo => geometryPools.reaperMistParticle.release(geo));
      
      // Return materials to pool
      materials.forEach(mat => materialPools.reaperMist.release(mat));
    };
  }, [pooledResources]);

  useFrame(() => {
    if (isCompleted.current) return;

    const elapsed = Date.now() - startTime.current;
    const currentProgress = Math.min(elapsed / duration, 1);
    setProgress(currentProgress);

    // Update material properties dynamically
    const { materials } = pooledResources;
    materials.forEach((material) => {
      const opacity = 0.6 * (1 - currentProgress);
      material.opacity = opacity;
      material.emissiveIntensity = 0.5 * (1 - currentProgress);
    });

    if (currentProgress >= 1 && !isCompleted.current) {
      isCompleted.current = true;
      onComplete?.();
    }
  });

  return (
    <group position={[position.x, position.y, position.z]}>
      {particleData.map((particle, i) => {
        // Calculate current particle position based on progress
        const angle = particle.initialAngle + progress * Math.PI;
        const radius = particle.initialRadius * (1 - progress);
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        const y = particle.initialY + progress * 2; // Rise upward
        
        const scale = 1 - progress * 0.5;
        
        return (
          <mesh
            key={i}
            position={[x, y, z]}
            scale={[scale, scale, scale]}
            geometry={pooledResources.geometries[i]}
            material={pooledResources.materials[i]}
          />
        );
      })}
      
      {/* Add central light for glow effect - same as stealth mist */}
      <pointLight 
        color="#a8e6cf"
        intensity={4}
        distance={5}
        decay={1}
      />
    </group>
  );
}
