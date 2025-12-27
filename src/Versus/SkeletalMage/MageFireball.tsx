// src/versus/SkeletalMage/MageFireball.tsx
import React, { useRef, useState, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3, Group, Color } from 'three';
import { AdditiveBlending, Mesh, SphereGeometry, TorusGeometry, MeshStandardMaterial } from 'three';
import MageFireballTrail from './MageFireballTrail';
import { geometryPools, materialPools } from '@/Scene/EffectPools';

// MEMORY FIX: Static shared geometries for explosion effect - created once, reused for all instances
// Use base size of 1.0 and scale via mesh scale prop to avoid recreating geometry every frame
const EXPLOSION_CORE_GEOMETRY = new SphereGeometry(0.35, 32, 32);
const EXPLOSION_INNER_GEOMETRY = new SphereGeometry(0.4, 24, 24);
const EXPLOSION_RING_GEOMETRIES = [
  new TorusGeometry(0.45, 0.045, 16, 32),
  new TorusGeometry(0.675, 0.045, 16, 32),
  new TorusGeometry(0.9, 0.045, 16, 32),
  new TorusGeometry(1.175, 0.045, 16, 32)
];

// MEMORY FIX: Pre-baked rotation values to avoid Math.random() causing re-renders
const RING_ROTATIONS = [
  [0.8, 1.2, 0.3],
  [2.1, 0.5, 1.8],
  [1.5, 2.8, 0.9],
  [0.3, 1.9, 2.4]
] as const;

// MEMORY FIX: Constant color objects to prevent recreating them every frame
const FIREBALL_COLOR = new Color("#9370DB");
const FIREBALL_GLOW_COLOR = new Color("#6A0DAD");

// MEMORY FIX: Memoized explosion component using shared geometries
interface MageFireballExplosionProps {
  position: Vector3;
  explosionStartTime: number | null;
}

function MageFireballExplosion({ position, explosionStartTime }: MageFireballExplosionProps) {
  const [, forceUpdate] = useState({});
  
  useFrame(() => {
    forceUpdate({});
  });
  
  const elapsed = explosionStartTime ? (Date.now() - explosionStartTime) / 1000 : 0;
  const duration = 0.2;
  const fade = Math.max(0, 1 - (elapsed / duration));
  
  // MEMORY FIX: Use scale transform instead of dynamic geometry args
  const coreScale = 1 + elapsed * 2;
  const innerScale = 1 + elapsed * 3;
  const ringScale = 1 + elapsed * 3;
  
  return (
    <group position={position.toArray()}>
      {/* Core explosion sphere - MEMORY FIX: use shared geometry with scale */}
      <mesh scale={[coreScale, coreScale, coreScale]}>
        <primitive object={EXPLOSION_CORE_GEOMETRY} attach="geometry" />
        <meshStandardMaterial
          color="#8A2BE2"
          emissive="#9370DB"
          emissiveIntensity={2 * fade}
          transparent
          opacity={0.8 * fade}
          depthWrite={false}
          blending={AdditiveBlending}
        />
      </mesh>
      
      {/* Projectile core - MEMORY FIX: use shared geometry with scale */}
      <mesh scale={[innerScale, innerScale, innerScale]}>
        <primitive object={EXPLOSION_INNER_GEOMETRY} attach="geometry" />
        <meshStandardMaterial
          color="#6A0DAD"
          emissive="#6A0DAD"
          emissiveIntensity={1 * fade}
          transparent
          opacity={0.9 * fade}
          depthWrite={false}
          blending={AdditiveBlending}
        />
      </mesh>

      {/* Multiple expanding rings - MEMORY FIX: use shared geometries with scale */}
      {EXPLOSION_RING_GEOMETRIES.map((geometry, i) => (
        <mesh 
          key={i} 
          rotation={RING_ROTATIONS[i] as unknown as [number, number, number]}
          scale={[ringScale, ringScale, ringScale]}
        >
          <primitive object={geometry} attach="geometry" />
          <meshStandardMaterial
            color="#6A0DAD"
            emissive="#6A0DAD"
            emissiveIntensity={0.8 * fade}
            transparent
            opacity={0.5 * fade * (1 - i * 0.2)}
            depthWrite={false}
            blending={AdditiveBlending}
          />
        </mesh>
      ))}
    </group>
  );
}

interface FireballProps {
  position: Vector3;
  target: Vector3;
  onHit: (didHitPlayer: boolean) => void;
  playerPosition: Vector3;
  getCurrentPlayerPosition?: () => Vector3;
} 

export default function MageFireball({ 
  position, 
  target, 
  onHit, 
  playerPosition, 
  getCurrentPlayerPosition 
}: FireballProps) {
  const fireballRef = useRef<Group>(null);
  const initialDirection = useMemo(() => target.clone().sub(position).normalize(), [target, position]);
  const speed = 0.225
  const hitRadius = 1.2;
  const [showExplosion, setShowExplosion] = useState(false);
  const [explosionStartTime, setExplosionStartTime] = useState<number | null>(null);
  const [, forceUpdate] = useState({});
  const hasDealtDamage = useRef(false);
  // Maximum distance the fireball can travel before disappearing
  const MAX_TRAVEL_DISTANCE = 20;

  // Use pooled resources
  const pooledResources = useMemo(() => {
    const geometry = geometryPools.mageFireballSphere.acquire();
    const material = materialPools.mageFireball.acquire();
    return { geometry, material };
  }, []);

  // Return resources to pool on cleanup
  useEffect(() => {
    return () => {
      geometryPools.mageFireballSphere.release(pooledResources.geometry);
      materialPools.mageFireball.release(pooledResources.material);
    };
  }, [pooledResources]);

  useFrame(() => {
    if (!fireballRef.current) return;
    
    if (showExplosion) {
      forceUpdate({});
      return;
    }
    
    fireballRef.current.position.add(initialDirection.clone().multiplyScalar(speed));
    
    const currentPlayerPos = getCurrentPlayerPosition ? getCurrentPlayerPosition() : playerPosition;
    const distanceToPlayer = fireballRef.current.position.distanceTo(currentPlayerPos);
    const directHitRadius = 1.2;
    
    if (distanceToPlayer < directHitRadius) {
      if (!hasDealtDamage.current) {
        hasDealtDamage.current = true;
        onHit(true);
      }
      setShowExplosion(true);
      setExplosionStartTime(Date.now());
      return;
    }
    
    const distanceToTarget = fireballRef.current.position.distanceTo(target);
    if (distanceToTarget < hitRadius) {
      const playerDistanceToTarget = currentPlayerPos.distanceTo(target);
      if (playerDistanceToTarget < hitRadius) {
        if (!hasDealtDamage.current) {
          hasDealtDamage.current = true;
          onHit(true);
        }
        setShowExplosion(true);
        setExplosionStartTime(Date.now());
      } else {
        onHit(false);
      }
      return;
    }

    const distanceFromStart = fireballRef.current.position.distanceTo(position);
    if (distanceFromStart > MAX_TRAVEL_DISTANCE) {
      onHit(false);
    }
  });

  return (
    <group>
      {!showExplosion ? (
        <>
          <MageFireballTrail
            color={FIREBALL_COLOR}
            size={0.235}
            meshRef={fireballRef}
            opacity={0.8}
          />
          
          <group ref={fireballRef} position={position}>
            <mesh 
              geometry={pooledResources.geometry}
              material={pooledResources.material}
              scale={[0.67, 0.67, 0.67]}
            />

            <pointLight 
              color={FIREBALL_GLOW_COLOR} 
              intensity={2} 
              distance={3}
              decay={2}
            />
          </group>
        </>
      ) : (
        <MageFireballExplosion 
          position={fireballRef.current?.position || position}
          explosionStartTime={explosionStartTime}
        />
      )}
    </group>
  );
}