import { useFrame } from '@react-three/fiber';
import { Vector3 } from 'three';
import * as THREE from 'three';
import { useState, useEffect } from 'react';

interface FrostExplosionProps {
  position: Vector3;
  onComplete?: () => void;
}

export const FrostExplosion: React.FC<FrostExplosionProps> = ({ position, onComplete }) => {
  const [particles, setParticles] = useState(() => 
    Array(50).fill(null).map(() => ({
      position: new Vector3(
        position.x + (Math.random() - 0.5) * 2,
        position.y + Math.random() * 1,
        position.z + (Math.random() - 0.5) * 2
      ),
      velocity: new Vector3(
        (Math.random() - 0.5) * 3,
        -Math.random() * 3 - 2,
        (Math.random() - 0.5) * 3
      ),
      scale: Math.random() * 0.1 + 0.02,
      rotation: Math.random() * Math.PI,
      rotationSpeed: (Math.random() - 0.5) * 5,
      life: 1.0,
      spiralRadius: Math.random() * 0.5 + 0.5,
      spiralSpeed: (Math.random() * 2 + 2) * (Math.random() < 0.5 ? 1 : -1),
      spiralPhase: Math.random() * Math.PI * 2
    }))
  );

  const startTime = useState(() => Date.now())[0];

  useFrame((_, delta) => {
    const currentTime = Date.now();
    const elapsedTime = (currentTime - startTime) / 1000;

    if (elapsedTime >= 0.5) {
      setParticles([]);
      onComplete?.();
      return;
    }

    setParticles(prev => {
      const updated = prev.map(particle => {
        const spiralAngle = particle.spiralPhase + elapsedTime * particle.spiralSpeed;
        const spiralX = Math.cos(spiralAngle) * particle.spiralRadius * (1 - elapsedTime * 1.5);
        const spiralZ = Math.sin(spiralAngle) * particle.spiralRadius * (1 - elapsedTime * 1.5);

        const newPosition = particle.position.clone()
          .add(particle.velocity.clone().multiplyScalar(delta))
          .add(new Vector3(
            spiralX - particle.position.x,
            0,
            spiralZ - particle.position.z
          ).multiplyScalar(delta * 3));

        return {
          ...particle,
          velocity: particle.velocity.clone().add(new Vector3(0, -delta * 8, 0)),
          position: newPosition,
          rotation: particle.rotation + particle.rotationSpeed * delta,
          life: particle.life - delta * 2,
          spiralPhase: spiralAngle
        };
      }).filter(particle => particle.life > 0);
      
      if (updated.length === 0) {
        onComplete?.();
      }
      return updated;
    });
  });

  useEffect(() => {
    const timeout = setTimeout(() => {
      setParticles([]);
      onComplete?.();
    }, 500);

    return () => {
      clearTimeout(timeout);
      onComplete?.();
    };
  }, [onComplete]);

  return (
    <group>
      {particles.map((particle, i) => (
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
            opacity={particle.life * 0.5}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      ))}
    </group>
  );
};
