import { useRef } from 'react';
import { Group, Vector3 } from 'three';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';

interface EagleEyeEffectProps {
  position: Vector3;
  onComplete: () => void;
}

export default function EagleEyeEffect({ position, onComplete }: EagleEyeEffectProps) {
  const groupRef = useRef<Group>(null);
  const startTime = useRef(Date.now());
  const duration = 500; // ms
  
  useFrame(() => {
    if (!groupRef.current) return;
    
    const elapsed = Date.now() - startTime.current;
    const progress = Math.min(elapsed / duration, 1);
    
    // Scale effect up and fade out
    const scale = 1 + progress * 2;
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
  
  return (
    <group ref={groupRef} position={[position.x, position.y + 1, position.z]}>
      {/* Eagle Eye Symbol - Circular Aura */}
      <mesh rotation={[Math.PI/2, 0, 0]}>
        <ringGeometry args={[0.6, 0.8, 32]} />
        <meshStandardMaterial 
          color="#ffcc00" 
          emissive="#ffcc00"
          emissiveIntensity={2}
          transparent
          opacity={0.9}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      
      {/* Inner Eye Symbol */}
      <mesh rotation={[Math.PI/2, 0, 0]}>
        <ringGeometry args={[0.2, 0.3, 32]} />
        <meshStandardMaterial 
          color="#ffffff" 
          emissive="#ffffff"
          emissiveIntensity={2}
          transparent
          opacity={0.9}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      
      {/* Light flash */}
      <pointLight color="#ffcc00" intensity={3} distance={5} decay={2} />
      
      {/* Radiating lines */}
      {[...Array(8)].map((_, i) => (
        <mesh 
          key={i}
          position={[
            Math.cos((Math.PI * 2 * i) / 8) * 0.4,
            0,
            Math.sin((Math.PI * 2 * i) / 8) * 0.4
          ]}
          rotation={[0, 0, (Math.PI * 2 * i) / 8]}
        >
          <boxGeometry args={[0.05, 0.05, 0.4]} />
          <meshStandardMaterial 
            color="#ffcc00" 
            emissive="#ffcc00"
            emissiveIntensity={2}
            transparent
            opacity={0.8}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      ))}
    </group>
  );
}