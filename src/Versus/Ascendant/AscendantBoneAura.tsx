import React, { useRef } from 'react';
import { Group, Mesh } from 'three';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface AscendantBoneAuraProps {
  parentRef: React.RefObject<Group>;
}

const createBonePiece = () => (
  <group rotation={[Math.PI / 3.75, 0, 0]}>
    {/* Main bone shaft*/}
    <mesh>
      <cylinderGeometry args={[0.04, 0.04, 0.7, 8]} />
      <meshStandardMaterial 
        color="#ffffff"
        roughness={0.4}
        metalness={0.3}
      />
    </mesh>
    
    {/* Bone joints - more pronounced */}
    <mesh position={new THREE.Vector3(0, 0.375, 0)} rotation={new THREE.Euler(0, 0, Math.PI / 3)}>
      <sphereGeometry args={[0.075, 8, 8]} />
      <meshStandardMaterial 
        color="#ffffff"
        roughness={0.5}
        metalness={0.2}
      />
    </mesh>

    <mesh position={new THREE.Vector3(0, -0.375, 0)} rotation={new THREE.Euler(0, 0, -Math.PI / 3)}>
      <sphereGeometry args={[0.075, 8, 8]} />
      <meshStandardMaterial 
        color="#ffffff"
        roughness={0.5}
        metalness={0.2}
      />
    </mesh>
  </group>
);

export default function AscendantBoneAura({ parentRef }: AscendantBoneAuraProps) {
  const bonesRef = useRef<Mesh[]>([]);
  const boneCount = 15; // Fewer bones than boss for smaller effect
  const radius = 0.7;   // Smaller radius than boss
  const groupRef = useRef<Group>(null);
  
  useFrame(() => {
    if (!parentRef.current || !groupRef.current) return;
    
    const parentPosition = parentRef.current.position;
    groupRef.current.position.set(parentPosition.x, 0.25, parentPosition.z);
    
    bonesRef.current.forEach((bone, i) => {
      const angle = (i / boneCount) * Math.PI * 2 + Date.now() * 0.0008; // Slower rotation
      const x = -Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const y = Math.sin(Date.now() * 0.001 + i) * 0.0001; // Larger vertical movement
      
      bone.position.set(x, y - 0.15, z);
      bone.rotation.y = angle + Math.PI / 3;
    });
  });

  return (
    <group ref={groupRef}>
      {Array.from({ length: boneCount }).map((_, i) => (
        <mesh
          key={i}
          ref={(el) => {
            if (el) bonesRef.current[i] = el;
          }}
        >
          {createBonePiece()}
        </mesh>
      ))}
    </group>
  );
} 