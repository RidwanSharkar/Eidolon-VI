import React from 'react';
import { Vector3 } from 'three';

interface FlowerProps {
  position: Vector3;
  scale?: number;
}

const Flower: React.FC<FlowerProps> = ({ position, scale = 1 }) => {
  return (
    <group position={position} scale={scale}>
      {/* Stem */}
      <mesh position={[0, 0.1, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 0.8, 8]} />
        <meshStandardMaterial color="#8783D1" />
      </mesh>
      
      {/* Petals */}
      {[0, 72, 144, 216, 288].map((rotation, i) => (
        <mesh 
          key={i} 
          position={[0, 0.3, 0]} 
          rotation={[0.3, (rotation * Math.PI) / 180, 0]}
        >
          <sphereGeometry args={[0.12, 8, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial 
            color="#8783D1" 
            emissive="#8783D1"
            emissiveIntensity={0.5}
          />
        </mesh>
      ))}
      
      {/* Center */}
      <mesh position={[0, 0.425, 0]}>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshStandardMaterial 
          color="#ffeb3b"
          emissive="#ff8800"
          emissiveIntensity={.35}
        />
      </mesh>
    </group>
  );
};

export default Flower; 