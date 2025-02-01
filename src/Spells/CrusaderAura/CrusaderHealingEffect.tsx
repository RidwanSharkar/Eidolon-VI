import React, { useMemo, useRef } from 'react';
import { Vector3 } from 'three';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface CrusaderHealingEffectProps {
  position: Vector3;
  onComplete: () => void;
}

const CrusaderHealingEffect: React.FC<CrusaderHealingEffectProps> = ({ position, onComplete }) => {
  const timeRef = useRef(0);
  const duration = 1.5;

  // Cache geometries
  const geometries = useMemo(() => ({
    ring: new THREE.TorusGeometry(0.8, 0.05, 16, 32),
    sphere: new THREE.SphereGeometry(0.5, 32, 32),
    particle: new THREE.SphereGeometry(0.1, 8, 8)
  }), []);

  // Cache materials
  const materials = useMemo(() => ({
    ring: new THREE.MeshStandardMaterial({
      color: "#ffaa00",
      emissive: "#ff8800",
      emissiveIntensity: 2,
      transparent: true
    }),
    glow: new THREE.MeshStandardMaterial({
      color: "#ffaa00",
      emissive: "#ff8800",
      emissiveIntensity: 3,
      transparent: true
    }),
    particle: new THREE.MeshStandardMaterial({
      color: "#ffaa00",
      emissive: "#ff8800",
      emissiveIntensity: 2,
      transparent: true
    })
  }), []);

  // Pre-calculate particle positions
  const particleAngles = useMemo(() => 
    Array(12).fill(0).map((_, i) => (i / 12) * Math.PI * 2),
  []);

  useFrame((_, delta) => {
    timeRef.current += delta;
    if (timeRef.current >= duration) {
      onComplete();
      return;
    }

    const progress = timeRef.current / duration;
    const opacity = Math.sin(progress * Math.PI);

    // Update material opacities
    materials.ring.opacity = opacity;
    materials.glow.opacity = opacity * 0.3;
    materials.particle.opacity = opacity * 0.8;
  });

  const progress = timeRef.current / duration;
  const scale = 1 + progress * 2;

  return (
    <group position={position.toArray()}>
      {/* Rising healing rings */}
      {[0, 1, 2].map((i) => (
        <mesh
          key={`ring-${i}`}
          position={[0, progress * 2 + i * 0.5, 0]}
          rotation={[Math.PI / 2, 0, timeRef.current * 2]}
          geometry={geometries.ring}
          material={materials.ring}
          scale={[1 - i * 0.2, 1 - i * 0.2, 1]}
        />
      ))}

      {/* Central healing glow */}
      <mesh
        geometry={geometries.sphere}
        material={materials.glow}
        scale={[scale, scale, scale]}
      />

      {/* Healing particles */}
      {particleAngles.map((angle, i) => {
        const radius = 1 + progress;
        const yOffset = progress * 2;
        
        return (
          <mesh
            key={`particle-${i}`}
            position={[
              Math.cos(angle + timeRef.current * 2) * radius,
              yOffset + Math.sin(timeRef.current * 3 + i) * 0.5,
              Math.sin(angle + timeRef.current * 2) * radius
            ]}
            geometry={geometries.particle}
            material={materials.particle}
          />
        );
      })}

      <pointLight
        color="#ff8800"
        intensity={4 * Math.sin(progress * Math.PI)}
        distance={5}
        decay={2}
      />
    </group>
  );
};

export default CrusaderHealingEffect;
