import React, { useRef, useMemo } from 'react';
import { Vector3, Color } from 'three';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface BowLightningStrikeProps {
  position: Vector3;
  onComplete: () => void;
}

const BowLightningStrike: React.FC<BowLightningStrikeProps> = ({ 
  position, 
  onComplete 
}) => {
  const startTimeRef = useRef(Date.now());
  const duration = 0.75; // seconds
  const flickerRef = useRef(1);
  
  // Calculate the sky position (directly above the hit position)
  const skyPosition = useMemo(() => {
    return new Vector3(position.x, position.y + 50, position.z);
  }, [position]);
  
  // Create branching geometry for lightning bolt
  const branchCount = 5;
  const branches = useMemo(() => {
    // Use the skyPosition as starting point
    return Array(branchCount).fill(0).map(() => ({
      points: Array(8).fill(0).map((_, i) => {
        const t = i / 7;
        // Interpolate from sky position to impact position
        return new Vector3(
          skyPosition.x + (position.x - skyPosition.x) * t + (Math.random() - 0.5) * t * 1.5,
          skyPosition.y + (position.y - skyPosition.y) * t + (Math.random() - 0.5) * t * 2,
          skyPosition.z + (position.z - skyPosition.z) * t + (Math.random() - 0.5) * t * 1.5
        );
      }),
      thickness: Math.random() * 0.05 + 0.03,
      offset: Math.random() * Math.PI * 2
    }));
  }, [position, skyPosition]);
  
  // Create geometries and materials
  const geometries = useMemo(() => ({
    bolt: new THREE.SphereGeometry(1, 8, 8),
    impact: new THREE.SphereGeometry(0.6, 16, 16)
  }), []);
  
  const materials = useMemo(() => ({
    bolt: new THREE.MeshStandardMaterial({
      color: new Color('#80D9FF'),
      emissive: new Color('#80D9FF'),
      emissiveIntensity: 6,
      transparent: true
    }),
    impact: new THREE.MeshStandardMaterial({
      color: new Color('#B6EAFF'),
      emissive: new Color('#B6EAFF'),
      emissiveIntensity: 4,
      transparent: true
    })
  }), []);
  
  useFrame(() => {
    const elapsed = (Date.now() - startTimeRef.current) / 1000;
    flickerRef.current = Math.random() * 0.5 + 0.5;
    
    if (elapsed >= duration) {
      onComplete();
      return;
    }
    
    const progress = elapsed / duration;
    materials.bolt.opacity = (0.9 * (1 - progress)) * flickerRef.current;
    materials.impact.opacity = (0.8 * (1 - progress)) * flickerRef.current;
  });
  
  return (
    <group>
      {/* Main lightning branches */}
      {branches.map((branch, branchIdx) => (
        <group key={branchIdx}>
          {branch.points.map((point, idx) => (
            <mesh
              key={idx}
              position={point.toArray()}
              geometry={geometries.bolt}
              material={materials.bolt}
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
        
        {/* Impact rings */}
        {[0.8, 1.2, 1.6].map((size, i) => (
          <mesh 
            key={i} 
            rotation={[Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI]}
          >
            <ringGeometry args={[size, size + 0.15, 16]} />
            <meshBasicMaterial
              color="#80D9FF"
              transparent
              opacity={(0.6 - (i * 0.1)) * (1 - (Date.now() - startTimeRef.current) / (duration * 1000))}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
        ))}
        
        {/* Lights */}
        <pointLight
          color="#80D9FF"
          intensity={15 * (1 - (Date.now() - startTimeRef.current) / (duration * 1000)) * flickerRef.current}
          distance={6}
          decay={2}
        />
      </group>
    </group>
  );
};

export default BowLightningStrike;
