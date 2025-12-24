// src/Versus/DeathKnight/DeathKnightSlashEffect.tsx
import { useRef, useMemo, useEffect } from 'react';
import { Group, Vector3 } from 'three';
import { useFrame } from '@react-three/fiber';
import { AdditiveBlending } from 'three';
import { geometryPools, materialPools } from '@/Scene/EffectPools';

interface DeathKnightSlashEffectProps {
  startPosition: Vector3;
  direction: Vector3;
  onComplete: () => void;
}

export default function DeathKnightSlashEffect({ 
  startPosition, 
  direction, 
  onComplete
}: DeathKnightSlashEffectProps) {
  const effectRef = useRef<Group>(null);
  const progressRef = useRef(0);
  const animationDuration = 0.5; // Slightly longer for Death Knight's powerful attack

  // Use pooled geometries and materials
  const pooledResources = useMemo(() => {
    const geometries = {
      mainSlash: geometryPools.deathKnightSlashTorus.acquire(),
      innerGlow: geometryPools.deathKnightSlashTorus.acquire(),
      outerGlow: geometryPools.deathKnightSlashTorus.acquire(),
      particle: geometryPools.deathKnightSlashParticle.acquire(),
      trailSegment: geometryPools.slashTrailSegment.acquire()
    };

    const materials = {
      mainSlash: materialPools.deathKnightSlash.acquire(),
      innerGlow: materialPools.deathKnightSlash.acquire(),
      outerGlow: materialPools.deathKnightSlash.acquire(),
      particle: materialPools.deathKnightSlashParticle.acquire(),
      trail: materialPools.deathKnightSlash.acquire()
    };

    return { geometries, materials };
  }, []);

  // Return resources to pool on cleanup
  useEffect(() => {
    return () => {
      const { geometries, materials } = pooledResources;
      
      // Return geometries to pool
      geometryPools.deathKnightSlashTorus.release(geometries.mainSlash);
      geometryPools.deathKnightSlashTorus.release(geometries.innerGlow);
      geometryPools.deathKnightSlashTorus.release(geometries.outerGlow);
      geometryPools.deathKnightSlashParticle.release(geometries.particle);
      geometryPools.slashTrailSegment.release(geometries.trailSegment);
      
      // Return materials to pool
      materialPools.deathKnightSlash.release(materials.mainSlash);
      materialPools.deathKnightSlash.release(materials.innerGlow);
      materialPools.deathKnightSlash.release(materials.outerGlow);
      materialPools.deathKnightSlashParticle.release(materials.particle);
      materialPools.deathKnightSlash.release(materials.trail);
    };
  }, [pooledResources]);

  // Create particle positions along the slash arc - reduced count for performance
  const particlePositions = useMemo(() =>
    Array(6).fill(0).map((_, i) => { // Reduced from 10 to 6 particles
      const angle = (i / 5) * Math.PI * 0.9 - Math.PI * 0.45; // Arc from -45% to 45% of PI
      return {
        position: new Vector3(
          Math.cos(angle) * 1.4,
          Math.sin(angle) * 1.4,
          0
        ),
        delay: i * 0.04 // Slightly slower stagger
      };
    }),
  []);

  // Trail positions for sword trail effect - reduced for performance
  const trailPositions = useMemo(() =>
    Array(5).fill(0).map((_, i) => { // Reduced from 8 to 5 trail segments
      const angle = (i / 4) * Math.PI * 0.9 - Math.PI * 0.45;
      return {
        position: new Vector3(
          Math.cos(angle) * 1.0,
          Math.sin(angle) * 1.0,
          -0.1
        ),
        delay: i * 0.025
      };
    }),
  []);

  useFrame((_, delta) => {
    if (!effectRef.current) return;

    progressRef.current += delta;
    const progress = Math.min(progressRef.current / animationDuration, 1);

    // Scale and fade animation - keep effect at fixed position
    const scale = Math.sin(progress * Math.PI) * 1.3; // Slightly larger scale for Death Knight
    const opacity = Math.sin(progress * Math.PI); // Same fade pattern
    
    if (effectRef.current) {
      effectRef.current.scale.set(scale, scale, scale);
      
      // Update material opacities using pooled materials
      const { materials } = pooledResources;
      if (materials.mainSlash) materials.mainSlash.opacity = opacity * 0.9;
      if (materials.innerGlow) materials.innerGlow.opacity = opacity * 0.8;
      if (materials.outerGlow) materials.outerGlow.opacity = opacity * 0.6;
      if (materials.particle) materials.particle.opacity = opacity * 0.7;
      if (materials.trail) materials.trail.opacity = opacity * 0.6;
    }

    // Complete animation
    if (progress >= 1) {
      onComplete();
    }
  });

  return (
    <group
      ref={effectRef}
      position={startPosition.toArray()}
      rotation={[
        0, // Keep level with ground
        Math.atan2(direction.x, direction.z) + Math.PI/2, // Face direction
        Math.PI/2 // Rotate 90 degrees to make vertical (top to bottom)
      ]}
    >
      {/* Main slash arc */}
      <mesh geometry={pooledResources.geometries.mainSlash} material={pooledResources.materials.mainSlash} />
      <mesh geometry={pooledResources.geometries.innerGlow} material={pooledResources.materials.innerGlow} />
      <mesh geometry={pooledResources.geometries.outerGlow} material={pooledResources.materials.outerGlow} />
      
      {/* Sword trail segments */}
      {trailPositions.map((trail, i) => (
        <mesh
          key={`trail-${i}`}
          position={trail.position}
          geometry={pooledResources.geometries.trailSegment}
          material={pooledResources.materials.trail}
          rotation={[0, 0, (i - 3.5) * 0.25]} // Vary rotation for dynamic look
        />
      ))}
      
      {/* Dark energy particles along the arc */}
      {particlePositions.map((particle, i) => (
        <mesh
          key={`particle-${i}`}
          position={particle.position}
          geometry={pooledResources.geometries.particle}
          material={pooledResources.materials.particle}
        />
      ))}

      {/* Dynamic lighting - purple theme */}
      <pointLight 
        color="#8B44FF" 
        intensity={12} 
        distance={5} 
        decay={2}
        position={[0, 0, 0]}
      />
      <pointLight 
        color="#AB47BC" 
        intensity={6} 
        distance={7} 
        decay={2}
        position={[0, 0.5, 0]}
      />
      
      {/* Additional dark energy wisps */}
      {Array.from({ length: 4 }, (_, i) => {
        const angle = (i / 4) * Math.PI * 2;
        const radius = 0.8;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;
        
        return (
          <mesh
            key={`wisp-${i}`}
            position={[x, y, 0.2]}
          >
            <sphereGeometry args={[0.04, 6, 6]} />
            <meshStandardMaterial
              color="#9C27B0"
              emissive="#7B1FA2"
              emissiveIntensity={2.0}
              transparent
              opacity={0.6}
              blending={AdditiveBlending}
            />
          </mesh>
        );
      })}
    </group>
  );
}
