import React, { useRef, useEffect } from 'react';
import { Mesh, Vector3 } from 'three';


interface MountainProps {
  position: Vector3;
  scale?: number;
  isInteractive?: boolean;
  health?: number;
}

const Mountain: React.FC<MountainProps> = ({ position, scale = 1, isInteractive = false, health = 100 }) => {
  const mountainRef = useRef<Mesh>(null);

  useEffect(() => {
    if (isInteractive && health <= 0 && mountainRef.current) {
      mountainRef.current.parent?.remove(mountainRef.current);
    }
  }, [health, isInteractive]);

  if (isInteractive && health <= 0) return null;

  return (
    <group name="mountain" position={position} scale={scale}>
      <mesh ref={mountainRef} castShadow receiveShadow>
        <coneGeometry args={[23, 35, 8]} />
        <meshPhysicalMaterial 
          color="#2a2a2a"
          metalness={0.1}
          roughness={1}
          emissive="#222222"
          flatShading={true}
          clearcoat={0.1}
          clearcoatRoughness={0.8}
        />
      </mesh>
      <mesh position={[-4, -5, -2]} rotation={[0, 0.5, 0.1]} castShadow>
        <coneGeometry args={[24, 28, 7]} />
        <meshPhysicalMaterial 
          color="#252525"
          metalness={0.05}
          roughness={1}
          flatShading={true}
          clearcoat={0.1}
          clearcoatRoughness={0.9}
        />
      </mesh>
      <mesh position={[0, 14, 0]} castShadow>
        <coneGeometry args={[5, 8, 8]} />
        <meshPhysicalMaterial
          color="#ffffff"
          metalness={0.1}
          roughness={0.3}
          flatShading={true}
          clearcoat={0.4}
          clearcoatRoughness={0.2}
          envMapIntensity={1.5}
        />
      </mesh>


    </group>
  );
};

export default Mountain;