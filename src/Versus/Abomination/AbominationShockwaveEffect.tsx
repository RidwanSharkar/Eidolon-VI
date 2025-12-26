// src/Versus/Abomination/AbominationShockwaveEffect.tsx
import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Vector3, Group } from 'three';
import { useFrame } from '@react-three/fiber';
import { geometryPools, materialPools } from '@/Scene/EffectPools';

interface AbominationShockwaveEffectProps {
  position: Vector3;
  duration?: number;
  onComplete?: () => void;
}

export default function AbominationShockwaveEffect({
  position,
  duration = 1000, // 2 second shockwave effect
  onComplete
}: AbominationShockwaveEffectProps) {
  const groupRef = useRef<Group>(null);
  const [progress, setProgress] = useState(0);

  const startTime = useRef(Date.now());
  const isCompleted = useRef(false);

  // Use pooled geometries and materials
  const pooledResources = useMemo(() => {
    const geometries = {
      craterCircle: geometryPools.abominationShockwaveCircle.acquire(),
      ring1: geometryPools.abominationShockwaveRing.acquire(),
      ring2: geometryPools.abominationShockwaveRing.acquire(),
      ring3: geometryPools.abominationShockwaveRing.acquire(),
      dustSphere: geometryPools.abominationShockwaveCircle.acquire(), // Reuse circle for sphere
      debrisBoxes: Array(12).fill(0).map(() => geometryPools.abominationShockwaveBox.acquire())
    };

    const materials = {
      crater: materialPools.abominationShockwave.acquire(),
      ring1: materialPools.abominationShockwave.acquire(),
      ring2: materialPools.abominationShockwave.acquire(),
      ring3: materialPools.abominationShockwave.acquire(),
      dust: materialPools.abominationShockwave.acquire(),
      debris: Array(12).fill(0).map(() => materialPools.abominationShockwave.acquire())
    };

    return { geometries, materials };
  }, []);

  // Return resources to pool on cleanup
  useEffect(() => {
    return () => {
      const { geometries, materials } = pooledResources;

      // Return geometries to pool
      geometryPools.abominationShockwaveCircle.release(geometries.craterCircle);
      geometryPools.abominationShockwaveRing.release(geometries.ring1);
      geometryPools.abominationShockwaveRing.release(geometries.ring2);
      geometryPools.abominationShockwaveRing.release(geometries.ring3);
      geometryPools.abominationShockwaveCircle.release(geometries.dustSphere);
      geometries.debrisBoxes.forEach(box => geometryPools.abominationShockwaveBox.release(box));

      // Return materials to pool
      materialPools.abominationShockwave.release(materials.crater);
      materialPools.abominationShockwave.release(materials.ring1);
      materialPools.abominationShockwave.release(materials.ring2);
      materialPools.abominationShockwave.release(materials.ring3);
      materialPools.abominationShockwave.release(materials.dust);
      materials.debris.forEach(mat => materialPools.abominationShockwave.release(mat));
    };
  }, [pooledResources]);

  useFrame(() => {
    if (isCompleted.current) return;

    const elapsed = Date.now() - startTime.current;
    const currentProgress = Math.min(elapsed / duration, 1);
    setProgress(currentProgress);

    if (groupRef.current) {
      // Rotate the shockwave rings for dynamic effect
      groupRef.current.rotation.y += 0.02;
    }

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

  // Calculate expanding ring sizes and opacities
  const ring1Scale = 1 + progress * 8; // Expands from 1 to 9
  const ring2Scale = 1 + progress * 6; // Expands from 1 to 7
  const ring3Scale = 1 + progress * 4; // Expands from 1 to 5
  
  const ring1Opacity = Math.max(0, 0.8 - progress * 0.8);
  const ring2Opacity = Math.max(0, 0.6 - progress * 0.6);
  const ring3Opacity = Math.max(0, 0.4 - progress * 0.4);

  // Update material opacities dynamically
  useFrame(() => {
    const { materials } = pooledResources;

    // Update crater opacity
    materials.crater.opacity = Math.max(0, 0.7 - progress * 0.5);

    // Update ring opacities
    materials.ring1.opacity = ring1Opacity;
    materials.ring2.opacity = ring2Opacity;
    materials.ring3.opacity = ring3Opacity;

    // Update dust opacity
    materials.dust.opacity = Math.max(0, 0.3 - progress * 0.3);

    // Update debris opacities
    materials.debris.forEach(mat => {
      mat.opacity = Math.max(0, 0.8 - progress * 0.8);
    });
  });

  return (
    <group
      ref={groupRef}
      position={[position.x, position.y + 0.1, position.z]}
    >
      {/* Central impact crater */}
      <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <primitive object={pooledResources.geometries.craterCircle} />
        <primitive object={pooledResources.materials.crater} />
      </mesh>

      {/* Expanding shockwave rings */}
      <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <primitive object={pooledResources.geometries.ring1} />
        <primitive object={pooledResources.materials.ring1} />
      </mesh>

      <mesh position={[0, 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <primitive object={pooledResources.geometries.ring2} />
        <primitive object={pooledResources.materials.ring2} />
      </mesh>

      <mesh position={[0, 0.15, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <primitive object={pooledResources.geometries.ring3} />
        <primitive object={pooledResources.materials.ring3} />
      </mesh>

      {/* Dust particles effect */}
      <mesh position={[0, 0.5, 0]}>
        <primitive object={pooledResources.geometries.dustSphere} />
        <primitive object={pooledResources.materials.dust} />
      </mesh>

      {/* Central light flash */}
      <pointLight
        color="#FF6B35"
        intensity={Math.max(0, 5.0 - progress * 5.0)}
        distance={15}
        decay={2}
      />

      {/* Ground debris particles */}
      {Array.from({ length: 12 }, (_, i) => {
        const angle = (i / 12) * Math.PI * 2;
        const radius = 1 + progress * 4;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        const y = Math.sin(progress * Math.PI) * 0.5; // Arc trajectory

        return (
          <mesh
            key={i}
            position={[x, y, z]}
            scale={[0.3, 0.3, 0.3]}
          >
            <primitive object={pooledResources.geometries.debrisBoxes[i]} />
            <primitive object={pooledResources.materials.debris[i]} />
          </mesh>
        );
      })}
    </group>
  );
}
