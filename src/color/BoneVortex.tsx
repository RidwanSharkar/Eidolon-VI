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
      return '#5EFF00';
    case WeaponType.SWORD:
      return '#FF9748';
    case WeaponType.SABRES:
      return '#00AAFF';
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
        <boxGeometry args={[0.1075, 0.02, 0.025]} />
        <meshStandardMaterial 
          color={color}
          transparent
          opacity={0.6}
          emissive={color}
          emissiveIntensity={0.55}
        />
      </mesh>
      
      {/* Glowing core */}
      <mesh>
        <sphereGeometry args={[0.035, 9, 9]} />
        <meshStandardMaterial 
          color={color}
          emissive={color}
          emissiveIntensity={.7}
          transparent
          opacity={0.4}
        />
      </mesh>
    </group>
  );
};

export default function BoneVortex({ parentRef, weaponType }: BoneVortexProps) {
  const vortexPiecesRef = useRef<(Group | null)[]>([]);
  const pieceCount = 32;
  const baseRadius = 0.45;
  const groupRef = useRef<Group>(null);
  
  useFrame(({ clock }) => {
    if (!parentRef.current || !groupRef.current) return;
    
    const parentPosition = parentRef.current.position;
    groupRef.current.position.set(parentPosition.x, 0.0, parentPosition.z);
    
    vortexPiecesRef.current.forEach((piece, i) => {
      if (!piece) return;
      
      const time = clock.getElapsedTime();
      const heightOffset = ((i / pieceCount) * 0.625);
      const radiusMultiplier = 1 - (heightOffset * 0.875);
      
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
      {/* Base glow sphere
      <mesh position={[0, -0.40, 0]}>
        <sphereGeometry args={[0.675, 16, 16]} />
        <meshBasicMaterial
          color={getVortexColor(weaponType)}
          transparent
          opacity={0.15}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
 */}
      {/* outer  fade glow
      <mesh position={[0, -0.05, 0]}>
        <sphereGeometry args={[0.55, 16, 16]} />
        <meshBasicMaterial
          color={getVortexColor(weaponType)}
          transparent
          opacity={0.06}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
       */}

      {/* Point lights */}
      <pointLight 
        color={getVortexColor(weaponType)}
        intensity={2}
        distance={1.3}
        position={[0, 0.15, 0]}
      />
      
      <pointLight 
        color={getVortexColor(weaponType)}
        intensity={1}
        distance={2}
        position={[0, 0.1, 0]}
        decay={2}
      />

      {/* Existing vortex pieces */}
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
    </group>
  );
} 