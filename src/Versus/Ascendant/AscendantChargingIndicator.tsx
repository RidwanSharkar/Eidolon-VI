// src/Versus/Ascendant/AscendantChargingIndicator.tsx
import React, { useRef, useMemo, useEffect, useState } from 'react';
import { Vector3, Group } from 'three';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { geometryPools, materialPools } from '@/Scene/EffectPools';

interface AscendantChargingIndicatorProps {
  startPosition: Vector3; // Ascendant position
  targetPosition: Vector3; // Target position
  chargeDuration: number; // Total charge time in ms (1250ms)
  onComplete: () => void;
}

const AscendantChargingIndicator: React.FC<AscendantChargingIndicatorProps> = ({ 
  startPosition, 
  targetPosition,
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
      attackArea: geometryPools.ascendantChargingArea.acquire(),
      ring: geometryPools.ascendantLightningRing.acquire(),
      orb: geometryPools.ascendantChargingOrb.acquire(),
      line: geometryPools.ascendantLightningBolt.acquire()
    };

    const materials = {
      area: materialPools.ascendantChargingArea.acquire(),
      border: materialPools.ascendantChargingArea.acquire(),
      ring: materialPools.ascendantLightningRing.acquire(),
      orb: materialPools.ascendantChargingOrb.acquire(),
      line: materialPools.ascendantLightning.acquire()
    };

    return { geometries, materials };
  }, []);

  // Return resources to pool on cleanup
  useEffect(() => {
    return () => {
      const { geometries, materials } = pooledResources;
      
      // Return geometries to pool
      geometryPools.ascendantChargingArea.release(geometries.attackArea);
      geometryPools.ascendantLightningRing.release(geometries.ring);
      geometryPools.ascendantChargingOrb.release(geometries.orb);
      geometryPools.ascendantLightningBolt.release(geometries.line);
      
      // Return materials to pool
      materialPools.ascendantChargingArea.release(materials.area);
      materialPools.ascendantChargingArea.release(materials.border);
      materialPools.ascendantLightningRing.release(materials.ring);
      materialPools.ascendantChargingOrb.release(materials.orb);
      materialPools.ascendantLightning.release(materials.line);
    };
  }, [pooledResources]);
  
  // Note: direction and distance are calculated per line in the chargingLines useMemo
  
  // Create multiple charging lines radiating from Ascendant to target area
  const chargingLines = useMemo(() => {
    const lines = [];
    const lineCount = 8; // Number of charging lines
    
    for (let i = 0; i < lineCount; i++) {
      const angle = (i / lineCount) * Math.PI * 2;
      const radius = 0.5; // Small radius around the target point
      
      // Create slight variations in the target position
      const targetVariation = new Vector3(
        Math.cos(angle) * radius,
        0,
        Math.sin(angle) * radius
      );
      
      const lineTarget = targetPosition.clone().add(targetVariation);
      const lineDirection = lineTarget.clone().sub(startPosition).normalize();
      const lineDistance = startPosition.distanceTo(lineTarget);
      
      lines.push({
        direction: lineDirection,
        distance: lineDistance,
        targetPoint: lineTarget,
        offset: i * 0.1 // Slight timing offset for each line
      });
    }
    
    return lines;
  }, [startPosition, targetPosition]);
  
  useFrame(() => {
    const elapsed = Date.now() - startTimeRef.current;
    const progress = Math.min(elapsed / chargeDuration, 1);
    
    if (progress >= 1) {
      onComplete();
      return;
    }

    // Update material properties dynamically
    const baseIntensity = progress * 0.8 + 0.2;
    const pulseIntensity = Math.sin(elapsed * 0.01) * 0.3 + 0.7;
    const finalIntensity = baseIntensity * pulseIntensity;

    // Update state for JSX rendering
    setCurrentIntensity(finalIntensity);
    setCurrentProgress(progress);

    const { materials } = pooledResources;
    if (materials.orb) {
      materials.orb.emissiveIntensity = 20 * finalIntensity;
      materials.orb.opacity = 0.9 * finalIntensity;
    }
    if (materials.line) {
      materials.line.emissiveIntensity = 12 * finalIntensity;
      materials.line.opacity = 0.9 * finalIntensity;
    }
    if (materials.ring) {
      materials.ring.opacity = 0.6 * finalIntensity;
    }
  });
  
  return (
    <group ref={groupRef}>
      {/* Main charging lines */}
      {chargingLines.map((line, index) => {
        const lineProgress = Math.min((currentProgress + line.offset) * 1.2, 1);
        const lineLength = line.distance * lineProgress;
        
        return (
          <group key={index}>
            {/* Core charging line */}
            <group
              position={startPosition.toArray()}
              rotation={[
                0,
                Math.atan2(line.direction.x, line.direction.z),
                0
              ]}
            >
              <mesh 
                rotation={[Math.PI / 2, 0, 0]} 
                position={[0, 0, lineLength / 2]}
                scale={[1, lineLength, 1]}
                geometry={pooledResources.geometries.line}
                material={pooledResources.materials.line}
              />
              
              {/* Outer glow */}
              <mesh 
                rotation={[Math.PI / 2, 0, 0]} 
                position={[0, 0, lineLength / 2]}
                scale={[2, lineLength, 2]}
                geometry={pooledResources.geometries.line}
              >
                <meshStandardMaterial
                  color="#FF3333"
                  emissive="#FF0000"
                  emissiveIntensity={8 * currentIntensity}
                  transparent
                  opacity={0.6 * currentIntensity}
                />
              </mesh>
            </group>
          </group>
        );
      })}
      
      {/* Target area indicator - growing circle on the ground */}
      <group position={targetPosition.toArray()}>
        {/* Main target circle */}
        <mesh 
          rotation={[Math.PI / 2, 0, 0]} 
          position={[0, 0.01, 0]}
          scale={[1.25, 1.25, 1]} // Scale based on default ring size
          geometry={pooledResources.geometries.ring}
          material={pooledResources.materials.ring}
        />
        
        {/* Inner warning circle */}
        <mesh 
          rotation={[Math.PI / 2, 0, 0]} 
          position={[0, 0.02, 0]}
          scale={[0.875, 0.875, 1]} // Scale based on default ring size
          geometry={pooledResources.geometries.ring}
        >
          <meshBasicMaterial
            color="#FF4444"
            transparent
            opacity={0.5 * currentIntensity}
            blending={THREE.AdditiveBlending}
          />
        </mesh>
        
        {/* Pulsing center dot */}
        <mesh 
          position={[0, 0.03, 0]}
          scale={[0.1 + currentProgress * 0.2, 0.1 + currentProgress * 0.2, 0.1 + currentProgress * 0.2]}
          geometry={pooledResources.geometries.orb}
          material={pooledResources.materials.orb}
        />
      </group>
      
      {/* Energy buildup at Ascendant position */}
      <group position={startPosition.toArray()}>
        {/* Energy rings around Ascendant */}
        {[0.8, 1.2, 1.6].map((radius, i) => (
          <mesh 
            key={i} 
            rotation={[Math.PI / 2, 0, (Date.now() - startTimeRef.current) * 0.001 * (i + 1)]}
            position={[0, 0.5, 0]}
            scale={[radius / 0.8, radius / 0.8, 1]} // Scale based on default ring size
            geometry={pooledResources.geometries.ring}
            material={pooledResources.materials.ring}
          />
        ))}
        
        {/* Central energy orb */}
        <mesh 
          position={[0, 2.5, 0]}
          scale={[0.15 + currentProgress * 0.1, 0.15 + currentProgress * 0.1, 0.15 + currentProgress * 0.1]}
          geometry={pooledResources.geometries.orb}
          material={pooledResources.materials.orb}
        />
        
        {/* Red point light */}
        <pointLight
          color="#FF0000"
          intensity={30 * currentIntensity}
          distance={10}
          decay={2}
          position={[0, 2.5, 0]}
        />
      </group>
    </group>
  );
};

export default AscendantChargingIndicator;
