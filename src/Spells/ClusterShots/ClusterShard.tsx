import { useRef } from 'react';
import { Vector3 } from 'three';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Shared geometries and materials for better performance
export const sharedGeometries = {
  tetrahedron: new THREE.TetrahedronGeometry(0.0725)
};

export const sharedMaterials = {
  shard: new THREE.MeshStandardMaterial({
    color: "#80ff80",  // More green tint for cluster shots
    emissive: "#40ff40",
    emissiveIntensity: 1,
    transparent: true,
    opacity: 0.7
  })
};

interface ClusterShardProps {
  position: Vector3;
  direction: Vector3;
}

export function ClusterShard({ position, direction }: ClusterShardProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const startTime = useRef(Date.now());
  const speed = 0.5;

  useFrame(() => {
    if (!meshRef.current) return;

    // Update position based on direction and speed
    meshRef.current.position.add(direction.clone().multiplyScalar(speed));
    
    // Rotate the shard for visual effect
    meshRef.current.rotation.x += 0.1;
    meshRef.current.rotation.y += 0.15;
    meshRef.current.rotation.z += 0.12;

    // Add some wobble to the movement
    const elapsed = (Date.now() - startTime.current) / 1000;
    const wobble = Math.sin(elapsed * 10) * 0.02;
    meshRef.current.position.y += wobble;

    // Trail effect
    if (Math.random() < 0.3) {
      // You could add particle effects here if you have a particle system
    }
  });

  return (
    <group position={position.toArray()}>
      <mesh ref={meshRef} geometry={sharedGeometries.tetrahedron} material={sharedMaterials.shard}>
        <pointLight color="#40ff40" intensity={0.5} distance={2} decay={2} />
      </mesh>
    </group>
  );
} 