// src/Versus/Reaper/ReaperBloodPool.tsx - Blood Vortex Effect
import React, { useRef, useEffect, useState } from 'react';
import { Vector3, Group, SphereGeometry, TorusGeometry, CircleGeometry } from 'three';
import { useFrame } from '@react-three/fiber';

// MEMORY FIX: Static shared geometries - created once at module load, reused for all instances
// Use base scale of 1.0 and apply dynamic scale via mesh scale prop
const BLOOD_SPHERE_GEOMETRY = new SphereGeometry(0.6, 12, 8);
const BLOOD_INNER_SPHERE_GEOMETRY = new SphereGeometry(0.6, 8, 6);
const BLOOD_RING_1_GEOMETRY = new TorusGeometry(0.8, 0.1, 6, 12);
const BLOOD_RING_2_GEOMETRY = new TorusGeometry(0.6, 0.08, 6, 10);
const BLOOD_SPLATTER_GEOMETRY = new CircleGeometry(1.2, 16);
const BLOOD_MIST_GEOMETRY = new SphereGeometry(1.2, 8, 6);

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
      {/* MEMORY FIX: Central blood sphere - use shared geometry with scale transform */}
      <mesh scale={[scale, scale, scale]}>
        <primitive object={BLOOD_SPHERE_GEOMETRY} attach="geometry" />
        <meshBasicMaterial 
          color="#66d9ff" // Light blue
          transparent 
          opacity={opacity * 0.8}
        />
      </mesh>

      {/* MEMORY FIX: Inner darker core - use shared geometry with scale */}
      <mesh scale={[scale * 0.7, scale * 0.7, scale * 0.7]}>
        <primitive object={BLOOD_INNER_SPHERE_GEOMETRY} attach="geometry" />
        <meshBasicMaterial 
          color="#4db8e6" // Darker light blue
          transparent 
          opacity={opacity * 0.9}
        />
      </mesh>

      {/* MEMORY FIX: Swirling ring effects - use shared geometry with scale */}
      <mesh 
        position={[0, 0.3, 0]}
        rotation={[Math.PI / 6, 0, 0]}
        scale={[scale, scale, scale]}
      >
        <primitive object={BLOOD_RING_1_GEOMETRY} attach="geometry" />
        <meshBasicMaterial 
          color="#80e6ff"
          transparent 
          opacity={opacity * 0.6}
        />
      </mesh>

      <mesh 
        position={[0, 0.15, 0]}
        rotation={[-Math.PI / 6, 0, 0]}
        scale={[scale, scale, scale]}
      >
        <primitive object={BLOOD_RING_2_GEOMETRY} attach="geometry" />
        <meshBasicMaterial 
          color="#5cd1ff"
          transparent 
          opacity={opacity * 0.85}
        />
      </mesh>

      {/* MEMORY FIX: Ground blood splatter - use shared geometry with scale */}
      <mesh position={[0, 0.15, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[scale, scale, 1]}>
        <primitive object={BLOOD_SPLATTER_GEOMETRY} attach="geometry" />
        <meshBasicMaterial 
          color="#33a3cc"
          transparent 
          opacity={opacity * 0.7}
        />
      </mesh>

      {/* MEMORY FIX: Outer blood mist - use shared geometry with scale */}
      <mesh scale={[scale, scale, scale]}>
        <primitive object={BLOOD_MIST_GEOMETRY} attach="geometry" />
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