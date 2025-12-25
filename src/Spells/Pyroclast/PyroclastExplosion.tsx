import React, { useRef, useState, useEffect, useMemo } from 'react';
import { Vector3, AdditiveBlending, SphereGeometry, TorusGeometry, MeshStandardMaterial } from 'three';

// SHARED MATERIAL POOLS - prevents memory leaks from per-instance material creation
const PYROCLAST_EXPLOSION_SHARED_MATERIALS = {
  coreExplosion: new MeshStandardMaterial({
    color: "#FF2200",
    emissive: "#FF3300",
    emissiveIntensity: 0.5,
    transparent: true,
    opacity: 0.9,
    depthWrite: false,
    blending: AdditiveBlending
  }),
  innerEnergy: new MeshStandardMaterial({
    color: "#FF4400",
    emissive: "#FF6600",
    emissiveIntensity: 0.5,
    transparent: true,
    opacity: 0.95,
    depthWrite: false,
    blending: AdditiveBlending
  }),
  torus: new MeshStandardMaterial({
    color: "#FF2200",
    emissive: "#FF4400",
    emissiveIntensity: 0.3,
    transparent: true,
    opacity: 0.7,
    depthWrite: false,
    blending: AdditiveBlending
  }),
  spark: new MeshStandardMaterial({
    color: "#FF5500",
    emissive: "#FF7700",
    emissiveIntensity: 1.2,
    transparent: true,
    opacity: 0.9,
    depthWrite: false,
    blending: AdditiveBlending
  })
};

// Import shared geometries to prevent memory leaks
import {
  SHARED_SPHERE_GEOMETRY_SPELL_LARGE,
  SHARED_SPHERE_GEOMETRY_LOW,
  SHARED_TORUS_GEOMETRY_SPELL_MEDIUM
} from '../../SharedGeometries';

// Use shared geometries for pyroclast explosion - prevents memory leaks
// Note: Some geometries are approximated with shared ones for efficiency
const pyroclastGeometries = {
  coreExplosion: SHARED_SPHERE_GEOMETRY_SPELL_LARGE, // Approximation of (0.5, 32, 32)
  innerEnergy: SHARED_SPHERE_GEOMETRY_SPELL_LARGE, // Approximation of (0.525, 24, 24)
  torus0: SHARED_TORUS_GEOMETRY_SPELL_MEDIUM, // Approximation of (0.45, 0.06, 16, 32)
  torus1: SHARED_TORUS_GEOMETRY_SPELL_MEDIUM, // Approximation of (0.675, 0.06, 16, 32)
  torus2: SHARED_TORUS_GEOMETRY_SPELL_MEDIUM, // Approximation of (0.8, 0.06, 16, 32)
  torus3: SHARED_TORUS_GEOMETRY_SPELL_MEDIUM, // Approximation of (0.925, 0.06, 16, 32)
  torus4: SHARED_TORUS_GEOMETRY_SPELL_MEDIUM, // Approximation of (1.125, 0.06, 16, 32)
  spark: SHARED_SPHERE_GEOMETRY_LOW // Approximation of (0.08, 8, 8)
};

// Note: pyroclastGeometries uses SHARED geometries from SharedGeometries.ts
// These should NOT be disposed as they are shared across the entire application

interface PyroclastExplosionProps {
  position: Vector3;
  chargeTime?: number;
  explosionStartTime: number | null;
  onComplete?: () => void;
}

const IMPACT_DURATION = 0.8; 

export default function PyroclastExplosion({ 
  position, 
  chargeTime = 1.0,
  explosionStartTime,
  onComplete 
}: PyroclastExplosionProps) {
  const startTime = useRef(explosionStartTime || Date.now());
  const [, forceUpdate] = useState({}); // Force updates to animate
  const normalizedCharge = Math.min(chargeTime / 4, 1.0);
  const scale = 0.5 + (normalizedCharge * 0.8); // Increased base scale
  const intensity = 2 + (normalizedCharge * 3); // Increased intensity
  const sparkCount = 12; // More sparks

  // Note: Using shared geometries and materials - no resource management needed

  // Pre-generate spark positions
  const sparkPositions = useMemo(() => {
    return Array(sparkCount).fill(null).map((_, i) => ({
      angle: (i / sparkCount) * Math.PI * 2,
      randomOffset: Math.random() * 0.3,
      yOffset: (Math.random() - 0.5) * 0.5,
      depthOffset: (Math.random() - 0.5) * 0.3
    }));
  }, [sparkCount]);

  // Get torus geometry by index
  const getTorusGeometry = (i: number) => {
    switch (i) {
      case 0: return pyroclastGeometries.torus0;
      case 1: return pyroclastGeometries.torus1;
      case 2: return pyroclastGeometries.torus2;
      case 3: return pyroclastGeometries.torus3;
      case 4: return pyroclastGeometries.torus4;
      default: return pyroclastGeometries.torus0;
    }
  };
  
  useEffect(() => {
    // Animation timer
    const interval = setInterval(() => {
      forceUpdate({});
      
      // Check if we should clean up
      const elapsed = (Date.now() - startTime.current) / 1000;
      if (elapsed > IMPACT_DURATION) {
        clearInterval(interval);
        if (onComplete) onComplete();
      }
    }, 16); // ~60fps
    
    // Cleanup timer after explosion duration
    const timer = setTimeout(() => {
      clearInterval(interval);
      if (onComplete) onComplete();
    }, IMPACT_DURATION * 1000);
    
    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, [onComplete]);

  // Calculate fade based on elapsed time
  const elapsed = (Date.now() - startTime.current) / 1000;
  const duration = IMPACT_DURATION;
  const fade = Math.max(0, 1 - (elapsed / duration));
  
  if (fade <= 0) return null;

  // More dynamic effect - faster expansion for initial impact
  const expansionRate = 3 + (elapsed < 0.1 ? 8 : 0);

  // Update material opacities based on fade using shared materials
  const coreScale = scale * (1 + elapsed * expansionRate);
  const innerScale = scale * (1 + elapsed * (expansionRate + 1));
  const ringScale = scale * (1 + elapsed * (expansionRate + 2));

  PYROCLAST_EXPLOSION_SHARED_MATERIALS.coreExplosion.opacity = 0.9 * fade;
  PYROCLAST_EXPLOSION_SHARED_MATERIALS.coreExplosion.emissiveIntensity = intensity * fade * 0.5;
  PYROCLAST_EXPLOSION_SHARED_MATERIALS.innerEnergy.opacity = 0.95 * fade;
  PYROCLAST_EXPLOSION_SHARED_MATERIALS.innerEnergy.emissiveIntensity = intensity * 0.5 * fade;
  PYROCLAST_EXPLOSION_SHARED_MATERIALS.torus.opacity = 0.7 * fade;
  PYROCLAST_EXPLOSION_SHARED_MATERIALS.torus.emissiveIntensity = intensity * fade * 0.3;
  PYROCLAST_EXPLOSION_SHARED_MATERIALS.spark.opacity = 0.9 * fade;
  PYROCLAST_EXPLOSION_SHARED_MATERIALS.spark.emissiveIntensity = intensity * 1.2 * fade;

  return (
    <group position={position}>
      {/* Core explosion sphere */}
      <mesh
        geometry={pyroclastGeometries.coreExplosion}
        material={PYROCLAST_EXPLOSION_SHARED_MATERIALS.coreExplosion}
        scale={[coreScale, coreScale, coreScale]}
      />

      {/* Inner energy sphere */}
      <mesh
        geometry={pyroclastGeometries.innerEnergy}
        material={PYROCLAST_EXPLOSION_SHARED_MATERIALS.innerEnergy}
        scale={[innerScale, innerScale, innerScale]}
      />

      {/* Multiple expanding rings - using shared geometries */}
      {[0, 1, 2, 3, 4].map((i) => (
        <mesh 
          key={i} 
          rotation={[Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI]}
          geometry={getTorusGeometry(i)}
          material={PYROCLAST_EXPLOSION_SHARED_MATERIALS.torus}
          scale={[ringScale, ringScale, ringScale]}
        />
      ))}

      {/* Particle sparks - using pre-generated positions */}
      {sparkPositions.map((spark, i) => {
        const radius = scale * (1 + elapsed * (expansionRate - 1)) * (1 + spark.randomOffset);
        
        return (
          <mesh
            key={`spark-${i}`}
            position={[
              Math.sin(spark.angle) * radius,
              Math.cos(spark.angle) * radius + spark.yOffset,
              spark.depthOffset
            ]}
            geometry={pyroclastGeometries.spark}
            material={PYROCLAST_EXPLOSION_SHARED_MATERIALS.spark}
            scale={[scale, scale, scale]}
          />
        );
      })}

      {/* Dynamic lights - brighter and more intense */}
      <pointLight
        color="#FF2200"
        intensity={intensity * 3 * fade}
        distance={5 * scale}
        decay={1.8}
      />
      <pointLight
        color="#FF4400"
        intensity={intensity * 1.5 * fade}
        distance={8 * scale}
        decay={1.5}
      />
      
      {/* Additional bright flash at the beginning */}
      {elapsed < 0.1 && (
        <pointLight
          color="#FF3300"
          intensity={intensity * 5 * (1 - elapsed * 10)}
          distance={3 * scale}
          decay={1}
        />
      )}
    </group>
  );
}

