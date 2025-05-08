import { useRef } from 'react';
import { Group, Vector3 } from 'three';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

interface VenomEffectProps {
  position: Vector3;
  onComplete: () => void;
}

export default function VenomEffect({ position, onComplete }: VenomEffectProps) {
  const groupRef = useRef<Group>(null);
  const startTime = useRef(Date.now());
  const duration = 1000; // ms - lasts longer than the eagle eye effect
  
  useFrame(() => {
    if (!groupRef.current) return;
    
    const elapsed = Date.now() - startTime.current;
    const progress = Math.min(elapsed / duration, 1);
    
    // Scale effect and fade out
    const scale = 1 + progress * 1.5;
    groupRef.current.scale.set(scale, scale, scale);
    
    // Apply opacity
    groupRef.current.children.forEach(child => {
      if (child instanceof THREE.Mesh) {
        const material = child.material as THREE.MeshStandardMaterial;
        if (material.opacity) {
          material.opacity = 1 - progress;
        }
      }
    });
    
    // Remove when complete
    if (progress >= 1) {
      onComplete();
    }
  });
  
  // Randomize rotation for variety
  const randomRotation = useRef(Math.random() * Math.PI * 2);
  
  return (
    <group 
      ref={groupRef} 
      position={[position.x, position.y + 1, position.z]}
      rotation={[0, randomRotation.current, 0]}
    >
      {/* Main venom cloud */}
      <mesh>
        <sphereGeometry args={[0.4, 16, 16]} />
        <meshStandardMaterial 
          color="#00FF44"
          emissive="#00FF44"
          emissiveIntensity={1.5}
          transparent
          opacity={0.8}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      
      {/* Inner toxic core */}
      <mesh>
        <sphereGeometry args={[0.2, 12, 12]} />
        <meshStandardMaterial 
          color="#33FF33"
          emissive="#33FF33"
          emissiveIntensity={2}
          transparent
          opacity={0.9}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      
      {/* Toxic tendrils */}
      {[...Array(6)].map((_, i) => {
        const angle = (i / 6) * Math.PI * 2;
        const radiusX = 0.3 + Math.random() * 0.2;
        const radiusZ = 0.3 + Math.random() * 0.2;
        return (
          <mesh 
            key={i}
            position={[
              Math.cos(angle) * radiusX,
              Math.random() * 0.4 - 0.2,
              Math.sin(angle) * radiusZ
            ]}
          >
            <sphereGeometry args={[0.15 + Math.random() * 0.1, 8, 8]} />
            <meshStandardMaterial 
              color="#00BB33"
              emissive="#00BB33"
              emissiveIntensity={1.5}
              transparent
              opacity={0.7}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
        );
      })}
      
      {/* Toxic particles */}
      {[...Array(10)].map((_, i) => {
        const angle = Math.random() * Math.PI * 2;
        const radius = Math.random() * 0.5;
        const height = Math.random() * 0.4 - 0.2;
        return (
          <mesh 
            key={`particle-${i}`}
            position={[
              Math.cos(angle) * radius,
              height,
              Math.sin(angle) * radius
            ]}
          >
            <sphereGeometry args={[0.05 + Math.random() * 0.04, 6, 6]} />
            <meshStandardMaterial 
              color={i % 2 === 0 ? "#00FF44" : "#55FF00"}
              emissive={i % 2 === 0 ? "#00FF44" : "#55FF00"}
              emissiveIntensity={2}
              transparent
              opacity={0.8}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
        );
      })}
      
      {/* Venom glow light */}
      <pointLight color="#00FF44" intensity={1.5} distance={3} decay={2} />
    </group>
  );
} 