import { useRef } from 'react';
import { Group, Vector3 } from 'three';
import { useFrame } from '@react-three/fiber';
import FirestormShard from '@/Spells/Firestorm/FirestormShard';
import { calculateFirestormDamage } from '@/Spells/Firestorm/FirestormDamage';
import * as THREE from 'three';

export const sharedGeometries = {
  torus: new THREE.TorusGeometry(0.8, 0.075, 8, 32),
  tetrahedron: new THREE.TetrahedronGeometry(0.0725)
};

export const sharedMaterials = {
  firestorm: new THREE.MeshStandardMaterial({
    color: "#ff4400",
    emissive: "#ff2200",
    emissiveIntensity: 7.5,
    transparent: true,
    opacity: 0.6
  }),
  shard: new THREE.MeshStandardMaterial({
    color: "#ff6600",
    emissive: "#ff3300",
    emissiveIntensity: 5,
    transparent: true,
    opacity: 0.8
  })
};

interface FirestormProps {
  position: Vector3;
  onComplete: () => void;
  enemyData?: Array<{ id: string; position: Vector3; health: number }>;
  onHitTarget?: (targetId: string, damage: number, isCritical: boolean, position: Vector3, isFirestorm: boolean) => void;
  parentRef?: React.RefObject<Group>;
  isActive?: boolean; // New prop to control if firestorm should remain active
}

export default function Firestorm({ 
  onComplete, 
  enemyData = [], 
  onHitTarget,
  parentRef,
  isActive = true
}: FirestormProps) {
  const stormRef = useRef<Group>(null);
  const progressRef = useRef(0);
  const lastDamageTime = useRef<number>(0);
  // Duration is now managed externally through isActive prop
  // const duration = 4; // 4 second duration as specified
  const shardsRef = useRef<Array<{ id: number; position: Vector3; type: 'orbital' | 'falling' }>>([]);
  const aurasRef = useRef<Array<{ id: number }>>([]);

  const ORBITAL_RADIUS = 2;        // Smaller radius for more concentrated effect
  const FALLING_RADIUS = 0.75;        // Much smaller radius for intense concentration
  const ORBITAL_HEIGHT = -3.5;        // Lower height for more ground-level intensity
  const FALLING_HEIGHT = 0.75;       // Higher starting height for dramatic falls

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

    stormRef.current.rotation.y += delta * 6; // Faster rotation for more intensity

    if (Math.random() < 0.8) { // Increased spawn rate for more particles
      const angle = Math.random() * Math.PI * 2;
      const spawnRadius = Math.random() * ORBITAL_RADIUS;
      
      const orbitalPosition = new Vector3(
        Math.cos(angle) * spawnRadius +3,
        ORBITAL_HEIGHT + Math.random() * 0.8 + 3, // Reduced height variation for concentration
        Math.sin(angle) * spawnRadius +3
      );

      shardsRef.current.push({
        id: Date.now() + Math.random(),
        position: orbitalPosition,
        type: 'orbital'
      });
    }

    if (Math.random() < 0.6) { // Much higher spawn rate for falling particles
      const angle = Math.random() * Math.PI * 2;
      const spawnRadius = Math.random() * FALLING_RADIUS;
      
      const fallingPosition = new Vector3(
        Math.cos(angle) * spawnRadius,
        FALLING_HEIGHT + Math.random() * 1.5, // Less height variation
        Math.sin(angle) * spawnRadius
      );

      shardsRef.current.push({
        id: Date.now() + Math.random(),
        position: fallingPosition,
        type: 'falling'
      });
    }

    if (Math.random() < 0.2) { // Increased aura spawn rate for more visual intensity
      aurasRef.current.push({
        id: Date.now() + Math.random(),
      });
    }

    // Damage dealing logic
    const now = Date.now();
    if (now - lastDamageTime.current >= 1000) {
      lastDamageTime.current = now;
      
      if (enemyData && onHitTarget) {
        const hits = calculateFirestormDamage(parentPosition, enemyData);
        hits.forEach(hit => {
          onHitTarget(
            hit.targetId, 
            hit.damage, 
            hit.isCritical, 
            hit.position, 
            true  // isFirestorm flag
          );
        });
      }
    }
  });

  return (
    <group ref={stormRef}>

      {shardsRef.current.map(shard => (
        <FirestormShard
          key={shard.id}
          initialPosition={shard.position}
          type={shard.type}
          onComplete={() => {
            shardsRef.current = shardsRef.current.filter(s => s.id !== shard.id);
          }}
        />
      ))}


    </group>
  );
}