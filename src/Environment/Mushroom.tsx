// src/components/Environment/Mushroom.tsx
import React, { useRef, useMemo } from 'react';
import { Mesh } from 'three';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface MushroomProps {
  position: THREE.Vector3;
  scale: number;
  variant?: 'pink' | 'green' | 'blue';
}

const Mushroom: React.FC<MushroomProps> = ({ position, scale, variant = 'pink' }) => {
  const mushroomRef = useRef<Mesh>(null!);
  
  const mushroomColor = useMemo(() => {
    switch (variant) {
      case 'green':
        return new THREE.Color("#00FFC3"); // teal
      case 'blue':
        return new THREE.Color("#FF9BFC"); // ORANGE FFB574
      default:
        return new THREE.Color("#FF9BFC"); // PINK 
    }
  }, [variant]);

  const spotColor = useMemo(() => {
    switch (variant) {
      case 'green':
        return new THREE.Color("#2eb82e");
      case 'blue':
        return new THREE.Color("#0000FF");
      default:
        return new THREE.Color("#9b4f96");
    }
  }, [variant]);

  useFrame((state) => {
    if (mushroomRef.current) {
      mushroomRef.current.position.y = position.y + Math.sin(state.clock.getElapsedTime()) * 0.05;
    }
  });

  return (
    <group position={position} scale={scale*0.8}>
      {/* Stem */}
      <mesh ref={mushroomRef}>
        <cylinderGeometry args={[0.1, 0.12, 0.7, 16]} />
        <meshStandardMaterial 
          color={mushroomColor.clone().multiplyScalar(0.9)}
          roughness={0.4}
          metalness={0.1}
          emissive={mushroomColor}
          emissiveIntensity={0.25}
        />
      </mesh>
      
      {/* Cap */}
      <mesh position={[0, 0.35, 0]}>
        <sphereGeometry args={[0.3, 32, 32, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial 
          color={mushroomColor}
          roughness={0.4}
          metalness={0.1}
          emissive={mushroomColor}
          emissiveIntensity={0.475}
        />
      </mesh>

      {/* Spots */}
      {[...Array(6)].map((_, i) => {
        // Calculate angle for spot position
        const angle = (i * Math.PI / 3);
        // Calculate spot position on curved surface
        return (
          <mesh 
            key={i} 
            position={[
              Math.sin(angle) * 0.15,
              0.4 + Math.cos(angle) * 0.1, // Raise spots to cap surface
              Math.cos(angle) * 0.15
            ]}
            // Rotate to follow cap curvature
            rotation={[
              -Math.PI / 3, // Tilt spots to follow cap curve
              0,
              -angle // Rotate each spot to face outward
            ]}
          >
            <circleGeometry args={[0.04, 16]} />
            <meshStandardMaterial 
              color={spotColor}
              emissive={spotColor}
              emissiveIntensity={1.25}
            />
          </mesh>
        );
      })}
    </group>
  );
};

export default Mushroom;
export type { MushroomProps };