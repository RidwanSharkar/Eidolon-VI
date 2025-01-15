import { useRef } from 'react';
import { Group } from 'three';
import { useFrame } from '@react-three/fiber';

interface BossUnholyAuraProps {
  parentRef: React.RefObject<Group>;
}

export default function BossUnholyAura({ parentRef }: BossUnholyAuraProps) {
  const auraRef = useRef<Group>(null);
  const rotationSpeed = 0.1; // Slightly slower for more menacing feel

  useFrame(() => {
    if (auraRef.current && parentRef.current) {
      const parentPosition = parentRef.current.position;
      auraRef.current.position.set(parentPosition.x, 0.015, parentPosition.z);
      auraRef.current.rotation.y += rotationSpeed * 0.008;
    }
  });

  return (
    <group ref={auraRef} scale={0.75}>  {/* Slightly larger scale */}
      {/* Outer corrupted circle */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.2, 0]}>
        <ringGeometry args={[1.2, 1.65, 16, 1]} />
        <meshStandardMaterial
          color="#ff0000"
          emissive="#ff2200"
          emissiveIntensity={2}
          transparent
          opacity={0.4}
          depthWrite={false}
        />
      </mesh>

      {/* Spinning rune marks */}
      <group position={[0, -0.225, 0]}>
        {[...Array(10)].map((_, i) => (  // Adjusted to 10 marks
          <mesh
            key={i}
            rotation={[-Math.PI / 2, 0, (i / 10) * Math.PI * 2 + Date.now() * 0.001]}
            position={[0, 0, 0]}
          >
            <circleGeometry args={[0.1, 32]} />  
            <meshStandardMaterial
              color="#ff0000"
              emissive="#ff3300"
              emissiveIntensity={2.5}
              transparent
              opacity={0.5 + Math.sin(Date.now() * 0.002 + i) * 0.3}
              depthWrite={false}
            />
          </mesh>
        ))}
      </group>

      {/* Inner pulsing sigils */}
      <group position={[0, -0.25, 0]}>
        {[...Array(6)].map((_, i) => {  // Increased to 6 sigils
          const angle = (i / 6) * Math.PI * 2;
          const radius = 1.4;
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
              <circleGeometry args={[0.8, 32]} />
              <meshStandardMaterial
                color="#cc0000"
                emissive="#ff0000"
                emissiveIntensity={3}
                transparent
                opacity={0.4 + Math.sin(Date.now() * 0.002 + i * 0.5) * 0.3}
                depthWrite={false}
              />
            </mesh>
          );
        })}
      </group>

      {/* Center dark core */}
      <mesh position={[0, 0.15, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.3, 1.2, 32]} />
        <meshStandardMaterial
          color="#330000"
          emissive="#ff0000"
          emissiveIntensity={2}
          transparent
          opacity={0.6}
          depthWrite={false}
        />
      </mesh>

    </group>
  );
} 