import { useRef } from 'react';
import { Vector3 } from 'three';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface PyroclastMissileProps {
  id: number;
  position: Vector3;
  direction: Vector3;
  power: number;
  onImpact?: (position?: Vector3) => void;
  checkCollisions?: (missileId: number, position: Vector3) => void;
}

export default function PyroclastMissile({ 
  id,
  position, 
  direction, 
  power,
  onImpact,
  checkCollisions
}: PyroclastMissileProps) {
  const missileRef = useRef<THREE.Group>(null);
  const startPosition = useRef(position.clone());

  useFrame((_, delta) => {
    if (!missileRef.current) return;

    // Move missile forward with consistent speed using delta
    const speed = 30 * delta;
    missileRef.current.position.add(
      direction.clone().multiplyScalar(speed)
    );

    // Check collisions each frame with current position
    if (checkCollisions) {
      checkCollisions(id, missileRef.current.position);
    }

    // Check max distance (40 units)
    if (missileRef.current.position.distanceTo(startPosition.current) > 40) {
      onImpact?.(missileRef.current.position.clone());
    }
  });

  // Scale effects based on power (0-1)
  const scale = 0.5 + (power * 0.5);
  const intensity = 1 + (power * 2);

  return (
    <group ref={missileRef} position={position.toArray()}>
      {/* Core missile */}
      <mesh rotation={[0, Math.atan2(direction.x, direction.z), 0]}>
        <cylinderGeometry args={[0.2 * scale, 0.4 * scale, 2 * scale, 6]} />
        <meshStandardMaterial
          color="#FF544E"
          emissive="#FF544E"
          emissiveIntensity={intensity}
          transparent
          opacity={0.9}
        />
      </mesh>

      {/* Flame trail */}
      {[...Array(4)].map((_, i) => (
        <mesh
          key={i}
          position={[0, 0, -i * 0.5]}
          rotation={[0, Math.random() * Math.PI * 2, 0]}
        >
          <torusGeometry args={[0.3 * scale + (i * 0.1), 0.1, 6, 12]} />
          <meshStandardMaterial
            color="#FF8066"
            emissive="#FF8066"
            emissiveIntensity={intensity * (1 - i * 0.2)}
            transparent
            opacity={0.7 - (i * 0.15)}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
      ))}

      {/* Light source */}
      <pointLight
        color="#FF544E"
        intensity={intensity * 2}
        distance={5}
        decay={2}
      />
    </group>
  );
} 