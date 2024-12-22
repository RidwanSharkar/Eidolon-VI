import { useRef } from 'react';
import { Group, Vector3 } from 'three';
import { useFrame } from '@react-three/fiber';

interface RetributeProps {
  position: Vector3;
  onComplete: () => void;
  parentRef: React.RefObject<Group>;
  onHeal: (amount: number, isHealing: boolean) => void;
}

export default function Retribute({ onComplete, parentRef,  }: RetributeProps) {
  const effectRef = useRef<Group>(null);
  const progressRef = useRef(0);
  const duration = 5.0; // 5 seconds duration

  useFrame((_, delta) => {
    if (!effectRef.current || !parentRef.current) return;

    // Update position to follow parent
    effectRef.current.position.copy(parentRef.current.position);

    progressRef.current += delta;
    if (progressRef.current >= duration) {
      onComplete();
      return;
    }

    // Pulsing scale effect
    const baseScale = 2;
    const pulseScale = Math.sin(progressRef.current * 2) * -0.05 + 1;
    effectRef.current.scale.setScalar(baseScale * pulseScale);
  });

  return (
    <group ref={effectRef}>
      {/* Main bubble sphere */}
      <mesh>
        <sphereGeometry args={[-1, 32, 32]} />
        <meshStandardMaterial
          color="#ffff00"
          emissive="#ffff00"
          emissiveIntensity={1.5}
          transparent
          opacity={0.2}
        />
      </mesh>

      {/* Inner glow sphere */}
      <mesh>
        <sphereGeometry args={[0.9, 32, 32]} />
        <meshStandardMaterial
          color="#ffffff"
          emissive="#ffff00"
          emissiveIntensity={2}
          transparent
          opacity={0.1}
        />
      </mesh>

      {/* Outer particle effect */}
      {Array.from({ length: 8 }).map((_, i) => (
        <mesh
          key={i}
          position={[
            Math.sin(i * Math.PI * 0.25) * 1.2,
            Math.cos(i * Math.PI * 0.25) * 1.2,
            0
          ]}
        >
          <sphereGeometry args={[0.07, 16, 16]} />
          <meshStandardMaterial
            color="#ffff00"
            emissive="#ffff00"
            emissiveIntensity={2}
            transparent
            opacity={0.6}
          />
        </mesh>
      ))}

      {/* Point light for glow effect */}
      <pointLight
        color="#ffff00"
        intensity={2}
        distance={5}
        decay={2}
      />
    </group>
  );
} 