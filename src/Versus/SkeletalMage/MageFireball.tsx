// src/versus/SkeletalMage/MageFireball.tsx
import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3, Group, Color } from 'three';
import * as THREE from 'three';
import MageFireballTrail from './MageFireballTrail';

interface FireballProps {
  position: Vector3;
  target: Vector3;
  onHit: (didHitPlayer: boolean) => void;
  playerPosition: Vector3;
}

export default function MageFireball({ position, target, onHit, playerPosition }: FireballProps) {
  const fireballRef = useRef<Group>(null);
  const meshRef = useRef<THREE.Mesh>(null);
  const initialDirection = target.clone().sub(position).normalize();
  const speed = 0.25;
  const hitRadius = 0.5;
  const [showExplosion, setShowExplosion] = useState(false);
  const [explosionStartTime, setExplosionStartTime] = useState<number | null>(null);
  const [, forceUpdate] = useState({});
  const hasDealtDamage = useRef(false);

  useFrame(() => {
    if (!fireballRef.current) return;
    
    if (showExplosion) {
      forceUpdate({});
      
      if (!hasDealtDamage.current) {
        hasDealtDamage.current = true;
        onHit(true);
      }
      
      if (explosionStartTime && Date.now() - explosionStartTime > 200) {
        onHit(false);
        return;
      }
      return;
    }
    
    fireballRef.current.position.add(initialDirection.clone().multiplyScalar(speed));
    
    const distanceToPlayer = fireballRef.current.position.distanceTo(playerPosition);
    const directHitRadius = 0.75;
    
    if (distanceToPlayer < directHitRadius) {
      setShowExplosion(true);
      setExplosionStartTime(Date.now());
      return;
    }
    
    const distanceToTarget = fireballRef.current.position.distanceTo(target);
    
    if (distanceToTarget < hitRadius) {
      const playerDistanceToTarget = playerPosition.distanceTo(target);
      if (playerDistanceToTarget < hitRadius) {
        setShowExplosion(true);
        setExplosionStartTime(Date.now());
      } else {
        onHit(false);
      }
      return;
    }

    const distanceFromStart = fireballRef.current.position.distanceTo(position);
    if (distanceFromStart > 60) {
      onHit(false);
    }
  });

  return (
    <group ref={fireballRef} position={position}>
      {!showExplosion ? (
        <>
          <mesh ref={meshRef}>
            <sphereGeometry args={[0.22, 16, 16]} />
            <meshStandardMaterial
              color="#ff3333"
              emissive="#ff0000"
              emissiveIntensity={2}
              transparent
              opacity={0.9}
            />
          </mesh>

          <MageFireballTrail
            color={new Color("#ff3333")}
            size={0.185}
            meshRef={meshRef}
            opacity={0.8}
          />

          <pointLight 
            color="#ff3333" 
            intensity={2} 
            distance={3}
            decay={2}
          />
        </>
      ) : (
        // New explosion effect copied from Unit.tsx
        <>
          {/* Calculate fade  */}
          {(() => {
            const elapsed = explosionStartTime ? (Date.now() - explosionStartTime) / 1000 : 0;
            const duration = 0.2;
            const fade = Math.max(0, 1 - (elapsed / duration));
            
            return (
              <>
                {/* Core explosion sphere */}
                <mesh>
                  <sphereGeometry args={[0.45 * (1 + elapsed * 2), 32, 32]} />
                  <meshStandardMaterial
                    color="#ff3333"
                    emissive="#ff4444"
                    emissiveIntensity={2 * fade}
                    transparent
                    opacity={0.8 * fade}
                    depthWrite={false}
                    blending={THREE.AdditiveBlending}
                  />
                </mesh>
                
                {/* Inner energy sphere */}
                <mesh>
                  <sphereGeometry args={[0.4 * (1 + elapsed * 3), 24, 24]} />
                  <meshStandardMaterial
                    color="#ff6666"
                    emissive="#ffffff"
                    emissiveIntensity={3 * fade}
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
                      color="#ff3333"
                      emissive="#ff4444"
                      emissiveIntensity={0.8 * fade}
                      transparent
                      opacity={0.5 * fade * (1 - i * 0.2)}
                      depthWrite={false}
                      blending={THREE.AdditiveBlending}
                    />
                  </mesh>
                ))}

                {/* Particle sparks */}
                {[...Array(8)].map((_, i) => {
                  const angle = (i / 8) * Math.PI * 2;
                  const radius = 0.5 * (1 + elapsed * 2);
                  return (
                    <mesh
                      key={`spark-${i}`}
                      position={[
                        Math.sin(angle) * radius,
                        Math.cos(angle) * radius,
                        0
                      ]}
                    >
                      <sphereGeometry args={[0.05, 8, 8]} />
                      <meshStandardMaterial
                        color="#ff6666"
                        emissive="#ffffff"
                        emissiveIntensity={2 * fade}
                        transparent
                        opacity={0.8 * fade}
                        depthWrite={false}
                        blending={THREE.AdditiveBlending}
                      />
                    </mesh>
                  );
                })}

                {/* Dynamic lights */}
                <pointLight
                  color="#ff3333"
                  intensity={2 * fade}
                  distance={4}
                  decay={2}
                />
                <pointLight
                  color="#ff6666"
                  intensity={1 * fade}
                  distance={6}
                  decay={1}
                />
              </>
            );
          })()}
        </>
      )}
    </group>
  );
} 