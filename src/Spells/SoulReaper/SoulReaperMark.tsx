import React, { useRef, useState } from 'react';
import { Group, Vector3 } from 'three';
import { useFrame } from '@react-three/fiber';
import { Enemy } from '@/Versus/enemy';

interface SoulReaperMarkProps {
  targetId: string;
  enemyData: Enemy[];
  fallbackPosition: Vector3 | null;
  duration: number; // in milliseconds
  startTime: number;
}

export default function SoulReaperMark({ targetId, enemyData, fallbackPosition, duration, startTime }: SoulReaperMarkProps) {
  const groupRef = useRef<Group>(null);
  const [progress, setProgress] = useState(0);

  useFrame(() => {
    if (!groupRef.current) return;

    const elapsed = Date.now() - startTime;
    const newProgress = Math.min(elapsed / duration, 1);
    setProgress(newProgress);

    if (groupRef.current) {
      // Find the current enemy position
      const target = enemyData.find(enemy => enemy.id === targetId);
      let currentPosition = fallbackPosition;
      
      if (target && target.health > 0 && !target.isDying && !target.deathStartTime) {
        currentPosition = target.position;
      }
      
      if (currentPosition) {
        // Position the mark above the enemy's head
        groupRef.current.position.copy(currentPosition);
        groupRef.current.position.y += 2.5;
      }

      // Rotate the mark slowly
      groupRef.current.rotation.y += 0.02;

      // Pulse effect - more intense as it approaches detonation
      const pulseIntensity = 0.8 + Math.sin(elapsed * 0.01) * 0.2;
      const scaleMultiplier = 1 + Math.sin(elapsed * 0.02) * 0.1;
      groupRef.current.scale.setScalar(pulseIntensity * scaleMultiplier);
    }
  });

  // Calculate opacity based on progress
  const opacity = Math.max(0.3, 1 - progress * 0.3);
  const emissiveIntensity = 0.5 + progress * 1.5; // Increase intensity as it approaches detonation

  return (
    <group ref={groupRef}>
      {/* Main mark ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.8, 0.1, 8, 16]} />
        <meshStandardMaterial
          color="#DCA1DC"
          emissive="#DCA1DC"
          emissiveIntensity={emissiveIntensity}
          transparent
          opacity={opacity}
        />
      </mesh>

      {/* Inner energy core */}
      <mesh>
        <sphereGeometry args={[0.3, 8, 8]} />
        <meshStandardMaterial
          color="#D970D6"
          emissive="#D970D6"
          emissiveIntensity={emissiveIntensity * 0.8}
          transparent
          opacity={opacity * 0.6}
        />
      </mesh>

      {/* Outer energy ring */}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.2, 0.05, 8, 16]} />
        <meshStandardMaterial
          color="#D970D6"
          emissive="#D970D6"
          emissiveIntensity={emissiveIntensity * 0.6}
          transparent
          opacity={opacity * 0.4}
        />
      </mesh>

      {/* Chaos symbols/runes (simplified as rotating spikes) */}
      {[0, 1, 2, 3].map((index) => {
        const angle = (index * Math.PI) / 2;
        return (
          <group key={index} rotation={[0, angle, 0]}>
            <mesh position={[1, 0, 0]} rotation={[0, 0, Math.PI / 4]}>
              <coneGeometry args={[0.1, 0.4, 4]} />
              <meshStandardMaterial
                color="#DCA1DC"
                emissive="#DCA1DC"
                emissiveIntensity={emissiveIntensity}
                transparent
                opacity={opacity}
              />
            </mesh>
          </group>
        );
      })}

      {/* Energy particles */}
      <group>
        {[...Array(8)].map((_, index) => {
          const radius = 1.5;
          const angle = (index * Math.PI * 2) / 8;
          const x = Math.cos(angle) * radius;
          const z = Math.sin(angle) * radius;
          const floatOffset = Math.sin((Date.now() * 0.003) + index) * 0.2;
          
          return (
            <mesh key={index} position={[x, floatOffset, z]}>
              <sphereGeometry args={[0.05, 6, 6]} />
              <meshStandardMaterial
                color="#DCA1DC"
                emissive="#DCA1DC"
                emissiveIntensity={emissiveIntensity * 0.5}
                transparent
                opacity={opacity * 0.8}
              />
            </mesh>
          );
        })}
      </group>

      {/* Glowing point light */}
      <pointLight
        color="#DCA1DC"
        intensity={emissiveIntensity * 0.5}
        distance={3}
        decay={2}
      />
    </group>
  );
}