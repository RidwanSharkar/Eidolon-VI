import { useRef } from 'react';
import { Group } from 'three';
import { useFrame } from '@react-three/fiber';

interface UnholyAuraProps {
  parentRef: React.RefObject<Group>;
}

export default function UnholyAura({ parentRef }: UnholyAuraProps) {
  const auraRef = useRef<Group>(null);
  const rotationSpeed = 0.12;

  useFrame(() => {
    if (auraRef.current && parentRef.current) {
      const parentPosition = parentRef.current.position;
      auraRef.current.position.set(parentPosition.x, 0.015, parentPosition.z);
      auraRef.current.rotation.y += rotationSpeed * 0.008;
    }
  });

  return (
    <group ref={auraRef} scale={1.45}>
      {/* Outer corrupted circle */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <ringGeometry args={[2.4, 2.8, 128, 1]} />
        <meshStandardMaterial
          color="#00ff88"
          emissive="#00ff88"
          emissiveIntensity={1.5}
          transparent
          opacity={0.3}
          depthWrite={false}
        />
      </mesh>

      {/* Spinning rune marks */}
      <group position={[0, 0.02, 0]}>
        {[...Array(8)].map((_, i) => (
          <mesh
            key={i}
            rotation={[-Math.PI / 2, 0, (i / 8) * Math.PI * 2 + Date.now() * 0.001]}
            position={[0, 0, 0]}
          >
            <planeGeometry args={[0.4, 2.6]} />
            <meshStandardMaterial
              color="#00ff88"
              emissive="#00ff88"
              emissiveIntensity={2}
              transparent
              opacity={0.4 + Math.sin(Date.now() * 0.003 + i) * 0.2}
              depthWrite={false}
            />
          </mesh>
        ))}
      </group>

      {/* Inner pulsing sigils */}
      <group position={[0, 0.03, 0]}>
        {[...Array(5)].map((_, i) => {
          const angle = (i / 5) * Math.PI * 2;
          const radius = 1.2;
          return (
            <mesh
              key={i}
              position={[
                Math.cos(angle + Date.now() * 0.001) * radius,
                0,
                Math.sin(angle + Date.now() * 0.001) * radius
              ]}
              rotation={[-Math.PI / 2, 0, angle + Math.PI / 2]}
            >
              <planeGeometry args={[0.6, 0.6]} />
              <meshStandardMaterial
                color="#00cc66"
                emissive="#00ff88"
                emissiveIntensity={2}
                transparent
                opacity={0.3 + Math.sin(Date.now() * 0.002 + i * 0.5) * 0.2}
                depthWrite={false}
              />
            </mesh>
          );
        })}
      </group>

      {/* Corrupted energy streams */}
      <group position={[0, 0.01, 0]}>
        {[...Array(12)].map((_, i) => {
          const angle = (i / 12) * Math.PI * 2;
          const radius = 1.8 + Math.sin(Date.now() * 0.002 + i) * 0.2;
          return (
            <mesh
              key={i}
              position={[
                Math.cos(angle) * radius,
                0,
                Math.sin(angle) * radius
              ]}
              rotation={[-Math.PI / 2, 0, angle + Date.now() * 0.0015]}
            >
              <planeGeometry args={[0.2, 0.8]} />
              <meshStandardMaterial
                color="#004433"
                emissive="#00ff88"
                emissiveIntensity={3}
                transparent
                opacity={0.2 + Math.sin(Date.now() * 0.004 + i) * 0.1}
                depthWrite={false}
              />
            </mesh>
          );
        })}
      </group>

      {/* Center dark core */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.2, 1.0, 32]} />
        <meshStandardMaterial
          color="#002211"
          emissive="#00ff88"
          emissiveIntensity={1.5}
          transparent
          opacity={0.4}
          depthWrite={false}
        />
      </mesh>

      {/* Ambient glow */}
      <mesh position={[0, 0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[2.4, 2.55, 128, 1]} />
        <meshStandardMaterial
          color="#00ff88"
          emissive="#00ff88"
          emissiveIntensity={0.3}
          transparent
          opacity={0.6}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
} 