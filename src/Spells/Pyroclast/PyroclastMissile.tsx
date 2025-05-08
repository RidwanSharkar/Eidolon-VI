import { useRef, useEffect, useState } from 'react';
import { Vector3 } from 'three';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import PyroclastExplosion from './PyroclastExplosion';

interface PyroclastMissileProps {
  id: number;
  position: Vector3;
  direction: Vector3;
  chargeTime: number;
  onImpact?: (position?: Vector3) => void;
  checkCollisions?: (missileId: number, position: Vector3) => boolean;
}

export default function PyroclastMissile({ 
  id,
  position, 
  direction, 
  chargeTime,
  onImpact,
  checkCollisions
}: PyroclastMissileProps) {
  const missileRef = useRef<THREE.Group>(null);
  const startPosition = useRef(position.clone());
  const hasCollided = useRef(false);
  const [showExplosion, setShowExplosion] = useState(false);
  const [impactPosition, setImpactPosition] = useState<Vector3 | null>(null);
  const [explosionStartTime, setExplosionStartTime] = useState<number | null>(null);

  // Initialize position on mount
  useEffect(() => {
    if (missileRef.current) {
      missileRef.current.position.copy(position);
    }
  }, [position]);

  useFrame((_, delta) => {
    if (!missileRef.current || hasCollided.current) return;

    // Move missile forward with consistent speed using delta
    const speed = 30 * delta;
    missileRef.current.position.add(
      direction.clone().multiplyScalar(speed)
    );

    // Check collisions each frame with current position
    if (checkCollisions) {
      const hitSomething = checkCollisions(id, missileRef.current.position.clone());
      
      if (hitSomething) {
        hasCollided.current = true;
        setImpactPosition(missileRef.current.position.clone());
        setExplosionStartTime(Date.now());
        setShowExplosion(true);
        if (onImpact) {
          onImpact(missileRef.current.position.clone());
        }
        return;
      }
    }

    // Check max distance (40 units)
    if (missileRef.current.position.distanceTo(startPosition.current) > 40) {
      if (!hasCollided.current) {
        hasCollided.current = true;
        setImpactPosition(missileRef.current.position.clone());
        setExplosionStartTime(Date.now());
        setShowExplosion(true);
        if (onImpact) {
          onImpact(missileRef.current.position.clone());
        }
      }
    }
  });

  // Handle explosion completion (delay cleanup for visual impact)
  const handleExplosionComplete = () => {
    setTimeout(() => {
      if (onImpact) {
        // Final cleanup signal
        onImpact();
      }
    }, 200); // Small delay after explosion ends
  };

  // Calculate scale and intensity based on chargeTime
  const normalizedCharge = Math.min(chargeTime / 4, 1.0);
  const scale = 0.5 + (normalizedCharge * 0.5);
  const intensity = 1 + (normalizedCharge * 2);

  return (
    <group>
      {!hasCollided.current && (
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
      )}

      {/* Show explosion effect when missile has collided */}
      {showExplosion && impactPosition && (
        <PyroclastExplosion 
          position={impactPosition}
          chargeTime={chargeTime}
          explosionStartTime={explosionStartTime}
          onComplete={handleExplosionComplete}
        />
      )}
    </group>
  );
} 