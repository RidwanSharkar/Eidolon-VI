import { useRef } from 'react';
import { Group, Vector3 } from 'three';
import { useFrame } from '@react-three/fiber';
import BlizzardShard from '@/Spells/Blizzard/BlizzardShard';
import { calculateBlizzardDamage } from '@/Spells/Blizzard/BlizzardDamage';
import BlizzardAura from '@/Spells/Blizzard/BlizzardAura';
import * as THREE from 'three';

export const sharedGeometries = {
  torus: new THREE.TorusGeometry(0.8, 0.075, 8, 32),
  tetrahedron: new THREE.TetrahedronGeometry(0.075)
};

export const sharedMaterials = {
  blizzard: new THREE.MeshStandardMaterial({
    color: "#80ffff",
    emissive: "#40a0ff",
    emissiveIntensity: 2,
    transparent: true,
    opacity: 0.3
  }),
  shard: new THREE.MeshStandardMaterial({
    color: "#80ffff",
    emissive: "#40a0ff",
    emissiveIntensity: 1,
    transparent: true,
    opacity: 0.7
  })
};

interface BlizzardProps {
  position: Vector3;
  onComplete: () => void;
  enemyData?: Array<{ id: string; position: Vector3; health: number }>;
  onHitTarget?: (targetId: string, damage: number, isCritical: boolean, position: Vector3, isBlizzard: boolean) => void;
  parentRef?: React.RefObject<Group>;
  level?: number; // Player level for damage scaling
}

export default function Blizzard({ 
  onComplete, 
  enemyData = [], 
  onHitTarget,
  parentRef,
  level = 2 // Default to level 2 since Blizzard unlocks at level 2
}: BlizzardProps) {
  const stormRef = useRef<Group>(null);
  const progressRef = useRef(0);
  const lastDamageTime = useRef<number>(0);
  const duration = 7;
  const shardsRef = useRef<Array<{ id: number; position: Vector3; type: 'orbital' | 'falling' }>>([]);
  const aurasRef = useRef<Array<{ id: number }>>([]);

  const ORBITAL_RADIUS = .8;        // Radius of the orbital shard spawn area
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

    stormRef.current.rotation.y += delta * 6;

    if (Math.random() < 0.3) { // Reduced from 0.2
      const angle = Math.random() * Math.PI * 2;
      const spawnRadius = Math.random() * ORBITAL_RADIUS / 50;
      
      const orbitalPosition = new Vector3(
        Math.cos(angle) * spawnRadius,
        ORBITAL_HEIGHT + Math.random() * 1.7,
        Math.sin(angle) * spawnRadius
      );

      shardsRef.current.push({
        id: Date.now() + Math.random(),
        position: orbitalPosition,
        type: 'orbital'
      });
    }

    if (Math.random() > 0.2) { // Reduced from 0.3
      const angle = Math.random() * Math.PI * 2;
      const spawnRadius = Math.random() * FALLING_RADIUS;
      
      const fallingPosition = new Vector3(
        Math.cos(angle) * spawnRadius,
        FALLING_HEIGHT + Math.random() * 3,
        Math.sin(angle) * spawnRadius
      );

      shardsRef.current.push({
        id: Date.now() + Math.random(),
        position: fallingPosition,
        type: 'falling'
      });
    }

    if (Math.random() < 0.1) { // 10% chance each frame
      aurasRef.current.push({
        id: Date.now() + Math.random(),
      });
    }
    
    const now = Date.now();
    if (now - lastDamageTime.current >= 1000) {
      lastDamageTime.current = now;
      
      if (enemyData && onHitTarget) {
        const hits = calculateBlizzardDamage(parentPosition, enemyData, level);
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

      {shardsRef.current.map(shard => (
        <BlizzardShard
          key={shard.id}
          initialPosition={shard.position}
          type={shard.type}
          onComplete={() => {
            shardsRef.current = shardsRef.current.filter(s => s.id !== shard.id);
          }}
        />
      ))}

      {aurasRef.current.map(aura => (
        <BlizzardAura
          key={aura.id}
          onComplete={() => {
            aurasRef.current = aurasRef.current.filter(a => a.id !== aura.id);
          }}
        />
      ))}
    </group>
  );
} 