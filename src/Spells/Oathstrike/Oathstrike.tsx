import { useRef, useEffect } from 'react';
import { Group, Vector3 } from 'three';
import { useOathstrikeAnimation } from './useOathstrikeAnimation';


interface OathstrikeProps {
  position: Vector3;
  direction: Vector3;
  onComplete: () => void;
}

export default function Oathstrike({ position, direction, onComplete }: OathstrikeProps) {
  const effectRef = useRef<Group>(null);
  
  useEffect(() => {
    return () => {
      onComplete();
    };
  }, [onComplete]);
  
  const { reset } = useOathstrikeAnimation({
    effectRef,
    position,
    direction
  });

  useEffect(() => {
    return () => {
      reset();
    };
  }, [reset]);

  return (
    <group
      ref={effectRef}
      position={position.toArray()}
      rotation={[0, Math.atan2(direction.x, direction.z), 0]}
    >
      {/* Main flame arc */}
      <group position={[0, 0, 2]}>
        {/* Core flame */}
        <mesh>
          <torusGeometry args={[2, 0.4, 16, 32, Math.PI]} />
          <meshStandardMaterial
            color="#ff4400"
            emissive="#ff2200"
            emissiveIntensity={8}
            transparent
            opacity={0.9}
          />
        </mesh>

        {/* Inner glow */}
        <mesh>
          <torusGeometry args={[2, 0.6, 16, 32, Math.PI]} />
          <meshStandardMaterial
            color="#ff6600"
            emissive="#ff4400"
            emissiveIntensity={6}
            transparent
            opacity={0.7}
          />
        </mesh>

        {/* Outer glow */}
        <mesh>
          <torusGeometry args={[2, 0.8, 16, 32, Math.PI]} />
          <meshStandardMaterial
            color="#ff8800"
            emissive="#ff6600"
            emissiveIntensity={4}
            transparent
            opacity={0.5}
          />
        </mesh>

        {/* Flame particles */}
        {[...Array(12)].map((_, i) => (
          <mesh
            key={i}
            position={[
              Math.cos((i * Math.PI) / 6) * 2,
              Math.sin((i * Math.PI) / 6) * 2,
              0
            ]}
          >
            <sphereGeometry args={[0.2, 8, 8]} />
            <meshStandardMaterial
              color="#ff8800"
              emissive="#ff6600"
              emissiveIntensity={6}
              transparent
              opacity={0.6}
            />
          </mesh>
        ))}

        {/* Dynamic lighting */}
        <pointLight color="#ff6600" intensity={15} distance={8} />
        <pointLight color="#ff4400" intensity={10} distance={12} />
      </group>
    </group>
  );
}
