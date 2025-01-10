import { useRef, useEffect } from 'react';
import { Group, Vector3 } from 'three';
import { useOathstrikeAnimation } from './useOathstrikeAnimation';


interface OathstrikeProps {
  position: Vector3;
  direction: Vector3;
  onComplete: () => void;
  parentRef: React.RefObject<Group>;
}

export default function Oathstrike({ position, direction, onComplete, parentRef }: OathstrikeProps) {
  const effectRef = useRef<Group>(null);
  
  useEffect(() => {
    return () => {
      onComplete();
    };
  }, [onComplete]);
  
  const { reset } = useOathstrikeAnimation({
    effectRef,
    position,
    direction,
    parentRef
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
      rotation={[Math.PI/2, Math.atan2(direction.x, direction.z), 0]}
    >
      {/* Main flame arc */}
      <group position={[0, 0, 0]}>
        {/* Core flame */}
        <mesh>
          <torusGeometry args={[3, 0.8, 8, 32, Math.PI]} />
          <meshStandardMaterial
            color="#FF9748"
            emissive="#FF6F00"
            emissiveIntensity={2}
            transparent
            opacity={0.9}
          />
        </mesh>

        {/* Inner glow */}
        <mesh>
          <torusGeometry args={[3, 0.4, 16, 32, Math.PI]} />
          <meshStandardMaterial
            color="#FF9748"
            emissive="#FF6F00"
            emissiveIntensity={1}
            transparent
            opacity={0.7}
          />
        </mesh>

        {/* Outer glow */}
        <mesh>
          <torusGeometry args={[2, 0.9, 16, 32, Math.PI]} />
          <meshStandardMaterial
            color="#FF9748"
            emissive="#FF6F00"
            emissiveIntensity={1.3}
            transparent
            opacity={0.5}
          />
        </mesh>

        {/* Flame particles */}
        {[...Array(12)].map((_, i) => (
          <mesh
            key={i}
            position={[
              Math.cos((i * Math.PI) / 6) * 1.5,
              Math.sin((i * Math.PI) / 6) * 1.5,
              0
            ]}
          >
            <sphereGeometry args={[0.15, 8, 8]} />
            <meshStandardMaterial
              color="#FF9748"
              emissive="#FF6F00"
              emissiveIntensity={1.5}
              transparent
              opacity={0.6}
            />
          </mesh>
        ))}

        {/* Dynamic lighting */}
        <pointLight color="#FF9748" intensity={15} distance={8} />
        <pointLight color="#FF6F00" intensity={10} distance={12} />
      </group>
    </group>
  );
}
