import React, { useRef } from 'react';
import { Group, Mesh } from 'three';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface BoneAuraTotemProps {
  parentRef: React.RefObject<Group>;
}

const createBonePiece = () => (
  <group rotation={[Math.PI / 4, 0, 0]}>
    {/* Main bone shaft */}
    <mesh>
      <cylinderGeometry args={[0.12, 0.12, 1.8, 8]} />
      <meshStandardMaterial 
        color="#ffffff"
        roughness={0.4}
        metalness={0.3}
      />
    </mesh>
    
    {/* Bone joints */}
    <mesh position={new THREE.Vector3(0, 0.5, 0)} rotation={new THREE.Euler(0, 0, Math.PI / 6)}>
      <sphereGeometry args={[0.12, 8, 8]} />
      <meshStandardMaterial 
        color="#ffffff"
        roughness={0.5}
        metalness={0.2}
      />
    </mesh>

    <mesh position={new THREE.Vector3(0, 0.15, 0)} rotation={new THREE.Euler(0, 0, -Math.PI / 6)}>
      <sphereGeometry args={[0.12, 8, 8]} />
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
  const boneCount = 20;
  const radius = 1.75;
  const groupRef = useRef<Group>(null);
  
  useFrame(() => {
    if (!parentRef.current || !groupRef.current) return;
    
    const parentPosition = parentRef.current.position;
    groupRef.current.position.set(parentPosition.x, 0.4, parentPosition.z);
    
    bonesRef.current.forEach((bone, i) => {
      const angle = (i / boneCount) * Math.PI * 2 + Date.now() * 0.001;
      const x = -Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const y = Math.sin(Date.now() * 0.002 + i) * 0.15;
      
      bone.position.set(x, y - 0.3, z);
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

