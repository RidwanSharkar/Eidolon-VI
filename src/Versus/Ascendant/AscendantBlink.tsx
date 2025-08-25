// src/Versus/Ascendant/AscendantBlink.tsx
import React, { useRef, useEffect, useState } from 'react';
import { Vector3 } from 'three';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface AscendantBlinkProps {
  startPosition: Vector3;
  endPosition: Vector3;
  duration?: number;
  onComplete?: () => void;
}

export default function AscendantBlink({ 
  startPosition, 
  endPosition,
  duration = 800, // 0.8 second blink effect
  onComplete 
}: AscendantBlinkProps) {
  const [progress, setProgress] = useState(0);
  
  const startTime = useRef(Date.now());
  const isCompleted = useRef(false);

  useFrame(() => {
    if (isCompleted.current) return;

    const elapsed = Date.now() - startTime.current;
    const currentProgress = Math.min(elapsed / duration, 1);
    setProgress(currentProgress);

    if (currentProgress >= 1 && !isCompleted.current) {
      isCompleted.current = true;
      onComplete?.();
    }
  });

  useEffect(() => {
    return () => {
      if (onComplete && !isCompleted.current) {
        onComplete();
      }
    };
  }, [onComplete]);

  // Calculate fade effects for start and end
  const startOpacity = progress < 0.5 ? (1 - progress * 2) : 0;
  const endOpacity = progress > 0.5 ? ((progress - 0.5) * 2) : 0;
  const portalScale = Math.sin(progress * Math.PI) * 2;

  return (
    <>
      {/* Start position portal effect */}
      <group position={[startPosition.x, startPosition.y + 1, startPosition.z]}>
        {/* Disappearing portal */}
        <mesh>
          <sphereGeometry args={[1.5, 24, 24]} />
          <meshStandardMaterial
            color="#4466ff"
            emissive="#2244cc"
            emissiveIntensity={3.0}
            transparent
            opacity={startOpacity * 0.7}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>

        {/* Swirling energy rings */}
        <mesh rotation={[0, progress * Math.PI * 4, 0]}>
          <torusGeometry args={[1.8, 0.2, 8, 16]} />
          <meshStandardMaterial 
            color="#6688ff"
            emissive="#4466dd"
            emissiveIntensity={2.5}
            transparent 
            opacity={startOpacity * 0.8}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>

        <mesh rotation={[Math.PI / 2, progress * Math.PI * -3, 0]}>
          <torusGeometry args={[1.4, 0.15, 8, 14]} />
          <meshStandardMaterial 
            color="#88aaff"
            emissive="#6688ee"
            emissiveIntensity={2.0}
            transparent 
            opacity={startOpacity * 0.6}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>

        {/* Energy particles spiraling inward */}
        {Array.from({ length: 8 }, (_, i) => {
          const angle = (i / 8) * Math.PI * 2 + progress * Math.PI * 3;
          const radius = 2.5 * (1 - progress * 0.8);
          const x = Math.cos(angle) * radius;
          const z = Math.sin(angle) * radius;
          const y = Math.sin(progress * Math.PI * 2 + i) * 0.8;
          
          return (
            <mesh 
              key={i}
              position={[x, y, z]}
              scale={[0.3, 0.3, 0.3]}
            >
              <sphereGeometry args={[0.2, 8, 8]} />
              <meshStandardMaterial 
                color="#aaccff"
                emissive="#88aaee"
                emissiveIntensity={2.5}
                transparent 
                opacity={startOpacity}
                depthWrite={false}
                blending={THREE.AdditiveBlending}
              />
            </mesh>
          );
        })}

        {/* Start portal light */}
        <pointLight 
          color="#4466ff"
          intensity={6.0 * startOpacity}
          distance={8}
          decay={2}
        />
      </group>

      {/* End position portal effect */}
      <group position={[endPosition.x, endPosition.y + 1, endPosition.z]}>
        {/* Appearing portal */}
        <mesh scale={[portalScale, portalScale, portalScale]}>
          <sphereGeometry args={[1.5, 24, 24]} />
          <meshStandardMaterial
            color="#ff4466"
            emissive="#cc2244"
            emissiveIntensity={3.0}
            transparent
            opacity={endOpacity * 0.7}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>

        {/* Expanding energy rings */}
        <mesh 
          rotation={[0, -progress * Math.PI * 4, 0]}
          scale={[portalScale, portalScale, portalScale]}
        >
          <torusGeometry args={[1.8, 0.2, 8, 16]} />
          <meshStandardMaterial 
            color="#ff6688"
            emissive="#dd4466"
            emissiveIntensity={2.5}
            transparent 
            opacity={endOpacity * 0.8}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>

        <mesh 
          rotation={[Math.PI / 2, -progress * Math.PI * 3, 0]}
          scale={[portalScale, portalScale, portalScale]}
        >
          <torusGeometry args={[1.4, 0.15, 8, 14]} />
          <meshStandardMaterial 
            color="#ff88aa"
            emissive="#ee6688"
            emissiveIntensity={2.0}
            transparent 
            opacity={endOpacity * 0.6}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>

        {/* Energy particles spiraling outward */}
        {Array.from({ length: 8 }, (_, i) => {
          const angle = (i / 8) * Math.PI * 2 - progress * Math.PI * 3;
          const radius = 1.0 + progress * 2.0;
          const x = Math.cos(angle) * radius;
          const z = Math.sin(angle) * radius;
          const y = Math.sin(progress * Math.PI * 2 + i) * 0.8;
          
          return (
            <mesh 
              key={i}
              position={[x, y, z]}
              scale={[0.3, 0.3, 0.3]}
            >
              <sphereGeometry args={[0.2, 8, 8]} />
              <meshStandardMaterial 
                color="#ffaacc"
                emissive="#eeaacc"
                emissiveIntensity={2.5}
                transparent 
                opacity={endOpacity}
                depthWrite={false}
                blending={THREE.AdditiveBlending}
              />
            </mesh>
          );
        })}

        {/* End portal light */}
        <pointLight 
          color="#ff4466"
          intensity={6.0 * endOpacity}
          distance={8}
          decay={2}
        />

        {/* Ground impact effect */}
        <mesh position={[0, -0.8, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.0, 3.0 * portalScale, 16]} />
          <meshStandardMaterial 
            color="#ff6688"
            emissive="#cc4466"
            emissiveIntensity={1.5}
            transparent 
            opacity={endOpacity * 0.5}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      </group>

      {/* Energy trail connecting start and end positions */}
      {progress > 0.2 && progress < 0.8 && (
        <group>
          {Array.from({ length: 10 }, (_, i) => {
            const t = i / 9;
            const trailPosition = new Vector3().lerpVectors(startPosition, endPosition, t);
            trailPosition.y += 1 + Math.sin(t * Math.PI) * 2; // Arc trajectory
            
            const trailOpacity = Math.sin((progress - 0.2) / 0.6 * Math.PI) * 0.6;
            
            return (
              <mesh 
                key={i}
                position={[trailPosition.x, trailPosition.y, trailPosition.z]}
                scale={[0.4, 0.4, 0.4]}
              >
                <sphereGeometry args={[0.3, 8, 8]} />
                <meshStandardMaterial 
                  color="#8866ff"
                  emissive="#6644dd"
                  emissiveIntensity={2.0}
                  transparent 
                  opacity={trailOpacity}
                  depthWrite={false}
                  blending={THREE.AdditiveBlending}
                />
              </mesh>
            );
          })}
        </group>
      )}
    </>
  );
}
