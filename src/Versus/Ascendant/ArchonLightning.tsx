// src/Versus/Ascendant/ArchonLightning.tsx
import React, { useRef, useMemo, useEffect } from 'react';
import { Vector3 } from 'three';
import { useFrame } from '@react-three/fiber';
import { geometryPools, materialPools } from '@/Scene/EffectPools';

interface ArchonLightningProps {
  startPosition: Vector3; // Palm position
  targetPosition: Vector3; // Player position
  onComplete: () => void;
}

const ArchonLightning: React.FC<ArchonLightningProps> = ({ 
  startPosition, 
  targetPosition,
  onComplete 
}) => {
  const startTimeRef = useRef(Date.now());
  const duration = 0.6; // Slightly longer than bow lightning
  const flickerRef = useRef(1);
  
  // Create horizontal lightning geometry
  const mainBoltSegments = 48; // Reduced from 96
  const branchCount = 12;      // Reduced from 32
  
  const branches = useMemo(() => {
    const direction = targetPosition.clone().sub(startPosition).normalize();
    const distance = startPosition.distanceTo(targetPosition);
    
    // Create main horizontal bolt
    const mainBolt = {
      points: Array(mainBoltSegments).fill(0).map((_, i) => {
        const t = i / (mainBoltSegments - 1);
        
        // Calculate base position along the line
        const basePosition = startPosition.clone().lerp(targetPosition, t);
        
        // Add perpendicular offsets for zigzag effect
        const perpendicular1 = new Vector3().crossVectors(direction, new Vector3(0, 1, 0)).normalize();
        const perpendicular2 = new Vector3().crossVectors(direction, perpendicular1).normalize();
        
        // Create zigzag pattern - simplified
        const primaryOffset = Math.sin(t * Math.PI * 6) * (1 - t * 0.5) * 0.4;
        const randomOffset = (Math.random() - 0.5) * 0.4 * (1 - t * 0.7);
        
        // Apply offsets perpendicular to the main direction
        basePosition.add(perpendicular1.clone().multiplyScalar(primaryOffset + randomOffset));
        basePosition.add(perpendicular2.clone().multiplyScalar(randomOffset * 0.5));
        
        return basePosition;
      }),
      thickness: 0.08,
      isCoreStrike: true
    };

    // Create secondary branches - significantly reduced
    const secondaryBranches = Array(branchCount).fill(0).map(() => {
      const startIdx = Math.floor(Math.random() * (mainBoltSegments * 0.7));
      const startPoint = mainBolt.points[startIdx];
      const branchLength = Math.floor(mainBoltSegments * (0.15 + Math.random() * 0.2));
      
      // Random direction for branch
      const perpendicular1 = new Vector3().crossVectors(direction, new Vector3(0, 1, 0)).normalize();
      const perpendicular2 = new Vector3().crossVectors(direction, perpendicular1).normalize();
      
      const branchDir = perpendicular1.clone()
        .multiplyScalar((Math.random() - 0.5) * 2)
        .add(perpendicular2.clone().multiplyScalar((Math.random() - 0.5) * 1.5))
        .normalize();
      
      return {
        points: Array(branchLength).fill(0).map((_, i) => {
          const t = i / (branchLength - 1);
          const branchTarget = startPoint.clone().add(
            branchDir.clone().multiplyScalar(distance * 0.2 * t)
          );
          
          const randomJitter = new Vector3(
            (Math.random() - 0.5) * 0.2,
            (Math.random() - 0.5) * 0.2,
            (Math.random() - 0.5) * 0.2
          );
          
          const point = startPoint.clone().lerp(branchTarget, t);
          point.add(randomJitter);
          return point;
        }),
        thickness: 0.05 + Math.random() * 0.04,
        isCoreStrike: false
      };
    });

    // MEMORY FIX: Removed tertiary micro-branches to save hundreds of draw calls per bolt
    return [mainBolt, ...secondaryBranches];
  }, [startPosition, targetPosition]);
  
  // Use pooled geometries and materials
  const pooledResources = useMemo(() => {
    const geometries = {
      bolt: geometryPools.ascendantLightningBolt.acquire(),
      impact: geometryPools.ascendantLightningBolt.acquire(),
      ring: geometryPools.ascendantLightningRing.acquire()
    };

    const materials = {
      coreBolt: materialPools.ascendantLightning.acquire(),
      secondaryBolt: materialPools.ascendantLightning.acquire(),
      impact: materialPools.ascendantLightning.acquire(),
      ring: materialPools.ascendantLightningRing.acquire()
    };

    return { geometries, materials };
  }, []);

  // Return resources to pool on cleanup
  useEffect(() => {
    return () => {
      const { geometries, materials } = pooledResources;
      
      // Return geometries to pool
      geometryPools.ascendantLightningBolt.release(geometries.bolt);
      geometryPools.ascendantLightningBolt.release(geometries.impact);
      geometryPools.ascendantLightningRing.release(geometries.ring);
      
      // Return materials to pool
      materialPools.ascendantLightning.release(materials.coreBolt);
      materialPools.ascendantLightning.release(materials.secondaryBolt);
      materialPools.ascendantLightning.release(materials.impact);
      materialPools.ascendantLightningRing.release(materials.ring);
    };
  }, [pooledResources]);
  
  useFrame(() => {
    const elapsed = (Date.now() - startTimeRef.current) / 1000;
    flickerRef.current = Math.random() * 0.4 + 0.6;
    
    if (elapsed >= duration) {
      onComplete();
      return;
    }
    
    const progress = elapsed / duration;
    const fadeOut = (1.0 * (1 - progress)) * flickerRef.current;
    const { materials } = pooledResources;
    materials.coreBolt.opacity = fadeOut;
    materials.secondaryBolt.opacity = fadeOut * 0.8;
    materials.impact.opacity = fadeOut * 0.9;
  });
  
  return (
    <group>
      {/* Lightning branches */}
      {branches.map((branch, branchIdx) => (
        <group key={branchIdx}>
          {branch.points.map((point, idx) => (
            <mesh
              key={idx}
              position={point.toArray()}
              geometry={pooledResources.geometries.bolt}
              material={branch.isCoreStrike ? pooledResources.materials.coreBolt : pooledResources.materials.secondaryBolt}
              scale={[branch.thickness, branch.thickness, branch.thickness]}
            />
          ))}
        </group>
      ))}
      
      {/* Start effect (at palm) */}
      <group position={startPosition.toArray()}>
        <mesh
          geometry={pooledResources.geometries.impact}
          material={pooledResources.materials.impact}
          scale={[0.60, 0.60, 0.60]}
        />
        
        {/* MEMORY FIX: Reduced energy rings and lights */}
        {[0.6, 1.2].map((size, i) => (
          <mesh 
            key={i} 
            rotation={[Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI]}
            scale={[size / 0.8, size / 0.8, 1]} 
            geometry={pooledResources.geometries.ring}
            material={pooledResources.materials.ring}
          />
        ))}
        
        {/* Red point light at palm - reduced intensity and distance */}
        <pointLight
          color="#FF0000"
          intensity={12 * (1 - (Date.now() - startTimeRef.current) / (duration * 1000)) * flickerRef.current}
          distance={5}
          decay={2}
        />
      </group>

      {/* Impact effect (at target) */}
      <group position={targetPosition.toArray()}>
        <mesh
          geometry={pooledResources.geometries.impact}
          material={pooledResources.materials.impact}
          scale={[1.0, 1.0, 1.0]}
        />
        
        {/* Impact rings at target - reduced count */}
        {[0.75, 1.45].map((size, i) => (
          <mesh 
            key={i} 
            rotation={[Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI]}
            scale={[size / 0.8, size / 0.8, 1]} 
            geometry={pooledResources.geometries.ring}
            material={pooledResources.materials.ring}
          />
        ))}
        
        {/* Red point light at impact - reduced intensity and distance */}
        <pointLight
          color="#FF0000"
          intensity={15 * (1 - (Date.now() - startTimeRef.current) / (duration * 1000)) * flickerRef.current}
          distance={8}
          decay={2}
        />
      </group>
    </group>
  );
};

export default ArchonLightning;