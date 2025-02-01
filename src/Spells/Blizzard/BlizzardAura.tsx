import { useRef } from 'react';
import { Mesh } from 'three';
import { useFrame } from '@react-three/fiber';
import { sharedGeometries, sharedMaterials } from './Blizzard';

interface BlizzardAuraProps {
  onComplete: () => void;
}

export default function BlizzardAura({ onComplete }: BlizzardAuraProps) {
  const meshRef = useRef<Mesh>(null);
  const timeAlive = useRef(0);
  const rotationSpeed = useRef({
    x: Math.random() * 0.2,
    y: Math.random() * 2,
    z: Math.random() * 0.3
  });

  useFrame((_, delta) => {
    if (!meshRef.current) return;

    timeAlive.current += delta;
    
    meshRef.current.rotation.x += rotationSpeed.current.x * delta;
    meshRef.current.rotation.y += rotationSpeed.current.y * delta;
    meshRef.current.rotation.z += rotationSpeed.current.z * delta;

    const pulse = Math.sin(timeAlive.current * 2) * 0.1 + 1;
    meshRef.current.scale.setScalar(pulse);

    if (timeAlive.current > 6) {
      onComplete();
    }
  });

  return (
    <mesh 
      ref={meshRef}
      geometry={sharedGeometries.torus}
      material={sharedMaterials.blizzard}
    />
  );
} 