// src/Versus/Reaper/ReaperBloodPool.tsx - Blood Vortex Effect
import React, { useRef, useEffect, useState } from 'react';
import { Vector3, Group } from 'three';
import { useFrame } from '@react-three/fiber';

interface ReaperBloodVortexProps {
  position: Vector3;
  duration?: number;
  onComplete?: () => void;
}

export default function ReaperBloodVortex({ 
  position, 
  duration = 6000, // Increased from 3000ms to 6000ms
  onComplete 
}: ReaperBloodVortexProps) {
  const groupRef = useRef<Group>(null);
  const [opacity, setOpacity] = useState(1.0);
  const [scale, setScale] = useState(2.0);
  
  const startTime = useRef(Date.now());
  const isCompleted = useRef(false);

  useFrame((state, delta) => {
    if (!groupRef.current || isCompleted.current) return;

    const elapsed = Date.now() - startTime.current;
    const progress = Math.min(elapsed / duration, 1);

    // Accelerating rotation for vortex effect
    const rotationSpeed = 2 + progress * 5; // Speed up over time
    groupRef.current.rotation.y += delta * rotationSpeed;

    if (progress < 0.05) {
      // Quick fade in (first 5% - shorter fade in)
      const fadeProgress = progress / 0.05;
      setOpacity(fadeProgress);
      setScale(3.0 + fadeProgress * 0.5); // Grow slightly while fading in
    } else if (progress < 0.9) {
      // Stay at full visibility for most of the duration (5%-90% = 85% of time)
      setOpacity(1.0);
      setScale(3.5); // end scale
    } else {
      // Slow fade out (last 10% of duration)
      const fadeProgress = (progress - 0.9) / 0.1;
      setOpacity(1.0 - fadeProgress);
      setScale(3.5 + fadeProgress * 0.5); // Grow slightly while fading out
    }

    if (progress >= 1 && !isCompleted.current) {
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

  return (
    <group
      ref={groupRef}
      position={[position.x, position.y + 0.8, position.z]}
    >
      {/* Central blood sphere with swirling effect */}
      <mesh>
        <sphereGeometry args={[scale * 0.6, 12, 8]} />
        <meshBasicMaterial 
          color="#66d9ff" // Light blue
          transparent 
          opacity={opacity * 0.8}
        />
      </mesh>

      {/* Inner darker core */}
      <mesh scale={[0.7, 0.7, 0.7]}>
        <sphereGeometry args={[scale * 0.6, 8, 6]} />
        <meshBasicMaterial 
          color="#4db8e6" // Darker light blue
          transparent 
          opacity={opacity * 0.9}
        />
      </mesh>

      {/* Swirling ring effects */}
      <mesh 
        position={[0, 0.3, 0]}
        rotation={[Math.PI / 6, 0, 0]}
      >
        <torusGeometry args={[scale * 0.8, scale * 0.1, 6, 12]} />
        <meshBasicMaterial 
          color="#80e6ff"
          transparent 
          opacity={opacity * 0.6}
        />
      </mesh>

      <mesh 
        position={[0, 0.15, 0]}
        rotation={[-Math.PI / 6, 0, 0]}
      >
        <torusGeometry args={[scale * 0.6, scale * 0.08, 6, 10]} />
        <meshBasicMaterial 
          color="#5cd1ff"
          transparent 
          opacity={opacity * 0.85}
        />
      </mesh>

      {/* Ground blood splatter */}
      <mesh position={[0, 0.15, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[scale * 1.2, 16]} />
        <meshBasicMaterial 
          color="#33a3cc"
          transparent 
          opacity={opacity * 0.7}
        />
      </mesh>

      {/* Outer blood mist */}
      <mesh>
        <sphereGeometry args={[scale * 1.2, 8, 6]} />
        <meshBasicMaterial 
          color="#2e7399"
          transparent 
          opacity={opacity * 0.5}
          wireframe={true}
        />
      </mesh>
    </group>
  );
} 