import React, { useRef, useEffect } from 'react';
import { Vector3, BoxGeometry } from 'three';
import { useFrame } from '@react-three/fiber';
import { DoubleSide, RingGeometry, SphereGeometry } from 'three';
import { registerGlobalSharedResource } from '../../Scene/EffectPools';

interface LightningWarningIndicatorProps {
  position: Vector3;
  duration: number;
  onComplete: () => void;
}

const DAMAGE_RADIUS = 2.0; // Lightning strike damage radius
const WARNING_RING_SEGMENTS = 32;
const FIRE_PARTICLES_COUNT = 8;

// Reusable geometries
const warningRingGeometry = new RingGeometry(DAMAGE_RADIUS - 0.2, DAMAGE_RADIUS, WARNING_RING_SEGMENTS);
const pulsingRingGeometry = new RingGeometry(DAMAGE_RADIUS - 0.6, DAMAGE_RADIUS - 0.4, WARNING_RING_SEGMENTS);
const outerGlowGeometry = new RingGeometry(DAMAGE_RADIUS - 0.15, DAMAGE_RADIUS, WARNING_RING_SEGMENTS);
const particleGeometry = new SphereGeometry(0.08, 8, 8);
// MEMORY FIX: Additional shared geometries to prevent inline JSX geometry recreation
const centralGlowGeometry = new SphereGeometry(0.2, 16, 16);
const crackleGeometry = new BoxGeometry(0.05, 0.4, 0.05);

// Register for global disposal
let registeredLightningWarningResources = false;
const registerLightningWarningResources = () => {
  if (registeredLightningWarningResources || typeof window === 'undefined') return;
  try {
    registerGlobalSharedResource(() => {
      warningRingGeometry.dispose();
      pulsingRingGeometry.dispose();
      outerGlowGeometry.dispose();
      particleGeometry.dispose();
      centralGlowGeometry.dispose();
      crackleGeometry.dispose();
    }, 'LightningWarningIndicator');
    registeredLightningWarningResources = true;
  } catch (error) {
    console.warn('Failed to register LightningWarning resources:', error);
  }
};

// Auto-register when module loads
if (typeof window !== 'undefined') {
  registerLightningWarningResources();
}

export default function LightningWarningIndicator({ position, duration, onComplete }: LightningWarningIndicatorProps) {
  const startTimeRef = useRef(Date.now());
  // MEMORY FIX: Store accumulated time in ref instead of using Date.now() everywhere
  const elapsedTimeRef = useRef(0);
  const pulsingRotationRef = useRef(0);
  const particleTimeRef = useRef(0);
  const glowTimeRef = useRef(0);
  const crackleRotationRef = useRef(0);
  
  useFrame((_, delta) => {
    const elapsed = (Date.now() - startTimeRef.current) / 1000;
    
    if (elapsed >= duration) {
      onComplete();
      return;
    }

    // MEMORY FIX: Accumulate time in refs instead of calling Date.now() everywhere
    elapsedTimeRef.current += delta;
    pulsingRotationRef.current += delta * 0.004;
    particleTimeRef.current += delta;
    glowTimeRef.current += delta;
    crackleRotationRef.current += delta * 0.005;
  });

  // MEMORY FIX: Calculate pulsing scale using accumulated time refs
  const pulsingScale = 1 + Math.sin(elapsedTimeRef.current * 8) * 0.15;
  const pulsingOpacity = 0.4 + Math.sin(elapsedTimeRef.current * 6) * 0.2;

  return (
    <group position={[position.x, 0.1, position.z]}>
      {/* Main warning ring - blue theme */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <primitive object={warningRingGeometry} />
        <meshBasicMaterial color="#0088ff" transparent opacity={0.5} side={DoubleSide} />
      </mesh>
      
      {/* MEMORY FIX: Pulsing inner ring - use accumulated time refs */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        scale={[pulsingScale, pulsingScale, 1]}
      >
        <primitive object={pulsingRingGeometry} />
        <meshBasicMaterial 
          color="#00bbff"
          transparent 
          opacity={pulsingOpacity}
          side={DoubleSide}
        />
      </mesh>

      {/* MEMORY FIX: Rotating outer glow ring - use accumulated rotation ref */}
      <mesh
        rotation={[-Math.PI / 2, pulsingRotationRef.current, 0]}
      >
        <primitive object={outerGlowGeometry} />
        <meshBasicMaterial 
          color="#0099dd"
          transparent
          opacity={0.3}
          side={DoubleSide}
        />
      </mesh>

      {/* MEMORY FIX: Rising electric particles - use accumulated time refs */}
      {[...Array(FIRE_PARTICLES_COUNT)].map((_, i) => {
        const particleX = Math.sin(particleTimeRef.current * 2 + i) * (DAMAGE_RADIUS - 0.3);
        const particleY = Math.sin(particleTimeRef.current * 3 + i) * 0.4 + 0.2;
        const particleZ = Math.cos(particleTimeRef.current * 2 + i) * (DAMAGE_RADIUS - 0.3);
        const particleOpacity = 0.4 + Math.sin(particleTimeRef.current * 5 + i) * 0.3;

        return (
          <mesh
            key={i}
            position={[particleX, particleY, particleZ]}
          >
            <primitive object={particleGeometry} />
            <meshBasicMaterial
              color="#80D9FF"
              transparent
              opacity={particleOpacity}
            />
          </mesh>
        );
      })}

      {/* MEMORY FIX: Central electric glow - use accumulated time refs */}
      <mesh position={[0, 0.3, 0]}>
        <primitive object={centralGlowGeometry} attach="geometry" />
        <meshBasicMaterial
          color="#FFFFFF"
          transparent
          opacity={0.6 + Math.sin(glowTimeRef.current * 10) * 0.3}
        />
      </mesh>

      {/* MEMORY FIX: Electric crackling effects - use accumulated time refs */}
      {[...Array(4)].map((_, i) => {
        const crackleX = Math.sin(elapsedTimeRef.current * 8 + i * Math.PI / 2) * 0.8;
        const crackleY = 0.1 + Math.sin(glowTimeRef.current * 10 + i) * 0.1;
        const crackleZ = Math.cos(elapsedTimeRef.current * 8 + i * Math.PI / 2) * 0.8;
        const crackleOpacity = 0.7 + Math.sin(elapsedTimeRef.current * 12 + i) * 0.3;

        return (
          <mesh
            key={`crackle-${i}`}
            position={[crackleX, crackleY, crackleZ]}
            rotation={[0, crackleRotationRef.current + i, 0]}
          >
            <primitive object={crackleGeometry} attach="geometry" />
            <meshBasicMaterial
              color="#B6EAFF"
              transparent
              opacity={crackleOpacity}
            />
          </mesh>
        );
      })}

      {/* MEMORY FIX: Point light for atmospheric effect - use accumulated time ref */}
      <pointLight
        color="#80D9FF"
        intensity={2 + Math.sin(glowTimeRef.current * 10) * 1}
        distance={6}
        decay={2}
      />
    </group>
  );
}