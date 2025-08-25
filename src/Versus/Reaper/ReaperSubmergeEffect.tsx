// src/Versus/Reaper/ReaperSubmergeEffect.tsx
import { useRef, useEffect, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Mesh, AdditiveBlending } from 'three';
import * as THREE from 'three';

interface ReaperSubmergeEffectProps {
  position: THREE.Vector3;
  duration?: number;
  onComplete?: () => void;
}

export default function ReaperSubmergeEffect({ 
  position, 
  duration = 4000, // 4 second animation - longer duration
  onComplete 
}: ReaperSubmergeEffectProps) {
  const particles = useRef<Mesh[]>([]);
  const startTime = useRef(Date.now());
  const isCompleted = useRef(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Initialize 40 particle meshes for a more dramatic effect
    particles.current = Array(40).fill(null).map(() => {
      const mesh = new Mesh(
        new THREE.SphereGeometry(0.25, 12, 12), // Larger particles
        new THREE.MeshStandardMaterial({
          color: '#8B0000', // Dark red for better visibility
          emissive: '#FF4500', // Bright orange-red emissive
          transparent: true,
          opacity: 0.9,
          blending: AdditiveBlending,
          depthWrite: false
        })
      );
      
      // Random initial positions in a larger circle around the position
      const angle = Math.random() * Math.PI * 2;
      const radius = 0.5 + Math.random() * 1.0; // Larger initial radius
      mesh.position.set(
        Math.cos(angle) * radius,
        0.5 + Math.random() * 1.0, // Start higher
        Math.sin(angle) * radius
      );
      
      return mesh;
    });

    return () => {
      particles.current.forEach(particle => {
        particle.geometry.dispose();
        (particle.material as THREE.Material).dispose();
      });
    };
  }, []);

  useFrame(() => {
    if (isCompleted.current) return;

    const elapsed = Date.now() - startTime.current;
    const currentProgress = Math.min(elapsed / duration, 1);
    setProgress(currentProgress);

    particles.current.forEach((particle, i) => {
      // Spiral downward movement (opposite of stealth mist)
      const angle = (i / particles.current.length) * Math.PI * 2 + currentProgress * Math.PI * 3;
      const radius = 1.5 * currentProgress; // Expand much more outward
      
      particle.position.x = Math.cos(angle) * radius;
      particle.position.z = Math.sin(angle) * radius;
      particle.position.y = Math.max(particle.position.y - 0.015, 0.1); // Sink slower, don't go below ground

      // Fade out more gradually
      const material = particle.material as THREE.MeshStandardMaterial;
      material.opacity = 0.9 * (1 - currentProgress * 0.8); // Stay visible longer
      
      // Scale up more dramatically as they disperse
      const scale = 1 + currentProgress * 0.8;
      particle.scale.setScalar(scale);
    });

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

  return (
    <group position={[position.x, position.y, position.z]}>
      {particles.current.map((particle, i) => (
        <primitive key={i} object={particle} />
      ))}
      
      {/* Add central bright light for dramatic effect */}
      <pointLight 
        color="#FF4500"
        intensity={3.0}
        distance={6}
        decay={1.5}
      />
      
      {/* Ground effect circle - larger and more visible */}
      <mesh position={[0, 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[2.5, 24]} />
        <meshBasicMaterial 
          color="#8B0000"
          transparent 
          opacity={0.8 * (1 - progress * 0.7)}
        />
      </mesh>
      
      {/* Additional pulsing ring effect */}
      <mesh position={[0, 0.15, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.0, 2.0, 16]} />
        <meshBasicMaterial 
          color="#FF4500"
          transparent 
          opacity={0.6 * (1 - progress) * Math.sin(progress * Math.PI * 4)}
        />
      </mesh>
    </group>
  );
}
