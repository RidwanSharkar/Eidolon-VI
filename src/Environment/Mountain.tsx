import React, { useRef, useEffect } from 'react';
import { Mesh, Vector3, Vector2 } from 'three';


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
      {/* Main mountain peak */}
      <mesh ref={mountainRef} castShadow receiveShadow>
        <coneGeometry args={[21.5, 35, 16]} />
        <meshStandardMaterial 
          color="#363636"
          metalness={0.2}
          roughness={1}
          emissive="#1a1a1a"
          emissiveIntensity={0.2}
        />
      </mesh>

      {/* Larger base mountain */}
      <mesh position={[-1, 1, 3]} rotation={[0.125, 0.5, 0.1]} castShadow>
        <coneGeometry args={[22, 25, 7]} />
        <meshStandardMaterial 
          color="#2a2a2a"
          metalness={0.15}
          roughness={1}
          normalScale={new Vector2(2, 2)}
        />
      </mesh>

      {/* Snow cap */}
      <mesh position={[0, 13.9, 0]} castShadow>
        <coneGeometry args={[5, 8, 8]} />
        <meshStandardMaterial
          color="#ffffff"
          metalness={0.3}
          roughness={0.4}
          envMapIntensity={1.5}
        />
      </mesh>

      {/* Additional snow patches */}
      <mesh position={[-2, 10, -1]} rotation={[0.1, 0.3, 0.1]} castShadow>
        <coneGeometry args={[3, 6, 6]} />
        <meshStandardMaterial
          color="#f0f0f0"
          metalness={0.2}
          roughness={0.5}
          envMapIntensity={1.2}
        />
      </mesh>

      {/* Rocky outcrop */}
      <mesh position={[3, 5, 2]} rotation={[0.2, -0.3, 0]} castShadow>
        <coneGeometry args={[6, 17, 12]} />
        <meshStandardMaterial
          color="#1f1f1f"
          metalness={0.3}
          roughness={1}
          normalScale={new Vector2(1.5, 1.5)}
        />
      </mesh>

      {/* Additional rocky details */}
      <mesh position={[2, -2, 4]} rotation={[0.4, 0.2, -0.1]} castShadow>
        <coneGeometry args={[4, 25, 5]} />
        <meshStandardMaterial
          color="#2d2d2d"
          metalness={0.2}
          roughness={0.9}
        />
      </mesh>

      {/* 
      <mesh position={[0.1, 5, -2]} rotation={[0.2, 0.1, 0]} castShadow>
        <coneGeometry args={[10, 14, 10]} />
        <meshStandardMaterial
          color="#ffffff"
          metalness={0.2}
          roughness={0.5}
          envMapIntensity={1.3}
        />
      </mesh>
      */}
      
    </group>
  );
};

export default Mountain;