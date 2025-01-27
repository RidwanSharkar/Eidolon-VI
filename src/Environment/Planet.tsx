import React, { useRef } from 'react';
import * as THREE from 'three';
import { useLoader, useFrame } from '@react-three/fiber';

const Planet: React.FC = () => {
  const ringTexture = useLoader(THREE.TextureLoader, '/textures/ring-alpha.jpg');
  const ringRef = useRef<THREE.Mesh>(null);

  // Rotate the ring slowly
  useFrame((state, delta) => {
    if (ringRef.current) {
      ringRef.current.rotation.z += delta * 0.006;
    }
  });

  return (
    <group position={[100, 80, -150]} scale={[24 , 24, 24]} rotation={[1.0, 0.1, 0.1]}>
      {/* Main planet sphere */}
      <mesh>
        <sphereGeometry args={[1, 32, 32]} />
        <meshStandardMaterial
          color="#B8E0D2"
          roughness={0.7}
          metalness={0.2}
          emissive="#B8E0D2"
          emissiveIntensity={0.675}
        />
      </mesh>

      {/* Planet Ring */}
      <mesh ref={ringRef} rotation={[Math.PI / 2.8, 0, 0]}>
        <ringGeometry args={[1.4, 2.1, 64]} />
        <meshStandardMaterial
          map={ringTexture}
          color="#A8DBFF"
          transparent
          opacity={1}
          side={THREE.DoubleSide}
          alphaMap={ringTexture}
          roughness={0.7}
          metalness={0.2}
          emissive="#77FFC0"
          emissiveIntensity={1.1}
        />
      </mesh>

      {/* Inner glow */}
      <mesh scale={[1.05, 1.05, 1.05]}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial
          color="#4dff90"
          transparent
          opacity={0.5}
        />
      </mesh> 

      {/* Outer glow */}
      <mesh scale={[1.1, 1.1, 1.1]}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial
          color="#4dff90"
          transparent
          opacity={0.2}
          side={THREE.BackSide}
        />
      </mesh>


    </group>
  );
};

export default Planet; 