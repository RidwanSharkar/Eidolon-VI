import { useRef } from 'react';
import { Group } from 'three';
import { useFrame } from '@react-three/fiber';

interface ReaperUnholyAuraProps {
  parentRef: React.RefObject<Group>;
}

export default function ReaperUnholyAura({ parentRef }: ReaperUnholyAuraProps) {
  const auraRef = useRef<Group>(null);
  const rotationSpeed = 0.1;

  useFrame(() => {
    if (auraRef.current && parentRef.current) {
      const parentPosition = parentRef.current.position;
      auraRef.current.position.set(parentPosition.x, 0.012, parentPosition.z);
      auraRef.current.rotation.y += rotationSpeed * 0.008;
    }
  });

  return (
    <group ref={auraRef} scale={0.5}>  {/* Smaller scale than boss */}
      {/* Outer corrupted circle */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.15, 0]}>
        <ringGeometry args={[1.0, 1.35, 14, 1]} />
        <meshStandardMaterial
          color="#ff0000"
          emissive="#ff2200"
          emissiveIntensity={1}
          transparent
          opacity={0.4}
          depthWrite={false}
        />
      </mesh>

      {/* Spinning rune marks */}
      <group position={[0, -0.18, 0]}>
        {[...Array(8)].map((_, i) => (  // Fewer marks than boss
          <mesh
            key={i}
            rotation={[-Math.PI / 2, 0, (i / 8) * Math.PI * 2 + Date.now() * 0.001]}
            position={[0, 0, 0]}
          >
            <circleGeometry args={[0.04, 32]} />  
            <meshStandardMaterial
              color="#ff0000"
              emissive="#FF0000"
              emissiveIntensity={2.5}
              transparent
              opacity={0.5 + Math.sin(Date.now() * 0.002 + i) * 0.3}
              depthWrite={false}
            />
          </mesh>
        ))}
      </group>

      {/* Inner pulsing sigils */}
      <group position={[0, -0.2, 0]}>
        {[...Array(5)].map((_, i) => {  // Fewer sigils than boss
          const angle = (i / 5) * Math.PI * 2;
          const radius = 1.1;
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
              <circleGeometry args={[0.6, 32]} />
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
      <mesh position={[0, 0.12, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.25, 1.0, 32]} />
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