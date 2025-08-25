// src/Spells/Firestorm/FirestormShard.tsx
import { useRef } from 'react';
import { Mesh, Vector3 } from 'three';
import { useFrame } from '@react-three/fiber';
import { sharedGeometries, sharedMaterials } from '@/Spells/Firestorm/Firestorm';

interface FirestormShardProps {
  initialPosition: Vector3;
  onComplete: () => void;
  type: 'orbital' | 'falling';
}

export default function FirestormShard({ initialPosition, onComplete, type }: FirestormShardProps) {
  const meshRef = useRef<Mesh>(null);
  const fallSpeed = useRef(Math.random() * 2.5 + 4.5); // Faster falling for more intensity
  const rotationSpeed = useRef({
    x: Math.random() * 3.5, // Faster rotation
    y: Math.random() * 0.5,
    z: Math.random() * 2
  });
  const orbitRadius = useRef(Math.min(initialPosition.length(), 4.1));
  const orbitAngle = useRef(Math.atan2(initialPosition.z, initialPosition.x));

  useFrame((_, delta) => {
    if (!meshRef.current) return;

    if (type === 'falling') {
      meshRef.current.position.y -= fallSpeed.current * delta;
      
      if (meshRef.current.position.y < 0) {
        onComplete();
        return;
      }
    } else if (type === 'orbital') {
      orbitAngle.current += delta * 2.5; // Faster orbital motion
      
      const orbitX = Math.cos(orbitAngle.current) * orbitRadius.current;
      const orbitZ = Math.sin(orbitAngle.current) * orbitRadius.current;
      
      meshRef.current.position.x = orbitX;
      meshRef.current.position.z = orbitZ;
      
      meshRef.current.position.y += Math.sin(Date.now() * 0.008) * 0.02; // More vertical movement
      
      if (orbitAngle.current > Math.PI * 3) { // Complete faster for more particle turnover
        onComplete();
        return;
      }
    }

    meshRef.current.rotation.x += rotationSpeed.current.x * delta;
    meshRef.current.rotation.y += rotationSpeed.current.y * delta;
    meshRef.current.rotation.z += rotationSpeed.current.z * delta;
  });

  return (
    <mesh 
      ref={meshRef}
      position={initialPosition}
      geometry={sharedGeometries.tetrahedron}
      material={sharedMaterials.shard}
    />
  );
}