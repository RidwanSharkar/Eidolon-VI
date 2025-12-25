import React, { useRef, useMemo, useEffect } from 'react';
import { Vector3, Color } from 'three';
import { useFrame } from '@react-three/fiber';
import { AdditiveBlending, MeshStandardMaterial, MeshBasicMaterial, SphereGeometry, RingGeometry } from 'three';

interface ColossusStrikeLightningProps {
  position: Vector3;
  onComplete: () => void;
}

const ColossusStrikeLightning: React.FC<ColossusStrikeLightningProps> = ({ 
  position, 
  onComplete 
}) => {
  const startTimeRef = useRef(Date.now());
  const duration = 0.5; // seconds
  const flickerRef = useRef(1);
  
  // Calculate the sky position (directly above the hit position)
  const skyPosition = useMemo(() => {
    return new Vector3(position.x, position.y + 20, position.z);
  }, [position]);
  
  // Create more concentrated branching geometry for lightning bolt
  const mainBoltSegments = 128; // Increased for more detail
  const branchCount = 48; // Doubled for more branches
  
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
      const startIdx = Math.floor(Math.random() * mainBolt.points.length * 0.8);
      const startPoint = mainBolt.points[startIdx];
      const branchLength = Math.floor(mainBolt.points.length * 0.3);
      
      return {
        points: Array(branchLength).fill(0).map((_, i) => {
          const t = i / (branchLength - 1);
          const randomDir = new Vector3(
            (Math.random() - 0.5) * 2,
            -0.3 * t,
            (Math.random() - 0.5) * 2
          ).normalize();
          
          return startPoint.clone().add(
            randomDir.multiplyScalar(distance * 0.08 * t)
          );
        }),
        thickness: 0.03 + Math.random() * 0.04,
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
  
  // Create geometries and materials
  const geometries = useMemo(() => ({
    bolt: new SphereGeometry(1, 8, 8),
    impact: new SphereGeometry(0.8, 16, 16),
    ring1: new RingGeometry(1, 1.2, 32),
    ring2: new RingGeometry(1.4, 1.6, 32),
    ring3: new RingGeometry(1.8, 2.0, 32),
  }), []);
  
  // Updated materials for yellow lightning
  const materials = useMemo(() => ({
    coreBolt: new MeshStandardMaterial({
      color: new Color('#FFFF00'),
      emissive: new Color('#FFD700'),
      emissiveIntensity: 4,
      transparent: true
    }),
    secondaryBolt: new MeshStandardMaterial({
      color: new Color('#FFDD00'),
      emissive: new Color('#FFD700'),
      emissiveIntensity: 2,
      transparent: true
    }),
    impact: new MeshStandardMaterial({
      color: new Color('#FFFF00'),
      emissive: new Color('#FFD700'),
      emissiveIntensity: 1,
      transparent: true
    }),
    ring1: new MeshBasicMaterial({
      color: '#FFD700',
      transparent: true,
      opacity: 0.8,
      blending: AdditiveBlending
    }),
    ring2: new MeshBasicMaterial({
      color: '#FFD700',
      transparent: true,
      opacity: 0.65,
      blending: AdditiveBlending
    }),
    ring3: new MeshBasicMaterial({
      color: '#FFD700',
      transparent: true,
      opacity: 0.5,
      blending: AdditiveBlending
    }),
  }), []);

  // Cleanup geometries and materials on unmount
  useEffect(() => {
    return () => {
      Object.values(geometries).forEach(g => g.dispose());
      Object.values(materials).forEach(m => m.dispose());
    };
  }, [geometries, materials]);
  
  useFrame(() => {
    const elapsed = (Date.now() - startTimeRef.current) / 1000;
    flickerRef.current = Math.random() * 0.3 + 0.7;
    
    if (elapsed >= duration) {
      onComplete();
      return;
    }
    
    const progress = elapsed / duration;
    const fadeOut = (1.0 * (1 - progress)) * flickerRef.current;
    materials.coreBolt.opacity = fadeOut;
    materials.secondaryBolt.opacity = fadeOut * 0.8;
    materials.impact.opacity = fadeOut * 0.9;
    
    // Update ring opacities
    const ringFade = 1 - progress;
    materials.ring1.opacity = 0.8 * ringFade;
    materials.ring2.opacity = 0.65 * ringFade;
    materials.ring3.opacity = 0.5 * ringFade;
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
              geometry={geometries.bolt}
              material={branch.isCoreStrike ? materials.coreBolt : materials.secondaryBolt}
              scale={[branch.thickness, branch.thickness, branch.thickness]}
            />
          ))}
        </group>
      ))}
      
      {/* Impact effect */}
      <group position={position.toArray()}>
        <mesh
          geometry={geometries.impact}
          material={materials.impact}
          scale={[1, 1, 1]}
        />
        
        {/* Impact rings - using memoized geometries and materials */}
        <mesh 
          rotation={[Math.PI / 2, 0, 0]}
          geometry={geometries.ring1}
          material={materials.ring1}
        />
        <mesh 
          rotation={[Math.PI / 2, 0.5, 0]}
          geometry={geometries.ring2}
          material={materials.ring2}
        />
        <mesh 
          rotation={[Math.PI / 2, 1.0, 0]}
          geometry={geometries.ring3}
          material={materials.ring3}
        />
        
        {/* Enhanced lighting */}
        <pointLight
          color="#FFD700" // Golden yellow
          intensity={25 * (1 - (Date.now() - startTimeRef.current) / (duration * 1000)) * flickerRef.current}
          distance={8}
          decay={2}
        />
      </group>
    </group>
  );
};

export default ColossusStrikeLightning;