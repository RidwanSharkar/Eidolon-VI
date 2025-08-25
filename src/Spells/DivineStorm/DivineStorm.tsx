import { useRef } from 'react';
import { Group, Vector3 } from 'three';
import { useFrame } from '@react-three/fiber';
import DivineStormShard from '@/color/DivineStormShard';
import * as THREE from 'three';

interface DivineStormProps {
  position: Vector3;
  onComplete: () => void;
  enemyData?: Array<{ id: string; position: Vector3; health: number }>;
  onHitTarget?: (targetId: string, damage: number, isCritical: boolean, position: Vector3, isDivineStorm: boolean) => void;
  parentRef?: React.RefObject<Group>;
  isActive?: boolean; // Control if divine storm should remain active
}

export default function DivineStorm({ 
  onComplete, 
  parentRef,
  isActive = true
}: DivineStormProps) {
  const stormRef = useRef<Group>(null);
  const progressRef = useRef(0);
  const shardsRef = useRef<Array<{ id: number; position: Vector3; type: 'orbital' | 'falling' }>>([]);

  // Smaller parameters than Firestorm for more focused divine effect
  const ORBITAL_RADIUS = 1.5;        // Smaller radius than firestorm
  const FALLING_RADIUS = 1.0;        // Smaller radius for concentration
  const ORBITAL_HEIGHT = -2.0;       // Height for orbital shards
  const FALLING_HEIGHT = 1.0;        // Starting height for falling shards

  useFrame((_, delta) => {
    if (!stormRef.current || !parentRef?.current) return;

    const parentPosition = parentRef.current.position;
    stormRef.current.position.copy(parentPosition);

    // Only auto-complete if isActive is false (managed externally)
    if (!isActive) {
      onComplete();
      return;
    }
    
    progressRef.current += delta;

    // Slower rotation than firestorm for more elegant divine effect
    stormRef.current.rotation.y += delta * 4;

    // Spawn orbital shards - less frequent than firestorm for cleaner look
    if (Math.random() < 0.6) {
      const angle = Math.random() * Math.PI * 2;
      const spawnRadius = Math.random() * ORBITAL_RADIUS;
      
      const orbitalPosition = new Vector3(
        Math.cos(angle) * spawnRadius,
        ORBITAL_HEIGHT + Math.random() * 0.6,
        Math.sin(angle) * spawnRadius
      );

      shardsRef.current.push({
        id: Date.now() + Math.random(),
        position: orbitalPosition,
        type: 'orbital'
      });
    }

    // Spawn falling shards
    if (Math.random() < 0.4) {
      const angle = Math.random() * Math.PI * 2;
      const spawnRadius = Math.random() * FALLING_RADIUS;
      
      const fallingPosition = new Vector3(
        Math.cos(angle) * spawnRadius,
        FALLING_HEIGHT + Math.random() * 1.2,
        Math.sin(angle) * spawnRadius
      );

      shardsRef.current.push({
        id: Date.now() + Math.random(),
        position: fallingPosition,
        type: 'falling'
      });
    }

  });

  return (
    <group ref={stormRef}>
      {/* Spinning divine shards */}
      {shardsRef.current.map(shard => (
        <DivineStormShard
          key={shard.id}
          initialPosition={shard.position}
          type={shard.type}
          centerPosition={new Vector3(0, 0, 0)} // Relative to storm center
          onComplete={() => {
            shardsRef.current = shardsRef.current.filter(s => s.id !== shard.id);
          }}
        />
      ))}

      {/* Divine light */}
      <pointLight 
        color={new THREE.Color(0xFFD700)}
        intensity={1}
        distance={4}
        decay={1}
      />
    </group>
  );
}
