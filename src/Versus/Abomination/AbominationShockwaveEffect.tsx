// src/Versus/Abomination/AbominationShockwaveEffect.tsx
import React, { useRef, useEffect, useState } from 'react';
import { Vector3, Group } from 'three';
import { useFrame } from '@react-three/fiber';

interface AbominationShockwaveEffectProps {
  position: Vector3;
  duration?: number;
  onComplete?: () => void;
}

export default function AbominationShockwaveEffect({ 
  position, 
  duration = 1000, // 2 second shockwave effect
  onComplete 
}: AbominationShockwaveEffectProps) {
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
      // Rotate the shockwave rings for dynamic effect
      groupRef.current.rotation.y += 0.02;
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

  // Calculate expanding ring sizes and opacities
  const ring1Scale = 1 + progress * 8; // Expands from 1 to 9
  const ring2Scale = 1 + progress * 6; // Expands from 1 to 7
  const ring3Scale = 1 + progress * 4; // Expands from 1 to 5
  
  const ring1Opacity = Math.max(0, 0.8 - progress * 0.8);
  const ring2Opacity = Math.max(0, 0.6 - progress * 0.6);
  const ring3Opacity = Math.max(0, 0.4 - progress * 0.4);

  return (
    <group
      ref={groupRef}
      position={[position.x, position.y + 0.1, position.z]}
    >
      {/* Central impact crater */}
      <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[2.0, 16]} />
        <meshBasicMaterial 
          color="#8B4513" // Brown crater color
          transparent 
          opacity={Math.max(0, 0.7 - progress * 0.5)}
        />
      </mesh>

      {/* Expanding shockwave rings */}
      <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[ring1Scale * 0.8, ring1Scale, 24]} />
        <meshBasicMaterial 
          color="#FF6B35" // Orange-red shockwave
          transparent 
          opacity={ring1Opacity}
        />
      </mesh>

      <mesh position={[0, 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[ring2Scale * 0.8, ring2Scale, 20]} />
        <meshBasicMaterial 
          color="#FF8C42" // Lighter orange
          transparent 
          opacity={ring2Opacity}
        />
      </mesh>

      <mesh position={[0, 0.15, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[ring3Scale * 0.8, ring3Scale, 16]} />
        <meshBasicMaterial 
          color="#FFB347" // Light orange
          transparent 
          opacity={ring3Opacity}
        />
      </mesh>

      {/* Dust particles effect */}
      <mesh position={[0, 0.5, 0]}>
        <sphereGeometry args={[2 + progress * 3, 8, 6]} />
        <meshBasicMaterial 
          color="#D2691E" // Sandy brown dust
          transparent 
          opacity={Math.max(0, 0.3 - progress * 0.3)}
          wireframe={true}
        />
      </mesh>

      {/* Central light flash */}
      <pointLight 
        color="#FF6B35"
        intensity={Math.max(0, 5.0 - progress * 5.0)}
        distance={15}
        decay={2}
      />

      {/* Ground debris particles */}
      {Array.from({ length: 12 }, (_, i) => {
        const angle = (i / 12) * Math.PI * 2;
        const radius = 1 + progress * 4;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        const y = Math.sin(progress * Math.PI) * 0.5; // Arc trajectory
        
        return (
          <mesh 
            key={i}
            position={[x, y, z]}
            scale={[0.3, 0.3, 0.3]}
          >
            <boxGeometry args={[0.2, 0.2, 0.2]} />
            <meshBasicMaterial 
              color="#8B4513"
              transparent 
              opacity={Math.max(0, 0.8 - progress * 0.8)}
            />
          </mesh>
        );
      })}
    </group>
  );
}
