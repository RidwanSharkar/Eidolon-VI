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
  const mainBoltSegments = 96;
  const branchCount = 32;
  
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
        
        // Create zigzag pattern
        const primaryOffset = Math.sin(t * Math.PI * 12) * (1 - t * 0.5) * 0.5;
        const secondaryOffset = Math.sin(t * Math.PI * 24) * (1 - t * 0.5) * 0.25;
        const randomOffset = (Math.random() - 0.5) * 0.6 * (1 - t * 0.7);
        
        // Apply offsets perpendicular to the main direction
        basePosition.add(perpendicular1.clone().multiplyScalar(primaryOffset + randomOffset));
        basePosition.add(perpendicular2.clone().multiplyScalar(secondaryOffset));
        
        return basePosition;
      }),
      thickness: 0.06,
      isCoreStrike: true
    };

    // Create secondary branches
    const secondaryBranches = Array(branchCount).fill(0).map(() => {
      const startIdx = Math.floor(Math.random() * (mainBoltSegments * 0.8));
      const startPoint = mainBolt.points[startIdx];
      const branchLength = Math.floor(mainBoltSegments * (0.08 + Math.random() * 0.15));
      
      // Random direction for branch, but generally perpendicular to main bolt
      const perpendicular1 = new Vector3().crossVectors(direction, new Vector3(0, 1, 0)).normalize();
      const perpendicular2 = new Vector3().crossVectors(direction, perpendicular1).normalize();
      
      const branchDir = perpendicular1.clone()
        .multiplyScalar((Math.random() - 0.5) * 2)
        .add(perpendicular2.clone().multiplyScalar((Math.random() - 0.5) * 0.5))
        .normalize();
      
      return {
        points: Array(branchLength).fill(0).map((_, i) => {
          const t = i / (branchLength - 1);
          const branchTarget = startPoint.clone().add(
            branchDir.clone().multiplyScalar(distance * 0.15 * t)
          );
          
          const randomJitter = new Vector3(
            (Math.random() - 0.5) * 0.25,
            (Math.random() - 0.5) * 0.25,
            (Math.random() - 0.5) * 0.25
          );
          
          const point = startPoint.clone().lerp(branchTarget, t);
          point.add(randomJitter);
          return point;
        }),
        thickness: 0.04 + Math.random() * 0.05,
        isCoreStrike: false
      };
    });

    // Tertiary micro-branches
    const tertiaryBranches = secondaryBranches.flatMap(branch => {
      if (Math.random() > 0.4) return [];
      
      const startIdx = Math.floor(Math.random() * branch.points.length * 0.6);
      const startPoint = branch.points[startIdx];
      const miniBranchLength = Math.floor(branch.points.length * 0.3);
      
      return [{
        points: Array(miniBranchLength).fill(0).map((_, i) => {
          const t = i / (miniBranchLength - 1);
          const randomDir = new Vector3(
            (Math.random() - 0.5),
            (Math.random() - 0.5),
            (Math.random() - 0.5)
          ).normalize();
          
          return startPoint.clone().add(
            randomDir.multiplyScalar(distance * 0.02 * t)
          );
        }),
        thickness: 0.02 + Math.random() * 0.025,
        isCoreStrike: false
      }];
    });

    return [mainBolt, ...secondaryBranches, ...tertiaryBranches];
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
        
        {/* Energy rings at start */}
        {[0.6, 0.9, 1.2].map((size, i) => (
          <mesh 
            key={i} 
            rotation={[Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI]}
            scale={[size / 0.8, size / 0.8, 1]} // Scale based on default ring size
            geometry={pooledResources.geometries.ring}
            material={pooledResources.materials.ring}
          />
        ))}
        
        {/* Red point light at palm */}
        <pointLight
          color="#FF0000"
          intensity={25 * (1 - (Date.now() - startTimeRef.current) / (duration * 1000)) * flickerRef.current}
          distance={8}
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
        
        {/* Impact rings at target */}
        {[0.75, 1.225, 1.45].map((size, i) => (
          <mesh 
            key={i} 
            rotation={[Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI]}
            scale={[size / 0.8, size / 0.8, 1]} // Scale based on default ring size
            geometry={pooledResources.geometries.ring}
            material={pooledResources.materials.ring}
          />
        ))}
        
        {/* Red point light at impact */}
        <pointLight
          color="#FF0000"
          intensity={25 * (1 - (Date.now() - startTimeRef.current) / (duration * 1000)) * flickerRef.current}
          distance={12}
          decay={2}
        />
      </group>
    </group>
  );
};

export default ArchonLightning;