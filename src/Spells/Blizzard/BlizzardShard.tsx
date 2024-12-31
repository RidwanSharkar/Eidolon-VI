// src/Spells/Blizzard/BlizzardShard.tsx
import { useRef } from 'react';
import { Mesh, Vector3 } from 'three';
import { useFrame } from '@react-three/fiber';

interface BlizzardShardProps {
  initialPosition: Vector3;
  onComplete: () => void;
  type: 'orbital' | 'falling';
}

export default function BlizzardShard({ initialPosition, onComplete, type }: BlizzardShardProps) {
  const SHARD_SIZE = 0.075;
  const meshRef = useRef<Mesh>(null);
  const fallSpeed = useRef(Math.random() * 2 + 4);
  const rotationSpeed = useRef({
    x: Math.random() * 1.5,
    y: Math.random() * 0.25,
    z: Math.random() * 1
  });
  const orbitRadius = useRef(initialPosition.length());
  const orbitAngle = useRef(Math.atan2(initialPosition.z, initialPosition.x));

  useFrame((_, delta) => {
    if (!meshRef.current) return;

    if (type === 'falling') {
      meshRef.current.position.y -= fallSpeed.current * delta;
      
      if (meshRef.current.position.y < 0) {
        onComplete();
      }
    } else {
      // Orbital movement
      orbitAngle.current += delta;
      meshRef.current.position.x = Math.cos(orbitAngle.current) * orbitRadius.current;
      meshRef.current.position.z = Math.sin(orbitAngle.current) * orbitRadius.current;
      
      // Remove after a few rotations
      if (orbitAngle.current > Math.PI * 8) {
        onComplete();
      }
    }

    // Common rotation for both types
    meshRef.current.rotation.x += rotationSpeed.current.x;
    meshRef.current.rotation.y += rotationSpeed.current.y;
    meshRef.current.rotation.z += rotationSpeed.current.z;
  });

  return (
    <mesh ref={meshRef} position={initialPosition}>
      <tetrahedronGeometry args={[SHARD_SIZE]} />
      <meshStandardMaterial
        color="#80ffff"
        emissive="#40a0ff"
        emissiveIntensity={1}
        transparent
        opacity={0.6}
      />
      <pointLight color="#80ffff" intensity={1} distance={2} decay={2} />
    </mesh>
  );
}