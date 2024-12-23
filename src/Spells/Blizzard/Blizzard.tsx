import { useRef, useState } from 'react';
import { Group, Vector3 } from 'three';
import { useFrame } from '@react-three/fiber';
import BlizzardShard from './BlizzardShard';
import { calculateBlizzardDamage } from './BlizzardDamage';

interface BlizzardProps {
  position: Vector3;
  onComplete: () => void;
  enemyData?: Array<{ id: string; position: Vector3; health: number }>;
  onHitTarget?: (targetId: string, damage: number, isCritical: boolean, position: Vector3, isBlizzard: boolean) => void;
  parentRef?: React.RefObject<Group>;
}

export default function Blizzard({ 
  onComplete, 
  enemyData = [], 
  onHitTarget,
  parentRef 
}: BlizzardProps) {
  const stormRef = useRef<Group>(null);
  const progressRef = useRef(0);
  const lastDamageTime = useRef(0);
  const duration = 7.0;
  const [shards, setShards] = useState<Array<{ id: number; position: Vector3; type: 'orbital' | 'falling' }>>([]);

  const ORBITAL_RADIUS = 1.01;        // Radius of the orbital shard spawn area
  const FALLING_RADIUS = 2.5;        // Radius of the falling shard spawn area
  const ORBITAL_HEIGHT = 2.35;        // Height of orbital shards
  const FALLING_HEIGHT = 1.2;       // Starting height of falling shards

  useFrame((_, delta) => {
    if (!stormRef.current || !parentRef?.current) return;

    const parentPosition = parentRef.current.position;
    stormRef.current.position.copy(parentPosition);

    progressRef.current += delta;
    if (progressRef.current >= duration) {
      onComplete();
      return;
    }

    stormRef.current.rotation.y += delta * 6.5;

    if (Math.random() < 0.22) { // Reduced from 0.2
      const angle = Math.random() * Math.PI * 2;
      const spawnRadius = Math.random() * ORBITAL_RADIUS / 50;
      
      const orbitalPosition = new Vector3(
        Math.cos(angle) * spawnRadius,
        ORBITAL_HEIGHT + Math.random() * 1.7,
        Math.sin(angle) * spawnRadius
      );

      setShards(prev => [...prev.slice(-40), { // Keep only last 15 shards
        id: Date.now() + Math.random(),
        position: orbitalPosition,
        type: 'orbital'
      }]);
    }

    if (Math.random() < 0.5) { // Reduced from 0.3
      const angle = Math.random() * Math.PI * 2;
      const spawnRadius = Math.random() * FALLING_RADIUS;
      
      const fallingPosition = new Vector3(
        Math.cos(angle) * spawnRadius,
        FALLING_HEIGHT + Math.random() * 3,
        Math.sin(angle) * spawnRadius
      );

      setShards(prev => [...prev.slice(-100), { // Keep only last 15 shards
        id: Date.now() + Math.random(),
        position: fallingPosition,
        type: 'falling'
      }]);
    }

      //BLUE DAMAGE??
    const now = Date.now();
    if (now - lastDamageTime.current >= 1000) {
      lastDamageTime.current = now;
      
      if (enemyData && onHitTarget) {
        const hits = calculateBlizzardDamage(parentPosition, enemyData);
        hits.forEach(hit => {
          onHitTarget(
            hit.targetId, 
            hit.damage, 
            hit.isCritical, 
            hit.position, 
            true  // isBlizzard flag
          );
        });
      }
    }
  });

  return (
    <group ref={stormRef}>
      <pointLight
        position={[0, 3, 0]}
        color="#80ffff"
        intensity={1.5}
        distance={3}
        decay={2}
      />

      {shards.map(shard => (
        <BlizzardShard
          key={shard.id}
          initialPosition={shard.position}
          type={shard.type}
          onComplete={() => {
            setShards(prev => prev.filter(s => s.id !== shard.id));
          }}
        />
      ))}
    </group>
  );
} 