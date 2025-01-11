import { useRef, useEffect } from 'react';
import { Group, Vector3 } from 'three';
import { useFirebeamAnimation } from '@/Spells/Firebeam/useFirebeamAnimation';

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
      {/* Origin point effects */}
      <group position={[0, -1.1, 0]}>
        {/* Origin core glow */}
        <mesh>
          <sphereGeometry args={[0.65, 16, 16]} />
          <meshStandardMaterial
            color="#58FCEC"
            emissive="#00E5FF"
            emissiveIntensity={2.5}
            transparent
            opacity={0.65}
          />
        </mesh>

        {/* Origin outer glow */}
        <mesh>
          <sphereGeometry args={[0.825, 16, 16]} />
          <meshStandardMaterial
            color="#58FCEC"
            emissive="#00E5FF"
            emissiveIntensity={0.7}
            transparent
            opacity={0.65}
          />
        </mesh>

        {/* Origin energy rings */}
        {[...Array(3)].map((_, i) => (
          <mesh 
            key={`ring-${i}`}
            rotation={[Math.PI / 2, 0, (i * Math.PI) / 3]}
          >
            <torusGeometry args={[0.875, 0.075, 8, 32]} />
            <meshStandardMaterial
              color="#58FCEC"
              emissive="#00E5FF"
              emissiveIntensity={0.8}
              transparent
              opacity={0.9}
            />
          </mesh>
        ))}

        {/* Origin point light */}
        <pointLight color="#58FCEC" intensity={20} distance={3} />
      </group>

      {/* Main beam group */}
      <group position={[0, -1.1, 10.7]}>
        {/* Core beam */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.1, 0.1, 20, 16]} />
          <meshStandardMaterial
            color="#58FCEC"
            emissive="#00E5FF"
            emissiveIntensity={3}
            transparent
            opacity={0.95}
          />
        </mesh>

        {/* Inner glow */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.275, 0.275, 20, 16]} />
          <meshStandardMaterial
            color="#58FCEC"
            emissive="#00E5FF"
            emissiveIntensity={2.5}
            transparent
            opacity={0.7}
          />
        </mesh>

        {/* Outer glow */}
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.375, 0.375, 20, 16]} />
          <meshStandardMaterial
            color="#58FCEC"
            emissive="#00E5FF"
            emissiveIntensity={1}
            transparent
            opacity={0.6}
          />
        </mesh>

        {/* Spiral effect */}
        {[...Array(5)].map((_, i) => (
          <mesh 
            key={i} 
            rotation={[-Math.PI / 4, 0, (i * Math.PI) / -1.5]}
            position={[0, 0, 10]}
          >
            <torusGeometry args={[0.35, 0.05, 8, 32]} />
            <meshStandardMaterial
              color="#58FCEC"
              emissive="#00E5FF"
              emissiveIntensity={1}
              transparent
              opacity={0.3}
            />
          </mesh>
        ))}



        {/* End-beam sparks */}
        {[...Array(24)].map((_, i) => (
          <mesh
            key={`spark-${i}`}
            position={[
              (Math.random() - 0.5) * 1.75, // Increased X spread
              (Math.random() - 0.5) * 1.75, // Increased Y spread
              Math.random() * 10, // end of beam
            ]}
            rotation={[
              Math.random() * Math.PI * 2,
              Math.random() * Math.PI * 2,
              Math.random() * Math.PI * 2,
            ]}
          >
            <boxGeometry args={[0.05, 0.05, 0.1]} /> {/* sparks */}
            <meshStandardMaterial
              color="#58FCEC"
              emissive="#00E5FF"
              emissiveIntensity={2}
              transparent
              opacity={0.75}
            />
          </mesh>
        ))}

        {/* Adjusted point light for the sparks */}
        <pointLight position={[0, 0, 18.5]} color="#00E5FF" intensity={12} distance={4} />

        {/* Enhanced beam glow */}
        {/* <pointLight position={[0, 0.5, 7.5]} color="#58FCEC" intensity={15} distance={2} /> */}
        {/* <pointLight position={[0, 0, 10]} color="#58FCEC" intensity={15} distance={2} /> */}
        {/* <pointLight position={[0, 0, 5]} color="#58FCEC" intensity={15} distance={2} /> */}
        {/* <pointLight position={[0, 0, 2.5]} color="#58FCEC" intensity={15} distance={2} /> */}
        {/* <pointLight position={[0, 0, 0]} color="#58FCEC" intensity={15} distance={2} /> */}
        {/* <pointLight position={[0, 0, -2.5]} color="#58FCEC" intensity={15} distance={2} /> */}
        {/* <pointLight position={[0, 0, -5]} color="#58FCEC" intensity={15} distance={2} /> */}
        {/* <pointLight position={[0, 0, -7.5]} color="#58FCEC" intensity={15} distance={2} /> */}
      </group>
    </group>
  );
} 