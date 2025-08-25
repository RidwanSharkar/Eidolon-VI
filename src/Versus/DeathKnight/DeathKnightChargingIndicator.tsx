// src/Versus/DeathKnight/DeathKnightChargingIndicator.tsx
import React, { useRef, useMemo, useEffect, useState } from 'react';
import { Vector3, Group } from 'three';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { geometryPools, materialPools } from '@/Scene/EffectPools';

interface DeathKnightChargingIndicatorProps {
  position: Vector3; // Death Knight position
  direction: Vector3; // Attack direction
  attackRange: number; // Attack range
  chargeDuration: number; // Total charge time in ms (1000ms)
  onComplete: () => void;
}

const DeathKnightChargingIndicator: React.FC<DeathKnightChargingIndicatorProps> = ({ 
  position, 
  direction,
  attackRange,
  chargeDuration,
  onComplete 
}) => {
  const groupRef = useRef<Group>(null);
  const startTimeRef = useRef(Date.now());
  const [currentIntensity, setCurrentIntensity] = useState(0.2);
  const [currentProgress, setCurrentProgress] = useState(0);

  // Use pooled resources
  const pooledResources = useMemo(() => {
    const geometries = {
      attackArea: geometryPools.deathKnightChargingArea.acquire(),
      ring: geometryPools.deathKnightChargingRing.acquire(),
      orb: geometryPools.deathKnightChargingOrb.acquire(),
      line: geometryPools.chargingLine.acquire()
    };

    const materials = {
      area: materialPools.deathKnightChargingArea.acquire(),
      border: materialPools.deathKnightChargingArea.acquire(),
      ring: materialPools.deathKnightChargingRing.acquire(),
      orb: materialPools.deathKnightChargingOrb.acquire(),
      line: materialPools.chargingLine.acquire()
    };

    return { geometries, materials };
  }, []);

  // Return resources to pool on cleanup
  useEffect(() => {
    return () => {
      const { geometries, materials } = pooledResources;
      
      // Return geometries to pool
      geometryPools.deathKnightChargingArea.release(geometries.attackArea);
      geometryPools.deathKnightChargingRing.release(geometries.ring);
      geometryPools.deathKnightChargingOrb.release(geometries.orb);
      geometryPools.chargingLine.release(geometries.line);
      
      // Return materials to pool
      materialPools.deathKnightChargingArea.release(materials.area);
      materialPools.deathKnightChargingArea.release(materials.border);
      materialPools.deathKnightChargingRing.release(materials.ring);
      materialPools.deathKnightChargingOrb.release(materials.orb);
      materialPools.chargingLine.release(materials.line);
    };
  }, [pooledResources]);
  
  useFrame(() => {
    const elapsed = Date.now() - startTimeRef.current;
    const progress = Math.min(elapsed / chargeDuration, 1);
    
    if (progress >= 1) {
      onComplete();
      return;
    }

    // Update material properties dynamically
    const baseIntensity = progress * 0.8 + 0.2;
    const pulseIntensity = Math.sin(elapsed * 0.006) * 0.4 + 0.6; // Slower pulse for Death Knight
    const finalIntensity = baseIntensity * pulseIntensity;

    // Update state for JSX rendering
    setCurrentIntensity(finalIntensity);
    setCurrentProgress(progress);

    const { materials } = pooledResources;
    if (materials.orb) {
      materials.orb.emissiveIntensity = 12 * finalIntensity;
      materials.orb.opacity = 0.9 * finalIntensity;
    }
    if (materials.line) {
      materials.line.emissiveIntensity = 10 * finalIntensity;
      materials.line.opacity = 0.8 * finalIntensity;
    }
    if (materials.ring) {
      materials.ring.opacity = 0.6 * finalIntensity;
    }
  });
  
  // Update attack area geometry scale based on attackRange
  useEffect(() => {
    const { geometries } = pooledResources;
    const scale = attackRange / 2.65; // 2.65 is the default attack range used in pool
    geometries.attackArea.scale(scale, 1, scale);
    
    return () => {
      // Reset scale when returning to pool
      geometries.attackArea.scale(1/scale, 1, 1/scale);
    };
  }, [attackRange, pooledResources]);
  
  return (
    <group ref={groupRef} position={position.toArray()}>
      {/* Main attack area indicator on ground */}
      <group
        rotation={[
          0,
          Math.atan2(direction.x, direction.z),
          0
        ]}
      >
        {/* Main attack area - purple theme */}
        <mesh geometry={pooledResources.geometries.attackArea} position={[0, 0, 0]}>
          <meshBasicMaterial
            color="#8B44FF" // Purple
            transparent
            opacity={0.4 * currentIntensity}
            blending={THREE.AdditiveBlending}
            side={THREE.DoubleSide}
          />
        </mesh>
        
        {/* Attack area border/outline - darker purple */}
        <mesh geometry={pooledResources.geometries.attackArea} position={[0, 0.005, 0]}>
          <meshBasicMaterial
            color="#6A1B9A" // Dark purple
            transparent
            opacity={0.7 * currentIntensity}
            blending={THREE.AdditiveBlending}
            side={THREE.DoubleSide}
            wireframe={true}
          />
        </mesh>
        
        {/* Charging lines radiating from Death Knight */}
        {Array.from({ length: 10 }, (_, i) => {
          const angle = (i / 10 - 0.5) * Math.PI * 0.7;
          const lineLength = attackRange * (0.7 + currentProgress * 0.3);
          const x = Math.sin(angle) * lineLength;
          const z = Math.cos(angle) * lineLength;
          
          return (
            <group key={i}>
              <mesh
                position={[x / 2, 0.02, z / 2]}
                rotation={[Math.PI / 2, angle, 0]}
                scale={[1, lineLength, 1]}
                geometry={pooledResources.geometries.line}
                material={pooledResources.materials.line}
              />
            </group>
          );
        })}
        
        {/* Dark energy wisps around the attack area */}
        {Array.from({ length: 6 }, (_, i) => {
          const angle = (i / 6) * Math.PI * 2;
          const radius = attackRange * 0.8;
          const x = Math.sin(angle) * radius;
          const z = Math.cos(angle) * radius;
          const elapsed = Date.now() - startTimeRef.current;
          const floatHeight = Math.sin(elapsed * 0.003 + i) * 0.2 + 0.3;
          
          return (
            <mesh
              key={i}
              position={[x, floatHeight, z]}
              scale={[0.06 + currentProgress * 0.03, 0.06 + currentProgress * 0.03, 0.06 + currentProgress * 0.03]}
              geometry={pooledResources.geometries.orb}
            >
              <meshStandardMaterial
                color="#AB47BC" // Light purple
                emissive="#7B1FA2" // Purple emissive
                emissiveIntensity={8 * currentIntensity}
                transparent
                opacity={0.7 * currentIntensity}
              />
            </mesh>
          );
        })}
      </group>
      
      {/* Energy buildup at Death Knight position */}
      <group position={[0, 0, 0]}>
        {/* Energy rings around Death Knight - purple theme */}
        {[0.8, 1.3, 1.8].map((radius, i) => (
          <mesh 
            key={i} 
            rotation={[Math.PI / 2, 0, (Date.now() - startTimeRef.current) * 0.001 * (i + 1)]}
            position={[0, 0.1, 0]}
            scale={[radius / 0.7, radius / 0.7, 1]} // Scale based on default ring size
            geometry={pooledResources.geometries.ring}
            material={pooledResources.materials.ring}
          />
        ))}
        
        {/* Central energy orb at Death Knight's weapon */}
        <mesh 
          position={[0.8, 2.5, 0.3]}
          scale={[0.12 + currentProgress * 0.08, 0.12 + currentProgress * 0.08, 0.12 + currentProgress * 0.08]}
          geometry={pooledResources.geometries.orb}
          material={pooledResources.materials.orb}
        />
        
        {/* Secondary energy orbs floating around Death Knight */}
        {[0.6, 1.0, 1.4].map((radius, i) => {
          const elapsed = Date.now() - startTimeRef.current;
          const angle = elapsed * 0.002 + (i * Math.PI * 2 / 3);
          const x = Math.sin(angle) * radius;
          const z = Math.cos(angle) * radius;
          const y = 1.5 + Math.sin(elapsed * 0.004 + i) * 0.3;
          
          return (
            <mesh 
              key={i} 
              position={[x, y, z]}
              scale={[0.05 + currentProgress * 0.02, 0.05 + currentProgress * 0.02, 0.05 + currentProgress * 0.02]}
              geometry={pooledResources.geometries.orb}
            >
              <meshStandardMaterial
                color="#AB47BC" // Light purple
                emissive="#8B44FF" // Purple emissive
                emissiveIntensity={12 * currentIntensity}
                transparent
                opacity={0.8 * currentIntensity}
              />
            </mesh>
          );
        })}
        
        {/* Purple point light */}
        <pointLight
          color="#9C27B0"
          intensity={25 * currentIntensity}
          distance={10}
          decay={2}
          position={[0, 2.0, 0]}
        />
      </group>
    </group>
  );
};

export default DeathKnightChargingIndicator;
