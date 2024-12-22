import { useRef, useEffect } from 'react';
import { Group, Vector3 } from 'three';
import { useFirebeamAnimation } from './useFirebeamAnimation';

interface FirebeamProps {
  position: Vector3;
  direction: Vector3;
  onComplete: () => void;
  onHit?: () => void;
}

export default function Firebeam({ position, direction, onComplete }: FirebeamProps) {
  const beamRef = useRef<Group>(null);
  
  useEffect(() => {
    const currentBeam = beamRef.current;
    
    return () => {
      if (currentBeam) {
        currentBeam.scale.z = 0;
      }
      onComplete();
    };
  }, [onComplete]);
  
  const { reset } = useFirebeamAnimation({
    beamRef,
    position,
    direction
  });

  // Call reset when component unmounts
  useEffect(() => {
    return () => {
      reset();
    };
  }, [reset]);

  return (
    <group
      ref={beamRef}
      position={position.toArray()}
      rotation={[0, Math.atan2(direction.x, direction.z), 0]}
    >
      {/* Core beam - Moved forward */}
      <group position={[0, -1.25, 10.7]}>
        {/* Core beam */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.1, 0.1, 20, 16]} />
          <meshStandardMaterial
            color="#ff0000"
            emissive="#ff1100"
            emissiveIntensity={15}
            transparent
            opacity={0.95}
          />
        </mesh>

        {/* Inner glow */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.2, 0.2, 20, 16]} />
          <meshStandardMaterial
            color="#ff2200"
            emissive="#ff1100"
            emissiveIntensity={10}
            transparent
            opacity={0.7}
          />
        </mesh>

        {/* Outer glow */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.3, 0.3, 20, 16]} />
          <meshStandardMaterial
            color="#ff3300"
            emissive="#ff2200"
            emissiveIntensity={8}
            transparent
            opacity={0.4}
          />
        </mesh>

        {/* Spiral effect */}
        {[...Array(5)].map((_, i) => (
          <mesh 
            key={i} 
            rotation={[Math.PI / 2, 0, (i * Math.PI) / 1.5]}
            position={[0, 0, 10]}
          >
            <torusGeometry args={[0.35, 0.05, 8, 32]} />
            <meshStandardMaterial
              color="#ff2200"
              emissive="#ff1100"
              emissiveIntensity={8}
              transparent
              opacity={0.3}
            />
          </mesh>
        ))}

        {/* Floating particles along beam */}
        {[...Array(8)].map((_, i) => (
          <mesh
            key={i}
            position={[
              Math.cos((i * Math.PI) / 4) * 0.8,
              Math.sin((i * Math.PI) / 4) * 0.8,
              i * 2.5,
            ]}
          >
            <sphereGeometry args={[0.15, 8, 8]} />
            <meshStandardMaterial
              color="#ff6600"
              emissive="#ff4400"
              emissiveIntensity={12}
              transparent
              opacity={0.6}
            />
          </mesh>
        ))}

        {/* Enhanced beam glow */}
        <pointLight position={[0, 0, 10]} color="#ff4400" intensity={25} distance={12} />
        <pointLight position={[0, 0, 0]} color="#ff6600" intensity={15} distance={6} />
      </group>
    </group>
  );
} 