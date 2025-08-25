// src/Versus/DeathKnight/FrostStrike.tsx
import React, { useRef, useMemo, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { Vector3, Group } from 'three';
import * as THREE from 'three';
import { geometryPools, materialPools } from '@/Scene/EffectPools';

interface FrostStrikeProps {
  position: Vector3;
  direction: Vector3;
  onComplete: () => void;
  parentRef: React.RefObject<Group>;
}

export default function FrostStrike({ position, direction, onComplete, parentRef }: FrostStrikeProps) {
  const effectRef = useRef<Group>(null);
  const progressRef = useRef(0);
  const animationDuration = 0.225; // Slightly longer than Oathstrike for visual impact
  const isActive = useRef(true);
  
  // Use pooled geometries and materials
  const pooledResources = useMemo(() => {
    const geometries = {
      mainArc: geometryPools.deathKnightSlashTorus.acquire(),
      innerGlow: geometryPools.deathKnightSlashTorus.acquire(),
      outerGlow: geometryPools.deathKnightSlashTorus.acquire(),
      particle: geometryPools.deathKnightSlashParticle.acquire(),
      iceShards: geometryPools.frostStrikeShard.acquire(),
      ring: geometryPools.frostStrikeRing.acquire()
    };

    const materials = {
      mainFrost: materialPools.frostStrike.acquire(),
      innerGlow: materialPools.frostStrike.acquire(),
      outerGlow: materialPools.frostStrike.acquire(),
      particle: materialPools.frostStrike.acquire(),
      iceShards: materialPools.frostStrike.acquire(),
      ring: materialPools.frostStrikeRing.acquire()
    };

    return { geometries, materials };
  }, []);

  // Return resources to pool on cleanup
  useEffect(() => {
    return () => {
      const { geometries, materials } = pooledResources;
      
      // Return geometries to pool
      geometryPools.deathKnightSlashTorus.release(geometries.mainArc);
      geometryPools.deathKnightSlashTorus.release(geometries.innerGlow);
      geometryPools.deathKnightSlashTorus.release(geometries.outerGlow);
      geometryPools.deathKnightSlashParticle.release(geometries.particle);
      geometryPools.frostStrikeShard.release(geometries.iceShards);
      geometryPools.frostStrikeRing.release(geometries.ring);
      
      // Return materials to pool
      materialPools.frostStrike.release(materials.mainFrost);
      materialPools.frostStrike.release(materials.innerGlow);
      materialPools.frostStrike.release(materials.outerGlow);
      materialPools.frostStrike.release(materials.particle);
      materialPools.frostStrike.release(materials.iceShards);
      materialPools.frostStrikeRing.release(materials.ring);
    };
  }, [pooledResources]);

  // Pre-calculate particle and ice shard positions
  const particlePositions = useMemo(() => 
    Array(15).fill(0).map((_, i) => ({
      position: new THREE.Vector3(
        Math.cos((i * Math.PI) / 7.5) * 1.8,
        Math.sin((i * Math.PI) / 7.5) * 1.8,
        0
      ),
      rotation: Math.random() * Math.PI * 2
    })), 
  []);

  const iceShardPositions = useMemo(() => 
    Array(8).fill(0).map((_, i) => ({
      position: new THREE.Vector3(
        Math.cos((i * Math.PI * 2) / 8) * 2.5,
        Math.sin((i * Math.PI * 2) / 8) * 2.5,
        0
      ),
      rotation: [
        Math.random() * Math.PI,
        Math.random() * Math.PI * 2,
        Math.random() * Math.PI
      ] as [number, number, number]
    })), 
  []);

  useEffect(() => {
    return () => {
      isActive.current = false;
      onComplete();
    };
  }, [onComplete]);

  useFrame((_, delta) => {
    if (!effectRef.current || !isActive.current || !parentRef.current) return;

    progressRef.current += delta;
    const progress = progressRef.current / animationDuration;

    if (progress <= 1) {
      // Position the effect in front of the Death Knight
      const parentQuaternion = parentRef.current.quaternion;
      const forward = new THREE.Vector3(0, 0, 2);
      forward.applyQuaternion(parentQuaternion);
      
      effectRef.current.position.copy(parentRef.current.position)
        .add(forward)
        .setY(0.1);
      
      // Apply rotation
      const flatRotation = new THREE.Quaternion().setFromAxisAngle(
        new THREE.Vector3(-1, 0, 0),
        -Math.PI/2
      );
      
      effectRef.current.quaternion.copy(parentQuaternion)
        .multiply(flatRotation);

      // Scale and fade effects with ice-like progression
      const scale = Math.sin(progress * Math.PI) * 0.75; // Slightly larger than Oathstrike
      effectRef.current.scale.set(scale, scale, scale * 0.6);

      // Update opacity with frost-like flickering
      const baseOpacity = Math.sin(progress * Math.PI);
      const flicker = Math.sin(Date.now() * 0.01) * 0.1 + 0.9;
      
      effectRef.current.traverse((child: THREE.Object3D) => {
        const material = (child as THREE.Mesh).material as THREE.Material & { opacity?: number };
        if (material?.opacity !== undefined) {
          material.opacity = baseOpacity * flicker;
        }
      });
    } else {
      isActive.current = false;
      if (effectRef.current) {
        effectRef.current.scale.set(0, 0, 0);
      }
    }
  });

  return (
    <group
      ref={effectRef}
      position={position.toArray()}
      rotation={[Math.PI/2, Math.atan2(direction.x, direction.z), 0]}
    >
      {/* Main frost arc */}
      <group position={[0, 0, 0]}>
        {/* Core frost */}
        <mesh geometry={pooledResources.geometries.mainArc} material={pooledResources.materials.mainFrost} />

        {/* Inner glow */}
        <mesh geometry={pooledResources.geometries.innerGlow} material={pooledResources.materials.innerGlow} />

        {/* Outer glow */}
        <mesh geometry={pooledResources.geometries.outerGlow} material={pooledResources.materials.outerGlow} />

        {/* Frost particles */}
        {particlePositions.map((props, i) => (
          <mesh
            key={`particle-${i}`}
            position={props.position}
            rotation={[0, props.rotation, 0]}
            geometry={pooledResources.geometries.particle}
            material={pooledResources.materials.particle}
          />
        ))}

        {/* Ice shards around the arc */}
        {iceShardPositions.map((props, i) => (
          <mesh
            key={`shard-${i}`}
            position={props.position}
            rotation={props.rotation}
            geometry={pooledResources.geometries.iceShards}
            material={pooledResources.materials.iceShards}
          />
        ))}


      </group>
    </group>
  );
}