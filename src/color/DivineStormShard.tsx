// src/color/DivineStormShard.tsx
import { useRef } from 'react';
import { Mesh, Vector3 } from 'three';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Shared geometries for performance - match firestorm sizes
export const divineStormGeometries = {
  torus: new THREE.TorusGeometry(0.8, 0.075, 8, 32), // Match firestorm
  tetrahedron: new THREE.SphereGeometry(0.0525, 16, 16) // Match firestorm
};

// Bright yellow materials for divine theme
export const divineStormMaterials = {
  storm: new THREE.MeshStandardMaterial({
    color: new THREE.Color(0xFFD700), // Gold
    emissive: new THREE.Color(0xFFFF00), // Bright yellow
    emissiveIntensity: 1,
    transparent: true,
    opacity: 0.7,
    blending: THREE.AdditiveBlending
  }),
  shard: new THREE.MeshStandardMaterial({
    color: new THREE.Color(0xFFF8DC), // Cornsilk
    emissive: new THREE.Color(0xFFD700), // Gold
    emissiveIntensity: 1,
    transparent: true,
    opacity: 0.8,
    blending: THREE.AdditiveBlending
  })
};

interface DivineStormShardProps {
  initialPosition: Vector3;
  onComplete: () => void;
  type: 'orbital' | 'falling';
  centerPosition?: Vector3; // Center point for orbital motion
}

export default function DivineStormShard({ initialPosition, onComplete, type, centerPosition }: DivineStormShardProps) {
  const meshRef = useRef<Mesh>(null);
  const fallSpeed = useRef(Math.random() * -6 + 3.5); // Slightly slower than firestorm
  const rotationSpeed = useRef({
    x: Math.random() * 3,
    y: Math.random() * 0.4,
    z: Math.random() * 1.8
  });
  const center = centerPosition || new Vector3(0, 0, 0);
  const relativePos = initialPosition.clone().sub(center);
  const orbitRadius = useRef(Math.max(relativePos.length(), 1.5)); // Ensure minimum orbit radius
  const orbitAngle = useRef(Math.atan2(relativePos.z, relativePos.x));
  const startTime = useRef(Date.now());

  useFrame((_, delta) => {
    if (!meshRef.current) return;

    if (type === 'falling') {
      meshRef.current.position.y -= fallSpeed.current * delta;
      
      if (meshRef.current.position.y < 0) {
        onComplete();
        return;
      }
    } else if (type === 'orbital') {
      orbitAngle.current += delta * 12; // Match firestorm orbital speed
      
      const orbitX = center.x + Math.cos(orbitAngle.current) * orbitRadius.current;
      const orbitZ = center.z + Math.sin(orbitAngle.current) * orbitRadius.current;
      const orbitY = center.y + Math.sin(Date.now() * 0.008) * 0.02; // More vertical movement like firestorm
      
      meshRef.current.position.set(orbitX, orbitY, orbitZ);
      
      // Ensure at least 2 seconds duration OR 1.5 full rotations, whichever is longer
      const elapsed = (Date.now() - startTime.current) / 1000;
      if (elapsed >= 2.0 || orbitAngle.current > Math.PI * 3) { // At least 2 seconds or 1.5 rotations
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
      geometry={divineStormGeometries.tetrahedron}
      material={divineStormMaterials.shard}
    />
  );
}
