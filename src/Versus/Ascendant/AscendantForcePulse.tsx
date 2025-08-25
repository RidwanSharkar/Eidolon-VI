// src/Versus/Ascendant/AscendantForcePulse.tsx
import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Vector3, Group } from 'three';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { geometryPools, materialPools } from '@/Scene/EffectPools';

interface AscendantForcePulseProps {
  position: Vector3;
  duration?: number;
  onComplete?: () => void;
}

export default function AscendantForcePulse({ 
  position, 
  duration = 1000, // 1 second force pulse effect
  onComplete 
}: AscendantForcePulseProps) {
  const groupRef = useRef<Group>(null);
  const [progress, setProgress] = useState(0);
  
  const startTime = useRef(Date.now());
  const isCompleted = useRef(false);
  const explosionScaleRef = useRef(0.1);

  // Use pooled geometries and materials
  const pooledResources = useMemo(() => {
    const geometries = {
      forcePulse: geometryPools.ascendantForcePulse.acquire(),
      ring: geometryPools.ascendantLightningRing.acquire(),
      orb: geometryPools.ascendantChargingOrb.acquire()
    };

    const materials = {
      forcePulse: materialPools.ascendantForcePulse.acquire(),
      ring: materialPools.ascendantLightningRing.acquire(),
      orb: materialPools.ascendantChargingOrb.acquire()
    };

    return { geometries, materials };
  }, []);

  // Return resources to pool on cleanup
  useEffect(() => {
    return () => {
      const { geometries, materials } = pooledResources;
      
      // Return geometries to pool
      geometryPools.ascendantForcePulse.release(geometries.forcePulse);
      geometryPools.ascendantLightningRing.release(geometries.ring);
      geometryPools.ascendantChargingOrb.release(geometries.orb);
      
      // Return materials to pool
      materialPools.ascendantForcePulse.release(materials.forcePulse);
      materialPools.ascendantLightningRing.release(materials.ring);
      materialPools.ascendantChargingOrb.release(materials.orb);
    };
  }, [pooledResources]);

  useFrame(() => {
    if (isCompleted.current) return;

    const elapsed = Date.now() - startTime.current;
    const currentProgress = Math.min(elapsed / duration, 1);
    setProgress(currentProgress);

    // Calculate scale based on elapsed time - similar to Reignite but larger and thicker
    // Fast expansion at first, slowing down towards the end
    explosionScaleRef.current = 4.5 * Math.pow(currentProgress, 0.4) * (1 - currentProgress * 0.3);

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

  // Calculate opacity that fades out as it expands
  const opacity = Math.max(0, 0.8 - progress * 0.6);
  const innerOpacity = Math.max(0, 0.9 - progress * 0.7);

  return (
    <group
      ref={groupRef}
      position={[position.x, position.y + 0.5, position.z]}
    >
      {/* Main force field sphere - thicker and more red than Reignite */}
      <mesh
        scale={[explosionScaleRef.current, explosionScaleRef.current, explosionScaleRef.current]}
        geometry={pooledResources.geometries.forcePulse}
        material={pooledResources.materials.forcePulse}
      />

      {/* Inner core sphere for thickness */}
      <mesh 
        scale={[explosionScaleRef.current * 0.7, explosionScaleRef.current * 0.7, explosionScaleRef.current * 0.7]}
        geometry={pooledResources.geometries.forcePulse}
      >
        <meshStandardMaterial
          color="#ff2200" // Brighter red core
          emissive="#cc0000"
          emissiveIntensity={4.0}
          transparent
          opacity={innerOpacity}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Outer energy shell for extra thickness */}
      <mesh 
        scale={[explosionScaleRef.current * 1.2, explosionScaleRef.current * 1.2, explosionScaleRef.current * 1.2]}
        geometry={pooledResources.geometries.forcePulse}
      >
        <meshStandardMaterial
          color="#880000" // Dark red outer shell
          emissive="#660000"
          emissiveIntensity={2.0}
          transparent
          opacity={opacity * 0.6}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Pulsing energy rings for dynamic effect */}
      <mesh 
        position={[0, 0.3, 0]}
        rotation={[Math.PI / 6, 0, progress * Math.PI * 2]}
        scale={[explosionScaleRef.current * 0.8, explosionScaleRef.current * 0.8, explosionScaleRef.current * 0.8]}
        geometry={pooledResources.geometries.ring}
      >
        <meshStandardMaterial 
          color="#ff4400"
          emissive="#cc2200"
          emissiveIntensity={2.5}
          transparent 
          opacity={opacity * 0.8}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      <mesh 
        position={[0, -0.3, 0]}
        rotation={[-Math.PI / 6, 0, -progress * Math.PI * 2]}
        scale={[explosionScaleRef.current * 0.6, explosionScaleRef.current * 0.6, explosionScaleRef.current * 0.6]}
        geometry={pooledResources.geometries.ring}
      >
        <meshStandardMaterial 
          color="#ff6600"
          emissive="#cc3300"
          emissiveIntensity={2.0}
          transparent 
          opacity={opacity * 0.7}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Ground impact ring */}
      <mesh 
        position={[0, -0.4, 0]} 
        rotation={[-Math.PI / 2, 0, 0]}
        scale={[explosionScaleRef.current * 0.9, explosionScaleRef.current * 0.9, 1]}
        geometry={pooledResources.geometries.ring}
      >
        <meshStandardMaterial 
          color="#cc2200"
          emissive="#aa1100"
          emissiveIntensity={1.5}
          transparent 
          opacity={opacity * 0.6}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>

      {/* Energy sparks around the force field */}
      {Array.from({ length: 12 }, (_, i) => {
        const angle = (i / 12) * Math.PI * 2 + progress * Math.PI;
        const radius = explosionScaleRef.current * 1.1;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        const y = Math.sin(progress * Math.PI * 4 + i) * 0.5;
        
        return (
          <mesh 
            key={i}
            position={[x, y, z]}
            scale={[0.06, 0.06, 0.06]}
            geometry={pooledResources.geometries.orb}
          >
            <meshStandardMaterial 
              color="#ff3300"
              emissive="#cc1100"
              emissiveIntensity={3.0}
              transparent 
              opacity={opacity}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
        );
      })}

      {/* Bright central light */}
      <pointLight 
        color="#ff2200"
        intensity={8.0 * (1 - progress * 0.7)}
        distance={12}
        decay={2}
      />

      {/* Secondary light for atmosphere */}
      <pointLight 
        color="#cc1100"
        intensity={4.0 * (1 - progress * 0.5)}
        distance={8}
        decay={1.5}
      />
    </group>
  );
}
