import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Mesh, Group, } from 'three';
import * as THREE from 'three';
import { WeaponType } from '@/Weapons/weapons';


interface BoneVortexProps {
  parentRef: React.RefObject<Group>;
  weaponType: WeaponType;
}

const getVortexColor = (weaponType: WeaponType) => {
  switch (weaponType) {
    case WeaponType.SCYTHE:
      return '#00ff44';
    case WeaponType.SWORD:
      return '#8783D1';
    case WeaponType.SABRES:
    case WeaponType.SABRES2:
      return '#73EEDC';
    default:
      return '#00ff44';
  }
};

const createVortexPiece = (weaponType: WeaponType) => {
  const color = getVortexColor(weaponType);
  return (
    <group>
      {/* Main vortex fragment */}
      <mesh>
        <boxGeometry args={[0.15, 0.03, 0.03]} />
        <meshStandardMaterial 
          color={color}
          transparent
          opacity={0.6}
          emissive={color}
          emissiveIntensity={0.5}
        />
      </mesh>
      
      {/* Glowing core */}
      <mesh>
        <sphereGeometry args={[0.035, 9, 9]} />
        <meshStandardMaterial 
          color={color}
          emissive={color}
          emissiveIntensity={1.5}
          transparent
          opacity={0.4}
        />
      </mesh>
    </group>
  );
};

export default function BoneVortex({ parentRef, weaponType }: BoneVortexProps) {
  const vortexPiecesRef = useRef<(Group | null)[]>([]);
  const pieceCount = 30;
  const baseRadius = 0.47;
  const groupRef = useRef<Group>(null);
  
  useFrame(({ clock }) => {
    if (!parentRef.current || !groupRef.current) return;
    
    const parentPosition = parentRef.current.position;
    groupRef.current.position.set(parentPosition.x, 0.03, parentPosition.z);
    
    vortexPiecesRef.current.forEach((piece, i) => {
      if (!piece) return;
      
      const time = clock.getElapsedTime();
      const heightOffset = ((i / pieceCount) * 0.6);
      const radiusMultiplier = 1 - (heightOffset * 0.7);
      
      const angle = (i / pieceCount) * Math.PI * 4 + time * 2;
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
          {createVortexPiece(weaponType)}
        </group>
      ))}
      
      <pointLight 
        color={getVortexColor(weaponType)}
        intensity={1}
        distance={1.2}
        position={[0, 0.25, 0]}
      />
    </group>
  );
} 