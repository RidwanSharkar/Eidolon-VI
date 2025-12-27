import { useRef, useMemo } from 'react';
import { Group, Vector3 } from 'three';
import { AdditiveBlending, Mesh, MeshStandardMaterial, SphereGeometry } from 'three';
import { useFrame } from '@react-three/fiber';

// MEMORY FIX: Static shared geometries - no Math.random() in args
const VENOM_GEOMETRIES = {
  cloud: new SphereGeometry(0.4, 16, 16),
  core: new SphereGeometry(0.2, 12, 12),
  tendril: new SphereGeometry(0.15, 8, 8),    // Average size for tendrils
  tendrilLarge: new SphereGeometry(0.2, 8, 8),
  particle: new SphereGeometry(0.05, 6, 6),   // Average size for particles
  particleLarge: new SphereGeometry(0.07, 6, 6),
};

interface VenomEffectProps {
  position: Vector3;
  onComplete: () => void;
}

export default function VenomEffect({ position, onComplete }: VenomEffectProps) {
  const groupRef = useRef<Group>(null);
  const startTime = useRef(Date.now());
  const duration = 1000; // ms - lasts longer than the eagle eye effect
  
  useFrame(() => {
    if (!groupRef.current) return;
    
    const elapsed = Date.now() - startTime.current;
    const progress = Math.min(elapsed / duration, 1);
    
    // Scale effect and fade out
    const scale = 1 + progress * 1.5;
    groupRef.current.scale.set(scale, scale, scale);
    
    // Apply opacity
    groupRef.current.children.forEach(child => {
      if (child instanceof Mesh) {
        const material = child.material as MeshStandardMaterial;
        if (material.opacity) {
          material.opacity = 1 - progress;
        }
      }
    });
    
    // Remove when complete
    if (progress >= 1) {
      onComplete();
    }
  });
  
  // Randomize rotation for variety
  const randomRotation = useRef(Math.random() * Math.PI * 2);
  
  // MEMORY FIX: Pre-calculate positions once per component mount using useMemo
  const tendrilPositions = useMemo(() => 
    [...Array(6)].map((_, i) => {
      const angle = (i / 6) * Math.PI * 2;
      const radiusX = 0.3 + (i * 0.03);  // Deterministic variation
      const radiusZ = 0.3 + ((i + 2) * 0.025);
      return {
        x: Math.cos(angle) * radiusX,
        y: (i * 0.1) - 0.25,
        z: Math.sin(angle) * radiusZ,
        useLarge: i % 2 === 0
      };
    }), []
  );

  const particlePositions = useMemo(() => 
    [...Array(10)].map((_, i) => {
      const angle = (i / 10) * Math.PI * 2;
      const radius = 0.15 + (i * 0.035);
      return {
        x: Math.cos(angle) * radius,
        y: (i * 0.04) - 0.2,
        z: Math.sin(angle) * radius,
        useLarge: i % 3 === 0
      };
    }), []
  );

  return (
    <group 
      ref={groupRef} 
      position={[position.x, position.y + 1, position.z]}
      rotation={[0, randomRotation.current, 0]}
    >
      {/* Main venom cloud - FIXED: Use shared geometry */}
      <mesh>
        <primitive object={VENOM_GEOMETRIES.cloud} />
        <meshStandardMaterial 
          color="#00FF44"
          emissive="#00FF44"
          emissiveIntensity={1.5}
          transparent
          opacity={0.8}
          depthWrite={false}
          blending={AdditiveBlending}
        />
      </mesh>
      
      {/* Inner toxic core - FIXED: Use shared geometry */}
      <mesh>
        <primitive object={VENOM_GEOMETRIES.core} />
        <meshStandardMaterial 
          color="#33FF33"
          emissive="#33FF33"
          emissiveIntensity={2}
          transparent
          opacity={0.9}
          depthWrite={false}
          blending={AdditiveBlending}
        />
      </mesh>
      
      {/* Toxic tendrils - FIXED: Use shared geometries with deterministic positions */}
      {tendrilPositions.map((pos, i) => (
        <mesh 
          key={i}
          position={[pos.x, pos.y, pos.z]}
        >
          <primitive object={pos.useLarge ? VENOM_GEOMETRIES.tendrilLarge : VENOM_GEOMETRIES.tendril} />
          <meshStandardMaterial 
            color="#00BB33"
            emissive="#00BB33"
            emissiveIntensity={1.5}
            transparent
            opacity={0.7}
            depthWrite={false}
            blending={AdditiveBlending}
          />
        </mesh>
      ))}
      
      {/* Toxic particles - FIXED: Use shared geometries with deterministic positions */}
      {particlePositions.map((pos, i) => (
        <mesh 
          key={`particle-${i}`}
          position={[pos.x, pos.y, pos.z]}
        >
          <primitive object={pos.useLarge ? VENOM_GEOMETRIES.particleLarge : VENOM_GEOMETRIES.particle} />
          <meshStandardMaterial 
            color={i % 2 === 0 ? "#00FF44" : "#55FF00"}
            emissive={i % 2 === 0 ? "#00FF44" : "#55FF00"}
            emissiveIntensity={2}
            transparent
            opacity={0.8}
            depthWrite={false}
            blending={AdditiveBlending}
          />
        </mesh>
      ))}
      
      {/* Venom glow light */}
      <pointLight color="#00FF44" intensity={1.5} distance={3} decay={2} />
    </group>
  );
} 