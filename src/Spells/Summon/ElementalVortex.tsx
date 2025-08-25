// src/Spells/Summon/ElementalVortex.tsx
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Mesh, Group, AdditiveBlending } from 'three';
import * as THREE from 'three';

interface ElementalVortexProps {
  parentRef: React.RefObject<Group>;
}

const createVortexPiece = () => (
  <group>
    {/* Mist-like particle similar to ReaperMistEffect */}
    <mesh>
      <sphereGeometry args={[0.2, 8, 8]} />
      <meshStandardMaterial 
        color="#4FC3F7"
        emissive="#4FC3F7"
        emissiveIntensity={0.6}
        transparent
        opacity={0.4}
        blending={AdditiveBlending}
        depthWrite={false}
      />
    </mesh>
  </group>
);

export default function ElementalVortex({ parentRef }: ElementalVortexProps) {
  const vortexPiecesRef = useRef<(Group | null)[]>([]);
  const pieceCount = 40; // More particles for denser effect
  const baseRadius = 1.0; // Larger radius
  const groupRef = useRef<Group>(null);
  
  useFrame(({ clock }) => {
    if (!parentRef.current || !groupRef.current) return;
    
    const parentPosition = parentRef.current.position;
    groupRef.current.position.set(parentPosition.x, 0, parentPosition.z);
    
    vortexPiecesRef.current.forEach((piece, i) => {
      if (!piece) return;
      
      const time = clock.getElapsedTime();
      const heightOffset = ((i / pieceCount) * 1.5); // Taller vortex
      const radiusMultiplier = 1.2 - (heightOffset * 0.6); // Gentler taper
      
      // More complex spiral motion like mist particles
      const spiralAngle = (i / pieceCount) * Math.PI * 6 + time * 1.5;
      const floatAngle = time * 2 + i * 0.5;
      const radius = baseRadius * radiusMultiplier + Math.sin(floatAngle) * 0.2;
      
      const x = Math.cos(spiralAngle) * radius;
      const z = Math.sin(spiralAngle) * radius;
      const y = heightOffset + Math.sin(time * 2 + i) * 0.3 - 0.85; // Floating motion
      
      piece.position.set(x, y, z);
      
      // Gentle rotation like mist particles
      piece.rotation.y = spiralAngle + Math.PI / 2;
      piece.rotation.x = Math.sin(time + i) * 0.2;
      piece.rotation.z = Math.cos(time * 0.8 + i) * 0.2;
      
      // Fade particles as they rise (like mist)
      const meshChild = piece.children[0] as Mesh;
      if (meshChild && meshChild.material) {
        const material = meshChild.material as THREE.MeshStandardMaterial;
        const fadeProgress = heightOffset / 1.5;
        material.opacity = Math.max(0.1, 0.6 * (1 - fadeProgress));
        
        // Scale particles down as they rise
        const scale = 1 - fadeProgress * 0.5;
        piece.scale.setScalar(scale);
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
        color="#4FC3F7"
        intensity={6}
        distance={8}
        decay={1.5}
        position={[0, 0.8, 0]}
      />
    </group>
  );
} 