// src/Spells/Stealth/StealthMistEffect.tsx
import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Mesh, AdditiveBlending } from 'three';
import { Group } from 'three';
import * as THREE from 'three';

interface StealthMistEffectProps {
  parentRef: React.RefObject<Group>;
}

export default function StealthMistEffect({ parentRef }: StealthMistEffectProps) {
  const particles = useRef<Mesh[]>([]);
  const startTime = useRef(Date.now());
  const duration = 1000; // 1 second animation

  useEffect(() => {
    // Initialize 20 particle meshes
    particles.current = Array(20).fill(null).map(() => {
      const mesh = new Mesh(
        new THREE.SphereGeometry(0.15, 8, 8),
        new THREE.MeshStandardMaterial({
          color: '#a8e6cf',
          emissive: '#a8e6cf',
          transparent: true,
          opacity: 0.6,
          blending: AdditiveBlending,
          depthWrite: false
        })
      );
      
      // Random initial positions in a circle around the unit
      const angle = Math.random() * Math.PI * 2;
      const radius = 0.5 + Math.random() * 0.5;
      mesh.position.set(
        Math.cos(angle) * radius,
        0.5 + Math.random() * 1,
        Math.sin(angle) * radius
      );
      
      return mesh;
    });

    return () => {
      particles.current.forEach(particle => {
        particle.geometry.dispose();
        (particle.material as THREE.Material).dispose();
      });
    };
  }, []);

  useFrame(() => {
    if (!parentRef.current) return;

    const elapsed = Date.now() - startTime.current;
    const progress = Math.min(elapsed / duration, 1);

    particles.current.forEach((particle, i) => {
      // Spiral upward movement
      const angle = (i / particles.current.length) * Math.PI * 2 + progress * Math.PI;
      const radius = 0.5 * (1 - progress);
      
      particle.position.x = Math.cos(angle) * radius;
      particle.position.z = Math.sin(angle) * radius;
      particle.position.y += 0.03;

      // Fade out
      const material = particle.material as THREE.MeshStandardMaterial;
      material.opacity = 0.6 * (1 - progress);
      
      // Scale down
      const scale = 1 - progress * 0.5;
      particle.scale.setScalar(scale);
    });
  });

  return (
    <group>
      {particles.current.map((particle, i) => (
        <primitive key={i} object={particle} />
      ))}
      
      {/* Add central light for glow effect */}
      <pointLight 
        color="#a8e6cf"
        intensity={2}
        distance={3}
        decay={2}
      />
    </group>
  );
}