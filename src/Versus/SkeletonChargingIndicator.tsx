// src/Versus/SkeletonChargingIndicator.tsx
import React, { useRef, useMemo, useEffect, useState } from 'react';
import { Vector3, Group } from 'three';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { geometryPools, materialPools } from '@/Scene/EffectPools';

interface SkeletonChargingIndicatorProps {
  position: Vector3; // Skeleton position
  direction: Vector3; // Attack direction
  attackRange: number; // Attack range (3.5)
  chargeDuration: number; // Total charge time in ms (1000ms)
  onComplete: () => void;
}

const SkeletonChargingIndicator: React.FC<SkeletonChargingIndicatorProps> = ({ 
  position, 
  direction,
  attackRange,
  chargeDuration,
  onComplete 
}) => {
  const groupRef = useRef<Group>(null);
  const startTimeRef = useRef(Date.now());
  const [currentIntensity, setCurrentIntensity] = useState(0.2);
  const [currentProgress, setCurrentProgress] = useState(0);

  
  // Use pooled resources
  const pooledResources = useMemo(() => {
    const geometries = {
      attackArea: geometryPools.chargingAttackArea.acquire(),
      ring: geometryPools.chargingRing.acquire(),
      orb: geometryPools.chargingOrb.acquire(),
      line: geometryPools.chargingLine.acquire()
    };

    const materials = {
      area: materialPools.chargingArea.acquire(),
      border: materialPools.chargingBorder.acquire(),
      ring: materialPools.chargingRing.acquire(),
      orb: materialPools.chargingOrb.acquire(),
      line: materialPools.chargingLine.acquire()
    };

    return { geometries, materials };
  }, []);

  // Return resources to pool on cleanup
  useEffect(() => {
    return () => {
      const { geometries, materials } = pooledResources;
      
      // Return geometries to pool
      geometryPools.chargingAttackArea.release(geometries.attackArea);
      geometryPools.chargingRing.release(geometries.ring);
      geometryPools.chargingOrb.release(geometries.orb);
      geometryPools.chargingLine.release(geometries.line);
      
      // Return materials to pool
      materialPools.chargingArea.release(materials.area);
      materialPools.chargingBorder.release(materials.border);
      materialPools.chargingRing.release(materials.ring);
      materialPools.chargingOrb.release(materials.orb);
      materialPools.chargingLine.release(materials.line);
    };
  }, [pooledResources]);
  
  useFrame(() => {
    const elapsed = Date.now() - startTimeRef.current;
    const progress = Math.min(elapsed / chargeDuration, 1);
    
    if (progress >= 1) {
      onComplete();
      return;
    }

    // Update material properties dynamically
    const baseIntensity = progress * 0.8 + 0.2;
    const pulseIntensity = Math.sin(elapsed * 0.008) * 0.4 + 0.6;
    const finalIntensity = baseIntensity * pulseIntensity;

    // Update state for JSX rendering
    setCurrentIntensity(finalIntensity);
    setCurrentProgress(progress);

    const { materials } = pooledResources;
    if (materials.orb) {
      materials.orb.emissiveIntensity = 15 * finalIntensity;
      materials.orb.opacity = 0.9 * finalIntensity;
    }
    if (materials.line) {
      materials.line.emissiveIntensity = 8 * finalIntensity;
      materials.line.opacity = 0.8 * finalIntensity;
    }
    if (materials.ring) {
      materials.ring.opacity = 0.5 * finalIntensity;
    }
  });
  
  // Update attack area geometry scale based on attackRange
  useEffect(() => {
    const { geometries } = pooledResources;
    const scale = attackRange / 2.65; // 2.65 is the default attack range used in pool
    geometries.attackArea.scale(scale, 1, scale);
    
    return () => {
      // Reset scale when returning to pool
      geometries.attackArea.scale(1/scale, 1, 1/scale);
    };
  }, [attackRange, pooledResources]);
  
  return (
    <group ref={groupRef} position={position.toArray()}>
      {/* Main attack area indicator on ground */}
      <group
        rotation={[
          0,
          Math.atan2(direction.x, direction.z),
          0
        ]}
      >
        {/* Main attack area */}
        <mesh geometry={pooledResources.geometries.attackArea} position={[0, 0, 0]}>
          <meshBasicMaterial
            color="#FF4444"
            transparent
            opacity={0.4 * currentIntensity}
            blending={THREE.AdditiveBlending}
            side={THREE.DoubleSide}
          />
        </mesh>
        
        {/* Attack area border/outline */}
        <mesh geometry={pooledResources.geometries.attackArea} position={[0, 0.005, 0]}>
          <meshBasicMaterial
            color="#FF0000"
            transparent
            opacity={0.7 * currentIntensity}
            blending={THREE.AdditiveBlending}
            side={THREE.DoubleSide}
            wireframe={true}
          />
        </mesh>
        
        {/* Charging lines radiating from skeleton */}
        {Array.from({ length: 8 }, (_, i) => {
          const angle = (i / 8 - 0.5) * Math.PI * 0.6;
          const lineLength = attackRange * (0.7 + currentProgress * 0.3);
          const x = Math.sin(angle) * lineLength;
          const z = Math.cos(angle) * lineLength;
          
          return (
            <group key={i}>
              <mesh
                position={[x / 2, 0.02, z / 2]}
                rotation={[Math.PI / 2, angle, 0]}
                scale={[1, lineLength, 1]}
                geometry={pooledResources.geometries.line}
                material={pooledResources.materials.line}
              />
            </group>
          );
        })}
      </group>
      
      {/* Energy buildup at Skeleton position */}
      <group position={[0, 0, 0]}>
        {/* Energy rings around Skeleton */}
        {[0.6, 1.0, 1.4].map((radius, i) => (
          <mesh 
            key={i} 
            rotation={[Math.PI / 2, 0,  0.002 * (i + 1)]}
            position={[0, 0.1, 0]}
            scale={[radius / 0.6, radius / 0.6, 1]} // Scale based on default ring size
            geometry={pooledResources.geometries.ring}
            material={pooledResources.materials.ring}
          />
        ))}
        
        {/* Central energy orb at skeleton's weapon */}
        <mesh 
          position={[0.3, 1.5, 0.2]}
          scale={[1 + currentProgress * 0.625, 1 + currentProgress * 0.625, 1 + currentProgress * 0.625]} // Scale from 1 to 1.625
          geometry={pooledResources.geometries.orb}
          material={pooledResources.materials.orb}
        />
        
        {/* Red point light */}
        <pointLight
          color="#FF3333"
          intensity={20 * currentIntensity}
          distance={8}
          decay={2}
          position={[0, 1.5, 0]}
        />
      </group>
    </group>
  );
};

export default SkeletonChargingIndicator;
