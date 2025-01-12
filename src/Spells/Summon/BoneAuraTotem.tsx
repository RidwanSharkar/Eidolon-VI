import React, { useRef } from 'react';
import { Group, Mesh } from 'three';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface BoneAuraTotemProps {
  parentRef: React.RefObject<Group>;
}

const createBonePiece = () => (
  <group rotation={[Math.PI / 4, 0, 0]}>
    {/* Main bone shaft - thinner and more angular */}
    <mesh>
      <cylinderGeometry args={[0.015, 0.015, 0.15, 4]} />
      <meshStandardMaterial 
        color="#ffffff"
        roughness={0.4}
        metalness={0.3}
      />
    </mesh>
    
    {/* Bone joints - more pronounced */}
    <mesh position={new THREE.Vector3(0, 0.1, 0)} rotation={new THREE.Euler(0, 0, Math.PI / 6)}>
      <sphereGeometry args={[0.03, 4, 4]} />
      <meshStandardMaterial 
        color="#ffffff"
        roughness={0.5}
        metalness={0.2}
      />
    </mesh>

    <mesh position={new THREE.Vector3(0, -0.1, 0)} rotation={new THREE.Euler(0, 0, -Math.PI / 6)}>
      <sphereGeometry args={[0.03, 4, 4]} />
      <meshStandardMaterial 
        color="#a4a4a4"
        roughness={0.5}
        metalness={0.2}
      />
    </mesh>
  </group>
);

export default function BoneAuraTotem({ parentRef }: BoneAuraTotemProps) {
  const bonesRef = useRef<Mesh[]>([]);
  const boneCount = 16;
  const radius = 1.25;
  const groupRef = useRef<Group>(null);
  
  useFrame(() => {
    if (!parentRef.current || !groupRef.current) return;
    
    const parentPosition = parentRef.current.position;
    groupRef.current.position.set(parentPosition.x, 1.0, parentPosition.z);
    
    bonesRef.current.forEach((bone, i) => {
      const angle = (i / boneCount) * Math.PI * 2 + Date.now() * 0.001;
      const x = -Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const y = Math.sin(Date.now() * 0.002 + i) * 0.1;
      
      bone.position.set(x, y - 0.2, z);
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

