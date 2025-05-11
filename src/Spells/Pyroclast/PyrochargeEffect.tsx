// src/Spells/Pyroclast/PyrochargeEffect.tsx
import { useRef, useState, useEffect } from 'react';
import { Group } from 'three';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface PyrochargeEffectProps {
  parentRef: React.RefObject<Group>;
  isActive: boolean;
  chargeProgress: number;
}

export default function PyrochargeEffect({ 
  parentRef, 
  isActive, 
  chargeProgress 
}: PyrochargeEffectProps) {
  const flameParticlesRef = useRef<THREE.Group>(null);
  const lastUpdateTime = useRef(0);
  // Add state to track if we should show the effect (with a short delay)
  const [shouldShowEffect, setShouldShowEffect] = useState(false);
  
  // Add effect to handle the activation delay
  useEffect(() => {
    if (isActive) {
      // Add a small delay before showing the effect to prevent flickering
      const timer = setTimeout(() => {
        setShouldShowEffect(true);
      }, 100); // 100ms delay
      
      return () => {
        clearTimeout(timer);
      };
    } else {
      setShouldShowEffect(false);
    }
  }, [isActive]);

  useFrame(() => {
    if (!shouldShowEffect || !parentRef.current || !flameParticlesRef.current) return;

    // Position the effect at the player's position
    flameParticlesRef.current.position.copy(parentRef.current.position);
    flameParticlesRef.current.position.y += -0.5; // Position slightly above the ground

    // Rotate particles randomly for more dynamic effect
    const now = Date.now();
    if (now - lastUpdateTime.current > 50) { // Update rotation every 50ms
      // Rotate the flame particles for effect
      Array.from(flameParticlesRef.current.children).forEach((child) => {
        const mesh = child as THREE.Mesh;
        mesh.rotation.y += (Math.random() * 0.2 - 0.1);
        mesh.rotation.x += (Math.random() * 0.1 - 0.05);
        
        // Scale based on charge progress
        const baseScale = 0.1 + (chargeProgress * 0.7); // Scale from 0.3 to 1.0
        const randomScale = baseScale * (0.8 + Math.random() * 0.4); // Add some randomness
        mesh.scale.set(randomScale, randomScale, randomScale);

        // Adjust opacity based on charge progress
        if (mesh.material instanceof THREE.Material) {
          const material = mesh.material as THREE.MeshStandardMaterial;
          material.opacity = 0.6 + (chargeProgress * 0.4);
          material.emissiveIntensity = 1 + (chargeProgress * 4);
        }
      });
      lastUpdateTime.current = now;
    }
  });

  // Don't render anything if we shouldn't show the effect yet
  if (!shouldShowEffect) return null;

  // Generate random particles around the player
  const particleCount = 12;
  const particles = [];

  for (let i = 0; i < particleCount; i++) {
    const angle = (i / particleCount) * Math.PI * 2;
    const radius = 0.8 + (Math.random() * 0.3);
    const offsetX = Math.sin(angle) * radius;
    const offsetZ = Math.cos(angle) * radius;
    const height = (Math.random() * 0.6) + 0.2;

    particles.push(
      <mesh 
        key={i} 
        position={[offsetX, height, offsetZ]}
        rotation={[0, Math.random() * Math.PI * 2, 0]}
      >
        <dodecahedronGeometry args={[0.2, 0]} />
        <meshStandardMaterial
          color={i % 3 === 0 ? "#FF8800" : (i % 3 === 1 ? "#FF4400" : "#FF2200")}
          emissive={i % 3 === 0 ? "#FF8800" : (i % 3 === 1 ? "#FF4400" : "#FF2200")}
          emissiveIntensity={1 + (chargeProgress * 4)}
          transparent
          opacity={0.6 + (chargeProgress * 0.4)}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    );
  }

  // Add ground ring effect 
  const groundRingRadius = 0.8 + (chargeProgress * 1.375);
  
  return (
    <group ref={flameParticlesRef}>
      {/* Flame particles */}
      {particles}
      
      {/* Ground fire ring */}
      <mesh position={[0, 0.5, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[groundRingRadius - 0.2, groundRingRadius, 32]} />
        <meshStandardMaterial
          color="#FF3000"
          emissive="#FF6000"
          emissiveIntensity={2 + (chargeProgress * 4)}
          transparent
          opacity={0.3 + (chargeProgress * 0.6)}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>
      
      {/* Center fire pillar */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.2, 0.5, 2 * chargeProgress, 8]} />
        <meshStandardMaterial
          color="#FF4000"
          emissive="#FF6000"
          emissiveIntensity={3 + (chargeProgress * 3)}
          transparent
          opacity={0.5 + (chargeProgress * 0.4)}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      
      {/* Light source */}
      <pointLight
        color="#FF6000"
        intensity={2 + (chargeProgress * 6)}
        distance={4 + (chargeProgress * 4)}
        decay={2}
      />
    </group>
  );
}