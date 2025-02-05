import { useFrame } from '@react-three/fiber';
import { Vector3 } from 'three';
import * as THREE from 'three';
import { useState, useRef, useEffect, useCallback } from 'react';

interface FrostExplosionProps {
  position: Vector3;
  onComplete?: () => void;
}

export const FrostExplosion: React.FC<FrostExplosionProps> = ({ position, onComplete }) => {
  const startTime = useRef(Date.now());
  const hasCompletedRef = useRef(false);
  const particlesRef = useRef<Array<{
    position: Vector3;
    velocity: Vector3;
    scale: number;
    rotation: number;
    rotationSpeed: number;
    life: number;
  }>>([]);
  
  const MINIMUM_DURATION = 1250;
  const MAXIMUM_DURATION = 2850;

  // Initialize particles only once
  useEffect(() => {
    particlesRef.current = Array(40).fill(null).map(() => ({
      position: new Vector3(
        position.x + (Math.random() - 0.5) * 1.65,
        position.y + 3 + Math.random() * 2,
        position.z + (Math.random() - 0.5) * 2
      ),
      velocity: new Vector3(
        (Math.random() - 0.5) * 3,
        -Math.random() * 5 - 3,
        (Math.random() - 0.5) * 3
      ),
      scale: Math.random() * 0.1 + 0.02,
      rotation: Math.random() * Math.PI,
      rotationSpeed: (Math.random() - 0.5) * 5,
      life: 1.0
    }));
  }, [position]);

  const cleanupEffect = useCallback(() => {
    if (!hasCompletedRef.current) {
      hasCompletedRef.current = true;
      onComplete?.();
    }
  }, [onComplete]);

  useEffect(() => {
    const forceCleanupTimer = setTimeout(cleanupEffect, MAXIMUM_DURATION);
    return () => {
      clearTimeout(forceCleanupTimer);
      // Don't automatically cleanup on unmount
    };
  }, [cleanupEffect]);

  const [renderParticles, setRenderParticles] = useState<typeof particlesRef.current>([]);

  useFrame((_, delta) => {
    if (hasCompletedRef.current) return;

    const updatedParticles = particlesRef.current
      .map(particle => ({
        ...particle,
        velocity: particle.velocity.clone().add(new Vector3(0, -delta * 8, 0)),
        position: particle.position.clone().add(particle.velocity.clone().multiplyScalar(delta)),
        rotation: particle.rotation + particle.rotationSpeed * delta,
        life: particle.life - delta
      }))
      .filter(particle => particle.life > 0);

    particlesRef.current = updatedParticles;
    setRenderParticles(updatedParticles);

    const timeSinceStart = Date.now() - startTime.current;
    if (updatedParticles.length === 0 && timeSinceStart >= MINIMUM_DURATION) {
      cleanupEffect();
    }
  });

  return (
    <group>
      {renderParticles.map((particle, i) => (
        <mesh 
          key={i} 
          position={particle.position.toArray()} 
          scale={[particle.scale, particle.scale, particle.scale]}
          rotation={[particle.rotation, particle.rotation, particle.rotation]}
        >
          <icosahedronGeometry args={[1, 0]} />
          <meshStandardMaterial
            color="#E5F7FF"
            emissive="#E5F7FF"
            emissiveIntensity={1}
            transparent
            opacity={particle.life * 0.45}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      ))}
    </group>
  );
};
