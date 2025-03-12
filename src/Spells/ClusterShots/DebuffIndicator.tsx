import { useRef, useEffect } from 'react';
import { Vector3 } from 'three';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';


interface DebuffIndicatorProps {
  position: Vector3;
  elapsedTime: number; // 0-1 value representing how far through the debuff duration we are
}

export function DebuffIndicator({ position, elapsedTime }: DebuffIndicatorProps) {
  const groupRef = useRef<THREE.Group>(null);
  
  // Position the indicator above the enemy
  useEffect(() => {
    if (groupRef.current) {
      groupRef.current.position.copy(position);
      groupRef.current.position.y += 2.2; // Position above the enemy
    }
  }, [position]);
  
  // Update position each frame
  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.position.copy(position);
      groupRef.current.position.y += 2.2;
      
      // Rotate the indicator for effect
      groupRef.current.rotation.y += 0.02; // Increased rotation speed for better visibility
    }
  });
  
  // Calculate opacity based on remaining time
  const opacity = Math.max(0.4, 1 - elapsedTime); // Minimum opacity of 0.4 for better visibility
  
  // Pulse effect based on time
  const scale = 1 + 0.1 * Math.sin(Date.now() * 0.005); // Subtle pulsing effect
  
  return (
    <group ref={groupRef} scale={[scale, scale, scale]}>
      {/* Ring indicator with glow effect */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.5, 0.6, 32]} />
        <meshBasicMaterial 
          color="#00ff00" 
          transparent={true} 
          opacity={opacity}
        />
      </mesh>
      
      {/* Inner ring for better visibility */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <ringGeometry args={[0.4, 0.45, 32]} />
        <meshBasicMaterial 
          color="#66ff66" 
          transparent={true} 
          opacity={opacity * 0.7}
        />
      </mesh>
      
      {/* Arrow symbols inside the ring */}
      {[0, 1, 2, 3].map((i) => (
        <mesh 
          key={i} 
          position={[
            0.35 * Math.cos(i * Math.PI / 2), 
            0, 
            0.35 * Math.sin(i * Math.PI / 2)
          ]}
          rotation={[Math.PI / 2, 0, i * Math.PI / 2]}
        >
          <coneGeometry args={[0.1, 0.2, 8]} />
          <meshBasicMaterial 
            color="#00ff00" 
            transparent={true} 
            opacity={opacity}
          />
        </mesh>
      ))}
    </group>
  );
} 