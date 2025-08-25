// src/versus/Reaper/ReaperBoneVortex.tsx
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Mesh, Group, } from 'three';
import * as THREE from 'three';

interface ReaperBoneVortexProps {
  parentRef: React.RefObject<Group>;
}

const createVortexPiece = () => (
  <group>
    {/* Main vortex fragment */}
    <mesh>
      <boxGeometry args={[0.045, 0.012, 0.012]} />
      <meshStandardMaterial 
        color="#66d9ff"
        transparent
        opacity={0.35}
        emissive="#66d9ff"
        emissiveIntensity={0.4}
      />
    </mesh>
    
    {/* Glowing core */}
    <mesh>
      <sphereGeometry args={[0.023, 6, 6]} />
      <meshStandardMaterial 
        color="#66d9ff"
        emissive="#66d9ff"
        emissiveIntensity={0.9}
        transparent
        opacity={0.6}
      />
    </mesh>
  </group>
);

export default function ReaperBoneVortex({ parentRef }: ReaperBoneVortexProps) {
  const vortexPiecesRef = useRef<(Group | null)[]>([]);
  const pieceCount = 20; // Fewer pieces than boss
  const baseRadius = 0.35; // Smaller radius than boss
  const groupRef = useRef<Group>(null);
  
  useFrame(({ clock }) => {
    if (!parentRef.current || !groupRef.current) return;
    
    const parentPosition = parentRef.current.position;
    groupRef.current.position.set(parentPosition.x, 0, parentPosition.z);
    
    vortexPiecesRef.current.forEach((piece, i) => {
      if (!piece) return;
      
      const time = clock.getElapsedTime();
      const heightOffset = ((i / pieceCount) * 0.55);
      const radiusMultiplier = 1.1 - (heightOffset * 1.3);
      
      const angle = (i / pieceCount) * Math.PI * 4 + time * 2.2; // Slightly faster than boss
      const radius = baseRadius * radiusMultiplier;
      
      const x = Math.cos(angle) * radius;
      const z = Math.sin(angle) * radius;
      const y = heightOffset;
      
      piece.position.set(x, y, z);
      piece.rotation.y = angle + Math.PI / 2;
      piece.rotation.x = Math.PI / 6;
      piece.rotation.z = Math.sin(time * 3 + i) * 0.1;
      
      // Update material opacity
      const meshChild = piece.children[0] as Mesh;
      if (meshChild && meshChild.material) {
        const material = meshChild.material as THREE.MeshStandardMaterial;
        material.opacity = Math.max(0.1, 1 - (heightOffset * 2));
      }
    });
  });

  return (
    <group ref={groupRef}>
      {Array.from({ length: pieceCount }).map((_, i) => (
        <group
          key={i}
          ref={(el) => {
            if (el) vortexPiecesRef.current[i] = el;
          }}
        >
          {createVortexPiece()}
        </group>
      ))}
      
      <pointLight 
        color="#66d9ff"
        intensity={0.5}
        distance={2}
        decay={2}
        position={[0, 0.4, 0]}
      />
    </group>
  );
} 