import React, { useRef, useMemo, useEffect } from 'react';
import { Vector3 } from 'three';
import { useFrame } from '@react-three/fiber';
import { geometryPools, materialPools } from '@/Scene/EffectPools';

interface MageLightningStrikeProps {
  position: Vector3;
  onComplete: () => void;
  onDamageCheck?: () => void;
}

const MageLightningStrike: React.FC<MageLightningStrikeProps> = ({ 
  position, 
  onComplete,
  onDamageCheck 
}) => {
  const startTimeRef = useRef(Date.now());
  const duration = 0.5; // seconds
  const flickerRef = useRef(1);
  const damageDealtRef = useRef(false);
  
  // Calculate the sky position (directly above the hit position)
  const skyPosition = useMemo(() => {
    return new Vector3(position.x, position.y + 20, position.z);
  }, [position]);
  
  // Create more concentrated branching geometry for lightning bolt
  const mainBoltSegments = 128; // Increased for more detail
  const branchCount = 24; // Doubled for more branches
  
  const branches = useMemo(() => {
    const distance = position.clone().sub(skyPosition).length();
    const mainBolt = {
      points: Array(mainBoltSegments).fill(0).map((_, i) => {
        const t = i / (mainBoltSegments - 1);
        // More complex zigzag pattern for main bolt
        const primaryOffset = Math.sin(t * Math.PI * 8) * (1 - t) * 1.2;
        const secondaryOffset = Math.sin(t * Math.PI * 16) * (1 - t) * 0.6;
        const randomOffset = (Math.random() - 0.5) * 0.8 * (1 - t);
        
        return new Vector3(
          skyPosition.x + (position.x - skyPosition.x) * t + primaryOffset + randomOffset,
          skyPosition.y + (position.y - skyPosition.y) * (Math.pow(t, 0.7)),
          skyPosition.z + (position.z - skyPosition.z) * t + secondaryOffset + randomOffset
        );
      }),
      thickness: 0.11,
      isCoreStrike: true
    }; 

    const secondaryBranches = Array(branchCount).fill(0).map(() => {
      const startIdx = Math.floor(Math.random() * (mainBoltSegments * 0.8));
      const startPoint = mainBolt.points[startIdx];
      const branchLength = Math.floor(mainBoltSegments * (0.1 + Math.random() * 0.2));
      const branchAngle = Math.random() * Math.PI * 2;
      
      return {
        points: Array(branchLength).fill(0).map((_, i) => {
          const t = i / (branchLength - 1);
          const branchTarget = startPoint.clone().add(
            new Vector3(
              Math.cos(branchAngle) * distance * 0.2,
              -distance * (0.05 + Math.random() * 0.05) * t,
              Math.sin(branchAngle) * distance * 0.2
            )
          );
          
          const randomJitter = new Vector3(
            (Math.random() - 0.5) * 0.3,
            (Math.random() - 0.5) * 0.2,
            (Math.random() - 0.5) * 0.3
          );
          
          const point = startPoint.clone().lerp(branchTarget, t);
          point.add(randomJitter);
          return point;
        }),
        thickness: 0.03 + Math.random() * 0.06,
        isCoreStrike: false
      };
    });

    // Adjust tertiary branches
    const tertiaryBranches = secondaryBranches.flatMap(branch => {
      if (Math.random() > 0.5) return [];
      
      const startIdx = Math.floor(Math.random() * branch.points.length * 0.7);
      const startPoint = branch.points[startIdx];
      const miniBranchLength = Math.floor(branch.points.length * 0.4);
      
      return [{
        points: Array(miniBranchLength).fill(0).map((_, i) => {
          const t = i / (miniBranchLength - 1);
          const randomDir = new Vector3(
            (Math.random() - 0.5),
            -0.25 * t,
            (Math.random() - 0.5)
          ).normalize();
          
          return startPoint.clone().add(
            randomDir.multiplyScalar(distance * 0.04 * t)
          );
        }),
        thickness: 0.02 + Math.random() * 0.03,
        isCoreStrike: false
      }];
    });

    return [mainBolt, ...secondaryBranches, ...tertiaryBranches];
  }, [position, skyPosition]);
  
  // Use pooled resources
  const pooledResources = useMemo(() => {
    // Calculate total number of segments needed
    const totalSegments = branches.reduce((total, branch) => total + branch.points.length, 0);
    
    const boltGeometries = [];
    const boltMaterials = [];
    
    // Acquire resources for all lightning segments
    for (let i = 0; i < totalSegments; i++) {
      boltGeometries.push(geometryPools.mageLightningCylinder.acquire());
      boltMaterials.push(materialPools.mageLightning.acquire());
    }
    
    return {
      boltGeometries,
      boltMaterials,
      impactGeometry: geometryPools.mageLightningCylinder.acquire(),
      impactMaterial: materialPools.mageLightning.acquire(),
      ringGeometries: [
        geometryPools.mageLightningRing.acquire(),
        geometryPools.mageLightningRing.acquire(),
        geometryPools.mageLightningRing.acquire()
      ],
      ringMaterials: [
        materialPools.mageLightningRing.acquire(),
        materialPools.mageLightningRing.acquire(),
        materialPools.mageLightningRing.acquire()
      ]
    };
  }, [branches]);

  // Return resources to pool on cleanup
  useEffect(() => {
    return () => {
      const { boltGeometries, boltMaterials, impactGeometry, impactMaterial, ringGeometries, ringMaterials } = pooledResources;
      
      // Return bolt resources
      boltGeometries.forEach(geo => geometryPools.mageLightningCylinder.release(geo));
      boltMaterials.forEach(mat => materialPools.mageLightning.release(mat));
      
      // Return impact resources
      geometryPools.mageLightningCylinder.release(impactGeometry);
      materialPools.mageLightning.release(impactMaterial);
      
      // Return ring resources
      ringGeometries.forEach(geo => geometryPools.mageLightningRing.release(geo));
      ringMaterials.forEach(mat => materialPools.mageLightningRing.release(mat));
    };
  }, [pooledResources]);
  
  useFrame(() => {
    const elapsed = (Date.now() - startTimeRef.current) / 1000;
    flickerRef.current = Math.random() * 0.3 + 0.7;
    
    // Deal damage at the very beginning of the lightning strike (when visually impactful)
    if (!damageDealtRef.current && elapsed >= 0.05 && onDamageCheck) {
      damageDealtRef.current = true;
      onDamageCheck();
    }
    
    if (elapsed >= duration) {
      onComplete();
      return;
    }
    
    const progress = elapsed / duration;
    const fadeOut = (1.0 * (1 - progress)) * flickerRef.current;
    
    // Update pooled materials
    const { boltMaterials, impactMaterial, ringMaterials } = pooledResources;
    
    // Update bolt materials
    boltMaterials.forEach((material, index) => {
      const isCoreStrike = index < (branches[0]?.points.length || 0); // First branch is core
      material.opacity = isCoreStrike ? fadeOut : fadeOut * 0.8;
      material.emissiveIntensity = isCoreStrike ? 3.0 * fadeOut : 2.0 * fadeOut;
    });
    
    // Update impact material
    if (impactMaterial) {
      impactMaterial.opacity = fadeOut * 0.9;
      impactMaterial.emissiveIntensity = 3.0 * fadeOut;
    }
    
    // Update ring materials
    ringMaterials.forEach((material, i) => {
      if (material) {
        material.opacity = (0.8 - (i * 0.15)) * fadeOut;
      }
    });
  });
  
  return (
    <group>
      {/* Lightning branches */}
      {(() => {
        let segmentIndex = 0;
        return branches.map((branch, branchIdx) => (
          <group key={branchIdx}>
            {branch.points.map((point, idx) => {
              const currentSegmentIndex = segmentIndex++;
              return (
                <mesh
                  key={idx}
                  position={point.toArray()}
                  geometry={pooledResources.boltGeometries[currentSegmentIndex]}
                  material={pooledResources.boltMaterials[currentSegmentIndex]}
                  scale={[branch.thickness, branch.thickness, branch.thickness]}
                />
              );
            })}
          </group>
        ));
      })()}
      
      {/* Impact effect */}
      <group position={position.toArray()}>
        <mesh
          geometry={pooledResources.impactGeometry}
          material={pooledResources.impactMaterial}
          scale={[0.8, 0.8, 0.8]} // Scale to match original impact size
        />
        
        {/* Impact rings */}
        {[1, 1.4, 1.8].map((size, i) => (
          <mesh 
            key={i} 
            rotation={[Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI]}
            geometry={pooledResources.ringGeometries[i]}
            material={pooledResources.ringMaterials[i]}
            scale={[size / 0.6, size / 0.6, 1]} // Scale based on default ring size (0.6)
          />
        ))}
        
        {/* Enhanced lighting */}
        <pointLight
          color="#80D9FF"
          intensity={25 * (1 - (Date.now() - startTimeRef.current) / (duration * 1000)) * flickerRef.current}
          distance={8}
          decay={2}
        />
      </group>
    </group>
  );
};

export default MageLightningStrike;