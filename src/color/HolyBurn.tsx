import React, { useRef } from 'react';
import { Group, Vector3 } from 'three';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface HolyBurnProps {
  position: Vector3;
  onComplete?: () => void;
  duration?: number;
  targetId?: string;
  enemyData?: Array<{
    id: string;
    position: Vector3;
    health: number;
    isDying?: boolean;
    deathStartTime?: number;
  }>;
}

export default function HolyBurn({ 
  position, 
  onComplete, 
  duration = 3.0,
  targetId,
  enemyData = []
}: HolyBurnProps) {
  const groupRef = useRef<Group>(null);
  const startTime = useRef(Date.now());
  
  useFrame(() => {
    if (!groupRef.current) return;
    
    const elapsed = (Date.now() - startTime.current) / 1000;
    const progress = Math.min(elapsed / duration, 1);
    
    if (progress >= 1) {
      onComplete?.();
      return;
    }
    
    // Update position to follow enemy if targetId is provided
    if (targetId && enemyData.length > 0) {
      const target = enemyData.find(enemy => enemy.id === targetId);
      let currentPosition = position;
      
      if (target && target.health > 0 && !target.isDying && !target.deathStartTime) {
        currentPosition = target.position;
      }
      
      // Update the group position to follow the enemy
      groupRef.current.position.copy(currentPosition);
    }
    
    // Pulsing effect
    const pulse = Math.sin(elapsed * 8) * 0.1 + 1;
    groupRef.current.scale.setScalar(pulse);
    
    // Fade out towards the end
    const fade = progress > 0.7 ? (1 - progress) / 0.3 : 1;
    
    // Update material opacity for all children
    groupRef.current.children.forEach(child => {
      if (child instanceof THREE.Mesh && child.material) {
        const material = child.material as THREE.MeshStandardMaterial;
        if (material.opacity !== undefined) {
          material.opacity = fade;
        }
      }
    });
  });

  return (
    <group ref={groupRef} position={position}>
      {/* Central holy flame */}
      <mesh position={[0, 1.5, 0]}>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial
          color={new THREE.Color(0xFFD700)}
          emissive={new THREE.Color(0xFFA500)}
          emissiveIntensity={2}
          transparent
          opacity={0.8}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      
      {/* Inner core */}
      <mesh position={[0, 1.5, 0]}>
        <sphereGeometry args={[0.15, 12, 12]} />
        <meshStandardMaterial
          color={new THREE.Color(0xFFFF00)}
          emissive={new THREE.Color(0xFFFF00)}
          emissiveIntensity={4}
          transparent
          opacity={0.9}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      
      {/* Rising holy particles */}
      {[...Array(6)].map((_, i) => (
        <mesh 
          key={i} 
          position={[
            (Math.random() - 0.5) * 0.4,
            1.5 + (i * 0.2),
            (Math.random() - 0.5) * 0.4
          ]}
        >
          <sphereGeometry args={[0.05, 8, 8]} />
          <meshStandardMaterial
            color={new THREE.Color(0xFFF8DC)}
            emissive={new THREE.Color(0xFFD700)}
            emissiveIntensity={3}
            transparent
            opacity={0.7}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      ))}
      
      {/* Holy aura ring */}
      <mesh position={[0, 1.5, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.5, 0.1, 16, 32]} />
        <meshStandardMaterial
          color={new THREE.Color(0xFFD700)}
          emissive={new THREE.Color(0xFFA500)}
          emissiveIntensity={1.5}
          transparent
          opacity={0.6}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      
      {/* Outer holy light */}
      <pointLight 
        color={new THREE.Color(0xFFD700)}
        intensity={2}
        distance={3}
        decay={2}
        position={[0, 1.5, 0]}
      />
    </group>
  );
} 