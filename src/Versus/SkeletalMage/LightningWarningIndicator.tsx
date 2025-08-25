import React, { useRef } from 'react';
import { Vector3 } from 'three';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface LightningWarningIndicatorProps {
  position: Vector3;
  duration: number;
  onComplete: () => void;
}

const DAMAGE_RADIUS = 2.0; // Lightning strike damage radius
const WARNING_RING_SEGMENTS = 32;
const FIRE_PARTICLES_COUNT = 8;

// Reusable geometries
const warningRingGeometry = new THREE.RingGeometry(DAMAGE_RADIUS - 0.2, DAMAGE_RADIUS, WARNING_RING_SEGMENTS);
const pulsingRingGeometry = new THREE.RingGeometry(DAMAGE_RADIUS - 0.6, DAMAGE_RADIUS - 0.4, WARNING_RING_SEGMENTS);
const outerGlowGeometry = new THREE.RingGeometry(DAMAGE_RADIUS - 0.15, DAMAGE_RADIUS, WARNING_RING_SEGMENTS);
const particleGeometry = new THREE.SphereGeometry(0.08, 8, 8);

export default function LightningWarningIndicator({ position, duration, onComplete }: LightningWarningIndicatorProps) {
  const startTimeRef = useRef(Date.now());
  
  const getPulsingScale = (): [number, number, number] => {
    const scale = 1 + Math.sin(Date.now() * 0.008) * 0.15;
    return [scale, scale, 1] as [number, number, number];
  };

  useFrame(() => {
    const elapsed = (Date.now() - startTimeRef.current) / 1000;
    
    if (elapsed >= duration) {
      onComplete();
      return;
    }
  });

  return (
    <group position={[position.x, 0.1, position.z]}>
      {/* Main warning ring - blue theme */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <primitive object={warningRingGeometry} />
        <meshBasicMaterial color="#0088ff" transparent opacity={0.5} side={THREE.DoubleSide} />
      </mesh>
      
      {/* Pulsing inner ring */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        scale={getPulsingScale()}
      >
        <primitive object={pulsingRingGeometry} />
        <meshBasicMaterial 
          color="#00bbff"
          transparent 
          opacity={0.4 + Math.sin(Date.now() * 0.006) * 0.2}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Rotating outer glow ring */}
      <mesh
        rotation={[-Math.PI / 2, Date.now() * 0.004, 0]}
      >
        <primitive object={outerGlowGeometry} />
        <meshBasicMaterial 
          color="#0099dd"
          transparent
          opacity={0.3}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Rising electric particles */}
      {[...Array(FIRE_PARTICLES_COUNT)].map((_, i) => (
        <mesh
          key={i}
          position={[
            Math.sin(Date.now() * 0.002 + i) * (DAMAGE_RADIUS - 0.3),
            Math.sin(Date.now() * 0.003 + i) * 0.4 + 0.2,
            Math.cos(Date.now() * 0.002 + i) * (DAMAGE_RADIUS - 0.3)
          ]}
        >
          <primitive object={particleGeometry} />
          <meshBasicMaterial
            color="#80D9FF"
            transparent
            opacity={0.4 + Math.sin(Date.now() * 0.005 + i) * 0.3}
          />
        </mesh>
      ))}

      {/* Central electric glow */}
      <mesh position={[0, 0.3, 0]}>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshBasicMaterial
          color="#FFFFFF"
          transparent
          opacity={0.6 + Math.sin(Date.now() * 0.01) * 0.3}
        />
      </mesh>

      {/* Electric crackling effects */}
      {[...Array(4)].map((_, i) => (
        <mesh
          key={`crackle-${i}`}
          position={[
            Math.sin(Date.now() * 0.008 + i * Math.PI / 2) * 0.8,
            0.1 + Math.sin(Date.now() * 0.01 + i) * 0.1,
            Math.cos(Date.now() * 0.008 + i * Math.PI / 2) * 0.8
          ]}
          rotation={[0, Date.now() * 0.005 + i, 0]}
        >
          <boxGeometry args={[0.05, 0.4, 0.05]} />
          <meshBasicMaterial
            color="#B6EAFF"
            transparent
            opacity={0.7 + Math.sin(Date.now() * 0.012 + i) * 0.3}
          />
        </mesh>
      ))}

      {/* Point light for atmospheric effect */}
      <pointLight
        color="#80D9FF"
        intensity={2 + Math.sin(Date.now() * 0.01) * 1}
        distance={6}
        decay={2}
      />
    </group>
  );
}