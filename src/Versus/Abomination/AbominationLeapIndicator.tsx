// src/Versus/Abomination/AbominationLeapIndicator.tsx
import React, { useRef, useEffect, useState } from 'react';
import { Vector3, Group } from 'three';
import { useFrame } from '@react-three/fiber';

interface AbominationLeapIndicatorProps {
  position: Vector3;
  duration?: number;
  onComplete?: () => void;
}

export default function AbominationLeapIndicator({ 
  position, 
  duration = 750, // 1.25 second charge-up
  onComplete 
}: AbominationLeapIndicatorProps) {
  const groupRef = useRef<Group>(null);
  const [progress, setProgress] = useState(0);
  
  const startTime = useRef(Date.now());
  const isCompleted = useRef(false);

  useFrame(() => {
    if (isCompleted.current) return;

    const elapsed = Date.now() - startTime.current;
    const currentProgress = Math.min(elapsed / duration, 1);
    setProgress(currentProgress);

    if (groupRef.current) {
      // Accelerating rotation as charge builds up
      const rotationSpeed = 0.05 + currentProgress * 0.15;
      groupRef.current.rotation.y += rotationSpeed;
    }

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

  // Calculate pulsing and growing effects
  const pulseIntensity = Math.sin(progress * Math.PI * 8) * 0.3 + 0.7; // Fast pulsing
  const chargeScale = 0.5 + progress * 1.5; // Grows from 0.5 to 2.0
  const energyOpacity = 0.3 + progress * 0.7; // Builds up opacity

  return (
    <group
      ref={groupRef}
      position={[position.x, position.y + 1, position.z]}
    >
      {/* Central charging orb */}
      <mesh scale={[chargeScale, chargeScale, chargeScale]}>
        <sphereGeometry args={[0.8, 16, 12]} />
        <meshBasicMaterial 
          color="#FF4500" // Orange-red energy
          transparent 
          opacity={energyOpacity * pulseIntensity}
        />
      </mesh>

      {/* Inner core */}
      <mesh scale={[chargeScale * 0.6, chargeScale * 0.6, chargeScale * 0.6]}>
        <sphereGeometry args={[0.8, 12, 8]} />
        <meshBasicMaterial 
          color="#FFD700" // Golden core
          transparent 
          opacity={energyOpacity * 0.8}
        />
      </mesh>

      {/* Rotating energy rings */}
      <mesh 
        position={[0, 0.5, 0]}
        rotation={[Math.PI / 4, 0, 0]}
        scale={[chargeScale, chargeScale, chargeScale]}
      >
        <torusGeometry args={[1.2, 0.1, 8, 16]} />
        <meshBasicMaterial 
          color="#FF6B35"
          transparent 
          opacity={energyOpacity * pulseIntensity}
        />
      </mesh>

      <mesh 
        position={[0, -0.5, 0]}
        rotation={[-Math.PI / 4, 0, 0]}
        scale={[chargeScale, chargeScale, chargeScale]}
      >
        <torusGeometry args={[1.0, 0.08, 8, 14]} />
        <meshBasicMaterial 
          color="#FF8C42"
          transparent 
          opacity={energyOpacity * pulseIntensity * 0.8}
        />
      </mesh>

      {/* Ground charging circle */}
      <mesh position={[0, -1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[2 + progress * 2, 24]} />
        <meshBasicMaterial 
          color="#FF4500"
          transparent 
          opacity={0.4 * pulseIntensity}
        />
      </mesh>

      {/* Energy sparks */}
      {Array.from({ length: 8 }, (_, i) => {
        const angle = (i / 8) * Math.PI * 2 + progress * Math.PI * 2;
        const radius = 1.5 + Math.sin(progress * Math.PI * 4) * 0.5;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        const y = Math.sin(angle * 2 + progress * Math.PI * 6) * 0.8;
        
        return (
          <mesh 
            key={i}
            position={[x, y, z]}
            scale={[0.2, 0.2, 0.2]}
          >
            <sphereGeometry args={[0.3, 6, 6]} />
            <meshBasicMaterial 
              color="#FFD700"
              transparent 
              opacity={energyOpacity * pulseIntensity}
            />
          </mesh>
        );
      })}

      {/* Bright central light */}
      <pointLight 
        color="#FF4500"
        intensity={2.0 + progress * 3.0}
        distance={10}
        decay={1.5}
      />

      {/* Warning text effect */}
      {progress > 0.5 && (
        <mesh position={[0, 3, 0]}>
          <sphereGeometry args={[0.1, 8, 6]} />
          <meshBasicMaterial 
            color="#FF0000"
            transparent 
            opacity={Math.sin((progress - 0.5) * Math.PI * 10) * 0.8 + 0.2}
          />
        </mesh>
      )}
    </group>
  );
}
