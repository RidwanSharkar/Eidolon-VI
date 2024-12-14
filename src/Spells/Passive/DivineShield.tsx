import { useRef, useState, useEffect } from 'react';
import { Group } from 'three';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface DivineShieldProps {
  parentRef: React.RefObject<Group>;
  onShieldStateChange: (isActive: boolean) => void;
}

const SHIELD_CYCLE = 10; // Total cycle time in seconds
const SHIELD_DURATION = 5; // Active shield duration in seconds

export default function DivineShield({ parentRef, onShieldStateChange }: DivineShieldProps) {
  const shieldRef = useRef<Group>(null);
  const [isActive, setIsActive] = useState(false);
  const timeRef = useRef(0);

  useEffect(() => {
    // Initial shield state
    setIsActive(true);
  }, []);

  useFrame((_, delta) => {
    if (!shieldRef.current || !parentRef.current) return;

    // Update cycle timer
    timeRef.current += delta;
    if (timeRef.current >= SHIELD_CYCLE) {
      timeRef.current = 0;
      setIsActive(true);
      onShieldStateChange(true);
    } else if (timeRef.current >= SHIELD_DURATION && isActive) {
      setIsActive(false);
      onShieldStateChange(false);
    }

    // Update position to follow parent
    shieldRef.current.position.copy(parentRef.current.position);
    shieldRef.current.position.y += 1; // Adjust height to center on character

    // Rotate shield effect
    if (isActive) {
      shieldRef.current.rotation.y += delta;
    }
  });

  return (
    <group ref={shieldRef} visible={isActive}>
      {/* Main shield sphere */}
      <mesh>
        <sphereGeometry args={[2, 32, 32]} />
        <meshStandardMaterial
          color="#ff6600"
          transparent
          opacity={0.2}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Shield rings */}
      {[...Array(3)].map((_, i) => (
        <mesh key={i} rotation={[Math.PI / 2, 0, i * Math.PI / 3]}>
          <torusGeometry args={[2, 0.05, 16, 100]} />
          <meshStandardMaterial
            color="#ff6600"
            emissive="#ff4400"
            emissiveIntensity={2}
            transparent
            opacity={0.7}
          />
        </mesh>
      ))}

      {/* Particle effects */}
      {[...Array(8)].map((_, i) => (
        <mesh
          key={`particle-${i}`}
          position={[
            Math.cos((i / 8) * Math.PI * 2) * 2,
            Math.sin((i / 8) * Math.PI * 2) * 2,
            0
          ]}
        >
          <sphereGeometry args={[0.1, 8, 8]} />
          <meshStandardMaterial
            color="#ff6600"
            emissive="#ff4400"
            emissiveIntensity={3}
            transparent
            opacity={0.6}
          />
        </mesh>
      ))}

      {/* Shield glow */}
      <pointLight
        color="#ff6600"
        intensity={2}
        distance={4}
        decay={2}
      />
    </group>
  );
} 