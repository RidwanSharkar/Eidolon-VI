// src/versus/SkeletalMage/MageFireball.tsx
import React, { useRef, useState, useEffect, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3, Group, Color } from 'three';
import * as THREE from 'three';
import MageFireballTrail from './MageFireballTrail';
import { geometryPools, materialPools } from '@/Scene/EffectPools';

interface FireballProps {
  position: Vector3;
  target: Vector3;
  onHit: (didHitPlayer: boolean) => void;
  playerPosition: Vector3;
  getCurrentPlayerPosition?: () => Vector3;
} 

const fireballPool: Group[] = [];
const MAX_POOL_SIZE = 5;

export function getFireballFromPool(): Group | null {
  return fireballPool.pop() || null;
}

export function returnFireballToPool(fireball: Group) {
  if (fireballPool.length < MAX_POOL_SIZE) {
    fireballPool.push(fireball);
  }
}

export default function MageFireball({ 
  position, 
  target, 
  onHit, 
  playerPosition, 
  getCurrentPlayerPosition 
}: FireballProps) {
  const fireballRef = useRef<Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const initialDirection = target.clone().sub(position).normalize();
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
    if (!fireballRef.current) {
      // Don't spam logs - fireball might be in cleanup phase
      return;
    }
    
    if (showExplosion) {
      forceUpdate({});
      return;
    }
    
    fireballRef.current.position.add(initialDirection.clone().multiplyScalar(speed));
    
    // Get current player position (use fresh position if available, otherwise fallback to prop)
    const currentPlayerPos = getCurrentPlayerPosition ? getCurrentPlayerPosition() : playerPosition;
    
    const distanceToPlayer = fireballRef.current.position.distanceTo(currentPlayerPos);
    const directHitRadius = 1.2;
    
    if (distanceToPlayer < directHitRadius) {

      // Deal damage immediately when hit is detected, not in next frame
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
        
        // Deal damage immediately when area hit is detected, not in next frame
        if (!hasDealtDamage.current) {
          hasDealtDamage.current = true;
          onHit(true);
        }
        
        setShowExplosion(true);
        setExplosionStartTime(Date.now());
      } else {
        onHit(false); // Clean up the fireball when player escapes
      }
      return; // Stop processing this fireball after reaching target
    }

    const distanceFromStart = fireballRef.current.position.distanceTo(position);
    // Only destroy the fireball after it travels the maximum distance
    if (distanceFromStart > MAX_TRAVEL_DISTANCE) {
      onHit(false);
    }
  });

  useEffect(() => {
    const mesh = meshRef.current;
    return () => {
      if (mesh) {
        if (mesh.geometry) {
          mesh.geometry.dispose();
        }
        if (mesh.material) {
          const material = mesh.material as THREE.Material;
          material.dispose();
        }
      }
    };
  }, []);




  return (
    <group>
      {!showExplosion ? (
        <>
          {/* Fireball trail effect - outside the moving group to avoid coordinate conflicts */}
          <MageFireballTrail
            color={new Color("#9370DB")}
            size={0.235}
            meshRef={fireballRef}
            opacity={0.8}
          />
          
          <group ref={fireballRef} position={position}>
            <mesh 
              ref={meshRef}
              geometry={pooledResources.geometry}
              material={pooledResources.material}
              scale={[0.67, 0.67, 0.67]} // Scale down from default 0.3 to 0.20 radius
            />

            <pointLight 
              color="#6A0DAD" 
              intensity={2} 
              distance={3}
              decay={2}
            />
          </group>
        </>
      ) : (
        // explosion effect copied from Unit.tsx - positioned at fireball's last position
        <group position={fireballRef.current?.position || position}>
          {/* Calculate fade  */}
          {(() => {
            const elapsed = explosionStartTime ? (Date.now() - explosionStartTime) / 1000 : 0;
            const duration = 0.2;
            const fade = Math.max(0, 1 - (elapsed / duration));
            
            return (
              <>
                {/* Core explosion sphere */}
                <mesh>
                  <sphereGeometry args={[0.35 * (1 + elapsed * 2), 32, 32]} />
                  <meshStandardMaterial
                    color="#8A2BE2"
                    emissive="#9370DB"
                    emissiveIntensity={2 * fade}
                    transparent
                    opacity={0.8 * fade}
                    depthWrite={false}
                    blending={THREE.AdditiveBlending}
                  />
                </mesh>
                
                {/* projectile core */}
                <mesh>
                  <sphereGeometry args={[0.4 * (1 + elapsed * 3), 24, 24]} />
                  <meshStandardMaterial
                    color="#6A0DAD"
                    emissive="#6A0DAD"
                    emissiveIntensity={1 * fade}
                    transparent
                    opacity={0.9 * fade}
                    depthWrite={false}
                    blending={THREE.AdditiveBlending}
                  />
                </mesh>

                {/* Multiple expanding rings */}
                {[0.45, 0.675, 0.9, 1.175].map((size, i) => (
                  <mesh key={i} rotation={[Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI]}>
                    <torusGeometry args={[size * (1 + elapsed * 3), 0.045, 16, 32]} />
                    <meshStandardMaterial
                      color="#6A0DAD"
                      emissive="#6A0DAD"
                      emissiveIntensity={0.8 * fade}
                      transparent
                      opacity={0.5 * fade * (1 - i * 0.2)}
                      depthWrite={false}
                      blending={THREE.AdditiveBlending}
                    />
                  </mesh>
                ))}


              </>
            );
          })()}
        </group>
      )}
    </group>
  );
} 