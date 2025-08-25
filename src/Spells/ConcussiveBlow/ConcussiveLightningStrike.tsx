import React, { useRef, useMemo } from 'react';
import { Vector3, Color } from 'three';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface ConcussiveLightningStrikeProps {
  position: Vector3;
  onComplete: () => void;
}

const ConcussiveLightningStrike: React.FC<ConcussiveLightningStrikeProps> = ({ 
  position, 
  onComplete 
}) => {
  const startTimeRef = useRef(Date.now());
  const duration = 0.6; // Slightly longer for dramatic effect
  const flickerRef = useRef(1);
  
  // Calculate the sky position (directly above the hit position)
  const skyPosition = useMemo(() => {
    return new Vector3(position.x, position.y + 15, position.z);
  }, [position]);
  
  // Reduced branching for cleaner look
  const mainBoltSegments = 64; // Reduced from 128
  const branchCount = 16; // Reduced from 48
  
  const branches = useMemo(() => {
    const distance = position.clone().sub(skyPosition).length();
    const mainBolt = {
      points: Array(mainBoltSegments).fill(0).map((_, i) => {
        const t = i / (mainBoltSegments - 1);
        // Simpler zigzag pattern with less randomness
        const primaryOffset = Math.sin(t * Math.PI * 4) * (1 - t) * 0.8;
        const secondaryOffset = Math.sin(t * Math.PI * 8) * (1 - t) * 0.3;
        const randomOffset = (Math.random() - 0.5) * 0.4 * (1 - t);
        
        return new Vector3(
          skyPosition.x + (position.x - skyPosition.x) * t + primaryOffset + randomOffset,
          skyPosition.y + (position.y - skyPosition.y) * (Math.pow(t, 0.7)),
          skyPosition.z + (position.z - skyPosition.z) * t + secondaryOffset + randomOffset
        );
      }),
      thickness: 0.14,
      isCoreStrike: true
    }; 

    const secondaryBranches = Array(branchCount).fill(0).map(() => {
      const startIdx = Math.floor(Math.random() * (mainBoltSegments * 0.6));
      const startPoint = mainBolt.points[startIdx];
      const branchLength = Math.floor(mainBoltSegments * (0.08 + Math.random() * 0.12)); // Shorter branches
      const branchAngle = Math.random() * Math.PI * 2;
      
      return {
        points: Array(branchLength).fill(0).map((_, i) => {
          const t = i / (branchLength - 1);
          const branchTarget = startPoint.clone().add(
            new Vector3(
              Math.cos(branchAngle) * distance * 0.15, // Reduced spread
              -distance * (0.03 + Math.random() * 0.03) * t,
              Math.sin(branchAngle) * distance * 0.15
            )
          );
          
          const randomJitter = new Vector3(
            (Math.random() - 0.5) * 0.2, // Reduced jitter
            (Math.random() - 0.5) * 0.1,
            (Math.random() - 0.5) * 0.2
          );
          
          const point = startPoint.clone().lerp(branchTarget, t);
          point.add(randomJitter);
          return point;
        }),
        thickness: 0.04 + Math.random() * 0.04,
        isCoreStrike: false
      };
    });

    // Minimal tertiary branches
    const tertiaryBranches = secondaryBranches.flatMap(branch => {
      if (Math.random() > 0.3) return []; // Reduced chance
      
      const startIdx = Math.floor(Math.random() * branch.points.length * 0.5);
      const startPoint = branch.points[startIdx];
      const miniBranchLength = Math.floor(branch.points.length * 0.3);
      
      return [{
        points: Array(miniBranchLength).fill(0).map((_, i) => {
          const t = i / (miniBranchLength - 1);
          const randomDir = new Vector3(
            (Math.random() - 0.5),
            -0.15 * t,
            (Math.random() - 0.5)
          ).normalize();
          
          return startPoint.clone().add(
            randomDir.multiplyScalar(distance * 0.02 * t)
          );
        }),
        thickness: 0.02 + Math.random() * 0.02,
        isCoreStrike: false
      }];
    });

    return [mainBolt, ...secondaryBranches, ...tertiaryBranches];
  }, [position, skyPosition]);
  
  // Create geometries and materials
  const geometries = useMemo(() => ({
    bolt: new THREE.SphereGeometry(1, 8, 8),
    impact: new THREE.SphereGeometry(0.8, 16, 16)
  }), []);
  
  const materials = useMemo(() => ({
    coreBolt: new THREE.MeshStandardMaterial({
      color: new Color('#FFFFFF'),
      emissive: new Color('#BB0000'), // Deep red emission
      emissiveIntensity: 8,
      transparent: true
    }),
    secondaryBolt: new THREE.MeshStandardMaterial({
      color: new Color('#DD4444'), // Red secondary
      emissive: new Color('#990000'), // Darker red emission
      emissiveIntensity: 6,
      transparent: true
    }),
    impact: new THREE.MeshStandardMaterial({
      color: new Color('#FFFFFF'),
      emissive: new Color('#DD0000'), // Red impact
      emissiveIntensity: 4,
      transparent: true
    })
  }), []);
  
  useFrame(() => {
    const elapsed = (Date.now() - startTimeRef.current) / 1000;
    flickerRef.current = Math.random() * 0.2 + 0.8; // Less flicker for cleaner look
    
    if (elapsed >= duration) {
      onComplete();
      return;
    }
    
    const progress = elapsed / duration;
    const fadeOut = (1.0 * (1 - progress)) * flickerRef.current;
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
          scale={[0.75, 0.75, 0.75]}
        />
        
        {/* Impact rings */}
        {[1.2, 1.6, 2.0].map((size, i) => (
          <mesh 
            key={i} 
            rotation={[Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI]}
          >
            <ringGeometry args={[size, size + 0.25, 32]} />
            <meshBasicMaterial
              color="#CC0000" // Deep red rings
              transparent
              opacity={(0.9 - (i * 0.2)) * (1 - (Date.now() - startTimeRef.current) / (duration * 1000))}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
        ))}
        
        {/* Enhanced red lighting */}
        <pointLight
          color="#CC0000" // Deep red light
          intensity={30 * (1 - (Date.now() - startTimeRef.current) / (duration * 1000)) * flickerRef.current}
          distance={10}
          decay={2}
        />
      </group>
    </group>
  );
};

export default ConcussiveLightningStrike;
