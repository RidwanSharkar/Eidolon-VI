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
    Array(50).fill(null).map(() => ({
      position: new Vector3(
        position.x + (Math.random() - 0.5) * 2,
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
    }))
  );

  useFrame((_, delta) => {
    setParticles(prev => {
      const updated = prev.map(particle => ({
        ...particle,
        velocity: particle.velocity.clone().add(new Vector3(0, -delta * 8, 0)),
        position: particle.position.clone().add(particle.velocity.clone().multiplyScalar(delta)),
        rotation: particle.rotation + particle.rotationSpeed * delta,
        life: particle.life - delta
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
