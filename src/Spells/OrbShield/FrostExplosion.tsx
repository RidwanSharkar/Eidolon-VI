import { useFrame } from '@react-three/fiber';
import { Vector3 } from 'three';
import * as THREE from 'three';
import { useState } from 'react';

interface FrostExplosionProps {
  position: Vector3;
  onComplete?: () => void;
}

export const FrostExplosion: React.FC<FrostExplosionProps> = ({ position, onComplete }) => {
  const [particles, setParticles] = useState(() => 
    Array(15).fill(null).map(() => ({
      position: new Vector3(
        position.x + (Math.random() - 0.5) * 0.2,
        position.y,
        position.z + (Math.random() - 0.5) * 0.2
      ),
      velocity: new Vector3(
        (Math.random() - 0.5) * 2,
        Math.random() * 3,
        (Math.random() - 0.5) * 2
      ),
      scale: Math.random() * 0.3 + 0.1,
      life: 1.0
    }))
  );

  useFrame((_, delta) => {
    setParticles(prev => {
      const updated = prev.map(particle => ({
        ...particle,
        velocity: particle.velocity.clone().add(new Vector3(0, -delta * 5, 0)),
        position: particle.position.clone().add(particle.velocity.clone().multiplyScalar(delta)),
        life: particle.life - delta * 1.5
      })).filter(particle => particle.life > 0);
      
      if (updated.length === 0) {
        onComplete?.();
      }
      return updated;
    });
  });

  return (
    <group>
      {particles.map((particle, i) => (
        <mesh key={i} position={particle.position.toArray()} scale={[particle.scale, particle.scale, particle.scale]}>
          <icosahedronGeometry args={[1, 0]} />
          <meshStandardMaterial
            color="#A5F3FC"
            emissive="#A5F3FC"
            emissiveIntensity={1.5}
            transparent
            opacity={particle.life * 0.7}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      ))}
    </group>
  );
};
